import {
  getAccessToken,
  getAuthTokenCandidates,
  silentRefreshAccessToken,
} from '@/services/authSession';
import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import { toast } from 'sonner';

interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  _silent?: boolean;
  _retry?: boolean;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
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

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    let bearerToken = getAccessToken();

    if (!bearerToken) {
      const candidates = await getAuthTokenCandidates();
      bearerToken = candidates[0] || null;
    }

    if (bearerToken) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${bearerToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const { response, config } = error;
    const customConfig = config as CustomAxiosRequestConfig | undefined;
    const isSilent = customConfig?._silent === true;

    if (!response) {
      if (!isSilent) {
        toast.error('Network Error. Please check your connection.');
      }
      return Promise.reject(error);
    }

    // Silent token rotation: refresh once and retry original request.
    if (
      (response.status === 401 || response.status === 403) &&
      customConfig &&
      !customConfig._retry &&
      !String(customConfig.url || '').includes('/auth/refresh') &&
      !String(customConfig.url || '').includes('/auth/login')
    ) {
      customConfig._retry = true;
      const refreshed = await silentRefreshAccessToken();
      if (refreshed) {
        customConfig.headers = customConfig.headers || {};
        (customConfig.headers as Record<string, string>).Authorization = `Bearer ${refreshed}`;
        return api.request(customConfig);
      }
    }

    if (!isSilent) {
      const rawMessage =
        (response.data as { message?: string } | undefined)?.message || 'Something went wrong';
      const errorMessage = sanitizeErrorMessage(rawMessage);

      switch (response.status) {
        case 400:
          toast.error(errorMessage);
          break;
        case 401:
          toast.error('Session expired. Please log in again.');
          break;
        case 403:
          toast.error('You do not have permission to perform this action.');
          break;
        case 404:
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
    await api.post('/api/v1/webhooks/config', { url });
    return { success: true };
  },

  testWebhookUrl: async (url: string) => {
    const response = await api.post<{ success: boolean; message: string }>(
      '/api/v1/webhooks/test',
      {
        url,
      }
    );
    return response.data;
  },

  getWebhookUrl: async () => {
    const response = await api.get<{ url: string }>('/api/v1/webhooks/config');
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
