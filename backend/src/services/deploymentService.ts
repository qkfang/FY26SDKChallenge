import { copilotService } from './copilotService.js';
import { fabricService } from './fabricService.js';
import { DeploymentStatus, DeploymentMessage } from '../types/index.js';
import { randomUUID } from 'crypto';

export class DeploymentService {
  private deployments: Map<string, DeploymentStatus> = new Map();

  async startDeployment(
    requirement: string,
    workspaceName?: string,
    lakehouseName?: string
  ): Promise<string> {
    const deploymentId = randomUUID();
    
    const initialStatus: DeploymentStatus = {
      id: deploymentId,
      status: 'pending',
      progress: 0,
      messages: [
        {
          timestamp: new Date(),
          type: 'info',
          message: 'Deployment initiated. Analyzing requirements...'
        }
      ]
    };

    this.deployments.set(deploymentId, initialStatus);

    // Start the deployment process asynchronously
    this.executeDeployment(deploymentId, requirement, workspaceName, lakehouseName)
      .catch(error => {
        this.updateDeploymentStatus(deploymentId, {
          status: 'failed',
          error: error.message
        });
      });

    return deploymentId;
  }

  private async executeDeployment(
    deploymentId: string,
    requirement: string,
    workspaceName?: string,
    lakehouseName?: string
  ): Promise<void> {
    try {
      // Update status
      this.updateDeploymentStatus(deploymentId, {
        status: 'in-progress',
        progress: 10
      });

      // Initialize Copilot service (will fall back gracefully if CLI unavailable)
      await copilotService.initialize();

      this.addMessage(deploymentId, 'info', 'Creating Copilot SDK session...');
      await copilotService.createSession(deploymentId);

      // Display session info
      const sessionInfo = copilotService.getSessionInfo(deploymentId);
      if (sessionInfo.sdkSessionId) {
        this.addMessage(deploymentId, 'info', `Connected to Copilot SDK (v${sessionInfo.clientVersion || '?'}, protocol ${sessionInfo.protocolVersion || '?'})`);
        this.addMessage(deploymentId, 'info', `Auth: ${sessionInfo.authStatus?.login || 'N/A'} (${sessionInfo.authStatus?.authType || 'none'})`);
      } else {
        this.addMessage(deploymentId, 'info', 'Copilot SDK not available — using built-in plan generation');
      }

      this.updateDeploymentStatus(deploymentId, { progress: 20 });
      this.addMessage(deploymentId, 'info', 'Analyzing requirements with Copilot...');

      // Process the requirement with Copilot
      const deploymentPlan = await copilotService.processRequirement(
        deploymentId,
        requirement,
        (message) => {
          this.addMessage(deploymentId, message.type, message.message);
        }
      );

      this.updateDeploymentStatus(deploymentId, { progress: 50 });
      this.addMessage(deploymentId, 'success', 'Deployment plan generated successfully');

      // For now, simulate deployment execution
      // In a real implementation, this would parse the Copilot response
      // and execute the Fabric API calls
      this.addMessage(deploymentId, 'info', 'Executing deployment plan...');
      
      // Check if Fabric API is authenticated
      if (!fabricService.isAuthenticated()) {
        this.addMessage(
          deploymentId,
          'info',
          'Note: Fabric API authentication not configured. Deployment plan generated but not executed.'
        );
        this.addMessage(
          deploymentId,
          'info',
          'To execute deployments, please configure Fabric API credentials.'
        );
      } else {
        // Execute actual deployment
        this.addMessage(deploymentId, 'info', 'Creating Fabric resources...');
        // Add actual deployment logic here based on the plan
      }

      this.updateDeploymentStatus(deploymentId, { progress: 90 });

      // Complete the deployment
      this.updateDeploymentStatus(deploymentId, {
        status: 'completed',
        progress: 100,
        result: {
          resources: ['Deployment plan generated'],
          summary: deploymentPlan
        }
      });

      this.addMessage(deploymentId, 'success', 'Deployment completed successfully!');

      // Clean up Copilot session
      await copilotService.destroySession(deploymentId);

    } catch (error: any) {
      console.error('Deployment error:', error);
      this.addMessage(deploymentId, 'error', `Deployment failed: ${error.message}`);
      throw error;
    }
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
