import { auth } from '@/lib/firebase';
import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token to every request
api.interceptors.request.use(
  async (config) => {
    // Only attempt to get auth token if Firebase is initialized
    if (auth) {
      const user = auth.currentUser;
      if (user) {
        try {
          const token = await user.getIdToken();
          config.headers.Authorization = `Bearer ${token}`;
        } catch (error) {
          console.error('Error getting auth token:', error);
        }
      }
    } else {
      // If Firebase is not available, check for token in localStorage (fallback)
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const { response } = error;

    if (response && response.status === 401) {
      // Handle unauthorized access
      console.error('Unauthorized access. Please log in again.');
      // You could trigger a logout or redirect to login here
    }

    if (response && response.status === 500) {
      console.error('Server error. Please try again later.');
    }

    return Promise.reject(error);
  }
);

export default api;

// Helper functions for common API operations
export const apiService = {
  get: async <T>(url: string, params?: any) => {
    const response = await api.get<T>(url, { params });
    return response.data;
  },

  post: async <T>(url: string, data: any) => {
    const response = await api.post<T>(url, data);
    return response.data;
  },

  put: async <T>(url: string, data: any) => {
    const response = await api.put<T>(url, data);
    return response.data;
  },

  delete: async <T>(url: string) => {
    const response = await api.delete<T>(url);
    return response.data;
  },

  // --- Real API Integration for Settings ---

  generatePersonalAccessToken: async () => {
    const response = await api.post<{ token: string; prefix: string; createdAt: string }>(
      '/api/tokens'
    );
    return response.data;
  },

  revokePersonalAccessToken: async (prefix: string) => {
    await api.delete(`/api/tokens/${prefix}`);
    return { success: true };
  },

  getPersonalAccessTokens: async () => {
    const response = await api.get<{ prefix: string; createdAt: string }[]>('/api/tokens');
    return response.data;
  },

  saveWebhookUrl: async (url: string) => {
    await api.post('/api/webhooks/config', { url });
    return { success: true };
  },

  testWebhookUrl: async (url: string) => {
    const response = await api.post<{ success: boolean; message: string }>('/api/webhooks/test', {
      url,
    });
    return response.data;
  },

  getWebhookUrl: async () => {
    const response = await api.get<{ url: string }>('/api/webhooks/config');
    return response.data;
  },

  saveProviderApiKey: async (provider: string, apiKey: string) => {
    // SECURITY: Keys are sent over HTTPS to backend for encryption
    const response = await api.post<{ id: string; provider: string }>('/api/provider-keys', {
      provider,
      apiKey,
    });
    return response.data;
  },

  deleteProviderApiKey: async (id: string) => {
    await api.delete(`/api/provider-keys/${id}`);
    return { success: true };
  },

  getProviderApiKeys: async () => {
    // Returns only metadata (id, provider), NOT the key itself
    const response = await api.get<{ id: string; provider: string }[]>('/api/provider-keys');
    return response.data;
  },
};
