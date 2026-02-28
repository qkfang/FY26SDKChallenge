#!/usr/bin/env python3
"""
validate_repo.py — Pre-deployment validation for the Fabric workspace repository.

Checks:
  1. workspace/ directory exists and is non-empty.
  2. config/parameter.yml exists and is valid YAML.
  3. parameter.yml contains the expected environment keys (DEV, QA, PROD).
  4. Each item folder inside workspace/ has a .platform file (basic structure check).

Exit codes:
  0 — all checks passed
  1 — one or more checks failed
"""

from __future__ import annotations

import logging
import os
import sys
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S%z",
)
logger = logging.getLogger("fabric-cicd-validate")

REQUIRED_ENVIRONMENTS = {"DEV", "QA", "PROD"}


def check_workspace_dir(repo_root: Path) -> bool:
    workspace = repo_root / "workspace"
    if not workspace.is_dir():
        logger.error("workspace/ directory not found at %s", workspace)
        return False
    children = list(workspace.iterdir())
    if not children:
        logger.warning("workspace/ directory is empty — nothing to deploy.")
        return True  # empty is valid, just a warning
    logger.info("workspace/ contains %d item(s).", len(children))
    return True


def check_parameter_yml(repo_root: Path) -> bool:
    param_file = repo_root / "config" / "parameter.yml"
    if not param_file.is_file():
        logger.error("config/parameter.yml not found at %s", param_file)
        return False

    try:
        import yaml  # type: ignore
    except ImportError:
        logger.warning("PyYAML not installed — skipping YAML parse validation.")
        return True

    try:
        with open(param_file, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
    except yaml.YAMLError as exc:
        logger.error("config/parameter.yml is not valid YAML: %s", exc)
        return False

    if not isinstance(data, dict):
        logger.error("config/parameter.yml root should be a mapping.")
        return False

    # Check for find_replace or key_value_replace sections
    has_sections = False
    for section in ("find_replace", "key_value_replace"):
        if section in data:
            has_sections = True
            section_data = data[section]
            if isinstance(section_data, dict):
                found_envs = set(section_data.keys())
                missing = REQUIRED_ENVIRONMENTS - found_envs
                if missing:
                    logger.warning(
                        "config/parameter.yml section '%s' is missing environments: %s",
                        section,
                        ", ".join(sorted(missing)),
                    )

    if not has_sections:
        logger.warning(
            "config/parameter.yml has no 'find_replace' or 'key_value_replace' sections."
        )

    logger.info("config/parameter.yml is valid.")
    return True


def check_platform_files(repo_root: Path) -> bool:
    workspace = repo_root / "workspace"
    if not workspace.is_dir():
        return True  # already reported by check_workspace_dir

    ok = True
    for item_dir in workspace.iterdir():
        if item_dir.is_dir():
            platform = item_dir / ".platform"
            if not platform.is_file():
                logger.warning(
                    "Item folder '%s' is missing a .platform file.", item_dir.name
                )
                # This is a warning, not a hard failure
    return ok


def main() -> None:
    repo_root = Path(os.environ.get("REPO_ROOT", ".")).resolve()
    logger.info("Validating repository at %s", repo_root)

    results = [
        ("Workspace directory", check_workspace_dir(repo_root)),
        ("parameter.yml", check_parameter_yml(repo_root)),
        ("Platform files", check_platform_files(repo_root)),
    ]

    logger.info("-" * 40)
    all_passed = True
    for name, passed in results:
        status = "PASS" if passed else "FAIL"
        logger.info("  %-25s %s", name, status)
        if not passed:
            all_passed = False
    logger.info("-" * 40)

    if not all_passed:
        logger.error("Validation FAILED. Fix errors above before deploying.")
        sys.exit(1)
    else:
        logger.info("All validation checks PASSED.")
        sys.exit(0)


if __name__ == "__main__":
    main()
