// apps/frontend/src/services/dashboard.service.ts

import { authFetch } from '@/utils/authToken';

const API_BASE = '/api';

interface DashboardMetricsResponse {
  [key: string]: unknown;
}

class DashboardService {
  private async request(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<DashboardMetricsResponse> {
    const response = await authFetch(`${API_BASE}${endpoint}`, options);

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }

    return response.json();
  }

  getDashboardMetrics(): Promise<DashboardMetricsResponse> {
    return this.request('/dashboard/metrics');
  }

  getAdminDashboardMetrics(): Promise<DashboardMetricsResponse> {
    return this.request('/admin/metrics/dashboard');
  }
}

const dashboardService = new DashboardService();
export default dashboardService;
