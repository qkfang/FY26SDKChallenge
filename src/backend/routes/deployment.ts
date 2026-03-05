import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { exec } from 'child_process';
import { deploymentService } from '../services/deploymentService.js';
import { fabricService } from '../services/fabricService.js';
import { workiqService } from '../services/workiqService.js';
import { copilotService } from '../services/copilotService.js';

export const deploymentRouter = Router();

// Rate limiting for deployment endpoints
const deploymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many deployment requests, please try again later.'
});

const configLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many configuration requests, please try again later.'
});

// List existing sessions
deploymentRouter.get('/sessions', configLimiter, (_req, res) => {
  try {
    const sessions = deploymentService.listSessions();
    res.json(sessions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Init session (create workspace + copilot session)
deploymentRouter.post('/init', deploymentLimiter, async (_req, res) => {
  try {
    const result = await deploymentService.initSession();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Setup workspace (Tab 2)
deploymentRouter.post('/setup', deploymentLimiter, async (req, res) => {
  try {
    const { requirement, resourceConfig, workspaceDir, sessionId } = req.body;

    if (!requirement) {
      return res.status(400).json({ error: 'Requirement is required' });
    }

    const deploymentId = await deploymentService.setupWorkspace(requirement, resourceConfig, workspaceDir, sessionId);
    res.json({ deploymentId });
  } catch (error: any) {
    console.error('Error setting up workspace:', error);
    res.status(500).json({ error: error.message });
  }
});

// Run a single deploy step (Tab 3 buttons)
deploymentRouter.post('/run-step', deploymentLimiter, async (req, res) => {
  try {
    const { step, workspaceDir, environment } = req.body;

    if (!step || !workspaceDir) {
      return res.status(400).json({ error: 'step and workspaceDir are required' });
    }

    const deploymentId = await deploymentService.runDeployStep(step, workspaceDir, environment);
    res.json({ deploymentId });
  } catch (error: any) {
    console.error('Error running deploy step:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get deployment/step status
deploymentRouter.get('/status/:deploymentId', (req, res) => {
  try {
    const { deploymentId } = req.params;
    const status = deploymentService.getDeploymentStatus(deploymentId);

    if (!status) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    res.json(status);
  } catch (error: any) {
    console.error('Error fetching deployment status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get workspace config.json
deploymentRouter.get('/config', configLimiter, (req, res) => {
  try {
    const { workspaceDir } = req.query;
    if (!workspaceDir || typeof workspaceDir !== 'string') {
      return res.status(400).json({ error: 'workspaceDir query param is required' });
    }
    const config = deploymentService.getWorkspaceConfig(workspaceDir);
    if (!config) {
      return res.status(404).json({ error: 'config.json not found' });
    }
    res.json(config);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Open a local folder in the file explorer
deploymentRouter.post('/open-folder', configLimiter, (req, res) => {
  try {
    const { folderPath } = req.body;
    if (!folderPath) return res.status(400).json({ error: 'folderPath is required' });
    exec(`explorer.exe "${folderPath}"`);
    res.json({ message: 'Opened folder' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Configure Fabric API token
deploymentRouter.post('/configure', configLimiter, (req, res) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token is required' });
    }

    fabricService.setAccessToken(accessToken);
    res.json({ message: 'Fabric API configured successfully' });
  } catch (error: any) {
    console.error('Error configuring Fabric API:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Fabric workspaces
deploymentRouter.get('/workspaces', configLimiter, async (req, res) => {
  try {
    if (!fabricService.isAuthenticated()) {
      return res.status(401).json({ error: 'Fabric API not authenticated' });
    }

    const workspaces = await fabricService.getWorkspaces();
    res.json(workspaces);
  } catch (error: any) {
    console.error('Error fetching workspaces:', error);
    res.status(500).json({ error: error.message });
  }
});

// ── Work IQ (SharePoint / M365 queries) ──────────────────────────────────────

// Configure Work IQ tenant
deploymentRouter.post('/workiq/configure', configLimiter, (req, res) => {
  try {
    const { tenantId } = req.body;
    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId is required' });
    }
    workiqService.setTenantId(tenantId);
    res.json({ message: 'Work IQ configured', tenantId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Direct Work IQ query (uses workiq CLI)
deploymentRouter.post('/workiq/ask', configLimiter, async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'question is required' });
    }
    const result = await workiqService.ask(question);
    res.json(result);
  } catch (error: any) {
    console.error('Work IQ ask error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Work IQ query through Copilot SDK session (uses MCP tools)
deploymentRouter.post('/workiq/query', configLimiter, async (req, res) => {
  try {
    const { question, sessionId } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'question is required' });
    }
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const messages: Array<{ type: string; message: string }> = [];
    const answer = await copilotService.queryWorkIQ(sessionId, question, (msg) => {
      messages.push(msg);
    });
    res.json({ question, answer, messages });
  } catch (error: any) {
    console.error('Work IQ query error:', error);
    res.status(500).json({ error: error.message });
  }
});
