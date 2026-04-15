// apps/frontend/src/services/dashboard.service.ts

const API_BASE = '/api';

interface DashboardMetricsResponse {
  [key: string]: unknown;
}

class DashboardService {
  private async request(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<DashboardMetricsResponse> {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(options.headers)) {
      for (const [key, value] of options.headers) headers[key] = value;
    } else if (options.headers) {
      Object.assign(headers, options.headers as Record<string, string>);
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

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
