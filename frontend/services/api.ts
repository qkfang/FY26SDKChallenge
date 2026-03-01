import axios from 'axios';

const API_BASE_URL = '/api';

export interface ResourceConfig {
  notebookName?: string;
  sqlServerName?: string;
  workspaces: {
    dev?: string;
    qa?: string;
    prod?: string;
  };
}

export interface DeploymentRequest {
  requirement: string;
  workspaceName?: string;
  lakehouseName?: string;
  resourceConfig?: ResourceConfig;
}

export interface DeploymentStatus {
  id: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  progress: number;
  messages: Array<{
    timestamp: Date;
    type: 'info' | 'success' | 'error' | 'progress';
    message: string;
  }>;
  result?: {
    workspaceId?: string;
    lakehouseId?: string;
    resources: string[];
    summary: string;
  };
  error?: string;
}

export const api = {
  async startDeployment(request: DeploymentRequest): Promise<{ deploymentId: string }> {
    const response = await axios.post(`${API_BASE_URL}/deployment/start`, request);
    return response.data;
  },

  async getDeploymentStatus(deploymentId: string): Promise<DeploymentStatus> {
    const response = await axios.get(`${API_BASE_URL}/deployment/status/${deploymentId}`);
    return response.data;
  },

  async configureFabricApi(accessToken: string): Promise<void> {
    await axios.post(`${API_BASE_URL}/deployment/configure`, { accessToken });
  },

  async checkHealth(): Promise<{ status: string; message: string }> {
    const response = await axios.get(`${API_BASE_URL}/health`);
    return response.data;
  }
};
