import { useState, useMemo, useCallback } from 'react';
import {
  createApiClient,
  createAuthService,
  createUserService,
  createAgentService,
  createWorkflowService
} from '@the-new-fuse/api-client';
import { useAuth } from './useAuth.js';
import { useToast } from './useToast.js';

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
export function useApi() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Create API client and services
  const api = useMemo(() => {
    return createApiClient({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
      token: localStorage.getItem('auth_token') || undefined,
      onUnauthorized: () => {
        localStorage.removeItem('auth_token');
        window.location.href = '/auth/login';
      },
      refreshToken: async () => {
        try {
          const authService = createAuthService(createApiClient({
            baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
          }));
          const newToken = await authService.refreshToken();
          localStorage.setItem('auth_token', newToken);
          return newToken;
        } catch (error) {
          localStorage.removeItem('auth_token');
          throw error;
        }
      },
    });
  }, []);

  // Create services
  const authService = useMemo(() => createAuthService(api), [api]);
  const userService = useMemo(() => createUserService(api), [api]);
  const agentService = useMemo(() => createAgentService(api), [api]);
  const workflowService = useMemo(() => createWorkflowService(api), [api]);

  // Generic API call function with loading and error handling
  const callApi = useCallback(async <T>(apiCall: () => Promise<T>): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiCall();
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);

      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });

      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    api,
    authService,
    userService,
    agentService,
    workflowService,
    isAuthenticated: !!user,
    loading,
    error,
    callApi
  };
}