import axios from 'axios';

const API_BASE_URL = '/api';

export interface ResourceConfig {
  notebookName?: string;
  sqlServerName?: string;
  fabricCapacity?: string;
  workspaces: {
    dev?: string;
    qa?: string;
    prod?: string;
  };
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
  copilotSessionId?: string;
  workspaceDir?: string;
}

export interface SessionEntry {
  workspaceDir: string;
  copilotSessionId: string;
  createdAt: string;
}

export const api = {
  async listSessions(): Promise<SessionEntry[]> {
    const response = await axios.get(`${API_BASE_URL}/deployment/sessions`);
    return response.data;
  },

  async initSession(): Promise<{ workspaceDir: string; copilotSessionId: string }> {
    const response = await axios.post(`${API_BASE_URL}/deployment/init`);
    return response.data;
  },

  async setupWorkspace(requirement: string, resourceConfig?: ResourceConfig): Promise<{ deploymentId: string }> {
    const response = await axios.post(`${API_BASE_URL}/deployment/setup`, { requirement, resourceConfig });
    return response.data;
  },

  async runDeployStep(step: string, workspaceDir: string): Promise<{ deploymentId: string }> {
    const response = await axios.post(`${API_BASE_URL}/deployment/run-step`, { step, workspaceDir });
    return response.data;
  },

  async getDeploymentStatus(deploymentId: string): Promise<DeploymentStatus> {
    const response = await axios.get(`${API_BASE_URL}/deployment/status/${deploymentId}`);
    return response.data;
  },

  async openFolder(folderPath: string): Promise<void> {
    await axios.post(`${API_BASE_URL}/deployment/open-folder`, { folderPath });
  },

  async checkHealth(): Promise<{ status: string; message: string }> {
    const response = await axios.get(`${API_BASE_URL}/health`);
    return response.data;
  }
};
