// apps/frontend/src/services/dashboard.service.ts

const API_BASE = '/api';

class DashboardService {
  private async request(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }

    return response.json();
  }

  getDashboardMetrics() {
    return this.request('/dashboard/metrics');
  }

  getAdminDashboardMetrics() {
    return this.request('/admin/metrics/dashboard');
  }
}

const dashboardService = new DashboardService();
export default dashboardService;
