#!/usr/bin/env python3
"""
deploy_workspace.py — Main deployment entrypoint for Microsoft Fabric CI/CD.

Deploys Fabric workspace items from a local Git repository to a target
Fabric workspace (DEV / QA / PROD) using the fabric-cicd library.

Usage:
    python deploy/deploy_workspace.py

All configuration is read from environment variables (see .env.example).
"""

from __future__ import annotations

import logging
import os
import sys
from datetime import datetime, timezone

import time

import requests
from azure.identity import ClientSecretCredential
from fabric_cicd import FabricWorkspace, publish_all_items, unpublish_all_orphan_items

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S%z",
    stream=sys.stdout,
    force=True,
)
logger = logging.getLogger("fabric-cicd-deploy")

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
DEFAULT_REPO_DIR = "./workspace"
DEFAULT_ITEM_TYPES = [
    "Lakehouse",
    "Notebook",
    "SemanticModel",
    "Report",
    # "Environment",
    # "SQLDatabase",
]

# DataPipeline is only supported with User Identity (UPN) authentication.
# Add it back if you switch away from Service Principal auth.
UPN_ONLY_ITEM_TYPES = [
    "DataPipeline",
]
VALID_ENVIRONMENTS = {"DEV", "QA", "PROD"}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _env(name: str, required: bool = True, default: str | None = None) -> str | None:
    """Read an environment variable, optionally raising on missing."""
    value = os.environ.get(name, default)
    if required and not value:
        logger.error("Required environment variable %s is not set.", name)
        sys.exit(1)
    return value


def _parse_bool(value: str | None) -> bool:
    if value is None:
        return False
    return value.strip().lower() in ("true", "1", "yes")


def _parse_items_in_scope(raw: str | None) -> list[str]:
    """Parse a comma-separated list of item types, falling back to defaults."""
    if not raw:
        return DEFAULT_ITEM_TYPES
    items = [i.strip() for i in raw.split(",") if i.strip()]
    return items if items else DEFAULT_ITEM_TYPES


def _build_credential(environment: str) -> ClientSecretCredential:
    """Build a ClientSecretCredential from environment-specific variables.

    Looks for <ENV>_TENANT_ID, <ENV>_CLIENT_ID, <ENV>_CLIENT_SECRET first
    (e.g. DEV_TENANT_ID), then falls back to the generic FABRIC_* variables.
    This allows per-environment service principals for least-privilege isolation.
    """
    env_prefix = environment.upper()
    tenant_id = (
        os.environ.get(f"{env_prefix}_TENANT_ID")
        or _env("FABRIC_TENANT_ID")
    )
    client_id = (
        os.environ.get(f"{env_prefix}_CLIENT_ID")
        or _env("FABRIC_CLIENT_ID")
    )
    client_secret = (
        os.environ.get(f"{env_prefix}_CLIENT_SECRET")
        or _env("FABRIC_CLIENT_SECRET")
    )
    logger.info(
        "Authenticating service principal for %s (tenant=%s, client=%s).",
        environment, tenant_id, client_id,
    )
    return ClientSecretCredential(
        tenant_id=tenant_id,
        client_id=client_id,
        client_secret=client_secret,
    )


# ---------------------------------------------------------------------------
# Force-republish helpers (Direct Lake storage mode migration)
# ---------------------------------------------------------------------------

FABRIC_API = "https://api.fabric.microsoft.com/v1"
FABRIC_SCOPE = "https://api.fabric.microsoft.com/.default"


def _get_token(credential: ClientSecretCredential) -> str:
    return credential.get_token(FABRIC_SCOPE).token


def _delete_item_if_exists(
    token: str,
    workspace_id: str,
    item_name: str,
    item_type: str,
) -> None:
    """Delete a Fabric workspace item by display name and type if it exists."""
    headers = {"Authorization": f"Bearer {token}"}
    url = f"{FABRIC_API}/workspaces/{workspace_id}/items?type={item_type}"
    resp = requests.get(url, headers=headers)
    resp.raise_for_status()
    for item in resp.json().get("value", []):
        if item.get("displayName") == item_name:
            item_id = item["id"]
            del_resp = requests.delete(
                f"{FABRIC_API}/workspaces/{workspace_id}/items/{item_id}",
                headers=headers,
            )
            del_resp.raise_for_status()
            logger.info("Deleted existing %s '%s' (id=%s).", item_type, item_name, item_id)
            return
    logger.info("%s '%s' not found — skipping deletion.", item_type, item_name)


def _force_republish(
    credential: ClientSecretCredential,
    workspace_id: str,
    repo_dir: str,
) -> None:
    """Delete all SemanticModels and Reports found in repo_dir so they can be
    re-published from scratch (required when converting from Import/DirectQuery
    to Direct Lake storage mode)."""
    token = _get_token(credential)
    item_dirs = os.listdir(repo_dir) if os.path.isdir(repo_dir) else []

    reports = [d.removesuffix(".Report") for d in item_dirs if d.endswith(".Report")]
    models = [d.removesuffix(".SemanticModel") for d in item_dirs if d.endswith(".SemanticModel")]

    # Delete Reports first (they depend on SemanticModels)
    for name in reports:
        _delete_item_if_exists(token, workspace_id, name, "Report")
    for name in models:
        _delete_item_if_exists(token, workspace_id, name, "SemanticModel")


# ---------------------------------------------------------------------------
# Notebook execution helpers
# ---------------------------------------------------------------------------

def _find_item_id(token: str, workspace_id: str, display_name: str, item_type: str) -> str | None:
    """Return the Fabric item ID matching display_name and item_type, or None."""
    headers = {"Authorization": f"Bearer {token}"}
    url = f"{FABRIC_API}/workspaces/{workspace_id}/items?type={item_type}"
    resp = requests.get(url, headers=headers)
    resp.raise_for_status()
    for item in resp.json().get("value", []):
        if item.get("displayName") == display_name:
            return item["id"]
    return None


def _run_notebook(token: str, workspace_id: str, notebook_id: str, display_name: str) -> None:
    """Trigger a notebook run and poll until it completes or fails."""
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    trigger_url = (
        f"{FABRIC_API}/workspaces/{workspace_id}/items/{notebook_id}"
        "/jobs/instances?jobType=RunNotebook"
    )
    resp = requests.post(trigger_url, headers=headers, json={})
    resp.raise_for_status()

    # Fabric returns 202 with a Location header pointing to the job instance
    job_url = resp.headers.get("Location") or resp.headers.get("location")
    if not job_url:
        job_instance_id = resp.json().get("id")
        job_url = (
            f"{FABRIC_API}/workspaces/{workspace_id}/items/{notebook_id}"
            f"/jobs/instances/{job_instance_id}"
        )

    logger.info("Notebook '%s' job started — polling for completion…", display_name)
    poll_headers = {"Authorization": f"Bearer {token}"}
    for _ in range(120):  # up to 20 minutes
        time.sleep(10)
        status_resp = requests.get(job_url, headers=poll_headers)
        status_resp.raise_for_status()
        status = status_resp.json().get("status", "").upper()
        logger.info("  Notebook '%s' status: %s", display_name, status)
        if status == "COMPLETED":
            logger.info("Notebook '%s' completed successfully.", display_name)
            return
        if status in ("FAILED", "CANCELLED", "DEDUPED"):
            raise RuntimeError(f"Notebook '{display_name}' ended with status: {status}")
    raise TimeoutError(f"Notebook '{display_name}' did not finish within the polling window.")


def run_notebooks_after_deploy(
    credential: ClientSecretCredential,
    workspace_id: str,
    notebook_names: list[str],
) -> None:
    """Find and run each notebook in sequence; skip any that are not found."""
    token = _get_token(credential)
    for name in notebook_names:
        item_id = _find_item_id(token, workspace_id, name, "Notebook")
        if not item_id:
            logger.warning("Notebook '%s' not found in workspace — skipping.", name)
            continue
        _run_notebook(token, workspace_id, item_id, name)


# ---------------------------------------------------------------------------
# Core deployment logic
# ---------------------------------------------------------------------------

def deploy(
    workspace_id: str,
    environment: str,
    repo_dir: str,
    item_types: list[str],
    clean_orphans: bool,
    parameter_file_path: str | None = None,
    force_republish: bool = False,
    notebooks_to_run: list[str] | None = None,
) -> None:
    """Run a full deterministic deployment to the target workspace."""

    logger.info("=" * 60)
    logger.info("DEPLOYMENT START")
    logger.info("  Workspace ID  : %s", workspace_id)
    logger.info("  Environment   : %s", environment)
    logger.info("  Repo directory: %s", os.path.abspath(repo_dir))
    logger.info("  Item types    : %s", ", ".join(item_types))
    logger.info("  Clean orphans : %s", clean_orphans)
    logger.info("  Force republish: %s", force_republish)
    logger.info("  Parameter file: %s", parameter_file_path or "(default)")
    logger.info("  Notebooks      : %s", ", ".join(notebooks_to_run) if notebooks_to_run else "(none)")
    logger.info("  Git commit    : %s", os.environ.get("GITHUB_SHA", "local"))
    logger.info("=" * 60)

    credential = _build_credential(environment)

    if force_republish:
        logger.info("Force-republish enabled — deleting existing SemanticModels and Reports…")
        _force_republish(credential, workspace_id, os.path.abspath(repo_dir))

    # Build FabricWorkspace object
    # Use an absolute path so that os.scandir inside the library produces
    # absolute directory.path entries, which match the .resolve()-d path used
    # in _convert_path_to_id when looking up the SemanticModel for a Report.
    workspace_kwargs = dict(
        workspace_id=workspace_id,
        environment=environment,
        repository_directory=os.path.abspath(repo_dir),
        item_type_in_scope=item_types,
        token_credential=credential,
    )
    if parameter_file_path:
        workspace_kwargs["parameter_file_path"] = os.path.abspath(parameter_file_path)
    workspace = FabricWorkspace(**workspace_kwargs)

    # Publish all items
    logger.info("Publishing items…")
    publish_all_items(workspace)
    logger.info("Publish completed successfully.")

    # Run post-deploy notebooks (creates Delta tables in the lakehouse)
    if notebooks_to_run:
        logger.info("Running post-deploy notebooks…")
        run_notebooks_after_deploy(credential, workspace_id, notebooks_to_run)

    # Optionally remove orphaned items
    if clean_orphans:
        logger.info("Removing orphaned items not present in repository…")
        unpublish_all_orphan_items(workspace)
        logger.info("Orphan cleanup completed successfully.")

    logger.info("DEPLOYMENT FINISHED SUCCESSFULLY.")


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------

def main() -> None:
    start = datetime.now(timezone.utc)
    logger.info("Deployment started at %s", start.isoformat())

    workspace_id = _env("TARGET_WORKSPACE_ID")
    environment = _env("TARGET_ENVIRONMENT")  # DEV | QA | PROD
    if environment.upper() not in VALID_ENVIRONMENTS:
        logger.error(
            "Invalid TARGET_ENVIRONMENT '%s'. Must be one of: %s",
            environment,
            ", ".join(sorted(VALID_ENVIRONMENTS)),
        )
        sys.exit(1)
    environment = environment.upper()
    repo_dir = _env("REPO_DIR", required=False, default=DEFAULT_REPO_DIR)
    items_in_scope = _parse_items_in_scope(_env("ITEMS_IN_SCOPE", required=False))
    logger.info("Items in scope: %s", items_in_scope)
    clean_orphans = _parse_bool(_env("CLEAN_ORPHANS", required=False, default="false"))
    force_republish = _parse_bool(_env("FORCE_REPUBLISH", required=False, default="false"))
    parameter_file_path = _env("PARAMETER_FILE_PATH", required=False, default="./config/parameter.yml")
    notebooks_to_run = _parse_items_in_scope(_env("RUN_NOTEBOOKS", required=False))
    if _env("RUN_NOTEBOOKS", required=False) is None:
        notebooks_to_run = ["Notebook_MockData"]

    try:
        deploy(
            workspace_id=workspace_id,
            environment=environment,
            repo_dir=repo_dir,
            item_types=items_in_scope,
            clean_orphans=clean_orphans,
            force_republish=force_republish,
            parameter_file_path=parameter_file_path,
            notebooks_to_run=notebooks_to_run,
        )
    except Exception:
        logger.exception("Deployment failed.")
        sys.exit(1)
    finally:
        end = datetime.now(timezone.utc)
        elapsed = (end - start).total_seconds()
        logger.info("Total elapsed time: %.1f seconds", elapsed)


if __name__ == "__main__":
    main()
