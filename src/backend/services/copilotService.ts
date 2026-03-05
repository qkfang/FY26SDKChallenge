import { CopilotClient, CopilotSession, approveAll } from '@github/copilot-sdk';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { workiqService } from './workiqService.js';

// Resolve temp directories relative to the project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const TEMPLATE_DIR = path.join(PROJECT_ROOT, 'temp', 'template_repo');
const WORKSPACE_DIR = path.join(PROJECT_ROOT, 'temp', 'user_repo');
const SESSION_DIR = path.join(PROJECT_ROOT, 'temp', 'copilot_session');

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
  tempFolder?: string;
}

export class CopilotService {
  private client: CopilotClient | null = null;
  private sessions: Map<string, CopilotSession> = new Map();
  private isAvailable: boolean = false;
  private clientInfo: { version?: string; protocolVersion?: number } = {};
  private authInfo: { isAuthenticated?: boolean; authType?: string; login?: string } = {};

  async initialize(): Promise<void> {
    try {
      // Ensure temp directories exist
      fs.mkdirSync(SESSION_DIR, { recursive: true });
      console.log(`Session directory: ${SESSION_DIR}`);
      fs.mkdirSync(WORKSPACE_DIR, { recursive: true });
      console.log(`Workspace directory: ${WORKSPACE_DIR}`);

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

  hasSession(sessionId: string): boolean {
    return this.sessions.has(sessionId);
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
      },
      tempFolder: SESSION_DIR
    };
  }

  async createSession(sessionId: string, workspaceDir?: string): Promise<void> {
    if (!this.isAvailable || !this.client) {
      console.log(`Session ${sessionId}: Copilot SDK not available, will use fallback plan generation`);
      return;
    }

    const cwd = workspaceDir || SESSION_DIR;
    try {
      const mcpConfig = workiqService.getMcpServerConfig();
      const githubToken = process.env.GITHUB_TOKEN || '';
      const session = await this.client.createSession({
        onPermissionRequest: approveAll,
        configDir: SESSION_DIR,
        workingDirectory: cwd,
        model: 'claude-sonnet-4.6',
        mcpServers: {
          workiq: {
            command: mcpConfig.command,
            args: mcpConfig.args,
            tools: ['*'],
          },
          github: {
            type: 'http',
            url: 'https://api.githubcopilot.com/mcp/',
            headers: {
              'Authorization': `Bearer ${githubToken}`,
            },
            tools: ['*'],
          },
        },
      });
      this.sessions.set(sessionId, session);
      console.log(`Session created — deployment: ${sessionId}, sdk: ${session.sessionId}, cwd: ${cwd}, mcpServers: [workiq, github]`);
    } catch (error: any) {
      console.warn(`Failed to create Copilot session: ${error.message}. Will use fallback.`);
    }
  }

  async queryWorkIQ(
    sessionId: string,
    question: string,
    onMessage?: (message: CopilotMessage) => void
  ): Promise<string> {
    const session = this.sessions.get(sessionId);

    if (!this.isAvailable || !session) {
      // Fall back to direct Work IQ CLI query
      if (onMessage) {
        onMessage({ type: 'info', message: 'Copilot session not available. Querying Work IQ directly...' });
      }
      const result = await workiqService.ask(question);
      return result.answer;
    }

    try {
      const prompt = `Use the Work IQ tools to answer this question about my Microsoft 365 data (SharePoint files, emails, meetings, Teams messages): ${question}`;

      if (onMessage) {
        onMessage({ type: 'progress', message: 'Querying Work IQ via Copilot...' });
      }

      session.on((event) => {
        if (!onMessage) return;
        switch (event.type) {
          case 'assistant.message_delta':
            if ('deltaContent' in event.data && event.data.deltaContent) {
              onMessage({ type: 'progress', message: event.data.deltaContent });
            }
            break;
          case 'tool.execution_start': {
            const args = event.data.arguments ? JSON.stringify(event.data.arguments) : '';
            onMessage({ type: 'info', message: `[WorkIQ] Tool: ${event.data.toolName} ${args}` });
            break;
          }
          case 'tool.execution_complete': {
            const result = event.data.result;
            if (result?.content) {
              onMessage({ type: 'info', message: `[WorkIQ] Result: ${result.content.substring(0, 500)}` });
            }
            break;
          }
          case 'session.error':
            onMessage({ type: 'error', message: `[WorkIQ] Error: ${event.data.message}` });
            break;
        }
      });

      const response = await session.sendAndWait({ prompt }, 120000);
      const content = response?.data?.content || '';

      if (content) {
        if (onMessage) {
          onMessage({ type: 'success', message: 'Work IQ query completed' });
        }
        return content;
      }
      return 'No results from Work IQ query.';
    } catch (error: any) {
      console.error('Work IQ query error:', error.message);
      if (onMessage) {
        onMessage({ type: 'error', message: `[WorkIQ] Error: ${error.message}` });
        onMessage({ type: 'info', message: 'Falling back to direct Work IQ CLI...' });
      }
      const result = await workiqService.ask(question);
      return result.answer;
    }
  }

  async processRequirement(
    sessionId: string,
    requirement: string,
    workspaceDir: string,
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
      const prompt = `# Workspace Setup for: ${requirement}

## Context
Setup local workspace and session: 
Checkout template GitHub repo 'https://github.com/qkfang/FY26SDKChallenge_Template' to this folder: '${TEMPLATE_DIR}'
Checkout user GitHub repo 'https://github.com/qkfang/FY26SDKChallenge_UserRepo' to this folder: '${WORKSPACE_DIR}'

If user repo is empty, copy template repo content to user repo as starting point.

## Task
Review the workspace structure and customize it for the requirement: "${requirement}"
- Update configuration files as needed (e.g., config/variable.json, config/parameter.yml)
- Do NOT run any deployment scripts — they will be triggered separately
- Check the workspace looks correct for the requirement (clean up the fabric resource in workspace if not needed, update README.md, etc.)
- Once all done, commit and push user repo to remote
- Never ever change or commit to template repo

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
            case 'tool.execution_start': {
              const args = event.data.arguments ? JSON.stringify(event.data.arguments) : '';
              onMessage({ type: 'info', message: `[SDK] Tool executing: ${event.data.toolName} ${args}` });
              break;
            }
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
        1800000 // 30 minute timeout
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

  async sendChat(
    sessionId: string,
    message: string,
    onMessage?: (msg: CopilotMessage) => void
  ): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!this.isAvailable || !session) {
      throw new Error('No active Copilot session. Complete Init Session first.');
    }

    session.on((event) => {
      if (!onMessage) return;
      switch (event.type) {
        case 'assistant.message_delta':
          if ('deltaContent' in event.data && event.data.deltaContent) {
            onMessage({ type: 'progress', message: event.data.deltaContent });
          }
          break;
        case 'tool.execution_start': {
          const args = event.data.arguments ? JSON.stringify(event.data.arguments) : '';
          onMessage({ type: 'info', message: `[Tool] ${event.data.toolName} ${args}` });
          break;
        }
        case 'tool.execution_complete': {
          const result = event.data.result;
          if (result?.content) {
            onMessage({ type: 'info', message: `[Tool result] ${result.content.substring(0, 500)}` });
          }
          break;
        }
        case 'session.error':
          onMessage({ type: 'error', message: event.data.message });
          break;
        default:
          break;
      }
    });

    const response = await session.sendAndWait({ prompt: message }, 300000);
    return response?.data?.content || '';
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
