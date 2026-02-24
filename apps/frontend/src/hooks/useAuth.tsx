import { GoogleAuthProvider } from 'firebase/auth';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AuthContext, { User } from '../AuthContext';
import { API_ENDPOINTS } from '../config/api';
import { auth, getRedirectResult, googleProvider, signInWithRedirect } from '../lib/firebase';

const AUTH_TOKEN_KEY = 'auth_token';
const GOOGLE_REDIRECT_PENDING_KEY = 'google_auth_redirect_pending';

const getAuthToken = () => localStorage.getItem(AUTH_TOKEN_KEY);
const setAuthToken = (token: string) => localStorage.setItem(AUTH_TOKEN_KEY, token);
const clearAuthToken = () => localStorage.removeItem(AUTH_TOKEN_KEY);
const setGoogleRedirectPending = () => sessionStorage.setItem(GOOGLE_REDIRECT_PENDING_KEY, '1');
const clearGoogleRedirectPending = () => sessionStorage.removeItem(GOOGLE_REDIRECT_PENDING_KEY);
const isGoogleRedirectPending = () => sessionStorage.getItem(GOOGLE_REDIRECT_PENDING_KEY) === '1';

type AuthPayload = {
  accessToken?: string;
  access_token?: string;
  refreshToken?: string;
  refresh_token?: string;
  token?: string;
  user?: unknown;
  message?: string | string[];
  error?: string;
};

type AuthSubmitOptions = {
  cfTurnstileToken?: string;
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
  const normalized = trimmed.toLowerCase();
  if (normalized === '/api' || normalized === '/v1') return '';
  return trimmed;
};

const uniqueUrls = (urls: string[]): string[] => Array.from(new Set(urls.filter(Boolean)));

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiBaseUrl = sanitizeApiBaseUrl(import.meta.env.VITE_API_URL || '');
  const gatewayBaseUrl = sanitizeApiBaseUrl(import.meta.env.VITE_API_GATEWAY_URL || '');
  const gatewayPrefix = import.meta.env.PROD ? '/v1' : '/api';

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
      login: uniqueUrls([
        `${apiBaseUrl}${API_ENDPOINTS.AUTH.LOGIN}`,
        `${apiBaseUrl}${gatewayPrefix}/auth/login`,
        `${apiBaseUrl}/api/auth/login`,
        `${apiBaseUrl}/auth/login`,
        `${gatewayBaseUrl}/v1/auth/login`,
        '/api/auth/login',
        '/v1/auth/login',
        '/auth/login',
      ]),
      register: uniqueUrls([
        `${apiBaseUrl}${API_ENDPOINTS.AUTH.REGISTER}`,
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

  const login = useCallback(
    async (emailOrToken: string, password?: string, options?: AuthSubmitOptions) => {
      setError(null);
      setIsLoading(true);

      try {
        if (!password) {
          return await authenticateWithToken(emailOrToken);
        }

        let lastErrorMessage: string | null = null;

        for (const endpoint of authEndpoints.login) {
          try {
            const response = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: emailOrToken,
                password,
                cfTurnstileToken: options?.cfTurnstileToken,
              }),
            });

            const rawPayload = await response.json();
            const payload = unwrapPayload(rawPayload);

            if (!response.ok) {
              lastErrorMessage =
                extractErrorMessage(rawPayload) || extractErrorMessage(payload) || lastErrorMessage;
              continue;
            }

            const token = getTokenFromPayload(payload);
            if (!token) continue;

            setAuthToken(token);

            if (payload.user) {
              setUser(toFrontendUser(payload.user, emailOrToken));
              return { method: 'backend' as const, user: payload.user };
            }

            const details = await fetchUserDetails(token);
            if (details) {
              setUser(details);
              return { method: 'backend' as const, user: details };
            }
          } catch {
            // Try next endpoint.
          }
        }

        throw new Error(lastErrorMessage || 'Failed to login');
      } catch (err: any) {
        setError(err?.message || 'Failed to login');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [authenticateWithToken, authEndpoints.login, fetchUserDetails]
  );

  const register = useCallback(
    async (name: string, email: string, password: string, options?: AuthSubmitOptions) => {
      setError(null);
      setIsLoading(true);

      try {
        let lastErrorMessage: string | null = null;

        for (const endpoint of authEndpoints.register) {
          try {
            const response = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name,
                email,
                password,
                cfTurnstileToken: options?.cfTurnstileToken,
              }),
            });

            const rawPayload = await response.json();
            const payload = unwrapPayload(rawPayload);

            if (!response.ok) {
              lastErrorMessage =
                extractErrorMessage(rawPayload) || extractErrorMessage(payload) || lastErrorMessage;
              continue;
            }

            const token = getTokenFromPayload(payload);
            if (!token) continue;

            setAuthToken(token);

            if (payload.user) {
              setUser(toFrontendUser(payload.user, email));
              return payload;
            }

            const details = await fetchUserDetails(token);
            if (details) {
              setUser(details);
              return payload;
            }
          } catch {
            // Try next endpoint.
          }
        }

        throw new Error(lastErrorMessage || 'Failed to register');
      } catch (err: any) {
        setError(err?.message || 'Failed to register');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [authEndpoints.register, fetchUserDetails]
  );

  const completeGoogleAuth = useCallback(
    async (idToken: string, fallbackEmail: string) => {
      let lastErrorMessage: string | null = null;

      for (const endpoint of authEndpoints.google) {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
          });

          const rawPayload = await response.json();
          const payload = unwrapPayload(rawPayload);

          if (!response.ok) {
            lastErrorMessage =
              extractErrorMessage(rawPayload) || extractErrorMessage(payload) || lastErrorMessage;
            continue;
          }

          const token = getTokenFromPayload(payload);
          if (!token) continue;

          setAuthToken(token);

          if (payload.user) {
            const normalized = toFrontendUser(payload.user, fallbackEmail);
            setUser(normalized);
            return { method: 'google' as const, user: normalized };
          }

          const details = await fetchUserDetails(token);
          if (details) {
            setUser(details);
            return { method: 'google' as const, user: details };
          }
        } catch {
          // Try next endpoint.
        }
      }

      throw new Error(lastErrorMessage || 'Google sign-in failed');
    },
    [authEndpoints.google, fetchUserDetails]
  );

  const processGoogleRedirectResult = useCallback(async () => {
    const redirectResult = await getRedirectResult(auth);
    if (!redirectResult) {
      if (isGoogleRedirectPending()) {
        clearGoogleRedirectPending();
      }
      return null;
    }

    clearGoogleRedirectPending();
    const googleCredential = GoogleAuthProvider.credentialFromResult(redirectResult);
    const idToken = googleCredential?.idToken;

    if (!idToken) {
      throw new Error('Google sign-in did not return an ID token');
    }

    return completeGoogleAuth(idToken, redirectResult.user.email || '');
  }, [completeGoogleAuth]);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      setGoogleRedirectPending();
      await signInWithRedirect(auth, googleProvider);
      return { method: 'google_redirect' as const };
    } catch (err: any) {
      clearGoogleRedirectPending();
      setError(err?.message || 'Google sign-in failed');
      setIsLoading(false);
      throw err;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const bootstrapAuth = async () => {
      setIsLoading(true);

      try {
        const googleRedirectAuth = await processGoogleRedirectResult();
        if (googleRedirectAuth) {
          if (isMounted) setIsLoading(false);
          return;
        }
      } catch (err: any) {
        clearAuthToken();
        if (isMounted) {
          setUser(null);
          setError(err?.message || 'Google sign-in failed');
        }
      }

      const token = getAuthToken();
      if (!token) {
        if (isMounted) {
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      const details = await fetchUserDetails(token);
      if (!isMounted) return;

      if (details?.id) {
        setUser(details);
      } else {
        clearAuthToken();
        setUser(null);
      }

      setIsLoading(false);
    };

    bootstrapAuth();

    return () => {
      isMounted = false;
    };
  }, [fetchUserDetails, processGoogleRedirectResult]);
  const forgotPassword = useCallback(async (_email: string) => {
    throw new Error('Forgot password is not configured yet in the new auth flow');
  }, []);

  const resetPassword = useCallback(async (_token: string, _password: string) => {
    throw new Error('Reset password is not configured yet in the new auth flow');
  }, []);

  const handleSSOCallback = useCallback(
    async (_provider: string, _code: string, _state?: string | null) => {
      throw new Error('SSO is not configured yet in the new auth flow');
    },
    []
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    clearAuthToken();
    clearGoogleRedirectPending();
    setUser(null);
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
