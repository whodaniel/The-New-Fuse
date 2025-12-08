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
    try {
      return await apiService.get<User[]>('/api/users');
    } catch (error) {
      console.warn('Failed to fetch users, returning mock data', error);
      // Fallback mock data for functionality demonstration
      return [
        {
          id: '1',
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'admin',
          status: 'active',
          lastLogin: new Date().toISOString(),
          createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
        },
        {
          id: '2',
          email: 'user@example.com',
          name: 'Regular User',
          role: 'user',
          status: 'active',
          lastLogin: new Date(Date.now() - 86400000).toISOString(),
          createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
        },
      ];
    }
  },

  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    return await apiService.put<User>(`/api/users/${id}`, data);
  },

  deleteUser: async (id: string): Promise<void> => {
    return await apiService.delete(`/api/users/${id}`);
  },
};
