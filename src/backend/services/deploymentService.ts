import { copilotService } from './copilotService.js';
import { DeploymentStatus, DeploymentMessage, ResourceConfig } from '../types/index.js';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const TEMPLATE_DIR = path.join(PROJECT_ROOT, 'temp', 'template_repo');
const WORKSPACE_DIR = path.join(PROJECT_ROOT, 'temp', 'project_repo');

for (const dir of [TEMPLATE_DIR, WORKSPACE_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const STEP_SCRIPTS: Record<string, string> = {
  bicep: 'deploy-bicep.ps1',
  cli: 'deploy-cli.ps1',
  fabric: 'deploy-fabric.ps1',
};

export interface SessionEntry {
  workspaceDir: string;
  copilotSessionId: string;
  createdAt: string;
}

export class DeploymentService {
  private deployments: Map<string, DeploymentStatus> = new Map();

  // ── List existing workspace sessions ───────────────────────────────────────
  listSessions(): SessionEntry[] {
    if (!fs.existsSync(WORKSPACE_DIR)) return [];
    return fs.readdirSync(WORKSPACE_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => {
        const dir = path.join(WORKSPACE_DIR, d.name);
        const stat = fs.statSync(dir);
        return {
          workspaceDir: dir,
          copilotSessionId: '',
          createdAt: stat.birthtime.toISOString(),
        };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  // ── Init: create workspace folder + copilot session (no requirement) ───────
  async initSession(): Promise<{ workspaceDir: string; copilotSessionId: string }> {
    const now = new Date();
    const ts = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}${String(now.getSeconds()).padStart(2,'0')}`;
    const workspaceDir = path.join(WORKSPACE_DIR, `ws-${ts}`);
    fs.mkdirSync(workspaceDir, { recursive: true });
    await fs.promises.cp(TEMPLATE_DIR, workspaceDir, { recursive: true });

    const sessionId = randomUUID();
    await copilotService.initialize();
    await copilotService.createSession(sessionId, workspaceDir);

    return { workspaceDir, copilotSessionId: sessionId };
  }

  // ── Config file helpers ─────────────────────────────────────────────────────
  saveWorkspaceConfig(workspaceDir: string, config: Record<string, any>): void {
    const configPath = path.join(workspaceDir, 'config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
  }

  getWorkspaceConfig(workspaceDir: string): Record<string, any> | null {
    const configPath = path.join(workspaceDir, 'config.json');
    if (!fs.existsSync(configPath)) return null;
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }

  // ── Setup workspace (Tab 2) ────────────────────────────────────────────────
  async setupWorkspace(requirement: string, resourceConfig?: ResourceConfig, existingWorkspaceDir?: string, existingSessionId?: string): Promise<string> {
    const deploymentId = randomUUID();

    const initialStatus: DeploymentStatus = {
      id: deploymentId,
      status: 'pending',
      progress: 0,
      messages: [
        {
          timestamp: new Date(),
          type: 'info',
          message: existingWorkspaceDir ? 'Setting up existing workspace...' : 'Setting up new workspace...'
        }
      ]
    };

    this.deployments.set(deploymentId, initialStatus);

    this.executeSetup(deploymentId, requirement, resourceConfig, existingWorkspaceDir, existingSessionId).catch(error => {
      this.updateDeploymentStatus(deploymentId, { status: 'failed', error: error.message });
    });

    return deploymentId;
  }

  private async executeSetup(
    deploymentId: string,
    requirement: string,
    resourceConfig?: ResourceConfig,
    existingWorkspaceDir?: string,
    existingSessionId?: string
  ): Promise<void> {
    try {
      this.updateDeploymentStatus(deploymentId, { status: 'in-progress', progress: 10 });

      let workspaceDir: string;
      let copilotSessionKey: string;

      if (existingWorkspaceDir) {
        // Reuse workspace from init step
        workspaceDir = existingWorkspaceDir;
        copilotSessionKey = existingSessionId || deploymentId;
        this.addMessage(deploymentId, 'info', `Using existing workspace: ${workspaceDir}`);

        // Ensure template files are present
        if (!fs.existsSync(workspaceDir)) {
          fs.mkdirSync(workspaceDir, { recursive: true });
          await fs.promises.cp(TEMPLATE_DIR, workspaceDir, { recursive: true });
          this.addMessage(deploymentId, 'success', 'Template copied successfully.');
        }
      } else {
        // Create timestamped workspace dir and copy template
        const now = new Date();
        const ts = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}${String(now.getSeconds()).padStart(2,'0')}`;
        workspaceDir = path.join(WORKSPACE_DIR, `ws-${ts}`);
        copilotSessionKey = deploymentId;

        this.addMessage(deploymentId, 'info', `Creating workspace directory: ${workspaceDir}`);
        fs.mkdirSync(workspaceDir, { recursive: true });

        this.addMessage(deploymentId, 'info', `Copying template from: ${TEMPLATE_DIR}`);
        await fs.promises.cp(TEMPLATE_DIR, workspaceDir, { recursive: true });
        this.addMessage(deploymentId, 'success', 'Template copied successfully.');
      }

      this.updateDeploymentStatus(deploymentId, { progress: 40, workspaceDir });

      // Initialize Copilot session
      this.addMessage(deploymentId, 'info', 'Initializing Copilot SDK...');
      await copilotService.initialize();

      // Reuse existing session if available, otherwise create new
      const hasExistingSession = existingSessionId && copilotService.hasSession(existingSessionId);
      if (!hasExistingSession) {
        await copilotService.createSession(copilotSessionKey, workspaceDir);
      }

      const sessionInfo = copilotService.getSessionInfo(hasExistingSession ? existingSessionId! : copilotSessionKey);
      if (sessionInfo.sdkSessionId) {
        this.addMessage(deploymentId, 'info', `Copilot SDK connected (v${sessionInfo.clientVersion || '?'})`);
        this.updateDeploymentStatus(deploymentId, { copilotSessionId: hasExistingSession ? existingSessionId! : copilotSessionKey });
      } else {
        this.addMessage(deploymentId, 'info', 'Copilot SDK not available — workspace created without AI customization.');
      }

      this.updateDeploymentStatus(deploymentId, { progress: 60 });

      // Process requirement with Copilot
      this.addMessage(deploymentId, 'info', 'Analyzing requirement with Copilot...');
      const activeSessionKey = existingSessionId && copilotService.hasSession(existingSessionId) ? existingSessionId : copilotSessionKey;
      await copilotService.processRequirement(
        activeSessionKey,
        requirement,
        workspaceDir,
        (message) => { this.addMessage(deploymentId, message.type, message.message); }
      );

      this.updateDeploymentStatus(deploymentId, {
        status: 'completed',
        progress: 100,
        result: {
          resources: [],
          summary: `Workspace ready at: ${workspaceDir}`
        }
      });
      this.addMessage(deploymentId, 'success', `Workspace setup complete. Ready to deploy from: ${workspaceDir}`);

      // Save config.json
      const suffix = resourceConfig?.workspaces?.dev?.replace(/-dev$/, '') || '';
      this.saveWorkspaceConfig(workspaceDir, {
        workspaceDir,
        copilotSessionId: existingSessionId || copilotSessionKey,
        requirement,
        workspaceSuffix: suffix,
        fabricCapacity: resourceConfig?.fabricCapacity || '',
        envDev: !!resourceConfig?.workspaces?.dev,
        envQa: !!resourceConfig?.workspaces?.qa,
        envProd: !!resourceConfig?.workspaces?.prod,
      });

    } catch (error: any) {
      console.error('Setup error:', error);
      this.addMessage(deploymentId, 'error', `Setup failed: ${error.message}`);
      throw error;
    }
  }

  // ── Run a single deploy step (Tab 3 buttons) ──────────────────────────────
  async runDeployStep(step: string, workspaceDir: string, environment?: string): Promise<string> {
    const deploymentId = randomUUID();
    const scriptFile = STEP_SCRIPTS[step];
    const env = environment || 'DEV';

    if (!scriptFile) {
      throw new Error(`Unknown step: ${step}. Valid steps are: ${Object.keys(STEP_SCRIPTS).join(', ')}`);
    }

    const scriptPath = path.join(workspaceDir, scriptFile);

    const initialStatus: DeploymentStatus = {
      id: deploymentId,
      status: 'pending',
      progress: 0,
      messages: [
        {
          timestamp: new Date(),
          type: 'info',
          message: `Running step '${step}' (env=${env}) via ${scriptFile} in ${workspaceDir}`
        }
      ],
      workspaceDir
    };

    this.deployments.set(deploymentId, initialStatus);

    this.executeScript(deploymentId, step, scriptPath, workspaceDir, env).catch(error => {
      this.updateDeploymentStatus(deploymentId, { status: 'failed', error: error.message });
    });

    return deploymentId;
  }

  private executeScript(
    deploymentId: string,
    step: string,
    scriptPath: string,
    workspaceDir: string,
    environment: string = 'DEV'
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.updateDeploymentStatus(deploymentId, { status: 'in-progress', progress: 5 });

      if (!fs.existsSync(scriptPath)) {
        const msg = `Script not found: ${scriptPath}`;
        this.addMessage(deploymentId, 'error', msg);
        this.updateDeploymentStatus(deploymentId, { status: 'failed', error: msg });
        return reject(new Error(msg));
      }

      this.addMessage(deploymentId, 'info', `Spawning: pwsh -File ${scriptPath} -Environment ${environment}`);

      const proc = spawn('pwsh', ['-File', scriptPath, '-Environment', environment], {
        cwd: workspaceDir,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      proc.stdout.on('data', (data: Buffer) => {
        const lines = data.toString().split('\n').filter(l => l.trim());
        for (const line of lines) {
          this.addMessage(deploymentId, 'info', line);
        }
        this.updateDeploymentStatus(deploymentId, {
          progress: Math.min(90, (this.deployments.get(deploymentId)?.progress ?? 5) + 5)
        });
      });

      proc.stderr.on('data', (data: Buffer) => {
        const lines = data.toString().split('\n').filter(l => l.trim());
        for (const line of lines) {
          this.addMessage(deploymentId, 'error', line);
        }
      });

      proc.on('close', (code) => {
        if (code === 0) {
          this.updateDeploymentStatus(deploymentId, {
            status: 'completed',
            progress: 100,
            result: { resources: [], summary: `Step '${step}' completed successfully.` }
          });
          this.addMessage(deploymentId, 'success', `Step '${step}' completed (exit code 0).`);
          resolve();
        } else {
          const msg = `Step '${step}' failed with exit code ${code}.`;
          this.updateDeploymentStatus(deploymentId, { status: 'failed', error: msg });
          this.addMessage(deploymentId, 'error', msg);
          reject(new Error(msg));
        }
      });

      proc.on('error', (err) => {
        const msg = `Failed to spawn pwsh: ${err.message}. Ensure PowerShell (pwsh) is installed.`;
        this.updateDeploymentStatus(deploymentId, { status: 'failed', error: msg });
        this.addMessage(deploymentId, 'error', msg);
        reject(new Error(msg));
      });
    });
  }

  getDeploymentStatus(deploymentId: string): DeploymentStatus | undefined {
    return this.deployments.get(deploymentId);
  }

  private updateDeploymentStatus(
    deploymentId: string,
    updates: Partial<DeploymentStatus>
  ): void {
    const current = this.deployments.get(deploymentId);
    if (current) {
      this.deployments.set(deploymentId, { ...current, ...updates });
    }
  }

  private addMessage(
    deploymentId: string,
    type: DeploymentMessage['type'],
    message: string
  ): void {
    const current = this.deployments.get(deploymentId);
    if (current) {
      const newMessage: DeploymentMessage = {
        timestamp: new Date(),
        type,
        message
      };
      current.messages.push(newMessage);
      this.deployments.set(deploymentId, current);
    }
  }
}

export const deploymentService = new DeploymentService();
