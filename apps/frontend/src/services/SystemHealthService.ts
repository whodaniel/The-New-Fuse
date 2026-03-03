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
      console.error('Failed to fetch system health', error);
      throw new Error('System health telemetry is currently unavailable');
    }
  },
};
