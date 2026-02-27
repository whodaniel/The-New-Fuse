import { createClient, type Session, type User } from '@supabase/supabase-js';

export interface AuthResponse {
  success: boolean;
  data?: {
    session: Session | null;
    user: User | null;
  };
  error?: string;
}

// Public fallback values for production domains when Docker build args are missing.
// Supabase anon keys are safe to expose in client apps by design.
const FALLBACK_SUPABASE_URL = 'https://wslydgtgindrywldatbv.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzbHlkZ3RnaW5kcnl3bGRhdGJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NjY4NTIsImV4cCI6MjA4NzU0Mjg1Mn0.5Vg04tY3XdhSuXw3HQmek4wT0Zi317n5xgKq5m9E_GI';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || FALLBACK_SUPABASE_URL).trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY).trim();

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

if (!hasSupabaseConfig) {
  console.error(
    '[Auth] Missing Supabase config. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

const requireClient = () => {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }
  return supabase;
};

export const authHelpers = {
  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const client = requireClient();
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Sign in failed' };
    }
  },

  async signUp(email: string, password: string, metadata?: Record<string, unknown>): Promise<AuthResponse> {
    try {
      const client = requireClient();
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });
      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Sign up failed' };
    }
  },

  async signOut(): Promise<AuthResponse> {
    try {
      const client = requireClient();
      const { error } = await client.auth.signOut();
      if (error) throw error;
      return { success: true, data: { session: null, user: null } };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Sign out failed' };
    }
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const client = requireClient();
      const { data, error } = await client.auth.getUser();
      if (error) throw error;
      return data.user || null;
    } catch {
      return null;
    }
  },

  async getCurrentSession(): Promise<Session | null> {
    try {
      const client = requireClient();
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      return data.session || null;
    } catch {
      return null;
    }
  },

  async isAuthenticated(): Promise<boolean> {
    const session = await this.getCurrentSession();
    return Boolean(session?.access_token);
  },

  async getAccessToken(): Promise<string | null> {
    const session = await this.getCurrentSession();
    return session?.access_token || null;
  },

  async changePassword(password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const client = requireClient();
      const { error } = await client.auth.updateUser({ password });
      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Failed to change password' };
    }
  },
};
