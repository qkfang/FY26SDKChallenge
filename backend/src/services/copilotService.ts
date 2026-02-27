import { CopilotClient, CopilotSession, approveAll } from '@github/copilot-sdk';
import * as fs from 'fs';
import * as path from 'path';

const SESSION_DIR = 'c:\\temp\\ghcsdk';

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
      // Ensure session directory exists
      fs.mkdirSync(SESSION_DIR, { recursive: true });
      console.log(`Session directory: ${SESSION_DIR}`);

      this.client = new CopilotClient({ logLevel: 'info', cwd: SESSION_DIR });
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
        onPermissionRequest: approveAll,
        configDir: SESSION_DIR,
        workingDirectory: SESSION_DIR,
        model: 'claude-sonnet-4.6'
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
      return `No deployment plan available — Copilot SDK not connected.`;
    }

    try {
      const prompt = `# Deployment Plan for: ${requirement}

## Overview
This is an automated deployment plan for Microsoft Fabric resources based on your requirement.

## Prerequisites
the template project is here 'C:\\repo\\FY26SDKChallenge\\ghsdk\\fabric_cicd'
dont change it directly, make a copy of the project folder with timestamp inside 'C:\\temp\\ghcsdk\\ws'
create additional new fabric resources in the new folder

## Deployment Steps
use 'deploy.ps1' script to deploy the resource
you must try to deploy the project and make sure no error happens
check the output of the log file for any error and troubleshooting

`;

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
        return `No deployment plan available — Copilot returned empty response.`;
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
      return `No deployment plan available — SDK error: ${error.message}`;
    }
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
