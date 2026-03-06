
## Architecture Overview



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


## Deployment




