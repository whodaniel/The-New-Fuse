import { hasSupabaseConfig, supabase } from '@/lib/supabase';
import axios, { type AxiosRequestConfig } from 'axios';
import { toast } from 'sonner';

// Custom config type to allow silent requests
interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  _silent?: boolean;
}

// Create an axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

const sanitizeErrorMessage = (input: unknown): string => {
  const fallback = 'Request failed. Please try again.';
  if (input == null) return fallback;

  const asString = Array.isArray(input)
    ? input.map((item) => String(item)).join(', ')
    : String(input);

  const compact = asString.replace(/\s+/g, ' ').trim();
  const looksLikePromptDump =
    compact.includes('Codebase Overview') ||
    compact.includes('What It Is') ||
    compact.includes('Core Services');

  if (!compact || looksLikePromptDump || compact.length > 220) {
    return 'Request failed due to an unexpected server response.';
  }

  return compact;
};

// Add a request interceptor to add the auth token to every request
api.interceptors.request.use(
  async (config) => {
    // Prefer Supabase token when available, then fall back to stored JWT.
    let bearerToken: string | null = null;

    if (hasSupabaseConfig && supabase) {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!error) {
          bearerToken = data?.session?.access_token || null;
        }
      } catch (error) {
        console.error('Error getting Supabase auth token:', error);
      }
    }

    if (!bearerToken) {
      bearerToken =
        localStorage.getItem('auth_token') ||
        localStorage.getItem('authToken') ||
        localStorage.getItem('token');
    }

    if (bearerToken) {
      config.headers.Authorization = `Bearer ${bearerToken}`;
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
    const { response, config } = error;
    // Cast config to our custom type to access _silent
    const customConfig = config as CustomAxiosRequestConfig;
    const isSilent = customConfig?._silent === true;

    // Network Error (no response)
    if (!response) {
      if (!isSilent) {
        toast.error('Network Error. Please check your connection.');
      }
      return Promise.reject(error);
    }

    if (!isSilent) {
      const rawMessage = response?.data?.message || 'Something went wrong';
      const errorMessage = sanitizeErrorMessage(rawMessage);

      switch (response.status) {
        case 400:
          // Validation Error
          toast.error(errorMessage);
          break;
        case 401:
          // Unauthorized
          toast.error('Session expired. Please log in again.');
          // Optional: Event bus emit for logout
          break;
        case 403:
          // Forbidden
          toast.error('You do not have permission to perform this action.');
          break;
        case 404:
          // Not Found - sometimes we don't want to toast this (e.g. check user existence),
          // but usually it's helpful.
          toast.error(typeof errorMessage === 'string' ? errorMessage : 'Resource not found.');
          break;
        case 500:
        case 502:
        case 503:
          toast.error('Server error. The team has been notified.');
          break;
        default:
          toast.error(
            typeof errorMessage === 'string' ? errorMessage : 'An unexpected error occurred.'
          );
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// Helper functions for common API operations
export const apiService = {
  get: async <T>(url: string, params?: any, config?: { silent?: boolean }) => {
    const requestConfig: CustomAxiosRequestConfig = {
      params,
      _silent: config?.silent,
    };
    const response = await api.get<T>(url, requestConfig);
    return response.data;
  },

  post: async <T>(url: string, data: any, config?: { silent?: boolean }) => {
    const requestConfig: CustomAxiosRequestConfig = {
      _silent: config?.silent,
    };
    const response = await api.post<T>(url, data, requestConfig);
    return response.data;
  },

  put: async <T>(url: string, data: any, config?: { silent?: boolean }) => {
    const requestConfig: CustomAxiosRequestConfig = {
      _silent: config?.silent,
    };
    const response = await api.put<T>(url, data, requestConfig);
    return response.data;
  },

  delete: async <T>(url: string, config?: { silent?: boolean }) => {
    const requestConfig: CustomAxiosRequestConfig = {
      _silent: config?.silent,
    };
    const response = await api.delete<T>(url, requestConfig);
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

  getAgentApiGrants: async () => {
    const response = await api.get<any[]>('/api/agent-grants');
    return response.data;
  },

  createAgentApiGrant: async (payload: {
    agentId: string;
    provider: string;
    allowedModels?: string[];
    maxRequestsPerMinute?: number;
    dailyTokenBudget?: number;
    monthlyUsdCapCents?: number;
    expiresAt: string;
  }) => {
    const response = await api.post<{ grant: any; accessToken: string }>(
      '/api/agent-grants',
      payload
    );
    return response.data;
  },

  revokeAgentApiGrant: async (id: string) => {
    const response = await api.post(`/api/agent-grants/${id}/revoke`, {});
    return response.data;
  },

  rotateAgentApiGrant: async (id: string) => {
    const response = await api.post<{ grant: any; accessToken: string }>(
      `/api/agent-grants/${id}/rotate`,
      {}
    );
    return response.data;
  },
};
