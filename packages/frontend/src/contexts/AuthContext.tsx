import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  email: string;
  name?: string;
  roles: string[];
  permissions: string[];
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (userData: { email: string; password: string; firstName: string; lastName: string }) => Promise<boolean>;
  checkAuthStatus: () => Promise<void>;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Export the provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: false,
    error: null,
  });
  const navigate = useNavigate();

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // DEVELOPMENT MODE: Mock successful authentication
      const mockUser: User = {
        id: 'dev-user-123',
        email: credentials.email,
        name: credentials.email.split('@')[0],
        roles: ['admin', 'user'],
        permissions: ['read', 'write', 'admin']
      };
      
      const mockToken = 'dev-mock-token-123';
      const mockRefreshToken = 'dev-mock-refresh-token-123';
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Store mock tokens
      localStorage.setItem('accessToken', mockToken);
      if (credentials.rememberMe) {
        localStorage.setItem('refreshToken', mockRefreshToken);
      }

      setState({
        isAuthenticated: true,
        user: mockUser,
        isLoading: false,
        error: null,
      });

      navigate('/dashboard');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Authentication failed";

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        isAuthenticated: false,
        user: null,
      }));

      return false;
    }
  }, [navigate]);

  const logout = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      // Clear stored tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');

      setState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null,
      });

      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
      // Force logout anyway
      setState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null,
      });
      navigate('/');
    }
  }, [navigate]);

  const checkAuthStatus = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setState(prev => ({ ...prev, isAuthenticated: false, user: null }));
      return;
    }

    // DEVELOPMENT MODE: Mock auth check
    if (token === 'dev-mock-token-123') {
      const mockUser: User = {
        id: 'dev-user-123',
        email: 'admin@thenewfuse.com',
        name: 'Admin User',
        roles: ['admin', 'user'],
        permissions: ['read', 'write', 'admin']
      };
      
      setState({
        isAuthenticated: true,
        user: mockUser,
        isLoading: false,
        error: null,
      });
      return;
    }

    // If not mock token, clear auth
    setState({
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null,
    });
  }, []);

  const register = useCallback(async (userData: { email: string; password: string; firstName: string; lastName: string }) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // DEVELOPMENT MODE: Mock successful registration
      const mockUser: User = {
        id: 'dev-user-' + Date.now(),
        email: userData.email,
        name: `${userData.firstName} ${userData.lastName}`,
        roles: ['user'],
        permissions: ['read', 'write']
      };
      
      const mockToken = 'dev-mock-token-' + Date.now();
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Store mock tokens
      localStorage.setItem('accessToken', mockToken);
      
      setState({
        isAuthenticated: true,
        user: mockUser,
        isLoading: false,
        error: null,
      });

      navigate('/dashboard');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Registration failed";
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return false;
    }
  }, [navigate]);

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      logout,
      register,
      checkAuthStatus,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Export a hook to use the auth context
export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
