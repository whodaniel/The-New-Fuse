import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { config } from '../config';
import { AuthService } from '../services/AuthService';
import type { AuthState, LoginCredentials, RegisterCredentials } from '../types/auth';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; message?: string }>;
  register: (credentials: RegisterCredentials) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  updateTokens: (amount: number) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  const authService = new AuthService(config.apiUrl);

  const refreshUser = useCallback(async () => {
    try {
      const user = await authService.getCurrentUser();
      setState((prev) => ({
        ...prev,
        user,
        isAuthenticated: !!user,
        isLoading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      }));
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (credentials: LoginCredentials) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    const response = await authService.login(credentials);

    if (response.success && response.user) {
      setState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return { success: true };
    }

    setState((prev) => ({
      ...prev,
      isLoading: false,
      error: response.message || 'Login failed',
    }));
    return { success: false, message: response.message };
  };

  const register = async (credentials: RegisterCredentials) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    const response = await authService.register(credentials);

    if (response.success && response.user) {
      setState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return { success: true };
    }

    setState((prev) => ({
      ...prev,
      isLoading: false,
      error: response.message || 'Registration failed',
    }));
    return { success: false, message: response.message };
  };

  const logout = async () => {
    await authService.logout();
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  };

  const updateTokens = async (amount: number) => {
    const updatedUser = await authService.updateTokens(amount);
    if (updatedUser) {
      setState((prev) => ({
        ...prev,
        user: updatedUser,
      }));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        updateTokens,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
