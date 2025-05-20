import { AxiosResponse } from 'axios';
import api from '../lib/api.js';

export interface SystemPreferences {
  settings: Record<string, any>;
}

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  status: string;
}

class AdminModel {
  async systemPreferences(): Promise<SystemPreferences> {
    const response: AxiosResponse<SystemPreferences> = await api.get('/api/admin/preferences');
    return response.data;
  }

  async getUsers(): Promise<AdminUser[]> {
    const response: AxiosResponse<AdminUser[]> = await api.get('/api/admin/users');
    return response.data;
  }

  async updateSystemPreferences(settings: Record<string, any>): Promise<SystemPreferences> {
    const response: AxiosResponse<SystemPreferences> = await api.patch('/api/admin/preferences', { settings });
    return response.data;
  }
}

export default new AdminModel();