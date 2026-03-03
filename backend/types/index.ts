export interface ResourceConfig {
  notebookName?: string;
  sqlServerName?: string;
  workspaces: {
    dev?: string;
    qa?: string;
    prod?: string;
  };
}

export interface SetupRequest {
  requirement: string;
  resourceConfig?: ResourceConfig;
}

export interface DeployStepRequest {
  step: 'bicep' | 'cli' | 'fabric';
  workspaceDir: string;
}

export interface DeploymentStatus {
  id: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  progress: number;
  messages: DeploymentMessage[];
  result?: DeploymentResult;
  error?: string;
  copilotSessionId?: string;
  workspaceDir?: string;
}

export interface DeploymentMessage {
  timestamp: Date;
  type: 'info' | 'success' | 'error' | 'progress';
  message: string;
}

export interface DeploymentResult {
  workspaceId?: string;
  lakehouseId?: string;
  resources: string[];
  summary: string;
}

export interface FabricConfig {
  tenantId?: string;
  clientId?: string;
  clientSecret?: string;
  apiEndpoint: string;
}
