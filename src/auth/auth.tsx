import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthService, AuthResult, LoginCredentials, RegisterData } from './auth.service';

export interface AuthContextType {
  user: any | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthResult>;
  register: (data: RegisterData) => Promise<AuthResult>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
  authService: AuthService;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children, authService }) => {
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored token on mount
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      authService.validateToken(storedToken).then(isValid => {
        if (isValid) {
          setToken(storedToken);
          // TODO: Decode token to get user info
          setUser({ id: 1, email: 'user@example.com' });
        } else {
          localStorage.removeItem('auth_token');
        }
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, [authService]);

  const login = async (credentials: LoginCredentials): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const result = await authService.login(credentials);
      if (result.success && result.token) {
        setToken(result.token);
        setUser(result.user);
        localStorage.setItem('auth_token', result.token);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const result = await authService.register(data);
      if (result.success && result.token) {
        setToken(result.token);
        setUser(result.user);
        localStorage.setItem('auth_token', result.token);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
  };

  const refreshToken = async () => {
    if (!token) return;
    
    try {
      const result = await authService.refreshToken(token);
      if (result.success && result.token) {
        setToken(result.token);
        localStorage.setItem('auth_token', result.token);
      } else {
        logout();
      }
    } catch {
      logout();
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    register,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;