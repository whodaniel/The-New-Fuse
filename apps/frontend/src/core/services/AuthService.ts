// @ts-nocheck
import { EventBus } from '../../domain/core/eventBus';
import { StateManager } from '../../domain/core/stateManager';
import { authHelpers } from '../../lib/supabase';
import { LoggingService } from '../../services/logging';
const API_BASE_URL = '/api/v1';

export class AuthService {
  private refreshTokenCache: string | null = null;

  constructor() {
    this.eventBus = EventBus.getInstance();
    this.stateManager = StateManager.getInstance();
    this.logger = LoggingService.getInstance();
  }
  static getInstance() {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }
  async login(credentials) {
    try {
      // Use Supabase Auth for authentication
      const result = await authHelpers.signIn(credentials.email, credentials.password);

      if (!result.success) {
        throw new Error(result.error || 'Login failed');
      }

      const { data } = result;
      this.setTokens({
        accessToken: data.session?.access_token,
        refreshToken: data.session?.refresh_token,
      });

      await this.fetchAndSetUserProfile();
      this.eventBus.emit('auth_login', { email: credentials.email }, 'AuthService');
      return { success: true, data: data.session };
    } catch (error) {
      this.logger.error('Login failed', error);
      return {
        success: false,
        error: {
          code: 'LOGIN_FAILED',
          message: 'Failed to login',
          details: error,
        },
      };
    }
  }
  async logout() {
    try {
      // Use Supabase Auth for logout
      const result = await authHelpers.signOut();

      if (!result.success) {
        throw new Error(result.error || 'Logout failed');
      }

      this.clearTokens();
      this.stateManager.setState(['auth', 'user'], null);
      this.eventBus.emit('auth_logout', null, 'AuthService');
      return { success: true, data: undefined };
    } catch (error) {
      this.logger.error('Logout failed', error);
      return {
        success: false,
        error: {
          code: 'LOGOUT_FAILED',
          message: 'Failed to logout',
          details: error,
        },
      };
    }
  }
  async register(credentials) {
    try {
      // Use Supabase Auth for registration
      const result = await authHelpers.signUp(credentials.email, credentials.password, {
        name: credentials.name,
        role: credentials.role || 'user',
      });

      if (!result.success) {
        throw new Error(result.error || 'Registration failed');
      }

      const { data } = result;
      if (data.session) {
        this.setTokens({
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
        });
        await this.fetchAndSetUserProfile();
      }

      this.eventBus.emit('auth_register', { email: credentials.email }, 'AuthService');
      return { success: true, data: data.session };
    } catch (error) {
      this.logger.error('Registration failed', error);
      return {
        success: false,
        error: {
          code: 'REGISTRATION_FAILED',
          message: 'Failed to register',
          details: error,
        },
      };
    }
  }
  async refreshToken() {
    try {
      const refreshToken = await this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });
      if (!response.ok) {
        throw new Error('Token refresh failed');
      }
      const tokens = await response.json();
      this.setTokens(tokens);
      return { success: true, data: tokens };
    } catch (error) {
      this.logger.error('Token refresh failed', error);
      return {
        success: false,
        error: {
          code: 'TOKEN_REFRESH_FAILED',
          message: 'Failed to refresh token',
          details: error,
        },
      };
    }
  }

  async changePassword(password: string) {
    try {
      // Use authHelpers to change password
      const result = await authHelpers.changePassword(password);

      if (!result.success) {
        throw new Error(result.error || 'Password change failed');
      }

      return { success: true };
    } catch (error) {
      this.logger.error('Password change failed', error);
      return {
        success: false,
        error: {
          code: 'PASSWORD_CHANGE_FAILED',
          message: 'Failed to change password',
          details: error,
        },
      };
    }
  }
  async fetchAndSetUserProfile() {
    try {
      // Use Supabase Auth to get current user
      const user = await authHelpers.getCurrentUser();
      if (!user) {
        throw new Error('No authenticated user found');
      }

      // Convert Supabase user to our profile format
      const profile = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email,
        role: user.user_metadata?.role || 'user',
        created_at: user.created_at,
      };

      this.stateManager.setState(['auth', 'user'], profile);
    } catch (error) {
      this.logger.error('Failed to fetch user profile', error);
      throw error;
    }
  }
  async isAuthenticated() {
    // Use Supabase Auth for proper session validation
    return await authHelpers.isAuthenticated();
  }
  getCurrentUser() {
    return this.stateManager.getState(['auth', 'user']);
  }
  setTokens(tokens) {
    // Avoid persisting sensitive tokens in app-managed localStorage.
    this.refreshTokenCache = tokens?.refreshToken || null;
  }
  clearTokens() {
    this.refreshTokenCache = null;
  }
  async getAccessToken() {
    return await authHelpers.getAccessToken();
  }
  async getRefreshToken() {
    if (this.refreshTokenCache) {
      return this.refreshTokenCache;
    }
    const session = await authHelpers.getCurrentSession();
    const refreshToken = session?.refresh_token || null;
    if (refreshToken) {
      this.refreshTokenCache = refreshToken;
    }
    return refreshToken;
  }
  subscribeToAuthState(callback) {
    return this.stateManager.subscribe(['auth', 'user'], callback);
  }
}
