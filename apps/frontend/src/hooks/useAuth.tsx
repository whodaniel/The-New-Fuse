import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AuthContext, { User } from '../AuthContext';
import { API_ENDPOINTS } from '../config/api';
import { hasSupabaseConfig, supabase } from '../lib/supabase';

const AUTH_TOKEN_KEY = 'auth_token';

const getAuthToken = () => localStorage.getItem(AUTH_TOKEN_KEY);
const setAuthToken = (token: string) => localStorage.setItem(AUTH_TOKEN_KEY, token);
const clearAuthToken = () => localStorage.removeItem(AUTH_TOKEN_KEY);

type AuthPayload = {
  accessToken?: string;
  access_token?: string;
  refreshToken?: string;
  refresh_token?: string;
  token?: string;
  user?: unknown;
  message?: string | string[];
  error?: string;
  requiresEmailVerification?: boolean;
};

type AuthSubmitOptions = {
  cfTurnstileToken?: string;
  inviteCode?: string;
};

const unwrapPayload = (payload: any): AuthPayload => {
  if (payload && typeof payload === 'object' && payload.data && typeof payload.data === 'object') {
    return payload.data as AuthPayload;
  }
  return (payload || {}) as AuthPayload;
};

const toFrontendUser = (backendUser: any, fallbackEmail = ''): User => ({
  id: String(backendUser?.id || backendUser?.sub || ''),
  email: String(backendUser?.email || fallbackEmail),
  name: String(backendUser?.name || backendUser?.email || fallbackEmail || 'User'),
  role: String(backendUser?.role || 'USER'),
  roles: Array.isArray(backendUser?.roles) ? backendUser.roles : [backendUser?.role || 'USER'],
  agencyId: backendUser?.agencyId,
  tenantId: backendUser?.tenantId,
  photoURL: backendUser?.photoURL,
  firstName: backendUser?.firstName,
  lastName: backendUser?.lastName,
});

const getTokenFromPayload = (payload: AuthPayload): string | null =>
  payload?.accessToken || payload?.access_token || payload?.token || null;

const extractErrorMessage = (payload: any): string | null => {
  if (!payload || typeof payload !== 'object') return null;
  if (payload.data && typeof payload.data === 'object') {
    const nested = extractErrorMessage(payload.data);
    if (nested) return nested;
  }
  if (typeof payload.message === 'string' && payload.message.trim()) return payload.message;
  if (Array.isArray(payload.message) && payload.message.length > 0) {
    const joined = payload.message.filter(Boolean).join(', ');
    return joined || null;
  }
  if (typeof payload.error === 'string' && payload.error.trim()) return payload.error;
  return null;
};

const sanitizeApiBaseUrl = (rawUrl: string) => {
  const trimmed = rawUrl.replace(/\/$/, '');
  if (!trimmed) return '';
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (
    !trimmed.startsWith('http://') &&
    !trimmed.startsWith('https://') &&
    !trimmed.startsWith('/')
  ) {
    const looksLikeDomain = /^[a-z0-9.-]+\.[a-z]{2,}(:\d+)?$/i.test(trimmed);
    if (looksLikeDomain) {
      return `https://${trimmed}`;
    }
  }
  const normalized = trimmed.toLowerCase();
  if (normalized === '/api' || normalized === '/v1') return '';
  return trimmed;
};

const uniqueUrls = (urls: string[]): string[] => Array.from(new Set(urls.filter(Boolean)));

const shouldFallbackToApiAuth = (message: string | null | undefined): boolean => {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return (
    normalized.includes('invalid api key') ||
    normalized.includes('apikey') ||
    normalized.includes('network request failed') ||
    normalized.includes('failed to fetch')
  );
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiBaseUrl = sanitizeApiBaseUrl(import.meta.env.VITE_API_URL || '');
  const gatewayBaseUrl = sanitizeApiBaseUrl(import.meta.env.VITE_API_GATEWAY_URL || '');
  const gatewayPrefix = import.meta.env.PROD ? '/api/v1' : '/api';

  const inviteOnlyMode = ['1', 'true', 'yes', 'on', 'enabled'].includes(
    String(import.meta.env.VITE_AUTH_INVITE_ONLY || '')
      .trim()
      .toLowerCase()
  );

  const authEndpoints = useMemo(
    () => ({
      me: uniqueUrls([
        `${apiBaseUrl}${API_ENDPOINTS.AUTH.ME}`,
        `${apiBaseUrl}${gatewayPrefix}/auth/me`,
        `${apiBaseUrl}/api/auth/me`,
        `${apiBaseUrl}/auth/me`,
        `${gatewayBaseUrl}/v1/auth/me`,
        '/api/auth/me',
        '/v1/auth/me',
        '/auth/me',
      ]),
      supabaseExchange: uniqueUrls([
        `${apiBaseUrl}${gatewayPrefix}/auth/supabase`,
        `${apiBaseUrl}/api/auth/supabase`,
        `${apiBaseUrl}/auth/supabase`,
        `${gatewayBaseUrl}/v1/auth/supabase`,
        '/api/auth/supabase',
        '/v1/auth/supabase',
        '/auth/supabase',
      ]),
      login: uniqueUrls([
        `${apiBaseUrl}${gatewayPrefix}/auth/login`,
        `${apiBaseUrl}/api/auth/login`,
        `${apiBaseUrl}/auth/login`,
        `${gatewayBaseUrl}/v1/auth/login`,
        '/api/auth/login',
        '/v1/auth/login',
        '/auth/login',
      ]),
      register: uniqueUrls([
        `${apiBaseUrl}${gatewayPrefix}/auth/register`,
        `${apiBaseUrl}/api/auth/register`,
        `${apiBaseUrl}/auth/register`,
        `${gatewayBaseUrl}/v1/auth/register`,
        '/api/auth/register',
        '/v1/auth/register',
        '/auth/register',
      ]),
      google: uniqueUrls([
        `${apiBaseUrl}${gatewayPrefix}/auth/google`,
        `${apiBaseUrl}/api/auth/google`,
        `${apiBaseUrl}/auth/google`,
        `${gatewayBaseUrl}/v1/auth/google`,
        '/api/auth/google',
        '/v1/auth/google',
        '/auth/google',
      ]),
    }),
    [apiBaseUrl, gatewayBaseUrl, gatewayPrefix]
  );

  const fetchUserDetails = useCallback(
    async (token: string): Promise<User | null> => {
      for (const endpoint of authEndpoints.me) {
        try {
          const response = await fetch(endpoint, {
            headers: {
              Authorization: `Bearer ${token}`,
              'X-Requested-With': 'XMLHttpRequest',
            },
          });

          if (!response.ok) continue;
          const payload = await response.json();
          const data = payload?.data ?? payload;
          const rawUser = data?.user || data;
          if (!rawUser?.id && !rawUser?.sub) continue;

          return toFrontendUser(rawUser);
        } catch {
          // Try next endpoint.
        }
      }

      return null;
    },
    [authEndpoints.me]
  );

  const authenticateWithToken = useCallback(
    async (token: string) => {
      setAuthToken(token);
      const details = await fetchUserDetails(token);
      if (!details) {
        clearAuthToken();
        setUser(null);
        throw new Error('Token was rejected by the API');
      }
      setUser(details);
      return { method: 'token' as const, user: details };
    },
    [fetchUserDetails]
  );

  const exchangeSupabaseToken = useCallback(
    async (accessToken: string) => {
      let lastErrorMessage: string | null = null;

      for (const endpoint of authEndpoints.supabaseExchange) {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accessToken }),
          });

          const rawPayload = await response.json();
          const payload = unwrapPayload(rawPayload);

          if (!response.ok) {
            lastErrorMessage =
              extractErrorMessage(rawPayload) || extractErrorMessage(payload) || lastErrorMessage;
            continue;
          }

          const appToken = getTokenFromPayload(payload);
          if (!appToken) continue;

          setAuthToken(appToken);

          if (payload.user) {
            const normalized = toFrontendUser(payload.user);
            setUser(normalized);
            return { method: 'supabase' as const, user: normalized };
          }

          const details = await fetchUserDetails(appToken);
          if (details) {
            setUser(details);
            return { method: 'supabase' as const, user: details };
          }
        } catch {
          // Try next endpoint.
        }
      }

      throw new Error(lastErrorMessage || 'Supabase auth exchange failed');
    },
    [authEndpoints.supabaseExchange, fetchUserDetails]
  );

  const exchangeApiAuth = useCallback(
    async (endpoints: string[], body: Record<string, unknown>, method: string) => {
      let lastErrorMessage: string | null = null;

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

          const rawPayload = await response.json();
          const payload = unwrapPayload(rawPayload);

          if (!response.ok) {
            lastErrorMessage =
              extractErrorMessage(rawPayload) || extractErrorMessage(payload) || lastErrorMessage;
            continue;
          }

          const appToken = getTokenFromPayload(payload);
          if (!appToken) continue;

          setAuthToken(appToken);

          if (payload.user) {
            const normalized = toFrontendUser(payload.user);
            setUser(normalized);
            return { method, user: normalized };
          }

          const details = await fetchUserDetails(appToken);
          if (details) {
            setUser(details);
            return { method, user: details };
          }
        } catch {
          // Try next endpoint.
        }
      }

      throw new Error(lastErrorMessage || 'Authentication exchange failed');
    },
    [fetchUserDetails]
  );

  const login = useCallback(
    async (emailOrToken: string, password?: string, _options?: AuthSubmitOptions) => {
      setError(null);
      setIsLoading(true);

      try {
        if (!password) {
          return await authenticateWithToken(emailOrToken);
        }

        if (!hasSupabaseConfig || !supabase) {
          return await exchangeApiAuth(
            authEndpoints.login,
            {
              email: emailOrToken,
              password,
              cfTurnstileToken: _options?.cfTurnstileToken,
            },
            'password'
          );
        }

        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: emailOrToken,
          password,
        });

        if (signInError) {
          if (shouldFallbackToApiAuth(signInError.message)) {
            return await exchangeApiAuth(
              authEndpoints.login,
              {
                email: emailOrToken,
                password,
                cfTurnstileToken: _options?.cfTurnstileToken,
              },
              'password_fallback'
            );
          }
          throw new Error(signInError.message || 'Failed to login');
        }

        const accessToken = data?.session?.access_token;
        if (!accessToken) {
          throw new Error('Supabase login did not return an access token');
        }

        return await exchangeSupabaseToken(accessToken);
      } catch (err: any) {
        setError(err?.message || 'Failed to login');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [authenticateWithToken, authEndpoints.login, exchangeApiAuth, exchangeSupabaseToken]
  );

  const register = useCallback(
    async (name: string, email: string, password: string, _options?: AuthSubmitOptions) => {
      setError(null);
      setIsLoading(true);

      try {
        if (!hasSupabaseConfig || !supabase) {
          return await exchangeApiAuth(
            authEndpoints.register,
            {
              name,
              email,
              password,
              inviteCode: _options?.inviteCode,
              cfTurnstileToken: _options?.cfTurnstileToken,
            },
            'register'
          );
        }

        if (inviteOnlyMode) {
          return await exchangeApiAuth(
            authEndpoints.register,
            {
              name,
              email,
              password,
              inviteCode: _options?.inviteCode,
              cfTurnstileToken: _options?.cfTurnstileToken,
            },
            'register_invite_only'
          );
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
            },
          },
        });

        if (signUpError) {
          if (shouldFallbackToApiAuth(signUpError.message)) {
            return await exchangeApiAuth(
              authEndpoints.register,
              {
                name,
                email,
                password,
                inviteCode: _options?.inviteCode,
                cfTurnstileToken: _options?.cfTurnstileToken,
              },
              'register_fallback'
            );
          }
          throw new Error(signUpError.message || 'Failed to register');
        }

        const accessToken = data?.session?.access_token;
        if (!accessToken) {
          return {
            method: 'supabase_signup_pending' as const,
            requiresEmailVerification: true,
            message: 'Check your email to verify your account, then sign in.',
          };
        }

        return await exchangeSupabaseToken(accessToken);
      } catch (err: any) {
        setError(err?.message || 'Failed to register');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [authEndpoints.register, exchangeApiAuth, exchangeSupabaseToken, inviteOnlyMode]
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
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (oauthError) {
        throw new Error(oauthError.message || 'Google sign-in failed');
      }

      return { method: 'google_redirect' as const };
    } catch (err: any) {
      setError(err?.message || 'Google sign-in failed');
      setIsLoading(false);
      throw err;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const bootstrapAuth = async () => {
      setIsLoading(true);

      const appToken = getAuthToken();
      if (appToken) {
        const details = await fetchUserDetails(appToken);
        if (!isMounted) return;

        if (details?.id) {
          setUser(details);
          setIsLoading(false);
          return;
        }

        clearAuthToken();
        setUser(null);
      }

      if (hasSupabaseConfig && supabase) {
        try {
          const { data, error: sessionError } = await supabase.auth.getSession();
          if (!sessionError && data?.session?.access_token) {
            await exchangeSupabaseToken(data.session.access_token);
          }
        } catch (err: any) {
          if (isMounted) {
            setError(err?.message || 'Failed to initialize Supabase session');
            setUser(null);
          }
        }
      }

      if (isMounted) {
        setIsLoading(false);
      }
    };

    bootstrapAuth();

    return () => {
      isMounted = false;
    };
  }, [exchangeSupabaseToken, fetchUserDetails]);

  const forgotPassword = useCallback(async (email: string) => {
    if (!hasSupabaseConfig || !supabase) {
      throw new Error('Supabase is not configured');
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (resetError) {
      throw new Error(resetError.message || 'Failed to send reset email');
    }

    return { success: true };
  }, []);

  const resetPassword = useCallback(async (_token: string, password: string) => {
    if (!hasSupabaseConfig || !supabase) {
      throw new Error('Supabase is not configured');
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      throw new Error(updateError.message || 'Failed to reset password');
    }

    return { success: true };
  }, []);

  const handleSSOCallback = useCallback(
    async (_provider: string, _code: string, _state?: string | null) => {
      if (!hasSupabaseConfig || !supabase) {
        throw new Error('Supabase is not configured');
      }

      const url = typeof window !== 'undefined' ? new URL(window.location.href) : null;
      const code = url?.searchParams.get('code') || _code || '';
      let accessToken = '';

      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          throw new Error(error.message || 'Failed to exchange OAuth code');
        }
        accessToken = data?.session?.access_token || '';
      } else if (url) {
        const hashParams = new URLSearchParams(
          url.hash.startsWith('#') ? url.hash.slice(1) : url.hash
        );
        accessToken = hashParams.get('access_token') || '';
      }

      if (!accessToken) {
        // Supabase may need a brief moment to persist the session.
        const maxAttempts = 10;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          const { data, error: sessionError } = await supabase.auth.getSession();
          if (!sessionError && data?.session?.access_token) {
            accessToken = data.session.access_token;
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 250));
        }
      }

      if (!accessToken) {
        throw new Error('No Supabase session after OAuth callback');
      }

      return await exchangeSupabaseToken(accessToken);
    },
    [exchangeSupabaseToken]
  );

  const signInWithMagicLink = useCallback(async (email: string) => {
    setError(null);
    setIsLoading(true);

    try {
      if (!hasSupabaseConfig || !supabase) {
        throw new Error('Supabase is not configured');
      }

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to send magic link');
      }

      return { success: true };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    clearAuthToken();
    setUser(null);
    if (supabase) {
      await supabase.auth.signOut();
    }
    setIsLoading(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
