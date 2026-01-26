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
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Sign in failed');
      }

      const user: User = {
        id: data.user.id,
        email: data.user.email,
        user_metadata: {
          name: data.user.name,
          role: data.user.role || 'user',
        },
        created_at: data.user.createdAt || new Date().toISOString(),
      };

      const session: Session = {
        access_token: data.accessToken,
        refresh_token: data.refreshToken,
        user: user,
      };

      // Store in localStorage
      localStorage.setItem('auth_session', JSON.stringify(session));
      localStorage.setItem('auth_token', session.access_token);

      return {
        success: true,
        data: {
          session: session,
          user: user,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Sign in failed',
      };
    }
  },

  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string, metadata?: any): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name: metadata?.name || email.split('@')[0],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Sign up failed');
      }

      const user: User = {
        id: data.user.id,
        email: data.user.email,
        user_metadata: {
          name: data.user.name,
          role: 'user',
        },
        created_at: new Date().toISOString(),
      };

      const session: Session = {
        access_token: data.access_token,
        user: user,
      };

      // Store in localStorage
      localStorage.setItem('auth_session', JSON.stringify(session));
      localStorage.setItem('auth_token', session.access_token);

      return {
        success: true,
        data: {
          session: session,
          user: user,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Sign up failed',
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
  },

  /**
   * Change password (mock implementation)
   */
  async changePassword(password: string): Promise<{ success: boolean; error?: string }> {
    try {
      // In a real implementation, this would call the API
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to change password' };
    }
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
