
# Fabric Automation App
Automating end to end Fabric Development & Deployment


# The Challenge We Solved

Data engineering teams could spend 4-5 hours manually developing and deploying Fabric workspaces, semantic models, and Power BI reports via UI, creating significant productivity drains

Configuration errors during manual deployments led to deployment failures and required time-consuming rollbacks and troubleshooting cycles

Teams lacked standardized deployment patterns, resulting in inconsistent environments and difficult-to-reproduce configurations across projects

The GitHub Copilot SDK Challenge provided the perfect catalyst to transform this operational pain point into an automated solution


# The Solution Architecture

Automated Fabric development via Chat covers the full Microsoft Fabric stack including notebook, semantic models, lakehouses, and Power BI reports in a single workflow  

Git-repository based version control uses a baseline template repo for the organisation to define guildlines and pattern, and user-specific repo stores fabric resource for each workspace and customisation. 

User repositories provide complete audit trails of all infrastructure changes with version control and approval workflows. and allow engineer to carry out further developments. the interface is web-based.

GitHub Actions integration enables continuous deployment including IaC for Azure capability, Fabric CLI for workspace level configuration and Fabric API for individual Fabric resource.

* current Fabric portal only supports AI capability for queries or individual resource, it is not covering the whole Fabric workspace as a whole

* Fabric does contain git source control but due to the limitation of the web portal, the git commit and conflicts resolution and testing is not easy to carry out. you can easily stuck with a conflict and can't move forward

* Fabric deployment typically contains multiple steps in different places: you need to deployment a fabric capacity in Azure first, then you need to either click-ops or use Fabric cli to create Fabric workspace, finally, you can use Fabric portal to create notebook or data sources. The app is hoping to combining all these integrations and deployment in one central place.




