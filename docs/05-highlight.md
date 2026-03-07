

# Solutions

##	Enterprise applicability, reusability & business value

The solution is focusing enterprise customer who has Fabric in place to help data engineering team to adopater model AI 

##	Integration with other Azure or Microsoft solutions

- Azure Static Web
- Azure Web App
- App Insight
- KeyVault
- Log Analytics Workspace
- Entra ID
- Work IQ
- Microsoft Fabric (Workspace, Lakehouse, Sementic Model, PowerBI, Notebook)
- GitHub Actions
- GitHub Repo
- GitHub Copilot
- GitHub Copilot CLI SDK

##	Operational readiness (deployability, observability, CI/CD)

- IaC models for Azure resource deployment (bicep folder)
- GitHub Action CI/CD (.github/workflows): infra pipeline, frontend, backend pipeline
- Deployed Azure application is integrated with Log Analystics Workspace and Application Insight
- The deployment pipelien has dev/qa/prod environement setup including approval gates
- UI displays copilot activities logs to provide full visibility

##	Security, governance & Responsible AI excellence

- Front-end application is integration with Entra ID for user login
- Backend GitHub Copilot SDK integration with Azure and Copilot uses OAuth workflows
- Application configurations and secrets are stored in Key Vault or GitHub Actions secrets

## Storytelling, clarity & “amplification ready” quality

- Steamline full Fabric development and deployment life cycle in single application
- Typically the whole processing might take more than 1 hours for a expreienced data engineer to setup manually, the automation is able to shorten the time to under 10 minutes
- The copilot is able to create initial version controlled fabric resources for infrastures, fabric workspace and also individual fabric resource types
- Super beneifition for data engineering team to understand and follow from a full ci/cd point of view (typically, data engineers are not as knowledge as software developers in terms of git version controls, pipelines and automations)


# Extras

## Use of Work IQ / Fabric IQ / Foundry IQ

Work IQ is integrated with the copoilot so that chat session is able to reference design and data file for context.

## Validated with a customer

We are Solution Engineers from Sydney, we have been very closely working with our finanical service customers especially in the Fabric space to help to adoption modern software engineer practise and automations.

## Copilot SDK product feedback

We have provided product feedback as attached in screenshot.


