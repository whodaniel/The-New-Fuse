import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AuthContext, { User } from '../AuthContext';
import { API_BASE, API_ENDPOINTS } from '../config/api';
import { hasSupabaseConfig, supabase } from '../lib/supabase';
import {
  clearTokens,
  getAccessToken,
  persistAuthPayload,
  persistTokens,
  silentRefreshAccessToken,
  stashDeepLinkNext,
} from '../services/authSession';
import { bootstrapUserSessionFactors } from '../services/userSessionFactors';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

import { AuthTransientError, authRequest, withAuthDeadline } from '../services/authRequest';
export { AuthTransientError } from '../services/authRequest';

// ---------------------------------------------------------------------------
// Token helpers
// ---------------------------------------------------------------------------

const getAuthToken = (): string | null => getAccessToken();
const setAuthToken = (token: string) => persistTokens({ accessToken: token });
const clearAuthToken = () => clearTokens();

// ---------------------------------------------------------------------------
// Fetch with timeout – never waits longer than REQUEST_TIMEOUT_MS
// ---------------------------------------------------------------------------

const apiFetch = authRequest;

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
  const [sessionUnavailable, setSessionUnavailable] = useState(false);
  const [bootstrapAttempt, setBootstrapAttempt] = useState(0);
  const retrySession = useCallback(() => setBootstrapAttempt((attempt) => attempt + 1), []);

  // Spine personalization factors as soon as identity is known (AI Assist / flywheels).
  useEffect(() => {
    if (user?.id) bootstrapUserSessionFactors(user);
  }, [user]);

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
      if (res.status === 401) return null;
      if (!res.ok)
        throw new AuthTransientError(
          `Session verification unavailable (${res.status})`,
          res.status
        );
      const raw = await res.json();
      const data = raw?.data ?? raw;
      const rawUser = data?.user ?? data;
      if (!rawUser?.id && !rawUser?.sub) {
        throw new AuthTransientError('Session verification returned an invalid response');
      }
      console.log('[Auth] fetchMe – user validated');
      return toUser(rawUser);
    } catch (err: any) {
      throw err instanceof AuthTransientError
        ? err
        : new AuthTransientError('Unable to verify your session. Please retry.');
    }
  }, []);

  const inFlightExchangeRef = useRef<Map<string, Promise<{ user: User; token: string } | null>>>(
    new Map()
  );

  /** POST a Supabase access_token to the backend to get an app token */
  const exchangeSupabaseToken = useCallback(
    async (supabaseAccessToken: string): Promise<{ user: User; token: string } | null> => {
      if (!supabaseAccessToken) return null;

      const existingPromise = inFlightExchangeRef.current.get(supabaseAccessToken);
      if (existingPromise) {
        return existingPromise;
      }

      const promise = (async () => {
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
            if (res.status === 429) {
              throw new AuthTransientError(
                'Too many authentication requests. Please wait a moment and try again.',
                429
              );
            }
            const msg =
              extractError(payload) ?? extractError(rawPayload as any) ?? `HTTP ${res.status}`;
            console.warn('[Auth] exchangeSupabaseToken failed:', msg);
            // If explicit 401, check if Supabase token is truly rejected
            if (res.status === 401) {
              return null;
            }
            throw new AuthTransientError(msg, res.status);
          }

          const appToken = extractToken(payload);
          if (!appToken) {
            throw new AuthTransientError('Session exchange returned an invalid response');
          }

          setAuthToken(appToken);
          persistAuthPayload(payload as Record<string, unknown>);

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
          throw err instanceof AuthTransientError
            ? err
            : new AuthTransientError('Unable to exchange your session. Please retry.');
        } finally {
          inFlightExchangeRef.current.delete(supabaseAccessToken);
        }
      })();

      inFlightExchangeRef.current.set(supabaseAccessToken, promise);
      return promise;
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

      persistAuthPayload(payload as Record<string, unknown>);
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
            console.warn(
              `[Auth] Supabase sign-in failed (${signInErr.message}), falling back to direct API`
            );
          } else {
            const accessToken = data?.session?.access_token;
            if (!accessToken) throw new Error('Supabase did not return an access token');

            const result = await exchangeSupabaseToken(accessToken);
            if (result) {
              setUser(result.user);
              return { method: 'supabase' as const, user: result.user };
            }

            console.warn('[Auth] Supabase token exchange failed, falling back to direct API');
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
        // Fall back to backend passport Google route when Supabase OAuth is unavailable.
        const next = encodeURIComponent(
          typeof window !== 'undefined'
            ? `${window.location.origin}/auth/callback`
            : '/auth/callback'
        );
        window.location.href = `${API_ENDPOINTS.AUTH.GOOGLE}?redirect=${next}`;
        return { method: 'google_redirect' as const };
      }

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          // App logout leaves Google's session active; always let users choose an account.
          queryParams: { prompt: 'select_account' },
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

  const signInWithGitHub = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      if (!hasSupabaseConfig || !supabase) {
        // Fall back to backend passport GitHub route when Supabase OAuth is unavailable.
        const next = encodeURIComponent(
          typeof window !== 'undefined'
            ? `${window.location.origin}/auth/callback`
            : '/auth/callback'
        );
        window.location.href = `${API_BASE}/auth/github?redirect=${next}`;
        return { method: 'github_redirect' as const };
      }

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'read:user user:email',
        },
      });

      if (oauthError) throw new Error(oauthError.message || 'GitHub sign-in failed');
      return { method: 'github_redirect' as const };
    } catch (err: any) {
      setError(err?.message ?? 'GitHub sign-in failed');
      setIsLoading(false);
      throw err;
    }
  }, []);

  const signInWithMagicLink = useCallback(async (email: string, nextPath?: string) => {
    setError(null);
    setIsLoading(true);

    try {
      if (!hasSupabaseConfig || !supabase) {
        throw new Error('Supabase is not configured');
      }

      if (nextPath) stashDeepLinkNext(nextPath);
      const redirectTo = new URL(`${window.location.origin}/auth/callback`);
      if (nextPath?.startsWith('/')) redirectTo.searchParams.set('next', nextPath);

      const { error: otpErr } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo.toString() },
      });

      if (otpErr) throw new Error(otpErr.message || 'Failed to send magic link');
      return { success: true };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    if (!hasSupabaseConfig || !supabase) throw new Error('Password reset is unavailable');

    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (resetErr) throw new Error(resetErr.message || 'Failed to send reset email');
    return { success: true };
  }, []);

  const resetPassword = useCallback(async (_token: string, password: string) => {
    if (!hasSupabaseConfig || !supabase) throw new Error('Password reset is unavailable');

    const { error: updateErr } = await supabase.auth.updateUser({ password });
    if (updateErr) throw new Error(updateErr.message || 'Failed to reset password');
    return { success: true };
  }, []);

  const handleSSOCallback = useCallback(
    async (_provider: string, _code: string, _state?: string | null) => {
      if (!hasSupabaseConfig || !supabase) {
        throw new Error('SSO authentication callback requires configured Supabase client');
      }

      const url = typeof window !== 'undefined' ? new URL(window.location.href) : null;
      const code = url?.searchParams.get('code') ?? _code ?? '';
      let accessToken = '';

      // detectSessionInUrl may already have exchanged the PKCE code during
      // client init. Prefer an existing session before attempting a second exchange.
      {
        const { data: existing } = await supabase.auth.getSession();
        accessToken = existing?.session?.access_token ?? '';
      }

      if (!accessToken && code) {
        const { data, error: codeErr } = await supabase.auth.exchangeCodeForSession(code);
        if (codeErr) {
          // Code may already have been consumed by detectSessionInUrl — re-check session.
          const { data: afterErr } = await supabase.auth.getSession();
          accessToken = afterErr?.session?.access_token ?? '';
          if (!accessToken) {
            throw new Error(codeErr.message || 'Failed to exchange OAuth code');
          }
        } else {
          accessToken = data?.session?.access_token ?? '';
        }
      } else if (!accessToken && url) {
        const hashParams = new URLSearchParams(
          url.hash.startsWith('#') ? url.hash.slice(1) : url.hash
        );
        accessToken = hashParams.get('access_token') ?? '';
      }

      // Poll for session if not yet available (race with detectSessionInUrl)
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

      const result = await exchangeSupabaseToken(accessToken);
      if (result) {
        setUser(result.user);
        return { method: 'sso' as const, user: result.user };
      }

      throw new Error('Token exchange failed after OAuth');
    },
    [exchangeSupabaseToken]
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    clearAuthToken();
    setSessionUnavailable(false);
    setUser(null);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem('__tnf_require_auth_redirect__');
        sessionStorage.removeItem('__tnf_login_redirect_count__');
        sessionStorage.removeItem('tnf.auth.session.v1');
      } catch {
        /* ignore */
      }
    }
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

    const slowLoadingTimer = setTimeout(() => {
      if (!cancelled) setIsSlowLoading(true);
    }, 5000);

    const bootstrap = async () => {
      setIsLoading(true);
      setIsSlowLoading(false);
      setSessionUnavailable(false);
      setError(null);
      try {
        const storedToken = getAuthToken();
        if (storedToken) {
          let validated = await fetchMe(storedToken);
          if (cancelled) return;
          if (!validated) {
            const refreshed = await silentRefreshAccessToken();
            if (cancelled) return;
            if (refreshed) validated = await fetchMe(refreshed);
          }
          if (cancelled) return;
          if (validated) {
            setUser(validated);
            return;
          }
          clearAuthToken(); // fetchMe returns null only for a confirmed 401.
        }
        if (hasSupabaseConfig && supabase) {
          const { data, error: sessionError } = await withAuthDeadline(() =>
            supabase!.auth.getSession()
          );
          if (cancelled) return;
          if (sessionError)
            throw new AuthTransientError('Unable to read your session. Please retry.');
          if (data.session?.access_token) {
            const result = await exchangeSupabaseToken(data.session.access_token);
            if (cancelled) return;
            if (result) {
              setUser(result.user);
              return;
            }
            // Preserve the provider session, but do not mount TNF queries until exchange succeeds.
            throw new AuthTransientError(
              'Your session could not be connected to TNF. Please retry or sign in again.'
            );
          }
        }
        if (!cancelled) setUser(null);
      } catch (err) {
        if (!cancelled) {
          setSessionUnavailable(true);
          setError(
            err instanceof Error ? err.message : 'Unable to verify your session. Please retry.'
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          clearTimeout(slowLoadingTimer);
        }
      }
    };
    void bootstrap();
    return () => {
      cancelled = true;
      clearTimeout(slowLoadingTimer);
    };
  }, [fetchMe, exchangeSupabaseToken, bootstrapAttempt]);

  // -----------------------------------------------------------------------
  // Provide context
  // -----------------------------------------------------------------------

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      isSlowLoading,
      sessionUnavailable,
      retrySession,
      login,
      register,
      signInWithGoogle,
      signInWithGitHub,
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
      isSlowLoading,
      sessionUnavailable,
      retrySession,
      login,
      register,
      signInWithGoogle,
      signInWithGitHub,
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
