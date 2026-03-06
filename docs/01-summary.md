# Fabric Automation App

Fabric Automation App is an end-to-end web-based solution designed to accelerate Microsoft Fabric development and simplify CI/CD automation.

Data engineer or business stake holder describe their Fabric requirements in natural language, and the app uses GitHub Copilot SDK to generate Fabric workspace artifacts — including lakehouses, notebooks, semantic models, and reports — then deploys them automatically via the Fabric REST API.

The app streamlines version control by committing generated artifacts to a Git repository for futher modification and editing, and managing deployment across environments (dev, QA, prod). It eliminates manual setup, reduces the time from idea to deployed Fabric solution, and enforces consistent Fabric workspace structure and CI/CD practices across environements.

Key capabilities:
- Natural language to Fabric artifact generation via Copilot
- Automated workspace deveopment, provisioning and deployment
- Git-backed version control for all Fabric items and automation
- Multi-environment promotion pipeline via GitHub Actions


## Screenshots

### Step 1 — Enter Requirements
![Step 1](docs/step1.png)

### Step 2 — Requirements
![Step 2](docs/step2.png)

### Step 3 — Workspace
![Step 3](docs/step3.png)

![Step 3b](docs/step3b.png)

### Step 4 — Deployment
![Step 4](docs/step4.png)

### Step 5 — Fabric Portal
![Step 5](docs/step5.png)
