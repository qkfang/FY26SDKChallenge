import axios, { AxiosInstance } from 'axios';

export interface FabricCredentials {
  tenantId?: string;
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
}

export interface CreateLakehouseRequest {
  displayName: string;
  description?: string;
}

export interface CreateWorkspaceRequest {
  displayName: string;
  description?: string;
}

export class FabricService {
  private client: AxiosInstance;
  private accessToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://api.fabric.microsoft.com/v1',
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  setAccessToken(token: string): void {
    this.accessToken = token;
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  async createWorkspace(request: CreateWorkspaceRequest): Promise<any> {
    try {
      const response = await this.client.post('/workspaces', request);
      return response.data;
    } catch (error: any) {
      console.error('Error creating workspace:', error.response?.data || error.message);
      throw new Error(`Failed to create workspace: ${error.response?.data?.message || error.message}`);
    }
  }

  async getWorkspaces(): Promise<any[]> {
    try {
      const response = await this.client.get('/workspaces');
      return response.data.value || [];
    } catch (error: any) {
      console.error('Error fetching workspaces:', error.response?.data || error.message);
      throw new Error(`Failed to fetch workspaces: ${error.response?.data?.message || error.message}`);
    }
  }

  async createLakehouse(workspaceId: string, request: CreateLakehouseRequest): Promise<any> {
    try {
      const response = await this.client.post(
        `/workspaces/${workspaceId}/lakehouses`,
        request
      );
      return response.data;
    } catch (error: any) {
      console.error('Error creating lakehouse:', error.response?.data || error.message);
      throw new Error(`Failed to create lakehouse: ${error.response?.data?.message || error.message}`);
    }
  }

  async getLakehouse(workspaceId: string, lakehouseId: string): Promise<any> {
    try {
      const response = await this.client.get(
        `/workspaces/${workspaceId}/lakehouses/${lakehouseId}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Error fetching lakehouse:', error.response?.data || error.message);
      throw new Error(`Failed to fetch lakehouse: ${error.response?.data?.message || error.message}`);
    }
  }

  async listLakehouses(workspaceId: string): Promise<any[]> {
    try {
      const response = await this.client.get(
        `/workspaces/${workspaceId}/lakehouses`
      );
      return response.data.value || [];
    } catch (error: any) {
      console.error('Error listing lakehouses:', error.response?.data || error.message);
      throw new Error(`Failed to list lakehouses: ${error.response?.data?.message || error.message}`);
    }
  }

  isAuthenticated(): boolean {
    return this.accessToken !== null;
  }
}

export const fabricService = new FabricService();
