// apps/frontend/src/services/port-management-api.ts

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

interface PortRegistration {
  id: string;
  port: number;
  serviceName: string;
  serviceType: 'frontend' | 'api' | 'backend' | 'broker' | 'database' | 'other';
  environment: string;
  status: 'active' | 'reserved' | 'conflict' | 'inactive';
  processId?: number;
  host: string;
  protocol: string;
  healthCheckUrl?: string;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, any>;
}

interface PortConflict {
  port: number;
  conflictingServices: PortRegistration[];
  suggestedResolutions: {
    type: 'reassign' | 'terminate' | 'merge';
    targetService: string;
    newPort?: number;
    description: string;
  }[];
}

class PortManagementApi {
  private wsConnection: WebSocket | null = null;

  async getAllPorts(environment?: string): Promise<PortRegistration[]> {
    const params = environment ? { environment } : {};
    const response = await axios.get(`${API_BASE_URL}/api/ports`, { params });
    return response.data;
  }

  async registerPort(config: {
    serviceName: string;
    serviceType: PortRegistration['serviceType'];
    environment: string;
    port?: number;
    host?: string;
    protocol?: string;
    healthCheckUrl?: string;
    metadata?: Record<string, any>;
  }): Promise<PortRegistration> {
    const response = await axios.post(`${API_BASE_URL}/api/ports/register`, config);
    return response.data;
  }

  async reassignPort(portId: string, newPort: number): Promise<void> {
    await axios.put(`${API_BASE_URL}/api/ports/${portId}/reassign`, { newPort });
  }

  async getConflicts(): Promise<PortConflict[]> {
    const response = await axios.get(`${API_BASE_URL}/api/ports/conflicts`);
    return response.data;
  }

  async resolveConflict(resolution: { port: number; resolution: any }): Promise<void> {
    await axios.post(`${API_BASE_URL}/api/ports/resolve-conflict`, resolution);
  }

  async findAvailablePort(serviceName: string, environment: string): Promise<number> {
    const response = await axios.get(`${API_BASE_URL}/api/ports/find-available`, {
      params: { serviceName, environment }
    });
    return response.data.port;
  }

  async checkPortHealth(port: number): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/api/ports/health/${port}`);
    return response.data;
  }

  connectWebSocket(): WebSocket {
    if (this.wsConnection) {
      this.wsConnection.close();
    }

    const wsUrl = `${API_BASE_URL.replace('http', 'ws')}/api/ports/ws`;
    this.wsConnection = new WebSocket(wsUrl);
    
    return this.wsConnection;
  }

  disconnectWebSocket(): void {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
  }
}

export const portManagementApi = new PortManagementApi();
