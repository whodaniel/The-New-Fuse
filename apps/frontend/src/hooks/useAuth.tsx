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

// Temporary API stub until api-client package is built
const createApiStub = () => ({
  setToken: (token: string) => {
    console.log('API: Setting token', token);
  },
  clearToken: () => {
    console.log('API: Clearing token');
  },
});

// Temporary auth service stub
const createAuthServiceStub = () => ({
  getCurrentUser: async () => ({ 
    data: { 
      id: '1', 
      email: 'test@example.com', 
      name: 'Test User', 
      role: 'user' 
    } 
  }),
  login: async (email: string, password: string) => {
    console.log('Auth: Login attempt', { email });
    return { 
      data: { 
        token: 'stub-token-' + Date.now(), 
        user: { id: '1', email, name: 'Test User', role: 'user' } 
      } 
    };
  },
  register: async (name: string, email: string, password: string) => {
    console.log('Auth: Register attempt', { name, email });
    return { 
      data: { 
        token: 'stub-token-' + Date.now(), 
        user: { id: '1', email, name, role: 'user' } 
      } 
    };
  },
  logout: async () => {
    console.log('Auth: Logout');
  },
  refreshToken: async () => {
    return 'new-stub-token-' + Date.now();
  },
});

// Create API client stub
const api = createApiStub();

// Create auth service stub
const authService = createAuthServiceStub();

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
    } catch (error) {
      localStorage.removeItem('auth_token');
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