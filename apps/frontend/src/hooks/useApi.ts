import {
  createAgentService,
  createApiClient,
  createAuthService,
  createUserService,
  createWorkflowService,
  type ApiClient,
} from '@the-new-fuse/api-client';
import { useCallback, useMemo, useState } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './useToast';

export interface UseApiReturn {
  api: ApiClient;
  authService: ReturnType<typeof createAuthService>;
  userService: ReturnType<typeof createUserService>;
  agentService: ReturnType<typeof createAgentService>;
  workflowService: ReturnType<typeof createWorkflowService>;
  isAuthenticated: boolean;
  loading: boolean;
  error: Error | null;
  callApi: <T>(apiCall: () => Promise<T>) => Promise<T | null>;
}

/**
 * Hook for accessing API services
 *
 * @example
 * // Usage in a component
 * const { authService, userService, agentService, workflowService } = useApi();
 *
 * // Get all agents
 * const fetchAgents = async () => {
 *   const { data } = await agentService.getAgents();
 *   setAgents(data);
 * };
 */
export function useApi(): UseApiReturn {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const apiBaseUrl = useMemo(() => {
    const configuredApiUrl =
      (import.meta.env.VITE_API_URL as string) || 'http://localhost:3001/api';
    return configuredApiUrl.endsWith('/api')
      ? configuredApiUrl
      : `${configuredApiUrl.replace(/\/$/, '')}/api`;
  }, []);

  // Create API client and services
  const api = useMemo(() => {
    return createApiClient({
      baseURL: apiBaseUrl,
      token: localStorage.getItem('auth_token') || undefined,
      onUnauthorized: () => {
        localStorage.removeItem('auth_token');
        window.location.href = '/auth/login';
      },
      refreshToken: async () => {
        try {
          const tempClient = createApiClient({ baseURL: apiBaseUrl });
          const auth = createAuthService(tempClient);
          const newToken = await auth.refreshToken();
          localStorage.setItem('auth_token', newToken);
          return newToken;
        } catch (err) {
          localStorage.removeItem('auth_token');
          throw err;
        }
      },
    });
  }, [apiBaseUrl]);

  // Create services
  const authService = useMemo(() => createAuthService(api), [api]);
  const userService = useMemo(() => createUserService(api), [api]);
  const agentService = useMemo(() => createAgentService(api), [api]);
  const workflowService = useMemo(() => createWorkflowService(api), [api]);

  // Generic API call function with loading and error handling
  const callApi = useCallback(
    async <T>(apiCall: () => Promise<T>): Promise<T | null> => {
      setLoading(true);
      setError(null);

      try {
        const result = await apiCall();
        return result;
      } catch (err) {
        const fetchError = err instanceof Error ? err : new Error(String(err));
        setError(fetchError);

        toast({
          title: 'Error',
          description: fetchError.message,
          variant: 'destructive',
        });

        return null;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  return {
    api,
    authService,
    userService,
    agentService,
    workflowService,
    isAuthenticated: !!user,
    loading,
    error,
    callApi,
  };
}
