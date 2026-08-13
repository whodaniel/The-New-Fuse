import { useState, useEffect, useCallback } from 'react';
import { AuthService, LoginCredentials, RegisterData } from '../mocks/api-client.js';

/**
 * Authentication hook result
 */
export interface UseAuthResult {
  /**
   * Whether the user is authenticated
   */
  isAuthenticated: boolean;
  /**
   * Whether authentication is being checked
   */
  isLoading: boolean;
  /**
   * Authentication error
   */
  error: Error | null;
  /**
   * Current user data
   */
  user: any | null;
  /**
   * Login function
   */
  login: (credentials: LoginCredentials) => Promise<void>;
  /**
   * Register function
   */
  register: (data: RegisterData) => Promise<void>;
  /**
   * Logout function
   */
  logout: () => Promise<void>;
}

/**
 * Authentication hook options
 */
export interface UseAuthOptions {
  /**
   * Authentication service
   */
  authService: AuthService;
  /**
   * Whether to check authentication on mount
   * @default true
   */
  checkOnMount?: boolean;
}

/**
 * Hook for authentication
 * @param options Authentication hook options
 * @returns Authentication hook result
 * 
 * @example
 * // Create auth service
 * const authService = new AuthService(apiClient, tokenStorage);
 * 
 * // Use auth hook
 * const { isAuthenticated, isLoading, user, login, logout } = useAuth({ authService });
 * 
 * // Login
 * const handleLogin = async (email, password) => {
 *   try {
 *     await login({ email, password });
 *     // Redirect to dashboard
 *   } catch (error) {
 *     // Handle error
 *   }
 * };
 */
export function useAuth(options: UseAuthOptions): UseAuthResult {
  const { authService, checkOnMount = true } = options;
  
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [user, setUser] = useState<any | null>(null);
  
  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const isAuth = await authService.isAuthenticated();
      setIsAuthenticated(isAuth);
      
      if (isAuth) {
        const userData = await authService.getCurrentUser();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (err) {
      setError(err as Error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [authService]);
  
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authService.login(credentials);
      
      setIsAuthenticated(true);
      setUser(response.user);
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [authService]);
  
  const register = useCallback(async (data: RegisterData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authService.register(data);
      
      setIsAuthenticated(true);
      setUser(response.user);
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [authService]);
  
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await authService.logout();
      
      setIsAuthenticated(false);
      setUser(null);
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [authService]);
  
  useEffect(() => {
    if (checkOnMount) {
      checkAuth();
    }
  }, [checkOnMount, checkAuth]);
  
  return {
    isAuthenticated,
    isLoading,
    error,
    user,
    login,
    register,
    logout,
  };
}
