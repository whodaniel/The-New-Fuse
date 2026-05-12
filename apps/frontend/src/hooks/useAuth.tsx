import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AuthContext, { User } from '../AuthContext';
import { API_ENDPOINTS } from '../config/api';
import { hasSupabaseConfig, supabase } from '../lib/supabase';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AUTH_TOKEN_KEY = 'auth_token';
const REQUEST_TIMEOUT_MS = 15_000;

// ---------------------------------------------------------------------------
// Token helpers
// ---------------------------------------------------------------------------

const getAuthToken = (): string | null => localStorage.getItem(AUTH_TOKEN_KEY);
const setAuthToken = (token: string) => localStorage.setItem(AUTH_TOKEN_KEY, token);
const clearAuthToken = () => localStorage.removeItem(AUTH_TOKEN_KEY);

// ---------------------------------------------------------------------------
// Fetch with timeout – never waits longer than REQUEST_TIMEOUT_MS
// ---------------------------------------------------------------------------

async function apiFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Payload normalisation
// ---------------------------------------------------------------------------

interface BackendPayload {
  accessToken?: string;
  access_token?: string;
  token?: string;
  user?: Record<string, unknown>;
  message?: string | string[];
  error?: string;
  requiresEmailVerification?: boolean;
  data?: BackendPayload;
}

/** Unwrap NestJS `{ data: { ... } }` envelope */
function unwrap(raw: unknown): BackendPayload {
  if (raw && typeof raw === 'object' && 'data' in raw && typeof (raw as any).data === 'object') {
    return (raw as any).data as BackendPayload;
  }
  return (raw ?? {}) as BackendPayload;
}

/** Pull an access token from any known field name */
function extractToken(p: BackendPayload): string | null {
  return p.accessToken ?? p.access_token ?? p.token ?? null;
}

/** Pull a human-readable error string */
function extractError(p: BackendPayload): string | null {
  if (typeof p.message === 'string' && p.message.trim()) return p.message;
  if (Array.isArray(p.message) && p.message.length) return p.message.filter(Boolean).join(', ');
  if (typeof p.error === 'string' && p.error.trim()) return p.error;
  return null;
}

/** Normalise any backend user shape into our `User` type */
function toUser(raw: any, fallbackEmail = ''): User {
  return {
    id: String(raw?.id ?? raw?.sub ?? ''),
    email: String(raw?.email ?? fallbackEmail),
    name: String(raw?.name ?? raw?.email ?? fallbackEmail ?? 'User'),
    role: String(raw?.role ?? 'USER'),
    roles: Array.isArray(raw?.roles) ? raw.roles : [raw?.role ?? 'USER'],
    agencyId: raw?.agencyId,
    tenantId: raw?.tenantId,
    photoURL: raw?.photoURL,
    firstName: raw?.firstName,
    lastName: raw?.lastName,
  };
}

// ---------------------------------------------------------------------------
// AuthProvider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSlowLoading, setIsSlowLoading] = useState(false);

  // -----------------------------------------------------------------------
  // Core API helpers
  // -----------------------------------------------------------------------

  /** GET /auth/me with a bearer token → User | null */
  const fetchMe = useCallback(async (token: string): Promise<User | null> => {
    console.log('[Auth] fetchMe – checking token validity');
    try {
      const res = await apiFetch(API_ENDPOINTS.AUTH.ME, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      if (!res.ok) {
        console.warn(`[Auth] fetchMe returned ${res.status}`);
        return null;
      }
      const raw = await res.json();
      const data = raw?.data ?? raw;
      const rawUser = data?.user ?? data;
      if (!rawUser?.id && !rawUser?.sub) {
        console.warn('[Auth] fetchMe – response has no user id');
        return null;
      }
      console.log('[Auth] fetchMe – user validated');
      return toUser(rawUser);
    } catch (err: any) {
      console.warn('[Auth] fetchMe failed:', err.name === 'AbortError' ? 'TIMEOUT' : err.message);
      return null;
    }
  }, []);

  /** POST a Supabase access_token to the backend to get an app token */
  const exchangeSupabaseToken = useCallback(
    async (supabaseAccessToken: string): Promise<{ user: User; token: string } | null> => {
      console.log('[Auth] exchangeSupabaseToken – exchanging with backend');
      try {
        const res = await apiFetch(API_ENDPOINTS.AUTH.SUPABASE_EXCHANGE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: supabaseAccessToken }),
        });
        const rawPayload = await res.json();
        const payload = unwrap(rawPayload);

        if (!res.ok) {
          const msg =
            extractError(payload) ?? extractError(rawPayload as any) ?? `HTTP ${res.status}`;
          console.warn('[Auth] exchangeSupabaseToken failed:', msg);
          return null;
        }

        const appToken = extractToken(payload);
        if (!appToken) {
          console.warn('[Auth] exchangeSupabaseToken – no token in response');
          return null;
        }

        setAuthToken(appToken);

        if (payload.user) {
          const u = toUser(payload.user);
          console.log('[Auth] exchangeSupabaseToken – success (user in payload)');
          return { user: u, token: appToken };
        }

        const u = await fetchMe(appToken);
        if (u) {
          console.log('[Auth] exchangeSupabaseToken – success (fetched user)');
          return { user: u, token: appToken };
        }

        console.warn('[Auth] exchangeSupabaseToken – got token but fetchMe failed');
        return null;
      } catch (err: any) {
        console.warn(
          '[Auth] exchangeSupabaseToken error:',
          err.name === 'AbortError' ? 'TIMEOUT' : err.message
        );
        return null;
      }
    },
    [fetchMe]
  );

  /** Generic POST to a backend auth endpoint (login/register) */
  const postAuth = useCallback(
    async (
      url: string,
      body: Record<string, unknown>
    ): Promise<{ user: User; token: string; requiresEmailVerification?: boolean }> => {
      console.log(`[Auth] postAuth → ${url}`);
      const res = await apiFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const rawPayload = await res.json();
      const payload = unwrap(rawPayload);

      if (!res.ok) {
        const msg = extractError(payload) ?? extractError(rawPayload as any) ?? 'Request failed';
        throw new Error(msg);
      }

      // Check for email verification requirement
      if (payload.requiresEmailVerification) {
        return {
          user: null as any,
          token: '',
          requiresEmailVerification: true,
        };
      }

      const appToken = extractToken(payload);
      if (!appToken) {
        throw new Error('Server did not return an access token');
      }

      setAuthToken(appToken);

      const rawUser = payload.user;
      if (rawUser) {
        const u = toUser(rawUser);
        return { user: u, token: appToken };
      }

      const u = await fetchMe(appToken);
      if (!u) throw new Error('Got a token but failed to fetch user profile');
      return { user: u, token: appToken };
    },
    [fetchMe]
  );

  // -----------------------------------------------------------------------
  // Public auth methods
  // -----------------------------------------------------------------------

  const login = useCallback(
    async (emailOrToken: string, password?: string, options?: { cfTurnstileToken?: string }) => {
      setError(null);
      setIsLoading(true);

      try {
        // Token-only login (used by SSO callbacks)
        if (!password) {
          setAuthToken(emailOrToken);
          const details = await fetchMe(emailOrToken);
          if (!details) {
            clearAuthToken();
            throw new Error('Token was rejected by the API');
          }
          setUser(details);
          return { method: 'token' as const, user: details };
        }

        // Strategy 1: Supabase sign-in → exchange
        if (hasSupabaseConfig && supabase) {
          console.log('[Auth] login – using Supabase');
          const { data, error: signInErr } = await supabase.auth.signInWithPassword({
            email: emailOrToken,
            password,
          });

          if (signInErr) {
            // If Supabase itself has a config issue, fall through to direct API
            const msg = signInErr.message?.toLowerCase() ?? '';
            if (msg.includes('invalid api key') || msg.includes('failed to fetch')) {
              console.warn('[Auth] Supabase unavailable, falling back to direct API');
            } else {
              throw new Error(signInErr.message || 'Failed to login');
            }
          } else {
            const accessToken = data?.session?.access_token;
            if (!accessToken) throw new Error('Supabase did not return an access token');

            const result = await exchangeSupabaseToken(accessToken);
            if (result) {
              setUser(result.user);
              return { method: 'supabase' as const, user: result.user };
            }
            throw new Error('Supabase token exchange failed');
          }
        }

        // Strategy 2: Direct API login
        console.log('[Auth] login – using direct API');
        const result = await postAuth(API_ENDPOINTS.AUTH.LOGIN, {
          email: emailOrToken,
          password,
          cfTurnstileToken: options?.cfTurnstileToken,
        });
        setUser(result.user);
        return { method: 'password' as const, user: result.user };
      } catch (err: any) {
        setError(err?.message ?? 'Failed to login');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchMe, exchangeSupabaseToken, postAuth]
  );

  const register = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      options?: { cfTurnstileToken?: string; inviteCode?: string }
    ) => {
      setError(null);
      setIsLoading(true);

      try {
        // Strategy 1: Supabase sign-up → exchange
        if (hasSupabaseConfig && supabase) {
          console.log('[Auth] register – using Supabase');
          const { data, error: signUpErr } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { name } },
          });

          if (signUpErr) {
            const msg = signUpErr.message?.toLowerCase() ?? '';
            if (msg.includes('invalid api key') || msg.includes('failed to fetch')) {
              console.warn('[Auth] Supabase unavailable, falling back to direct API');
            } else {
              throw new Error(signUpErr.message || 'Failed to register');
            }
          } else {
            const accessToken = data?.session?.access_token;
            if (!accessToken) {
              // Email verification required – Supabase doesn't give a session
              return {
                method: 'supabase_signup_pending' as const,
                requiresEmailVerification: true,
                message: 'Check your email to verify your account, then sign in.',
              };
            }

            const result = await exchangeSupabaseToken(accessToken);
            if (result) {
              setUser(result.user);
              return { method: 'supabase' as const, user: result.user };
            }
            throw new Error('Supabase token exchange failed');
          }
        }

        // Strategy 2: Direct API registration
        console.log('[Auth] register – using direct API');
        const result = await postAuth(API_ENDPOINTS.AUTH.REGISTER, {
          name,
          email,
          password,
          inviteCode: options?.inviteCode,
          cfTurnstileToken: options?.cfTurnstileToken,
        });

        if (result.requiresEmailVerification) {
          return {
            method: 'register_pending' as const,
            requiresEmailVerification: true,
            message: 'Check your email to verify your account, then sign in.',
          };
        }

        setUser(result.user);
        return { method: 'register' as const, user: result.user };
      } catch (err: any) {
        setError(err?.message ?? 'Failed to register');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [exchangeSupabaseToken, postAuth]
  );

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      if (!hasSupabaseConfig || !supabase) {
        throw new Error('Supabase OAuth is not configured');
      }

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo:
            window.location.hostname === 'localhost'
              ? `${window.location.origin}/auth/callback`
              : `${window.location.origin}/auth/callback`,
        },
      });

      if (oauthError) throw new Error(oauthError.message || 'Google sign-in failed');
      return { method: 'google_redirect' as const };
    } catch (err: any) {
      setError(err?.message ?? 'Google sign-in failed');
      setIsLoading(false);
      throw err;
    }
  }, []);

  const signInWithMagicLink = useCallback(async (email: string) => {
    setError(null);
    setIsLoading(true);

    try {
      if (!hasSupabaseConfig || !supabase) {
        throw new Error('Supabase is not configured');
      }

      const { error: otpErr } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });

      if (otpErr) throw new Error(otpErr.message || 'Failed to send magic link');
      return { success: true };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    if (!hasSupabaseConfig || !supabase) throw new Error('Supabase is not configured');

    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (resetErr) throw new Error(resetErr.message || 'Failed to send reset email');
    return { success: true };
  }, []);

  const resetPassword = useCallback(async (_token: string, password: string) => {
    if (!hasSupabaseConfig || !supabase) throw new Error('Supabase is not configured');

    const { error: updateErr } = await supabase.auth.updateUser({ password });
    if (updateErr) throw new Error(updateErr.message || 'Failed to reset password');
    return { success: true };
  }, []);

  const handleSSOCallback = useCallback(
    async (_provider: string, _code: string, _state?: string | null) => {
      if (!hasSupabaseConfig || !supabase) throw new Error('Supabase is not configured');

      const url = typeof window !== 'undefined' ? new URL(window.location.href) : null;
      const code = url?.searchParams.get('code') ?? _code ?? '';
      let accessToken = '';

      if (code) {
        const { data, error: codeErr } = await supabase.auth.exchangeCodeForSession(code);
        if (codeErr) throw new Error(codeErr.message || 'Failed to exchange OAuth code');
        accessToken = data?.session?.access_token ?? '';
      } else if (url) {
        const hashParams = new URLSearchParams(
          url.hash.startsWith('#') ? url.hash.slice(1) : url.hash
        );
        accessToken = hashParams.get('access_token') ?? '';
      }

      // Poll for session if not yet available
      if (!accessToken) {
        for (let i = 0; i < 10; i++) {
          const { data } = await supabase.auth.getSession();
          if (data?.session?.access_token) {
            accessToken = data.session.access_token;
            break;
          }
          await new Promise((r) => setTimeout(r, 250));
        }
      }

      if (!accessToken) throw new Error('No session after OAuth callback');

      const result = await exchangeSupabaseToken(accessToken);
      if (!result) throw new Error('Token exchange failed after OAuth');
      setUser(result.user);
      return { method: 'sso' as const, user: result.user };
    },
    [exchangeSupabaseToken]
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    clearAuthToken();
    setUser(null);
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        /* ignore */
      }
    }
    setIsLoading(false);
  }, []);

  // -----------------------------------------------------------------------
  // Bootstrap – runs ONCE on mount
  // -----------------------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    // Safety timeout to prevent infinite spinner
    const slowLoadingTimer = setTimeout(() => {
      if (isLoading && !cancelled) {
        console.warn('[Auth] Bootstrap is taking a long time...');
        setIsSlowLoading(true);
      }
    }, 5000);

    const forceStopLoadingTimer = setTimeout(() => {
      if (isLoading && !cancelled) {
        console.error('[Auth] Bootstrap timed out after 15 seconds. Forcing isLoading to false.');
        setIsLoading(false);
      }
    }, 15000);

    const bootstrap = async () => {
      console.log('[Auth] ▶ Bootstrap starting');
      setIsLoading(true);

      try {
        // 1. Check for a stored app token
        const storedToken = getAuthToken();
        if (storedToken) {
          console.log('[Auth] Found stored token, validating…');
          const u = await fetchMe(storedToken);
          if (cancelled) return;
          if (u?.id) {
            console.log('[Auth] ✓ Stored token is valid');
            setUser(u);
            setIsLoading(false);
            return;
          }
          console.log('[Auth] ✗ Stored token is invalid, clearing');
          clearAuthToken();
        }

        // 2. Check for a Supabase session
        if (hasSupabaseConfig && supabase) {
          console.log('[Auth] Checking Supabase session…');
          try {
            const { data, error: sessErr } = await supabase.auth.getSession();
            if (!sessErr && data?.session?.access_token) {
              console.log('[Auth] Supabase session found, exchanging…');
              const result = await exchangeSupabaseToken(data.session.access_token);
              if (cancelled) return;
              if (result) {
                console.log('[Auth] ✓ Supabase session exchange succeeded');
                setUser(result.user);
                setIsLoading(false);
                return;
              }
              console.log(
                '[Auth] ✗ Supabase exchange failed — signing out stale session to prevent redirect loop'
              );
              try {
                await supabase.auth.signOut();
              } catch {
                /* ignore */
              }
              clearAuthToken();
            } else {
              console.log('[Auth] No active Supabase session');
            }
          } catch (err: any) {
            console.warn('[Auth] Supabase session check failed:', err.message);
          }
        }

        // 3. Not authenticated
        if (!cancelled) {
          console.log('[Auth] ✓ Bootstrap complete – no active session');
          setUser(null);
        }
      } catch (err) {
        console.error('[Auth] Bootstrap error:', err);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          clearTimeout(slowLoadingTimer);
          clearTimeout(forceStopLoadingTimer);
        }
      }
    };

    bootstrap();
    return () => {
      cancelled = true;
      clearTimeout(slowLoadingTimer);
      clearTimeout(forceStopLoadingTimer);
    };
  }, [fetchMe, exchangeSupabaseToken]);

  // -----------------------------------------------------------------------
  // Provide context
  // -----------------------------------------------------------------------

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      isSlowLoading,
      login,
      register,
      signInWithGoogle,
      signInWithMagicLink,
      forgotPassword,
      resetPassword,
      handleSSOCallback,
      logout,
      error,
    }),
    [
      user,
      isLoading,
      login,
      register,
      signInWithGoogle,
      signInWithMagicLink,
      forgotPassword,
      resetPassword,
      handleSSOCallback,
      logout,
      error,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
