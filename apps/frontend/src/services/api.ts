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

  // Mock API functions for API settings page
  generatePersonalAccessToken: async () => {
    console.log('Mock API: Generating personal access token...');
    // Simulate a network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    const token = `nfuse_pat_${Math.random().toString(36).substring(2)}`;
    const prefix = token.substring(0, 12);
    // In a real app, you'd only send the prefix and metadata, not the full token
    return { token, prefix, createdAt: new Date().toISOString() };
  },

  revokePersonalAccessToken: async (prefix: string) => {
    console.log(`Mock API: Revoking personal access token with prefix ${prefix}...`);
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true };
  },

  getPersonalAccessTokens: async () => {
    console.log('Mock API: Fetching personal access tokens...');
    await new Promise(resolve => setTimeout(resolve, 500));
    // Return some mock data
    return [
      { prefix: 'nfuse_pat_abc123', createdAt: new Date().toISOString() },
      { prefix: 'nfuse_pat_def456', createdAt: new Date().toISOString() },
    ];
  },

  saveWebhookUrl: async (url: string) => {
    console.log(`Mock API: Saving webhook URL: ${url}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    // In a real app, you would save this to a database
    localStorage.setItem('webhookUrl', url);
    return { success: true };
  },

  testWebhookUrl: async (url: string) => {
    console.log(`Mock API: Testing webhook URL: ${url}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Simulate a successful or failed test
    const success = Math.random() > 0.2; // 80% chance of success
    if (success) {
      return { success: true, message: 'Webhook test successful!' };
    } else {
      return { success: false, message: 'Webhook test failed. Please check your endpoint.' };
    }
  },

  getWebhookUrl: async () => {
    console.log('Mock API: Fetching webhook URL...');
    await new Promise(resolve => setTimeout(resolve, 500));
    const url = localStorage.getItem('webhookUrl');
    return { url };
  },

  saveProviderApiKey: async (provider: string, apiKey: string) => {
    console.log(`Mock API: Saving API key for provider: ${provider}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    // Simulate API key validation
    if (apiKey.includes('invalid')) {
      return Promise.reject({ message: 'The provided API key is invalid.' });
    }
    const id = `${provider.toLowerCase()}_${Math.random().toString(36).substring(2)}`;
    const newKey = { id, provider };
    const existingKeys = JSON.parse(localStorage.getItem('providerApiKeys') || '[]');
    localStorage.setItem('providerApiKeys', JSON.stringify([...existingKeys, newKey]));
    return newKey;
  },

  deleteProviderApiKey: async (id: string) => {
    console.log(`Mock API: Deleting provider API key with id: ${id}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    const existingKeys = JSON.parse(localStorage.getItem('providerApiKeys') || '[]');
    const updatedKeys = existingKeys.filter((key: any) => key.id !== id);
    localStorage.setItem('providerApiKeys', JSON.stringify(updatedKeys));
    return { success: true };
  },

  getProviderApiKeys: async () => {
    console.log('Mock API: Fetching provider API keys...');
    await new Promise(resolve => setTimeout(resolve, 500));
    const keys = JSON.parse(localStorage.getItem('providerApiKeys') || '[]');
    return keys;
  },
};
