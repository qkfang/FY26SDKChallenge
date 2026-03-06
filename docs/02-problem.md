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