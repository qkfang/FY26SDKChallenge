# Fabric Automation Agent App

> **Copilot-driven automation that turns Microsoft Fabric delivery from a multi-tool manual process into a single-click, end-to-end deployment workflow.**

What used to take hours of portal navigation across Azure, Fabric, and Git tooling now happens in minutes — just describe what you need in plain English and let the agent handle the rest.

![Solution Design](docs/res/solution-design.png)

---

## Why It Matters

Data engineering teams working with Microsoft Fabric face a fragmented delivery process spanning three disconnected worlds: **Azure infrastructure**, **Fabric workspace administration**, and **artifact deployment**. Each requires different tools, different auth models, and different skill sets. The result is slow onboarding, inconsistent environments, and deployments that are hard to reproduce.

This app eliminates that friction entirely.

---

## What It Does

Describe your Fabric environment in natural language. The agent generates, provisions, and deploys everything — automatically.

| Step | What Happens |
|------|-------------|
| **1. Describe** | Enter your requirement: *"Create a marketing analytics workspace with a lakehouse and sample notebooks"* |
| **2. Generate** | GitHub Copilot SDK generates all Fabric artifacts — lakehouses, notebooks, semantic models, reports |
| **3. Review** | Inspect the generated artifacts committed to your Git repository — diff, edit, or approve before any infrastructure is touched |
| **4. Deploy** | One click provisions Azure infrastructure (Bicep), configures Fabric workspaces (CLI/API), and deploys all artifacts via CI/CD |
| **5. Repeat** | Every artifact is Git-backed and environment-aware — promote from dev → QA → prod with confidence |

![Requirements Form](docs/res/step2.png)

![Deployment Progress](docs/res/step4.png)

---

## Key Capabilities

- **Prompt-driven creation** — no portal clicking, no template editing; natural language in, production-ready Fabric environment out
- **Single-click deployment** — Azure provisioning, workspace setup, and artifact deployment in one unified action
- **Git-backed version control** — full history, branching, and PR reviews for every generated artifact
- **Multi-environment support** — consistent dev / QA / prod environments with AI-generated best-practice configurations
- **Enterprise-ready** — Entra ID authentication, Key Vault secrets, Application Insights observability, and CI/CD approval gates

---

## Technology

Built on **GitHub Copilot SDK** as the AI backbone, integrated with the full Microsoft Platform:

`React` · `TypeScript` · `Node.js` · `GitHub Copilot SDK` · `Microsoft Fabric API` · `Work IQ MCP` · `Bicep` · `Azure App Service` · `Azure Static Web App` · `Entra ID` · `Key Vault` · `App Insights` · `fabric-cicd` · `GitHub Actions`

---

## Quick Start

```bash
git clone https://github.com/qkfang/FY26SDKChallenge.git
cd FY26SDKChallenge
npm install
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:3001

**Prerequisites:** Node.js v18+, GitHub Copilot CLI authenticated (`gh copilot --version`), Microsoft Fabric access

---

## Documentation

| | |
|---|---|
| [Summary](docs/01-summary.md) | Solution overview and value proposition |
| [Problem Statement](docs/02-problem.md) | The Fabric delivery fragmentation problem and how we solve it |
| [Setup & Architecture](docs/03-setup.md) | Technical components, architecture diagram, and prerequisites |
| [Agent Integration](docs/04-agent-integration.md) | GitHub Copilot SDK and agent customization details |
| [Solution Highlights](docs/05-highlight.md) | Enterprise applicability, integrations, and scoring criteria |

