import axios from 'axios';

const API_BASE_URL = (import.meta.env.API_URL ?? '') + '/api';

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

export interface WorkspaceConfig {
  workspaceDir: string;
  copilotSessionId: string;
  requirement: string;
  workspaceSuffix: string;
  fabricCapacity: string;
  envDev: boolean;
  envQa: boolean;
  envProd: boolean;
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

  async setupWorkspace(requirement: string, resourceConfig?: ResourceConfig, workspaceDir?: string, sessionId?: string): Promise<{ deploymentId: string }> {
    const response = await axios.post(`${API_BASE_URL}/deployment/setup`, { requirement, resourceConfig, workspaceDir, sessionId });
    return response.data;
  },

  async runDeployStep(step: string, workspaceDir: string, environment?: string): Promise<{ deploymentId: string }> {
    const response = await axios.post(`${API_BASE_URL}/deployment/run-step`, { step, workspaceDir, environment });
    return response.data;
  },

  async getDeploymentStatus(deploymentId: string): Promise<DeploymentStatus> {
    const response = await axios.get(`${API_BASE_URL}/deployment/status/${deploymentId}`);
    return response.data;
  },

  async openFolder(folderPath: string): Promise<void> {
    await axios.post(`${API_BASE_URL}/deployment/open-folder`, { folderPath });
  },

  async getWorkspaceConfig(workspaceDir: string): Promise<WorkspaceConfig | null> {
    try {
      const response = await axios.get(`${API_BASE_URL}/deployment/config`, { params: { workspaceDir } });
      return response.data;
    } catch { return null; }
  },

  async checkHealth(): Promise<{ status: string; message: string }> {
    const response = await axios.get(`${API_BASE_URL}/health`);
    return response.data;
  },

  // ── Work IQ (SharePoint / M365 queries) ──────────────────────────
  async getWorkIQContext(): Promise<{ tenantId?: string; userPrincipalName?: string; userName?: string }> {
    const response = await axios.get(`${API_BASE_URL}/deployment/workiq/context`);
    return response.data;
  },

  async configureWorkIQ(params: { tenantId?: string; userPrincipalName?: string; userName?: string }): Promise<{ message: string }> {
    const response = await axios.post(`${API_BASE_URL}/deployment/workiq/configure`, params);
    return response.data;
  },

  async workiqAsk(question: string): Promise<{ query: string; answer: string; success: boolean }> {
    const response = await axios.post(`${API_BASE_URL}/deployment/workiq/ask`, { question });
    return response.data;
  },

  async workiqQuery(question: string, sessionId: string): Promise<{ question: string; answer: string; messages: Array<{ type: string; message: string }> }> {
    const response = await axios.post(`${API_BASE_URL}/deployment/workiq/query`, { question, sessionId });
    return response.data;
  },

  async approveTool(sessionId: string, approveAll: boolean): Promise<void> {
    await axios.post(`${API_BASE_URL}/deployment/chat/approve`, { sessionId, approveAll });
  },

  async chat(message: string, sessionId: string): Promise<{ reply: string; logs: Array<{ type: string; message: string }> }> {
    const response = await axios.post(`${API_BASE_URL}/deployment/chat`, { message, sessionId });
    return response.data;
  },
};
