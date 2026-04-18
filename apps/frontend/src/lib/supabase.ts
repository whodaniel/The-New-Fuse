import { createClient, type Session, type User } from '@supabase/supabase-js';

export interface AuthResponse {
  success: boolean;
  data?: {
    session: Session | null;
    user: User | null;
  };
  error?: string;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || '';

const isValidSupabaseUrl = supabaseUrl.length > 12 && supabaseUrl.includes('.supabase.co');
const isValidSupabaseKey = supabaseAnonKey.length > 50 && supabaseAnonKey.startsWith('eyJ');

export const hasSupabaseConfig = isValidSupabaseUrl && isValidSupabaseKey;

if (!hasSupabaseConfig) {
  console.warn(
    '[Auth] Supabase not configured or invalid config. Falling back to API auth.'
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
