/* global localStorage, console */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

interface User {
  id: string;
  email: string;
  roles: string[];
  permissions: string[];
}

interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
  expiresAt: string;
}

export function useAuth(): any {
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

      const response = await axios.post<AuthResponse>('/api/auth/login', credentials);
      const { token, refreshToken, user, expiresAt } = response.data;

      // Store tokens
      localStorage.setItem('accessToken', token);
      if (credentials.rememberMe) {
        localStorage.setItem('refreshToken', refreshToken);
      }

      setState({
        isAuthenticated: true,
        user,
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
      
      // Call logout endpoint to invalidate token
      await axios.post('/api/auth/logout');
      
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

    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const response = await axios.get<{ user: User }>('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setState({
        isAuthenticated: true,
        user: response.data.user,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      // Token might be expired - try refresh token
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post<AuthResponse>('/api/auth/refresh', { refreshToken });
          localStorage.setItem('accessToken', response.data.token);
          
          setState({
            isAuthenticated: true,
            user: response.data.user,
            isLoading: false,
            error: null,
          });
          return;
        } catch (refreshError) {
          // Refresh token failed - force logout
          await logout();
        }
      }

      setState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: "Session expired",
      });
    }
  }, [logout]);

  return {
    ...state,
    login,
    logout,
    checkAuthStatus,
  };
}
