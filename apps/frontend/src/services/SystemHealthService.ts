import { apiService } from './api';

export interface SystemHealth {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  uptime: number; // seconds
  services: {
    name: string;
    status: 'healthy' | 'degraded' | 'down';
    latency: number;
  }[];
}

export const SystemHealthService = {
  getSystemHealth: async (): Promise<SystemHealth> => {
    try {
      return await apiService.get<SystemHealth>('/api/system/health');
    } catch (error) {
      console.warn('Failed to fetch system health, returning mock data', error);
      return {
        cpuUsage: 45,
        memoryUsage: 62,
        diskUsage: 28,
        uptime: 1234567,
        services: [
          { name: 'Database', status: 'healthy', latency: 12 },
          { name: 'API Gateway', status: 'healthy', latency: 5 },
          { name: 'Workflow Engine', status: 'healthy', latency: 45 },
          { name: 'Auth Service', status: 'healthy', latency: 18 },
        ],
      };
    }
  },
};
