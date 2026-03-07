
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
./deploy.ps1 -Environment dev
```

This provisions:
- **App Service** — hosts the Express backend
- **Static Web App** — hosts the React frontend
- **Key Vault** — stores secrets
- **Application Insights + Log Analytics** — monitoring and diagnostics

## Responsible AI

- **Human-in-the-loop** — all Copilot-generated artifacts are presented for review before deployment; no changes are applied without explicit user action.
- **Transparency** — every generated plan is visible in the workspace folder and committed to Git, providing full auditability.
- **Rate limiting** — the backend enforces request rate limits to prevent abuse.
- **Authentication** — optional Entra ID integration ensures only authorized users can trigger deployments.
- **Least privilege** — Bicep templates assign managed identities with scoped Key Vault access policies rather than broad credentials.

