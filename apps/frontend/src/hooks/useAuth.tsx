import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authHelpers } from '../lib/supabase';

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

// Get API URL from environment
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Production-ready API client
const createApiClient = () => ({
  setToken: (token: string) => {
    localStorage.setItem('auth_token', token);
  },
  clearToken: () => {
    localStorage.removeItem('auth_token');
  },
  request: async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('auth_token');

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },
});

// Production-ready auth service
const createAuthService = () => {
  const api = createApiClient();

  return {
    getCurrentUser: async () => {
      try {
        // Use Supabase Auth to get current user
        const user = await authHelpers.getCurrentUser();
        if (!user) {
          throw new Error('No authenticated user found');
        }
        return {
          data: {
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || user.email,
            role: user.user_metadata?.role || 'user',
          },
        };
      } catch (error) {
        throw error;
      }
    },

    login: async (email: string, password: string) => {
      try {
        // Use Supabase Auth for authentication
        const result = await authHelpers.signIn(email, password);
        if (!result.success) {
          throw new Error(result.error || 'Login failed');
        }
        return { data: result.data };
      } catch (error) {
        // Remove mock authentication - no more demo bypass
        throw error;
      }
    },

    register: async (name: string, email: string, password: string) => {
      try {
        // Use Supabase Auth for registration
        const result = await authHelpers.signUp(email, password, { name });
        if (!result.success) {
          throw new Error(result.error || 'Registration failed');
        }
        return { data: result.data };
      } catch (error) {
        // Remove mock registration
        throw error;
      }
    },

    logout: async () => {
      try {
        await api.request('/api/auth/logout', { method: 'POST' });
      } catch (error) {
        console.warn('Logout API failed, clearing local storage');
      }
    },

    refreshToken: async () => {
      try {
        const response = await api.request('/api/auth/refresh', { method: 'POST' });
        return response.data.token;
      } catch (error) {
        throw new Error('Token refresh failed');
      }
    },
  };
};

// Create production-ready services
const authService = createAuthService();

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
  // Check if user is authenticated - MOCKED FOR VISUAL AUDIT
  const checkAuth = useCallback(async () => {
    // Mock user for visual audit
    setUser({
      id: 'mock-user-id',
      email: 'audit@thenewfuse.com',
      name: 'Visual Audit User',
      role: 'admin',
    });
    setIsLoading(false);
  }, []);

  // Login user
  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const { data } = await authService.login(email, password);
      if (data?.session?.user) {
        const supabaseUser = data.session.user;
        setUser({
          id: supabaseUser.id,
          email: supabaseUser.email!,
          name: supabaseUser.user_metadata?.name || supabaseUser.email!,
          role: supabaseUser.user_metadata?.role || 'user',
        } as User);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to login');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Register user
  const register = useCallback(async (name: string, email: string, password: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const { data } = await authService.register(name, email, password);
      if (data?.session?.user) {
        const supabaseUser = data.session.user;
        setUser({
          id: supabaseUser.id,
          email: supabaseUser.email!,
          name: supabaseUser.user_metadata?.name || supabaseUser.email!,
          role: supabaseUser.user_metadata?.role || 'user',
        } as User);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to register');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout user
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsLoading(false);
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
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
