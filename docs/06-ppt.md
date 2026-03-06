# Fabric Automation App  
**Automating end-to-end Microsoft Fabric development and deployment**

## The Challenge We Solved

Data engineering teams often spend **4–5 hours manually building and deploying** Microsoft Fabric workspaces, semantic models, notebooks, lakehouses, and Power BI reports through the UI. That manual process creates a major productivity bottleneck and slows delivery.

Manual deployments also introduce **configuration drift and human error**. Small mistakes can cause failed releases, inconsistent environments, and long rollback or troubleshooting cycles.

On top of that, teams often lack a **standardized deployment pattern**. Each project ends up being configured slightly differently, making environments hard to reproduce, govern, and scale across the organisation.

The **GitHub Copilot SDK Challenge** gave us the opportunity to turn this real operational pain point into an intelligent automation platform.

## The Solution

Our app provides a **chat-driven interface for end-to-end Fabric development and deployment**, covering the full Microsoft Fabric workflow in one place.

Instead of jumping between Azure, Fabric CLI, the Fabric portal, and source control tools, engineers can use a single web-based interface to generate, configure, version, and deploy Fabric assets consistently.

The platform supports:

- **Fabric workspaces**
- **Notebooks**
- **Lakehouses**
- **Semantic models**
- **Power BI reports**

## Why It Matters

This project is valuable because it shifts Fabric delivery from a **manual, UI-heavy process** to a **repeatable, governed, and automation-first workflow**.

Key benefits include:

- **Massive time savings** by reducing hours of manual setup to an automated workflow
- **Lower deployment risk** through standardized templates and validated configuration
- **Better governance** with version control, audit trails, and approval workflows
- **Improved developer experience** through a simple chat-based web interface
- **Greater consistency** across teams, projects, and environments

## Architecture Overview

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
