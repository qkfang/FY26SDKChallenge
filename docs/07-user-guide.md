# User Guide

## Overview

This guide walks through how to use the Fabric Automation Agent App to provision and deploy a complete Microsoft Fabric analytics environment — from requirements to production — in a handful of steps.

For reference, the equivalent end-to-end process done manually in the Fabric portal is documented here:
[Microsoft Fabric CI/CD Tutorial](https://learn.microsoft.com/en-us/fabric/cicd/cicd-tutorial?tabs=azure-devops%2Cmanual)

---

## Prerequisites

Before you start, ensure you have:

- A **Microsoft Fabric** capacity (Trial or Premium)
- A **GitHub account** with Copilot access
- An **Azure subscription** (for infrastructure provisioning)
- **Node.js v18+** installed locally (if running locally)
- Fabric tenant admin switches enabled:
  - *Users can create Fabric items*
  - *Users can synchronize workspace items with their Git repositories*
  - *Users can synchronize workspace items with GitHub repositories* (GitHub only)

---

## Step 1 — Open the App and Start a Session

1. Navigate to the app URL (e.g. `https://ghcsdk-prod-web.azurestaticapps.net`) or `http://localhost:3000` locally.
2. Sign in with your Microsoft account (Entra ID).
3. Click **New Session** to initialise a workspace folder and start a Copilot session.

---

## Step 2 — Describe Your Requirements

1. In the **Requirements** text box, describe the Fabric resources you need in plain English. For example:

   > "I need a lakehouse for customer transaction data with a semantic model, a data ingestion notebook, and a Power BI sales report."

2. Click **Generate Plan**.
3. Review the AI-generated plan — the agent lists every Fabric artifact it will create (lakehouses, notebooks, semantic models, reports) along with the deployment steps it will run.

---

## Step 3 — Review the Generated Workspace

After the plan is accepted the Copilot agent customises the workspace artifacts and commits them to your Git repository:

1. Inspect the generated files in the **Workspace** panel:
   - Lakehouse schema (`lakehouse.metadata.json`)
   - Notebook code (`notebook-content.py`)
   - Semantic model TMDL files
   - Power BI report definition (PBIR format)
   - Deployment config (`parameter.yml`, `variable.json`)
2. Make any edits directly in the panel or in your Git repo.
3. When satisfied, proceed to **Deploy**.

---

## Step 4 — Deploy Infrastructure (Bicep)

This step provisions the Azure resources that host the app and Fabric capacity.

1. Click **Deploy Bicep** (or **Run All** to execute all deploy steps in sequence).
2. The agent runs `deploy-bicep.ps1` against your Azure subscription.
3. Monitor real-time progress in the **Logs** panel.
4. On success you will see:
   - App Service (backend API)
   - Static Web App (frontend)
   - Key Vault
   - Application Insights + Log Analytics
   - Fabric Capacity

---

## Step 5 — Configure Fabric Workspace (CLI)

1. Click **Deploy CLI**.
2. The agent runs `deploy-cli.ps1`, which:
   - Creates and configures the Fabric workspace
   - Assigns the Fabric capacity
   - Connects the workspace to your Git repository (main branch)
   - Enables Git integration and syncs workspace items

This replaces the manual steps described in [Step 3 of the Fabric CI/CD tutorial](https://learn.microsoft.com/en-us/fabric/cicd/cicd-tutorial?tabs=azure-devops%2Cmanual#step-3-connect-the-teams-development-workspace-to-git).

---

## Step 6 — Deploy Fabric Artifacts (fabric-cicd)

1. Click **Deploy Fabric**.
2. The agent runs `deploy-fabric.ps1`, which uses the `fabric-cicd` Python library to publish all workspace items (lakehouses, notebooks, semantic models, reports) to the Fabric workspace.
3. Items are promoted through **dev → qa → prod** automatically via the GitHub Actions deployment pipeline.

This replaces the manual deployment pipeline steps described in [Steps 4 and 5 of the Fabric CI/CD tutorial](https://learn.microsoft.com/en-us/fabric/cicd/cicd-tutorial?tabs=azure-devops%2Cmanual#step-4-create-a-deployment-pipeline).

---

## Step 7 — Verify in the Fabric Portal

Once deployment completes, confirm everything looks correct in the portal:

1. Go to [app.fabric.microsoft.com](https://app.fabric.microsoft.com).
2. Open your workspace (named according to the session ID or your requirement description).
3. Verify the following items are present:
   - **Lakehouse** — with the expected schema and tables
   - **Notebook** — runnable and connected to the lakehouse
   - **Semantic Model** — with correct relationships and measures
   - **Power BI Report** — rendering data from the semantic model
4. Open the **Source control** panel and confirm the workspace is synced to your Git branch with `0` uncommitted changes.
5. Check the **Deployment pipeline** view to see all three stages (dev / test / prod) are green.

---

## Making Changes After Initial Deployment

To update resources after the initial deployment:

1. Open the app and load your existing session (or start a new one pointing at the same workspace directory).
2. Describe the change you want — for example: *"Add a new column 'region' to the customer lakehouse table."*
3. The agent modifies the relevant files and commits to a feature branch.
4. Raise a pull request in GitHub to merge the change into main.
5. Merging triggers the GitHub Actions CI/CD pipeline, which re-deploys the affected artifacts automatically.

This mirrors the branching workflow described in [Steps 6–9 of the Fabric CI/CD tutorial](https://learn.microsoft.com/en-us/fabric/cicd/cicd-tutorial?tabs=azure-devops%2Cmanual#step-6-create-an-isolated-workspace) — but without any manual portal work.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Deploy Bicep fails with auth error | `AZURE_CREDENTIALS` secret not set | Add the service principal JSON to the GitHub environment secret |
| Workspace not found after CLI deploy | Wrong Fabric capacity or tenant | Check `parameter.yml` for the correct capacity name and tenant ID |
| Semantic model shows no data | Dataset credentials not configured | Set credentials in Fabric portal: **Settings → Semantic models → Data source credentials** |
| Git sync shows conflicts | Parallel edits on the same branch | Create a feature branch, resolve conflicts, and merge via PR |
| Rate limit error (429) from backend | Too many requests in short time | Wait 15 minutes and retry; adjust limits in `deployment.ts` if needed |

---

## Reference Links

- [Microsoft Fabric CI/CD Tutorial](https://learn.microsoft.com/en-us/fabric/cicd/cicd-tutorial?tabs=azure-devops%2Cmanual)
- [Introduction to Git integration in Fabric](https://learn.microsoft.com/en-us/fabric/cicd/git-integration/intro-to-git-integration)
- [Introduction to deployment pipelines](https://learn.microsoft.com/en-us/fabric/cicd/deployment-pipelines/intro-to-deployment-pipelines)
- [fabric-cicd Python library](https://github.com/microsoft/fabric-cicd)
- [GitHub Copilot CLI](https://docs.github.com/en/copilot/github-copilot-in-the-cli/about-github-copilot-in-the-cli)

---

[← Previous: Presentation](06-ppt.md) | [Next: Customer Validation →](09-customer-validation.md)
