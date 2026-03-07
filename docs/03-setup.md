
## Solution Overview

### Key Components

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18, TypeScript, Vite, MSAL | SPA with multi-step wizard UI and Entra ID auth |
| Backend | Node.js, Express, TypeScript | REST API orchestrating Copilot, Fabric, and deploy scripts |
| Copilot Service | `@github/copilot-sdk` | Manages Copilot CLI sessions to generate Fabric artifacts from prompts |
| Fabric Service | Fabric REST API (`api.fabric.microsoft.com`) | Creates workspaces, lakehouses, and other Fabric items |
| Work IQ Service | `@microsoft/workiq` MCP | Queries organizational data for context-aware generation |
| Infrastructure | Bicep modules | Provisions App Service, Static Web App, Key Vault, App Insights |
| CI/CD Templates | PowerShell + `fabric-cicd` (Python) | Deploys Fabric workspace artifacts across environments |

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        User Browser                          │
│              React + TypeScript + Vite (SPA)                 │
│      MSAL auth · RequirementForm · DeploySteps UI            │
└──────────────────────┬───────────────────────────────────────┘
                       │  REST / polling
                       ▼
┌──────────────────────────────────────────────────────────────┐
│                   Express Backend (Node.js)                   │
│                                                              │
│  routes/deployment.ts  ─►  deploymentService.ts              │
│                              │                               │
│            ┌─────────────────┼────────────────┐              │
│            ▼                 ▼                ▼              │
│   copilotService.ts   fabricService.ts   workiqService.ts    │
│   (GitHub Copilot SDK) (Fabric REST API)  (Work IQ MCP)      │
└─────┬──────────────┬─────────────────────────────────────────┘
      │              │
      ▼              ▼
┌───────────┐  ┌────────────────────────────────────────────┐
│  GitHub   │  │         Microsoft Fabric                    │
│  Copilot  │  │  Workspaces · Lakehouses · Notebooks        │
│  CLI      │  │  Semantic Models · Reports · CI/CD          │
└───────────┘  └────────────────────────────────────────────┘
      │
      ▼
┌──────────────────────────────────────────────────────────────┐
│                Azure Resources (Bicep)                        │
│  App Service · Static Web App · Key Vault · App Insights     │
│  Log Analytics · Fabric Capacity                             │
└──────────────────────────────────────────────────────────────┘
```


## Prerequisites

- **Node.js** v18 or later
- **GitHub Copilot CLI** installed and authenticated (`gh copilot --version`)
- **GitHub account** with Copilot access
- **Microsoft Fabric** access (for live deployments)
- **Azure subscription** (optional, for hosting infrastructure)
- **Microsoft Entra ID** app registration (optional, for authentication)


## Usage

1. **Init** — click "New Session" to create a workspace folder and Copilot session.
2. **Describe requirements** — enter a natural-language description of the Fabric resources you need.
3. **Review workspace** — inspect the generated artifacts (lakehouses, notebooks, semantic models, reports).
4. **Deploy** — run individual deploy steps (Bicep → CLI → Fabric CI/CD) or execute them all.
5. **Monitor** — watch real-time progress and review logs.


## Feature Overview

### 1. Chat-driven Fabric automation
The app uses a conversational interface to automate development across the Microsoft Fabric stack. Rather than configuring resources manually in multiple tools, users describe what they want, and the platform orchestrates the required setup and deployment steps.

### 2. Template-driven Git model
We use a **baseline organisational repository** to define engineering standards, patterns, and recommended structures.  
Each user or workspace then has a **dedicated repository** that stores Fabric resources and project-specific customisation.

This approach gives teams:
- reusable templates
- consistent implementation patterns
- full change history
- support for peer review and approvals
- a foundation for further engineering beyond initial generation

### 3. End-to-end deployment automation
The solution integrates multiple layers of deployment tooling:

- **Infrastructure as Code** for Azure capacity provisioning
- **Fabric CLI** for workspace-level setup and configuration
- **Fabric APIs** for individual Fabric resource deployment
- **GitHub Actions** for continuous integration and continuous deployment

Together, these pieces create a single automated pipeline from environment creation through to Fabric asset deployment.

## Setup

```bash
# Clone the repository
git clone https://github.com/qkfang/FY26SDKChallenge.git
cd FY26SDKChallenge

# Install backend dependencies
cd src/backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Environment Variables (optional)

| Variable | Purpose |
|----------|---------|
| `PORT` | Backend port (default `3001`) |
| `AZURE_CLIENT_ID` | Entra ID app client ID for MSAL login |
| `AZURE_TENANT_ID` | Entra ID tenant (default `common`) |

## Running Locally

```bash
# Terminal 1 — backend
cd src/backend
npm run dev          # starts on http://localhost:3001

# Terminal 2 — frontend
cd src/frontend
npm run dev          # starts on http://localhost:3000
```

Open `http://localhost:3000` in a browser.




## Deployment to Azure

The `bicep/` directory contains modular infrastructure definitions:

```bash
cd bicep
./deploy-fabric.ps1 -Environment dev
```

This provisions:
- **App Service** — hosts the Express backend
- **Static Web App** — hosts the React frontend
- **Key Vault** — stores secrets
- **Application Insights + Log Analytics** — monitoring and diagnostics

## CI/CD with GitHub Actions

The project uses four GitHub Actions workflows that promote changes through **dev → qa → prod** environments with sequential gates.

### Workflows

| Workflow | File | Trigger | Purpose |
|----------|------|---------|---------|
| Deploy Infrastructure | `deploy-infra.yml` | Push to `bicep/**` | Provisions Azure resources via Bicep templates |
| Deploy Backend | `deploy-backend.yml` | Push to `src/backend/**` or `src/shared/**` | Builds and deploys the Express API to Azure App Service |
| Deploy Frontend | `deploy-frontend.yml` | Push to `src/frontend/**` or `src/shared/**` | Builds and deploys the React SPA to Azure Static Web Apps |
| Copilot Setup Steps | `copilot-setup-steps.yml` | Push/PR to its own path | Validates the Copilot agent environment setup (checkout + Azure login) |

All deployment workflows also support `workflow_dispatch` for manual runs.

### Pipeline Flow

```
  push to main
       │
       ▼
  ┌──────────┐     ┌──────────┐     ┌──────────┐
  │   dev    │────►│    qa    │────►│   prod   │
  └──────────┘     └──────────┘     └──────────┘
```

Each environment stage requires the previous stage to succeed before proceeding.

### Secrets & Variables

| Name | Type | Purpose |
|------|------|---------|
| `AZURE_CREDENTIALS` | Secret | Service principal JSON for Azure CLI login |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | Secret | Deployment token for Static Web Apps |
| `AZURE_TENANT_ID` | Variable | Entra ID tenant injected at build time |
| `AZURE_CLIENT_ID` | Variable | Entra ID app client ID injected at build time |
| `API_URL` | Variable | Backend API URL injected into the frontend build |

### GitHub Environment Setup

Create three environments (**dev**, **qa**, **prod**) under **Settings → Environments** in the repository. Each environment should have the secrets and variables listed above configured with environment-specific values. The qa environment should require dev to succeed, and prod should require qa, enforcing the sequential promotion gate.

### Service Endpoints

Resources follow the naming convention `ghcsdk-{env}-{role}`:

| Environment | Backend (App Service) | Frontend (Static Web App) |
|-------------|----------------------|--------------------------|
| dev | `https://ghcsdk-dev-api.azurewebsites.net` | `https://ghcsdk-dev-web.azurestaticapps.net` |
| qa | `https://ghcsdk-qa-api.azurewebsites.net` | `https://ghcsdk-qa-web.azurestaticapps.net` |
| prod | `https://ghcsdk-prod-api.azurewebsites.net` | `https://ghcsdk-prod-web.azurestaticapps.net` |

The backend API is served under the `/api` path on the App Service. The frontend build is configured with the `API_URL` variable pointing to the corresponding backend endpoint.

### Backend Build & Deploy

The backend workflow has a dedicated **build** job that compiles TypeScript, bundles production dependencies, and uploads an artifact. Each environment job then downloads and deploys the same artifact to its respective App Service (`ghcsdk-{env}-api`).

### Frontend Build & Deploy

Each environment job installs dependencies, builds the Vite app with environment-specific variables, and uploads the `dist/` folder to Azure Static Web Apps using the `Azure/static-web-apps-deploy` action.

### Infrastructure Deploy

Each environment job runs `az deployment group create` against its resource group (`rg-ghcsdk-{env}`) using the matching Bicep parameter file (`main.{env}.bicepparam`).

## Responsible AI

- **Human-in-the-loop** — all Copilot-generated artifacts are presented for review before deployment; no changes are applied without explicit user action.
- **Transparency** — every generated plan is visible in the workspace folder and committed to Git, providing full auditability.
- **Rate limiting** — the backend enforces request rate limits to prevent abuse.
- **Authentication** — optional Entra ID integration ensures only authorized users can trigger deployments.
- **Least privilege** — Bicep templates assign managed identities with scoped Key Vault access policies rather than broad credentials.

