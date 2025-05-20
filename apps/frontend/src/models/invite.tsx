import { AxiosResponse } from 'axios';
import api from '../lib/api.js';

export interface Invite {
  id: string;
  email: string;
  status: string;
  expiresAt: string;
  workspaceId?: string;
}

class InviteModel {
  async getInvite(id: string): Promise<Invite> {
    const response: AxiosResponse<Invite> = await api.get(`/api/invites/${id}`);
    return response.data;
  }

  async acceptInvite(id: string, data: { password: string }): Promise<void> {
    await api.post(`/api/invites/${id}/accept`, data);
  }

  async createInvite(email: string, workspaceId?: string): Promise<Invite> {
    const response: AxiosResponse<Invite> = await api.post('/api/invites', { email, workspaceId });
    return response.data;
  }

  async deleteInvite(id: string): Promise<void> {
    await api.delete(`/api/invites/${id}`);
  }
}

export default new InviteModel();