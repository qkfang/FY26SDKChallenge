export interface DeploymentRequest {
  requirement: string;
  workspaceName?: string;
  lakehouseName?: string;
  resourceConfig?: ResourceConfig;
  selectedSteps?: string[];
  sessionId?: string;
  tempFolder?: string;
}

export interface DeploymentStatus {
  id: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  progress: number;
  messages: DeploymentMessage[];
  result?: DeploymentResult;
  error?: string;
  copilotSessionId?: string;
  tempFolder?: string;
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
