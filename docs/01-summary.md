# Fabric Automation Agent App

**A copilot-driven automation platform that turns Microsoft Fabric delivery from a manual, multi-tool process into a standardized, version-controlled, end-to-end deployment workflow.**

Date engineering teams today spend hours manually setting up and deploying Microsoft Fabric environments across Azure, Fabric CLI, the Fabric portal, and Git tooling. Our solution unifies that into one web-based, agent-driven interface that automates the full workflow — from provisioning infrastructure to deploying workspaces, notebooks, lakehouses, semantic models, and Power BI reports. The result is faster delivery, fewer deployment errors, stronger governance, and a much better developer experience.

This **Fabric Automation Agent App** demonstrates how AI can move beyond simple assistance and become an **operational force multiplier** for data platforms. Rather than helping with one task at a time, the Fabric Automation Agent App helps teams automate the **entire delivery lifecycle** of a Fabric environment — from infrastructure provisioning to workspace setup to analytics asset deployment.

That makes it compelling not just as a demo, but as a practical platform with real enterprise value:

- faster project delivery
- more reliable deployments
- stronger governance
- easier scaling across teams

## Business Value

Setting up a Microsoft Fabric environment end-to-end through the Fabric portal requires navigating the [Fabric CI/CD tutorial](https://learn.microsoft.com/en-us/fabric/cicd/cicd-tutorial?tabs=azure-devops%2Cmanual) — a **30+ step, multi-portal process**. It covers workspace creation, Git integration, deployment pipeline setup, artifact authoring, credential configuration, branch management, and environment promotion. For an experienced data engineer this takes **over an hour** per environment, and is prone to configuration drift and human error.

Our agent replaces this with a **5-step workflow**:

1. Describe your requirements in natural language
2. Review the AI-generated plan and workspace artifacts
3. Deploy infrastructure (Bicep)
4. Configure the Fabric workspace (CLI)
5. Publish artifacts to Fabric (fabric-cicd)

**Saved from 30+ portal steps to 5 steps** — with every artifact version-controlled, every environment consistent, and every deployment repeatable without manual work.

## Solution Design

![Solution](res/solution-design.png)


## Screenshots

### Step 1 — Enter Requirements
![Step 1](res/step1.png)

### Step 2 — Requirements
![Step 2](res/step2.png)

### Step 3 — Workspace
![Step 3](res/step3.png)

![Step 3a](res/step3a.png)

### Step 4 — Deployment
![Step 4](res/step4.png)

### Step 5 — Fabric Portal
![Step 5](res/step5.png)
