import { apiService } from './api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'viewer';
  status: 'active' | 'inactive' | 'suspended';
  lastLogin?: string;
  createdAt: string;
}

export const UserService = {
  getUsers: async (): Promise<User[]> => {
    return await apiService.get<User[]>('/api/users');
  },

  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    return await apiService.put<User>(`/api/users/${id}`, data);
  },

  deleteUser: async (id: string): Promise<void> => {
    return await apiService.delete(`/api/users/${id}`);
  },
};
