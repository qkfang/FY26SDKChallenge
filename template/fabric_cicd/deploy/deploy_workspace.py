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
)
logger = logging.getLogger("fabric-cicd-deploy")

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
DEFAULT_REPO_DIR = "./workspace"
DEFAULT_ITEM_TYPES = [
    "Notebook",
    "SemanticModel",
    "Report",
    "Environment",
    "Lakehouse",
    "SQLDatabase",
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
# Core deployment logic
# ---------------------------------------------------------------------------

def deploy(
    workspace_id: str,
    environment: str,
    repo_dir: str,
    item_types: list[str],
    clean_orphans: bool,
    parameter_file_path: str | None = None,
) -> None:
    """Run a full deterministic deployment to the target workspace."""

    logger.info("=" * 60)
    logger.info("DEPLOYMENT START")
    logger.info("  Workspace ID  : %s", workspace_id)
    logger.info("  Environment   : %s", environment)
    logger.info("  Repo directory: %s", os.path.abspath(repo_dir))
    logger.info("  Item types    : %s", ", ".join(item_types))
    logger.info("  Clean orphans : %s", clean_orphans)
    logger.info("  Parameter file: %s", parameter_file_path or "(default)")
    logger.info("  Git commit    : %s", os.environ.get("GITHUB_SHA", "local"))
    logger.info("=" * 60)

    credential = _build_credential(environment)

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
    clean_orphans = _parse_bool(_env("CLEAN_ORPHANS", required=False, default="false"))
    parameter_file_path = _env("PARAMETER_FILE_PATH", required=False, default="./config/parameter.yml")

    try:
        deploy(
            workspace_id=workspace_id,
            environment=environment,
            repo_dir=repo_dir,
            item_types=items_in_scope,
            clean_orphans=clean_orphans,
            parameter_file_path=parameter_file_path,
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
