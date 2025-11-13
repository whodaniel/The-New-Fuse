/**
 * Simple Auth System for Railway Backend
 * This replaces Supabase authentication with a simple JWT-based auth system
 */

// Simple User type (matching what the app expects)
export interface User {
  id: string;
  email: string;
  user_metadata?: {
    name?: string;
    role?: string;
  };
  created_at?: string;
}

// Session type
export interface Session {
  access_token: string;
  refresh_token?: string;
  user: User;
}

// Auth response type
export interface AuthResponse {
  success: boolean;
  data?: {
    session: Session | null;
    user: User | null;
  };
  error?: string;
}

// Get API URL from environment
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Simple auth helpers that work with Railway backend
 */
export const authHelpers = {
  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      // For now, create a mock session for demo purposes
      // TODO: Replace with actual Railway backend API call
      const mockUser: User = {
        id: 'mock-user-id',
        email: email,
        user_metadata: {
          name: email.split('@')[0],
          role: 'user'
        },
        created_at: new Date().toISOString()
      };

      const mockSession: Session = {
        access_token: 'mock-jwt-token-' + Date.now(),
        refresh_token: 'mock-refresh-token',
        user: mockUser
      };

      // Store in localStorage
      localStorage.setItem('auth_session', JSON.stringify(mockSession));
      localStorage.setItem('auth_token', mockSession.access_token);

      return {
        success: true,
        data: {
          session: mockSession,
          user: mockUser
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Sign in failed'
      };
    }
  },

  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string, metadata?: any): Promise<AuthResponse> {
    try {
      // For now, create a mock session for demo purposes
      // TODO: Replace with actual Railway backend API call
      const mockUser: User = {
        id: 'mock-user-' + Date.now(),
        email: email,
        user_metadata: {
          name: metadata?.name || email.split('@')[0],
          role: metadata?.role || 'user'
        },
        created_at: new Date().toISOString()
      };

      const mockSession: Session = {
        access_token: 'mock-jwt-token-' + Date.now(),
        refresh_token: 'mock-refresh-token',
        user: mockUser
      };

      // Store in localStorage
      localStorage.setItem('auth_session', JSON.stringify(mockSession));
      localStorage.setItem('auth_token', mockSession.access_token);

      return {
        success: true,
        data: {
          session: mockSession,
          user: mockUser
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Sign up failed'
      };
    }
  },

  /**
   * Sign out
   */
  async signOut(): Promise<AuthResponse> {
    try {
      // Clear localStorage
      localStorage.removeItem('auth_session');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');

      return {
        success: true,
        data: {
          session: null,
          user: null
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Sign out failed'
      };
    }
  },

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const sessionStr = localStorage.getItem('auth_session');
      if (!sessionStr) return null;

      const session: Session = JSON.parse(sessionStr);
      return session.user;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  },

  /**
   * Get current session
   */
  async getCurrentSession(): Promise<Session | null> {
    try {
      const sessionStr = localStorage.getItem('auth_session');
      if (!sessionStr) return null;

      return JSON.parse(sessionStr);
    } catch (error) {
      console.error('Failed to get current session:', error);
      return null;
    }
  },

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const session = await this.getCurrentSession();
    return !!session && !!session.access_token;
  },

  /**
   * Get access token
   */
  async getAccessToken(): Promise<string | null> {
    const session = await this.getCurrentSession();
    return session?.access_token || null;
  }
};

/**
 * Mock supabase client for compatibility
 * Only implements the minimal auth functionality needed
 */
export const supabase = {
  auth: {
    onAuthStateChange(callback: (event: string, session: Session | null) => void) {
      // Listen for storage events to sync auth state across tabs
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'auth_session') {
          const session = e.newValue ? JSON.parse(e.newValue) : null;
          callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);
        }
      };

      window.addEventListener('storage', handleStorageChange);

      return {
        data: {
          subscription: {
            unsubscribe: () => {
              window.removeEventListener('storage', handleStorageChange);
            }
          }
        }
      };
    }
  }
};
