import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { deploymentService } from '../services/deploymentService.js';
import { fabricService } from '../services/fabricService.js';

export const deploymentRouter = Router();

// Rate limiting for deployment endpoints
const deploymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 deployments per window
  message: 'Too many deployment requests, please try again later.'
});

const configLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many configuration requests, please try again later.'
});

// Start a new deployment
deploymentRouter.post('/start', deploymentLimiter, async (req, res) => {
  try {
    const { requirement, workspaceName, lakehouseName } = req.body;

    if (!requirement) {
      return res.status(400).json({ error: 'Requirement is required' });
    }

    const deploymentId = await deploymentService.startDeployment(
      requirement,
      workspaceName,
      lakehouseName
    );

    res.json({ deploymentId });
  } catch (error: any) {
    console.error('Error starting deployment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get deployment status
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
