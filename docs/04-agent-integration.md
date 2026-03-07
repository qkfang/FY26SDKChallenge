

# Agent Integration

## Part 1 — Development-Time: GitHub Copilot Custom Agents, Skills & Instructions

Custom agents, skills, and instructions configured in `.github/` to guide GitHub Copilot during development of this project.

### Custom Instructions (`.github/copilot-instructions.md`)

Global instructions applied to all Copilot interactions in this repo:

- Minimal output for logging and description of code changes
- No markdown files in generated output
- No unit tests
- Keep code readable and simple

### Custom Agents (`.github/agents/`)

Two domain-scoped agents split responsibilities to avoid conflicts:

| Agent | File | Scope |
|---|---|---|
| `fabric-dev` | `.github/agents/fabric-dev.md` | Authoring Fabric workspace items — notebooks, lakehouses, semantic models, reports. Operates inside `template/fabric_cicd/workspace/`. Follows PySpark best practices, Delta format, AAD token auth, and parameterized configs. |
| `fabric-cicd` | `.github/agents/fabric-cicd.md` | Deployment infrastructure — `fabric-cicd` Python library, Bicep provisioning, GitHub Actions workflows, multi-environment promotion (DEV/QA/PROD), service principal auth, `parameter.yml` and `variable.json` config. |

Each agent has an explicit boundary: `fabric-dev` never touches CI/CD scripts; `fabric-cicd` never modifies workspace item content.

### Skills (`.github/skills/`)

Five domain-specific skills provide authoritative guidance for Fabric artifact authoring:

| Skill | Purpose |
|---|---|
| `fabric-notebook` | PySpark notebook structure, `.platform` metadata, cell layout, Spark config, SQL connectivity via AAD tokens, data seeding patterns |
| `fabric-lakehouse` | Lakehouse definitions, Delta table schemas, OneLake shortcuts, `lakehouse.metadata.json` |
| `fabric-semantic-model` | TMDL files, Direct Lake mode, table definitions, relationships, expressions, measures, DAX |
| `fabric-report` | Power BI reports in PBIR format, page layouts, visual definitions, themes |
| `fabric-deployment` | `fabric-cicd` library, `deploy_workspace.py`, `parameter.yml`, `variable.json`, multi-env deployment, repo validation |

Skills are triggered automatically when Copilot detects matching intent (e.g., "create a Fabric notebook" invokes `fabric-notebook`).

---

## Part 2 — Runtime: App Integration with Copilot SDK, MCP Servers & WorkIQ

The backend application uses the **GitHub Copilot SDK** (`@github/copilot-sdk`) to run an agentic coding session that customizes and deploys Fabric workspaces at runtime.

### Copilot SDK Session (`copilotService.ts`)

- Initializes a `CopilotClient` and creates sessions scoped to a user's workspace directory
- Uses `claude-sonnet-4.6` as the model
- Appends a system prompt that constrains the agent to only modify files inside the user's workspace folder
- Streams events (`assistant.message_delta`, `tool.execution_start`, `tool.execution_complete`) back to the frontend for real-time progress

### MCP Server Integration

Two MCP servers are attached to every Copilot session:

| MCP Server | Transport | Purpose |
|---|---|---|
| **WorkIQ** (`@microsoft/workiq`) | stdio (`npx -y @microsoft/workiq mcp`) | Queries Microsoft 365 data — SharePoint files, emails, meetings, Teams messages — to inform workspace setup based on organizational context |
| **GitHub** (`api.githubcopilot.com/mcp/`) | HTTP (bearer token auth) | Provides GitHub tools for repo operations — checkout, commit, push — so the agent can materialize workspace changes directly into the user's repo |

MCP servers are configured in `createSession()`:

```typescript
mcpServers: {
  workiq: {
    command: 'npx',
    args: ['-y', '@microsoft/workiq', 'mcp', '-t', tenantId],
    tools: ['*'],
  },
  github: {
    type: 'http',
    url: 'https://api.githubcopilot.com/mcp/',
    headers: { Authorization: `Bearer ${githubToken}` },
    tools: ['*'],
  },
}
```

### WorkIQ Integration (`workiqService.ts`)

- Provides a `getMcpServerConfig()` method consumed by `copilotService` to register the WorkIQ MCP server
- Also supports direct CLI queries via `ask()` as a fallback when the Copilot session is unavailable
- Tenant-scoped: `setTenantId()` configures which M365 tenant to query

### Fabric REST API (`fabricService.ts`)

- Direct integration with the Fabric REST API (`api.fabric.microsoft.com/v1`) for workspace and lakehouse operations
- Used for provisioning steps that run outside the Copilot agent session (e.g., creating workspaces, listing lakehouses)

### End-to-End Flow

1. User submits a requirement via the frontend
2. `deploymentService` creates a workspace directory, copies the template repo, and starts a Copilot session
3. The Copilot agent (with WorkIQ + GitHub MCP servers) customizes workspace artifacts based on the requirement
4. The agent commits and pushes changes to the user's GitHub repo
5. Deployment scripts (`deploy-bicep.ps1`, `deploy-cli.ps1`, `deploy-fabric.ps1`) are triggered separately to provision infrastructure and publish Fabric items

