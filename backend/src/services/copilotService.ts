import { CopilotClient, CopilotSession, approveAll } from '@github/copilot-sdk';

interface CopilotMessage {
  type: 'info' | 'success' | 'error' | 'progress';
  message: string;
}

interface CopilotSessionInfo {
  sessionId: string;
  sdkSessionId?: string;
  clientVersion?: string;
  protocolVersion?: number;
  authStatus?: {
    isAuthenticated: boolean;
    authType?: string;
    login?: string;
  };
  model?: string;
}

export class CopilotService {
  private client: CopilotClient | null = null;
  private sessions: Map<string, CopilotSession> = new Map();
  private isAvailable: boolean = false;
  private clientInfo: { version?: string; protocolVersion?: number } = {};
  private authInfo: { isAuthenticated?: boolean; authType?: string; login?: string } = {};

  async initialize(): Promise<void> {
    try {
      this.client = new CopilotClient({ logLevel: 'info' });
      await this.client.start();
      this.isAvailable = true;
      console.log('GitHub Copilot SDK connected successfully');

      // Fetch and log status info
      try {
        const status = await this.client.getStatus();
        this.clientInfo = {
          version: status.version,
          protocolVersion: status.protocolVersion
        };
        console.log(`Copilot CLI version: ${status.version}, protocol: ${status.protocolVersion}`);
      } catch (e: any) {
        console.warn(`Could not get CLI status: ${e.message}`);
      }

      // Fetch and log auth info
      try {
        const auth = await this.client.getAuthStatus();
        this.authInfo = {
          isAuthenticated: auth.isAuthenticated,
          authType: auth.authType,
          login: auth.login
        };
        console.log(`Auth: authenticated=${auth.isAuthenticated}, type=${auth.authType}, user=${auth.login || 'N/A'}`);
      } catch (e: any) {
        console.warn(`Could not get auth status: ${e.message}`);
      }

      // List available models
      try {
        const models = await this.client.listModels();
        console.log(`Available models (${models.length}): ${models.map(m => m.id).join(', ')}`);
      } catch (e: any) {
        console.warn(`Could not list models: ${e.message}`);
      }
    } catch (error: any) {
      this.isAvailable = false;
      console.warn(`Copilot SDK initialization failed: ${error.message}. Falling back to built-in plan generation.`);
    }
  }

  getSessionInfo(sessionId: string): CopilotSessionInfo {
    const session = this.sessions.get(sessionId);
    return {
      sessionId,
      sdkSessionId: session?.sessionId,
      clientVersion: this.clientInfo.version,
      protocolVersion: this.clientInfo.protocolVersion,
      authStatus: {
        isAuthenticated: this.authInfo.isAuthenticated ?? false,
        authType: this.authInfo.authType,
        login: this.authInfo.login
      }
    };
  }

  async createSession(sessionId: string): Promise<void> {
    if (!this.isAvailable || !this.client) {
      console.log(`Session ${sessionId}: Copilot SDK not available, will use fallback plan generation`);
      return;
    }

    try {
      const session = await this.client.createSession({
        onPermissionRequest: approveAll
      });
      this.sessions.set(sessionId, session);
      console.log(`Session created — deployment: ${sessionId}, sdk: ${session.sessionId}`);
    } catch (error: any) {
      console.warn(`Failed to create Copilot session: ${error.message}. Will use fallback.`);
    }
  }

  async processRequirement(
    sessionId: string,
    requirement: string,
    onMessage?: (message: CopilotMessage) => void
  ): Promise<string> {
    const session = this.sessions.get(sessionId);

    if (!this.isAvailable || !session) {
      if (onMessage) {
        onMessage({
          type: 'info',
          message: 'Copilot SDK not available. Using built-in plan generation.'
        });
      }
      return this.generateFallbackPlan(requirement);
    }

    try {
      const prompt = `You are an expert in Microsoft Fabric deployment automation.

User Requirement: ${requirement}

Please analyze this requirement and provide a detailed deployment plan including:

1. **Overview**: Brief summary of what will be deployed
2. **Prerequisites**: What needs to be in place before deployment
3. **Deployment Steps**: Step-by-step instructions with:
   - Fabric API endpoints to call
   - Complete request bodies (JSON format)
   - Expected responses
4. **Configuration**: Any required configurations or settings
5. **Verification**: How to verify the deployment was successful

Focus on creating lakehouses, workspaces, and related Fabric resources using the Microsoft Fabric REST API (https://api.fabric.microsoft.com/v1).

Provide the plan in a clear, structured format.`;

      // Display session details to the user
      if (onMessage) {
        const info = this.getSessionInfo(sessionId);
        onMessage({ type: 'info', message: `[SDK] Session ID: ${info.sdkSessionId}` });
        onMessage({ type: 'info', message: `[SDK] CLI version: ${info.clientVersion || 'unknown'}, protocol: ${info.protocolVersion || 'unknown'}` });
        onMessage({ type: 'info', message: `[SDK] Auth: ${info.authStatus?.isAuthenticated ? 'authenticated' : 'not authenticated'}, type: ${info.authStatus?.authType || 'N/A'}, user: ${info.authStatus?.login || 'N/A'}` });
        onMessage({ type: 'progress', message: 'Sending requirement to Copilot...' });
      }

      // Subscribe to session events — only show content and tool activity
      session.on((event) => {
        const eventType = event.type;
        console.log(`[SDK Event] ${eventType}:`, JSON.stringify(event.data).substring(0, 200));

        if (onMessage) {
          switch (eventType) {
            case 'assistant.message_delta':
              if ('deltaContent' in event.data && event.data.deltaContent) {
                onMessage({ type: 'progress', message: event.data.deltaContent });
              }
              break;
            case 'assistant.message':
              if ('content' in event.data && event.data.content) {
                onMessage({ type: 'success', message: event.data.content });
              }
              break;
            case 'session.error':
              onMessage({ type: 'error', message: `[SDK] Error: ${event.data.message}` });
              break;
            case 'tool.execution_start':
              onMessage({ type: 'info', message: `[SDK] Tool executing: ${event.data.toolName}` });
              break;
            case 'tool.execution_complete': {
              const result = event.data.result;
              const parts: string[] = [];
              if (result?.content) parts.push(result.content);
              if (result?.detailedContent) parts.push(result.detailedContent);
              if (parts.length > 0) {
                onMessage({ type: 'info', message: `[SDK] Tool result: ${parts.join(' — ')}` });
              }
              break;
            }
            // Silently ignore usage, model_change, idle, turn_start/end, etc.
            default:
              break;
          }
        }
      });

      // Send and wait for the full response
      const response = await session.sendAndWait(
        { prompt },
        120000 // 2 minute timeout
      );

      const content = response?.data?.content || '';
      const messageId = response?.data?.messageId;

      if (onMessage) {
        onMessage({ type: 'info', message: `[SDK] Response message ID: ${messageId || 'N/A'}` });
        onMessage({ type: 'info', message: `[SDK] Response length: ${content.length} characters` });
      }

      if (content) {
        if (onMessage) {
          onMessage({ type: 'success', message: 'Copilot generated deployment plan successfully' });
        }
        return content;
      } else {
        if (onMessage) {
          onMessage({ type: 'info', message: 'Copilot returned empty response. Using fallback plan.' });
        }
        return this.generateFallbackPlan(requirement);
      }
    } catch (error: any) {
      const fullError = error.stack || error.message;
      console.error('Copilot SDK error:', fullError);
      if (onMessage) {
        onMessage({
          type: 'error',
          message: `[SDK] Error: ${error.message}`
        });
        // Show full stack trace for debugging
        if (error.stack) {
          onMessage({
            type: 'info',
            message: `[SDK] Stack: ${error.stack}`
          });
        }
        // Show any additional error properties
        const extras = Object.keys(error)
          .filter(k => k !== 'message' && k !== 'stack')
          .map(k => `${k}: ${JSON.stringify(error[k])}`)
          .join(', ');
        if (extras) {
          onMessage({
            type: 'info',
            message: `[SDK] Details: ${extras}`
          });
        }
        onMessage({
          type: 'info',
          message: 'Falling back to built-in plan generation.'
        });
      }
      return this.generateFallbackPlan(requirement);
    }
  }

  private generateFallbackPlan(requirement: string): string {
    return `# Deployment Plan for: ${requirement}

## Overview
This is an automated deployment plan for Microsoft Fabric resources based on your requirement.

## Prerequisites
1. Azure subscription with Microsoft Fabric capacity
2. Service principal or user account with Fabric administrator permissions
3. Access token for Fabric REST API authentication
4. Workspace ID (or create a new workspace)

## Deployment Steps

### Step 1: Authenticate with Fabric API
Obtain an access token from Azure AD:
- Endpoint: https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token
- Scope: https://api.fabric.microsoft.com/.default

### Step 2: Create Workspace (if needed)
**API Call:**
\`\`\`
POST https://api.fabric.microsoft.com/v1/workspaces
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "displayName": "Your Workspace Name",
  "description": "Workspace for deployment"
}
\`\`\`

**Expected Response:**
\`\`\`json
{
  "id": "workspace-guid",
  "displayName": "Your Workspace Name",
  "type": "Workspace"
}
\`\`\`

### Step 3: Create Lakehouse
**API Call:**
\`\`\`
POST https://api.fabric.microsoft.com/v1/workspaces/{workspace_id}/lakehouses
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "displayName": "Your Lakehouse Name",
  "description": "Lakehouse created for ${requirement}"
}
\`\`\`

**Expected Response:**
\`\`\`json
{
  "id": "lakehouse-guid",
  "displayName": "Your Lakehouse Name",
  "type": "Lakehouse"
}
\`\`\`

### Step 4: Configure Lakehouse (Optional)
Set up any additional configurations:
- Tables and schemas
- Data connections
- Access permissions

## Configuration
- **Region**: Use the same region as your Fabric capacity
- **Permissions**: Grant necessary access to users/service principals
- **Naming Convention**: Follow your organization's naming standards

## Verification
1. Navigate to the Fabric portal
2. Verify the workspace appears in your workspace list
3. Open the workspace and confirm the lakehouse is present
4. Check lakehouse properties and configurations

## Additional Resources
- Microsoft Fabric REST API: https://learn.microsoft.com/en-us/rest/api/fabric/
- Lakehouse Tutorial: https://learn.microsoft.com/en-us/fabric/data-engineering/tutorial-lakehouse-introduction

## Notes
- This plan was generated automatically based on your requirement
- Adjust names, descriptions, and configurations as needed
- Ensure proper authentication before executing API calls
- Monitor the deployment process for any errors

---
*Generated by Fabric Automation App*`;
  }

  async destroySession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      try {
        await session.destroy();
      } catch (error: any) {
        console.warn(`Failed to destroy session ${sessionId}: ${error.message}`);
      }
      this.sessions.delete(sessionId);
    }
  }

  async shutdown(): Promise<void> {
    // Destroy all active sessions
    for (const [sessionId] of this.sessions) {
      await this.destroySession(sessionId);
    }
    // Stop the Copilot client
    if (this.client) {
      try {
        await this.client.stop();
      } catch (error: any) {
        console.warn(`Failed to stop Copilot client: ${error.message}`);
      }
      this.client = null;
    }
  }
}

export const copilotService = new CopilotService();
