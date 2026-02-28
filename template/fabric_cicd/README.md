# Microsoft Fabric CI/CD — fabric-cicd + GitHub Actions

<!-- Replace <OWNER>/<REPO> with your GitHub org/repo path -->
![Fabric CI/CD](https://github.com/<OWNER>/<REPO>/actions/workflows/fabric-cicd.yml/badge.svg)

End-to-end CI/CD for Microsoft Fabric using **Git as the source of truth**, the [fabric-cicd](https://microsoft.github.io/fabric-cicd/) Python library, and **GitHub Actions** with environment-gated approvals.

> **No Fabric Deployment Pipelines** are used. All deployments are code-first from this repository.

---

## Architecture

```
┌────────────┐   push to main   ┌──────────────────┐
│  Developer  │ ───────────────► │  GitHub Actions   │
└────────────┘                   │                   │
                                 │ 1. deploy-dev  ───┼──► DEV workspace
                                 │ 2. deploy-qa   ───┼──► QA  workspace  (approval gate)
                                 │ 3. deploy-prod ───┼──► PROD workspace (approval gate)
                                 └──────────────────┘
```

## Repository Structure

```
├── .github/
│   ├── workflows/
│   │   └── fabric-cicd.yml     # GitHub Actions workflow (DEV → QA → PROD)
│   ├── CODEOWNERS              # Required reviewers for critical paths
│   └── dependabot.yml          # Automated dependency updates
├── config/
│   └── parameter.yml            # Environment-specific find/replace rules
├── deploy/
│   ├── deploy_workspace.py      # Main deployment script
│   └── validate_repo.py         # Pre-deployment repository validation
├── workspace/                   # Fabric items (exported via Git integration)
├── .env.example                 # Template for local environment variables
├── .gitignore
├── requirements.txt             # Pinned Python dependencies
├── ruff.toml                    # Linter configuration
├── SECURITY.md                  # Vulnerability disclosure policy
└── README.md                    # This file
```

---

## Prerequisites

| Requirement | Details |
|---|---|
| **Python** | 3.10+ |
| **Service Principal** | Registered in Entra ID with Fabric workspace access (Contributor or Admin) |
| **Fabric Workspaces** | Three workspaces: DEV, QA, PROD |
| **GitHub Environments** | `dev`, `qa`, `prod` configured in your GitHub repo settings |
| **GitHub Secrets** | Per-env SP creds (`DEV_TENANT_ID`, `DEV_CLIENT_ID`, `DEV_CLIENT_SECRET`, etc.) + workspace IDs (`DEV_WORKSPACE_ID`, `QA_WORKSPACE_ID`, `PROD_WORKSPACE_ID`). Optional shared fallbacks: `FABRIC_TENANT_ID`, `FABRIC_CLIENT_ID`, `FABRIC_CLIENT_SECRET`. |

---

## How to Run Locally

### 1. Clone and set up

```bash
git clone <this-repo-url>
cd fabric-cicd-project
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
```

### 2. Configure environment variables

```bash
cp .env.example .env
# Edit .env with your real values
```

### 3. Validate the repository

```bash
python deploy/validate_repo.py
```

### 4. Deploy to a workspace

```bash
# Load .env variables (bash)
export $(grep -v '^#' .env | xargs)

# Or on Windows PowerShell
Get-Content .env | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.*)$') {
        [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2])
    }
}

python deploy/deploy_workspace.py
```

### VS Code Tips

- Set the Python interpreter to `.venv/bin/python` (or `.venv\Scripts\python.exe` on Windows).
- Install the **Python** extension for linting and IntelliSense.
- Create a `.vscode/launch.json` to run `deploy_workspace.py` with `envFile` pointing to `.env`:

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Deploy Workspace",
            "type": "debugpy",
            "request": "launch",
            "program": "${workspaceFolder}/deploy/deploy_workspace.py",
            "envFile": "${workspaceFolder}/.env",
            "console": "integratedTerminal"
        }
    ]
}
```

---

## How to Run in GitHub Actions

### 1. Push Fabric items to the `workspace/` folder

Export items via Fabric Git integration or author them locally, then commit to `main`.

### 2. Configure GitHub Environments

In **Settings → Environments**, create:

| Environment | Reviewers | Branch policy |
|---|---|---|
| `dev` | None (auto-deploy) | `main` |
| `qa` | 1+ reviewer(s) | `main` |
| `prod` | 1+ reviewer(s) | `main` |

### 3. Configure GitHub Secrets

Add the following secrets at the **repository** level (or per-environment if workspace IDs differ per env):

| Secret | Description |
|---|---|
| `DEV_TENANT_ID` | Entra ID tenant for the DEV service principal |
| `DEV_CLIENT_ID` | DEV service principal app (client) ID |
| `DEV_CLIENT_SECRET` | DEV service principal secret value |
| `QA_TENANT_ID` | Entra ID tenant for the QA service principal |
| `QA_CLIENT_ID` | QA service principal app (client) ID |
| `QA_CLIENT_SECRET` | QA service principal secret value |
| `PROD_TENANT_ID` | Entra ID tenant for the PROD service principal |
| `PROD_CLIENT_ID` | PROD service principal app (client) ID |
| `PROD_CLIENT_SECRET` | PROD service principal secret value |
| `FABRIC_TENANT_ID` | *(fallback)* Shared tenant ID if per-env vars are not set |
| `FABRIC_CLIENT_ID` | *(fallback)* Shared client ID if per-env vars are not set |
| `FABRIC_CLIENT_SECRET` | *(fallback)* Shared secret if per-env vars are not set |
| `DEV_WORKSPACE_ID` | Fabric workspace ID for DEV |
| `QA_WORKSPACE_ID` | Fabric workspace ID for QA |
| `PROD_WORKSPACE_ID` | Fabric workspace ID for PROD |

### 4. Trigger

- **Automatic**: push to `main` triggers the workflow.
- **Manual**: use the **Run workflow** button in GitHub Actions (workflow_dispatch).

---

## How Approvals Work

The workflow uses [GitHub Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment) for promotion gates:

1. **deploy-dev** runs immediately on push to `main`.
2. **deploy-qa** starts after `deploy-dev` succeeds. Because the `qa` environment has **required reviewers**, the job pauses and waits for approval.
3. **deploy-prod** starts after `deploy-qa` succeeds. The `prod` environment also requires **reviewer approval** before execution.

Reviewers receive an email / GitHub notification and can approve or reject directly from the Actions run page.

```
push to main
  └─► deploy-dev (auto) ✅
        └─► deploy-qa (⏸ waiting for approval)
              └─► [Reviewer approves]
                    └─► deploy-qa ✅
                          └─► deploy-prod (⏸ waiting for approval)
                                └─► [Reviewer approves]
                                      └─► deploy-prod ✅
```

---

## Configuration: parameter.yml

The `config/parameter.yml` file drives environment-specific replacements. When deploying to QA, for example, `fabric-cicd` replaces all DEV resource IDs with QA equivalents before pushing items to the workspace.

Edit the file to map **your** real workspace IDs, lakehouse IDs, connection strings, etc.:

```yaml
find_replace:
  DEV:
    "<dev-workspace-id>": "<dev-workspace-id>"
  QA:
    "<dev-workspace-id>": "<qa-workspace-id>"
  PROD:
    "<dev-workspace-id>": "<prod-workspace-id>"
```

See the [fabric-cicd parameterization docs](https://microsoft.github.io/fabric-cicd/parameterization/) for advanced patterns.

---

## Supported Item Types

The default deployment scope includes:

- Notebook
- DataPipeline
- SemanticModel
- Report
- Environment
- Lakehouse
- Warehouse
- KQLDatabase
- Eventstream
- MLModel / MLExperiment
- SparkJobDefinition

Override via the `ITEMS_IN_SCOPE` environment variable (comma-separated).

---

## Troubleshooting

| Issue | Resolution |
|---|---|
| **401 / 403 from Fabric API** | Verify the service principal has Contributor/Admin on the target workspace and the correct API permissions in Entra ID. |
| **HTTP 429 (throttling)** | `deploy_workspace.py` retries up to 3 times with exponential backoff. Increase `MAX_RETRIES` if needed. |
| **"Required environment variable not set"** | Check GitHub Secrets (CI) or your `.env` file (local). |
| **Empty workspace/ folder** | Export items from Fabric Git integration, or create them locally following the Fabric item folder structure. |

---

## License

This project is provided as a template. Apply your organization's license as appropriate.
