import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config';
import type { AuthResponse, LoginCredentials, RegisterCredentials, User } from '../types/auth';

const TOKEN_KEY = 'ai_arcade_token';
const USER_KEY = 'ai_arcade_user';

export class AuthService {
  private apiUrl: string;
  private supabase: SupabaseClient | null;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl || config.apiUrl;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey) {
      this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    } else {
      console.warn('[AuthService] Supabase credentials missing. Auth will be disabled.');
      this.supabase = null;
    }
  }

  private getStorage(): Storage | null {
    if (typeof window !== 'undefined') {
      return window.localStorage;
    }
    return null;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    if (!this.supabase) {
      return { success: false, message: 'Auth is not configured.' };
    }
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) throw error;

      if (data.user && data.session) {
        const user = this.supabaseUserToUser(data.user);
        const token = data.session.access_token;
        this.setSession(token, user);
        return { success: true, user, token };
      }

      throw new Error('Login failed: No session returned');
    } catch (error: any) {
      console.error('Supabase login error:', error);
      return {
        success: false,
        message: error.message || 'Authentication failed. Please try again.',
      };
    }
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    if (!this.supabase) {
      return { success: false, message: 'Auth is not configured.' };
    }
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            username: credentials.username,
          },
        },
      });

      if (error) throw error;

      if (data.user && data.session) {
        const user = this.supabaseUserToUser(data.user);
        const token = data.session.access_token;
        this.setSession(token, user);
        return { success: true, user, token };
      }

      return {
        success: true,
        user: data.user ? this.supabaseUserToUser(data.user) : (null as any),
        token: '',
        message: 'Registration successful. Please check your email for verification.',
      };
    } catch (error: any) {
      console.error('Supabase register error:', error);
      return {
        success: false,
        message: error.message || 'Registration failed. Please try again.',
      };
    }
  }

  async logout(): Promise<void> {
    try {
      if (this.supabase) {
        await this.supabase.auth.signOut();
      }
    } catch (error) {
      console.error('Supabase logout error:', error);
    } finally {
      this.clearSession();
    }
  }

  async getCurrentUser(): Promise<User | null> {
    const storage = this.getStorage();
    if (!storage) return null;

    const cachedUser = storage.getItem(USER_KEY);
    if (cachedUser) {
      return JSON.parse(cachedUser);
    }

    if (!this.supabase) {
      return null;
    }

    try {
      const {
        data: { user },
        error,
      } = await this.supabase.auth.getUser();
      if (error) throw error;

      if (user) {
        const tnfUser = this.supabaseUserToUser(user);
        storage.setItem(USER_KEY, JSON.stringify(tnfUser));
        return tnfUser;
      }
    } catch (error) {
      console.error('Get current user error:', error);
    }

    return null;
  }

  async updateTokens(amount: number): Promise<User | null> {
    // This typically goes through your backend API to update credits securely
    try {
      const response = await fetch(`${this.apiUrl}/user/tokens`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ amount }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          const storage = this.getStorage();
          if (storage) {
            storage.setItem(USER_KEY, JSON.stringify(data.user));
          }
          return data.user;
        }
      }
    } catch (error) {
      console.error('Update tokens error:', error);
    }
    return null;
  }

  getToken(): string | null {
    const storage = this.getStorage();
    return storage ? storage.getItem(TOKEN_KEY) : null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private supabaseUserToUser(supabaseUser: any): User {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      username: supabaseUser.user_metadata?.username || supabaseUser.email?.split('@')[0] || 'User',
      tokens: supabaseUser.user_metadata?.tokens || 500,
      subscriptions: [],
      createdAt: supabaseUser.created_at,
    };
  }

  private setSession(token: string, user: User): void {
    const storage = this.getStorage();
    if (storage) {
      storage.setItem(TOKEN_KEY, token);
      storage.setItem(USER_KEY, JSON.stringify(user));
    }
  }

  private clearSession(): void {
    const storage = this.getStorage();
    if (storage) {
      storage.removeItem(TOKEN_KEY);
      storage.removeItem(USER_KEY);
    }
  }

  private getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }
}
