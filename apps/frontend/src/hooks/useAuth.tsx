import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { createApiClient, createAuthService } from '@the-new-fuse/api-client';

// Define user type
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

// Define auth context type
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

// Create API client
const api = createApiClient({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  token: localStorage.getItem('auth_token') || undefined,
  onUnauthorized: () => {
    localStorage.removeItem('auth_token');
    window.location.href = '/auth/login';
  },
  refreshToken: async () => {
    try {
      const authService = createAuthService(api);
      const newToken = await authService.refreshToken();
      localStorage.setItem('auth_token', newToken);
      return newToken;
    } catch (error) {
      localStorage.removeItem('auth_token');
      throw error;
    }
  },
});

// Create auth service
const authService = createAuthService(api);

// Create auth context
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  error: null,
});

/**
 * Auth provider component
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is authenticated
  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      api.setToken(token);
      const { data } = await authService.getCurrentUser();
      setUser(data as User);
    } catch (error) {
      localStorage.removeItem('auth_token');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Login user
  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const { data } = await authService.login(email, password);
      if (data?.token) {
        localStorage.setItem('auth_token', data.token);
        api.setToken(data.token);
        setUser(data.user as User);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to login');
      throw error;
    }
  }, []);

  // Register user
  const register = useCallback(async (name: string, email: string, password: string) => {
    setError(null);
    try {
      const { data } = await authService.register(name, email, password);
      if (data?.token) {
        localStorage.setItem('auth_token', data.token);
        api.setToken(data.token);
        setUser(data.user as User);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to register');
      throw error;
    }
  }, []);

  // Logout user
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      api.clearToken();
      setUser(null);
    }
  }, []);

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook for accessing the auth context
 * 
 * @example
 * // Usage in a component
 * const { user, isAuthenticated, login, logout } = useAuth();
 * 
 * // Login
 * const handleLogin = async (email, password) => {
 *   try {
 *     await login(email, password);
 *     // Redirect or show success message
 *   } catch (error) {
 *     // Handle error
 *   }
 * };
 * 
 * // Logout
 * const handleLogout = async () => {
 *   await logout();
 *   // Redirect to login page
 * };
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
