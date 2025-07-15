import { useState, useEffect, useCallback, createContext, useContext } from 'react';

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
        return await api.request('/api/auth/me');
      } catch (error) {
        // For demo purposes, return a mock user if API is not available
        if (import.meta.env.DEV) {
          console.warn('API not available, using demo user');
          return { 
            data: { 
              id: '1', 
              email: 'demo@thenewfuse.com', 
              name: 'Demo User', 
              role: 'admin' // Set to admin for demo
            } 
          };
        }
        throw error;
      }
    },
    
    login: async (email: string, password: string) => {
      try {
        return await api.request('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
      } catch (error) {
        // For demo purposes, allow any email with "user" for authentication
        if (import.meta.env.DEV && email.includes('user')) {
          console.warn('API not available, using demo authentication');
          return { 
            data: { 
              token: 'demo-token-' + Date.now(), 
              user: { 
                id: '1', 
                email, 
                name: email.split('@')[0], 
                role: email.includes('admin') ? 'admin' : 'user'
              } 
            } 
          };
        }
        throw error;
      }
    },
    
    register: async (name: string, email: string, password: string) => {
      try {
        return await api.request('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name, email, password }),
        });
      } catch (error) {
        // For demo purposes, allow registration
        if (import.meta.env.DEV) {
          console.warn('API not available, using demo registration');
          return { 
            data: { 
              token: 'demo-token-' + Date.now(), 
              user: { id: '1', email, name, role: 'user' } 
            } 
          };
        }
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
  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const { data } = await authService.getCurrentUser();
      setUser(data as User);
      setError(null); // Clear any previous errors
    } catch (error: any) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('auth_token');
      setUser(null);
      setError(error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Login user
  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const { data } = await authService.login(email, password);
      if (data?.token) {
        localStorage.setItem('auth_token', data.token);
        setUser(data.user as User);
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
      if (data?.token) {
        localStorage.setItem('auth_token', data.token);
        setUser(data.user as User);
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
      localStorage.removeItem('auth_token');
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