import { spawn, ChildProcess } from 'child_process';

interface CopilotMessage {
  type: 'info' | 'success' | 'error' | 'progress';
  message: string;
}

export class CopilotService {
  private sessions: Map<string, ChildProcess> = new Map();
  private isAvailable: boolean = false;

  async initialize(): Promise<void> {
    // Check if GitHub Copilot CLI is available
    return new Promise((resolve, reject) => {
      const checkProcess = spawn('gh', ['copilot', '--version']);
      
      checkProcess.on('error', () => {
        this.isAvailable = false;
        reject(new Error('GitHub Copilot CLI is not installed. Please install it: gh extension install github/gh-copilot'));
      });

      checkProcess.on('close', (code) => {
        if (code === 0) {
          this.isAvailable = true;
          console.log('GitHub Copilot CLI is available');
          resolve();
        } else {
          this.isAvailable = false;
          reject(new Error('GitHub Copilot CLI is not properly configured'));
        }
      });
    });
  }

  async createSession(sessionId: string): Promise<void> {
    // Session creation is implicit when using CLI
    // We just store the sessionId for tracking
    if (!this.isAvailable) {
      throw new Error('Copilot CLI not available');
    }
  }

  async processRequirement(
    sessionId: string,
    requirement: string,
    onMessage?: (message: CopilotMessage) => void
  ): Promise<string> {
    if (!this.isAvailable) {
      throw new Error('Copilot CLI not available');
    }

    return new Promise((resolve, reject) => {
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

      // Use gh copilot suggest command
      const copilotProcess = spawn('gh', ['copilot', 'suggest', prompt], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      copilotProcess.stdout?.on('data', (data) => {
        const text = data.toString();
        output += text;
        
        if (onMessage) {
          onMessage({
            type: 'progress',
            message: text
          });
        }
      });

      copilotProcess.stderr?.on('data', (data) => {
        errorOutput += data.toString();
      });

      copilotProcess.on('error', (error) => {
        if (onMessage) {
          onMessage({
            type: 'error',
            message: `Copilot CLI error: ${error.message}`
          });
        }
        reject(new Error(`Failed to execute Copilot CLI: ${error.message}`));
      });

      copilotProcess.on('close', (code) => {
        if (code === 0 && output) {
          resolve(output);
        } else {
          // If Copilot CLI fails, provide a fallback response
          const fallbackResponse = this.generateFallbackPlan(requirement);
          if (onMessage) {
            onMessage({
              type: 'info',
              message: 'Using fallback plan generation (Copilot CLI not fully available)'
            });
          }
          resolve(fallbackResponse);
        }
      });

      this.sessions.set(sessionId, copilotProcess);
    });
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
    const process = this.sessions.get(sessionId);
    if (process) {
      process.kill();
      this.sessions.delete(sessionId);
    }
  }

  async shutdown(): Promise<void> {
    // Destroy all active sessions
    for (const [sessionId] of this.sessions) {
      await this.destroySession(sessionId);
    }
  }
}

export const copilotService = new CopilotService();
