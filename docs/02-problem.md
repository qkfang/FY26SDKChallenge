# Fabric Automation Agent App

## Problem

Standing up a Microsoft Fabric analytics solution requires juggling three disconnected toolchains:

1. **Azure provisioning** — Capacity, resource groups, and networking are managed with Bicep/ARM templates or the Azure portal, each with its own auth model and deployment patterns.
2. **Fabric workspace configuration** — Creating workspaces, assigning capacity, linking Git repos, and enabling CI/CD pipelines all happen through Fabric admin screens with no declarative desired-state file.
3. **Artifact deployment** — Lakehouses, notebooks, semantic models, and reports are built inside the Fabric portal and must be manually promoted across environments.

This fragmentation makes the process slow, error-prone, and hard to reproduce. A new team member must learn all three surfaces before they can stand up their first workspace.


## What Makes This Different

Current Fabric tooling is powerful, but fragmented.

- The **Fabric portal** provides AI assistance mainly for queries or individual resources, but not for orchestrating an entire Fabric workspace end to end.
- Fabric does support **Git integration**, but working with commits, conflict resolution, and testing through the portal can be difficult and can block progress when conflicts occur.
- A typical Fabric deployment requires work across **multiple systems**:
  1. provision Fabric capacity in Azure
  2. create and configure a workspace
  3. build assets such as notebooks, models, and data sources
  4. manage source control and deployment separately

Our app brings all of those disconnected steps into **one central experience**.

## Solution

This app unifies all three layers into a single prompt-driven workflow powered by the **GitHub Copilot SDK**:

- **Prompt-driven creation** — describe what you need in natural language; GitHub Copilot generates Fabric artifacts (lakehouses, notebooks, semantic models, reports) automatically.
- **Single-click deployment** — one action triggers Azure infrastructure provisioning (Bicep), Fabric workspace setup (CLI/API), and CI/CD artifact deployment together.
- **Git-backed version control** — every generated artifact is committed to a Git repo, enabling branching, PR reviews, and full history.
- **Consistent environments** — AI-generated plans follow best practices, reducing configuration drift across dev / QA / prod.
- **Repeatable workflows** — capture and replay common deployment patterns without manual template editing.

### Business Value

The [Fabric CI/CD tutorial](https://learn.microsoft.com/en-us/fabric/cicd/cicd-tutorial?tabs=azure-devops%2Cmanual) documents the current end-to-end process for standing up a Fabric analytics environment manually. It spans **30+ steps across the Fabric portal, Azure DevOps or GitHub, and Azure** — covering workspace creation, Git integration, deployment pipeline setup, artifact authoring, credential configuration, branch management, and environment promotion. For an experienced data engineer this takes **over an hour** per environment.

Our agent replaces all of that with **5 steps**:

1. Describe your requirements in natural language
2. Review the AI-generated plan and workspace artifacts
3. Deploy infrastructure (Bicep)
4. Configure the Fabric workspace (CLI)
5. Publish artifacts to Fabric (fabric-cicd)

**Saved from 30+ manual portal steps to 5 steps** — cutting delivery time from over an hour to under 10 minutes, with every artifact version-controlled and every environment reproducible.

---

[← Previous: Summary](01-summary.md) | [Next: Solution Overview →](03-setup.md)
