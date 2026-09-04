import type { User as SupabaseUser } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { apiService } from '../services/api';

export interface User {
  id: string;
  email: string;
  name: string;
  photoURL?: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  isConfigured: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const syncApiToken = async () => {
  if (!isSupabaseConfigured) {
    apiService.clearToken();
    return;
  }
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.access_token) {
    // The backend does not accept raw Supabase tokens — every guarded route
    // verifies against this app's own JWT_SECRET. Exchange first (POST
    // /api/auth/supabase) for a platform token, or every API call will 401
    // even though Supabase considers the user signed in.
    try {
      const exchanged = await apiService.exchangeSupabaseToken(session.access_token);
      if (exchanged?.accessToken) {
        apiService.setToken(exchanged.accessToken);
        return;
      }
    } catch (err) {
      console.error('Failed to exchange Supabase token for platform token:', err);
    }
    apiService.clearToken();
  } else {
    apiService.clearToken();
  }
};

// Registered on apiService so a 401 caused by the platform token's 15-minute
// expiry (Supabase sessions live much longer) can re-exchange without forcing
// a full re-login.
const refreshPlatformToken = async (): Promise<string | null> => {
  if (!isSupabaseConfigured) return null;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return null;
  const exchanged = await apiService.exchangeSupabaseToken(session.access_token);
  return exchanged?.accessToken ?? null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const mapUser = (supabaseUser: SupabaseUser): User => ({
  id: supabaseUser.id,
  email: supabaseUser.email || '',
  name: supabaseUser.user_metadata?.full_name || supabaseUser.email || '',
  photoURL: supabaseUser.user_metadata?.avatar_url || undefined,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      apiService.clearToken();
      setLoading(false);
      return;
    }

    apiService.setTokenRefresher(refreshPlatformToken);

    let cancelled = false;
    const timeout = window.setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 4000);

    const initAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (cancelled) return;
        if (session?.user) {
          setUser(mapUser(session.user));
        }
        await syncApiToken();
      } catch (err: unknown) {
        console.error('Error initializing auth:', err);
      } finally {
        if (!cancelled) setLoading(false);
        window.clearTimeout(timeout);
      }
    };

    void initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(mapUser(session.user));
      } else {
        setUser(null);
      }
      void syncApiToken();
      setLoading(false);
    });

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      subscription.unsubscribe();
      apiService.setTokenRefresher(null);
    };
  }, []);

  const loginWithGoogle = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (authError) throw authError;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signOut();
      if (authError) throw authError;
      setUser(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    error,
    isConfigured: isSupabaseConfigured,
    loginWithGoogle,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
