# Presentation Content

## Slide 1 — Title

**Fabric Automation Agent App**
End to end Fabric Development & Deployment across environments
FY26 GitHub Copilot SDK Challenge

Customer A: How to use agents to create Fabric models & reports following defined pattern?
Customer B: What's the strategy to manage data engineering CI/CD for Fabric? Lots of disconnected steps
Customer C: Why Git integration in Fabric workspace can't resolve conflicts?
Customer D: Our data team is very new to git and CI/CD process, but we really need it.

## Slide 2 — Current Challenges of Fabric Development & Deployment

- Data engineering teams could spend hours manually developing and deploying Fabric workspaces, semantic models, and Power BI reports via UI, creating significant productivity drains
- Although click-ops in the UI simplified initial setup, it was difficult to enforce consistent development patterns and build resource-efficient solutions that aligned with enterprise standards for large team
- Teams lacked standardized enterprise-level structures and patterns for Fabric workspace, resulting in inconsistent environments and difficult-to-reproduce configurations across deployments
- Configuration errors during manual deployments led to failures and required time-consuming rollbacks and troubleshooting cycles
- Engineers have to switch constantly between Azure portal, Fabric portal, GitHub, and console tools to complete a single end-to-end deployment, increasing cognitive load and the risk of mistakes
- Without version-controlled workspace, changes were hard to track and audit, making rollbacks, comparisons, and cross-environment consistency far more difficult (existing UI git repo support is limited)
- **90% Time Reduction**

## Slide 3 — Our Solution & Business Value

**Enterprise Fabric Template** — GitHub Copilot SDK reads pre-defined Fabric template project configurations and assets from enterprise template repository as starting point, allowing patterns and structures defined in a centralised way to start with.

Our app provides an agent-driven web interface for end-to-end Fabric development and deployment across multiple environments, covering the full Microsoft Fabric workflow and configurations in one single place.

Instead of jumping between Azure, Fabric CLI, the Fabric portal, and source control tools, data engineers can use a single web-based interface to generate, configure, version, and deploy Fabric assets consistently.

Shifting Fabric delivery from a manual, UI-heavy process to an agentic, repeatable, governed, and automation-first workflow.

- Massive time savings by reducing hours of manual development and deployment to an automated workflow
- Lower deployment risk through standardized enterprise-level templates and validated configuration
- Better governance with version control, audit trails, and approval workflows tightly integrated with CI/CD
- Improved developer experience through a simple agent-based web interface for producing Fabric asset
- Agent assisted debugging and fixing processing during deployment script execution (agent helps debugging and bug fix)
- Greater consistency across teams, projects, and environments

Built by App + Data + Software Solution Engineers from Down Under who work closely with financial services customers adopting Microsoft Fabric, this solution tackles real enterprise challenges: simplifying building, setup, and testing process, bridging data engineering & DevOps and enabling governed, repeatable deployments for large organisations.

## Slide 4 — Web-based Agent App

Agent-driven automation that turns Microsoft Fabric delivery from a multi-tool manual process into a centralised end-to-end development & deployment workflow across environments with work context.

---

[← Previous: Highlights](05-highlight.md) | [Next: User Guide →](07-user-guide.md)
