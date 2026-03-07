---
name: fabric-deployment
description: "Deploy Microsoft Fabric workspace items using fabric-cicd library and CI/CD automation. Covers deploy_workspace.py, parameter.yml, variable.json, publish_all_items, environment configuration, service principal auth, and post-deploy notebook execution. USE FOR: deploy Fabric workspace, fabric-cicd, publish items, CI/CD pipeline, parameter.yml, variable.json, deploy script, service principal auth, multi-environment deployment, Fabric REST API, unpublish orphans, force republish, validate repo. DO NOT USE FOR: creating notebooks (use fabric-notebook), creating lakehouses (use fabric-lakehouse), creating semantic models (use fabric-semantic-model), creating reports (use fabric-report)."
---

# Fabric Deployment Skill

> Authoritative guidance for deploying Microsoft Fabric workspace items using the fabric-cicd library and automation scripts.

## Triggers

- User asks to deploy Fabric workspace items
- User asks about fabric-cicd library or publish_all_items
- User asks about multi-environment deployment (DEV/QA/PROD)
- User asks about parameter.yml or variable.json configuration
- User asks about validating a Fabric workspace repo
- User asks about CI/CD for Fabric

## Rules

1. **Dependencies** — Required Python packages (`requirements.txt`):
   ```
   fabric-cicd==0.2.0
   azure-identity==1.19.0
   requests>=2.32.0
   pyyaml==6.0.2
   ```

2. **Deployment entry point** — `deploy/deploy_workspace.py` is the main script:
   ```python
   from fabric_cicd import FabricWorkspace, publish_all_items, unpublish_all_orphan_items

   target = FabricWorkspace(
       workspace_id=workspace_id,
       repository_directory=repo_dir,
       item_type_in_scope=item_types,
       environment=environment,
   )
   publish_all_items(target)
   unpublish_all_orphan_items(target)
   ```

3. **Deployment order** — Items are deployed in this sequence:
   1. `Lakehouse` — Storage layer (must exist first)
   2. `Notebook` — Data processing (depends on Lakehouse)
   3. `SemanticModel` — Data model (depends on Lakehouse)
   4. `Report` — Visualization (depends on SemanticModel)

4. **Authentication** — Uses `ClientSecretCredential` from `azure-identity`:
   - Per-environment: `<ENV>_TENANT_ID`, `<ENV>_CLIENT_ID`, `<ENV>_CLIENT_SECRET`
   - Fallback: `FABRIC_TENANT_ID`, `FABRIC_CLIENT_ID`, `FABRIC_CLIENT_SECRET`

5. **Environment variables** — Required configuration:
   | Variable | Description |
   |----------|-------------|
   | `FABRIC_TENANT_ID` | Azure AD tenant ID |
   | `FABRIC_CLIENT_ID` | Service principal app ID |
   | `FABRIC_CLIENT_SECRET` | Service principal secret |
   | `FABRIC_WORKSPACE_ID` | Target workspace GUID |
   | `FABRIC_ENVIRONMENT` | Target environment: `DEV`, `QA`, or `PROD` |
   | `WORKSPACE_DIR` | Path to workspace item definitions (default: `./workspace`) |
   | `ITEMS_IN_SCOPE` | Comma-separated item types (default: all) |
   | `FORCE_REPUBLISH` | Delete and re-create SemanticModels/Reports (default: false) |
   | `RUN_NOTEBOOKS` | Execute notebooks post-deploy (default: false) |

6. **config/variable.json** — Per-environment resource IDs:
   ```json
   {
     "DEV": {
       "capacityId": "<guid>",
       "workspaceId": "<guid>",
       "sqlServerEndpoint": "<endpoint>",
       "sqlDatabaseName": "<name>"
     },
     "QA": { ... },
     "PROD": { ... }
   }
   ```

7. **config/parameter.yml** — Find-replace rules for environment parameterization:
   ```yaml
   find_replace:
     - find: "<dev-workspace-id>"
       replace_with:
         QA: "<qa-workspace-id>"
         PROD: "<prod-workspace-id>"
     - find: "<dev-sql-endpoint>"
       replace_with:
         QA: "<qa-sql-endpoint>"
         PROD: "<prod-sql-endpoint>"
   ```

8. **Force-republish** — When `FORCE_REPUBLISH=true`, the script deletes existing SemanticModels and Reports before re-publishing. This is required when migrating storage modes (e.g., to Direct Lake).

9. **Post-deploy notebook execution** — When `RUN_NOTEBOOKS=true`, notebooks are triggered via Fabric REST API after publishing:
   ```
   POST /workspaces/{id}/items/{notebookId}/jobs/instances?jobType=RunNotebook
   ```
   The script polls until completion with exponential backoff.

10. **Validation** — Run `deploy/validate_repo.py` before deployment:
    - Checks `workspace/` directory exists and is non-empty
    - Validates `config/parameter.yml` is valid YAML with expected environment keys
    - Verifies each item folder contains a `.platform` file

11. **Infrastructure provisioning** scripts (run before deployment):
    - `deploy-bicep.ps1` — Provisions Azure resources (Fabric capacity) via Bicep
    - `deploy-cli.ps1` — Creates workspaces via Fabric REST API, assigns roles, creates SQL databases
    - `deploy-fabric.ps1` — Main entry: loads config, sets env vars, runs `deploy_workspace.py`

12. **Orphan cleanup** — `unpublish_all_orphan_items(target)` removes items from the workspace that no longer exist in the Git repo.

## Deployment Phases

| # | Phase | Script | Description |
|---|-------|--------|-------------|
| 1 | Infrastructure | `deploy-bicep.ps1` | Provision Fabric capacity and Azure resources |
| 2 | Workspace setup | `deploy-cli.ps1` | Create workspaces, assign roles, create SQL DB |
| 3 | Validation | `validate.ps1` | Validate repo structure and config |
| 4 | Deploy items | `deploy-fabric.ps1` | Publish workspace items via fabric-cicd |

## Output

- Deployed Fabric workspace items in the target environment
- Console logs with deployment status and timing
- Post-deploy notebook execution results (if enabled)
