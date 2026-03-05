# Fabric Automation App

## Problem

Standing up a Microsoft Fabric analytics solution requires juggling three disconnected toolchains:

1. **Azure provisioning** — Capacity, resource groups, and networking are managed with Bicep/ARM templates or the Azure portal, each with its own auth model and deployment patterns.
2. **Fabric workspace configuration** — Creating workspaces, assigning capacity, linking Git repos, and enabling CI/CD pipelines all happen through Fabric admin screens with no declarative desired-state file.
3. **Artifact authoring** — Lakehouses, notebooks, semantic models, and reports are built inside the Fabric portal and must be manually promoted across environments.

This fragmentation makes the process slow, error-prone, and hard to reproduce. A new team member must learn all three surfaces before they can stand up their first workspace.

## Solution

This app unifies all three layers into a single prompt-driven workflow powered by the **GitHub Copilot SDK**:

- **Prompt-driven creation** — describe what you need in natural language; GitHub Copilot generates Fabric artifacts (lakehouses, notebooks, semantic models, reports) automatically.
- **Single-click deployment** — one action triggers Azure infrastructure provisioning (Bicep), Fabric workspace setup (CLI/API), and CI/CD artifact deployment together.
- **Git-backed version control** — every generated artifact is committed to a Git repo, enabling branching, PR reviews, and full history.
- **Consistent environments** — AI-generated plans follow best practices, reducing configuration drift across dev / QA / prod.
- **Repeatable workflows** — capture and replay common deployment patterns without manual template editing.

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

## Prerequisites

- **Node.js** v18 or later
- **GitHub Copilot CLI** installed and authenticated (`gh copilot --version`)
- **GitHub account** with Copilot access
- **Microsoft Fabric** access (for live deployments)
- **Azure subscription** (optional, for hosting infrastructure)
- **Microsoft Entra ID** app registration (optional, for authentication)

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
| `VITE_AZURE_CLIENT_ID` | Entra ID app client ID for MSAL login |
| `VITE_AZURE_TENANT_ID` | Entra ID tenant (default `common`) |

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

## Usage

1. **Init** — click "New Session" to create a workspace folder and Copilot session.
2. **Describe requirements** — enter a natural-language description of the Fabric resources you need.
3. **Review workspace** — inspect the generated artifacts (lakehouses, notebooks, semantic models, reports).
4. **Deploy** — run individual deploy steps (Bicep → CLI → Fabric CI/CD) or execute them all.
5. **Monitor** — watch real-time progress and review logs.

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
- **No training on user data** — Copilot interactions use the standard GitHub Copilot CLI; user prompts are handled under GitHub's existing Copilot data policies and are not used to train models.
