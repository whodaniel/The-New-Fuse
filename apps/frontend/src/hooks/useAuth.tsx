import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AuthContext, { User } from '../AuthContext';
import { API_ENDPOINTS } from '../config/api';
import { auth, googleProvider } from '../lib/firebase';

const getAuthToken = () => localStorage.getItem('auth_token');
const setAuthToken = (token: string) => localStorage.setItem('auth_token', token);
const clearAuthToken = () => localStorage.removeItem('auth_token');

type AuthPayload = {
  accessToken?: string;
  access_token?: string;
  refreshToken?: string;
  refresh_token?: string;
  token?: string;
  user?: unknown;
};

const toFrontendUser = (backendUser: any, fallbackEmail = ''): User => ({
  id: String(backendUser?.id || ''),
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

const mapFirebaseUser = (firebaseUser: any): User => ({
  id: firebaseUser.uid || firebaseUser.id || '',
  email: firebaseUser.email || '',
  name: firebaseUser.displayName || firebaseUser.name || firebaseUser.email || 'User',
  photoURL: firebaseUser.photoURL || undefined,
  role: 'USER',
  roles: ['USER'],
});

const splitName = (name: string): { firstName?: string; lastName?: string } => {
  const trimmed = name.trim();
  if (!trimmed) return {};
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return { firstName: parts[0] };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
};

const usernameFromName = (name: string, email: string): string => {
  const fromName = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  if (fromName) return fromName.slice(0, 40);
  const local = email.split('@')[0] || 'user';
  return local
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
};

const getTokenFromPayload = (payload: AuthPayload): string | null =>
  payload?.accessToken || payload?.access_token || payload?.token || null;

const extractErrorMessage = (payload: any): string | null => {
  if (!payload || typeof payload !== 'object') return null;
  if (typeof payload.message === 'string' && payload.message.trim()) return payload.message;
  if (Array.isArray(payload.message) && payload.message.length > 0) {
    const joined = payload.message.filter(Boolean).join(', ');
    return joined || null;
  }
  if (typeof payload.error === 'string' && payload.error.trim()) return payload.error;
  return null;
};

const isLikelyHtmlResponse = (response: Response, bodyText: string): boolean => {
  const contentType = response.headers.get('content-type') || '';
  const normalized = contentType.toLowerCase();
  if (normalized.includes('text/html')) return true;
  const sample = bodyText.slice(0, 256).toLowerCase();
  return sample.includes('<!doctype html') || sample.includes('<html');
};

const isCloudflareChallenge = (bodyText: string): boolean => {
  const sample = bodyText.slice(0, 2000).toLowerCase();
  return (
    sample.includes('cf-chl') ||
    sample.includes('cloudflare') ||
    sample.includes('attention required')
  );
};

const sanitizeApiBaseUrl = (rawUrl: string) => {
  const trimmed = rawUrl.replace(/\/$/, '');
  if (!trimmed) return '';
  const prefix = trimmed.toLowerCase();
  if (prefix === '/api' || prefix === '/v1') return '';
  return trimmed;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiBaseUrl = sanitizeApiBaseUrl(import.meta.env.VITE_API_URL || '');
  const gatewayPrefix = import.meta.env.PROD ? '/v1' : '/api';

  const isFirebaseConfigured =
    !!import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_API_KEY !== '${VITE_FIREBASE_API_KEY}';

  const authEndpoints = useMemo(
    () => ({
      me: [
        `${apiBaseUrl}${API_ENDPOINTS.AUTH.ME}`,
        `${apiBaseUrl}${gatewayPrefix}/auth/me`,
        '/api/auth/me',
        '/v1/auth/me',
        '/auth/me',
      ],
      login: [
        `${apiBaseUrl}${API_ENDPOINTS.AUTH.LOGIN}`,
        `${apiBaseUrl}${gatewayPrefix}/auth/login`,
        '/api/auth/login',
        '/v1/auth/login',
        '/auth/login',
      ],
      register: [
        `${apiBaseUrl}${API_ENDPOINTS.AUTH.REGISTER}`,
        `${apiBaseUrl}${gatewayPrefix}/auth/register`,
        '/api/auth/register',
        '/v1/auth/register',
        '/auth/register',
      ],
      firebase: [
        `${apiBaseUrl}/auth/login/firebase`,
        `${apiBaseUrl}${gatewayPrefix}/auth/login/firebase`,
        '/api/auth/login/firebase',
        '/v1/auth/login/firebase',
      ],
    }),
    [apiBaseUrl, gatewayPrefix]
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
          const rawUser = payload?.user || payload;
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

  const authenticateFirebaseWithBackend = useCallback(
    async (firebaseIdToken: string, fallbackUser?: User) => {
      for (const endpoint of authEndpoints.firebase) {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${firebaseIdToken}`,
            },
          });
          if (!response.ok) continue;
          const payload = (await response.json()) as AuthPayload;
          const token = getTokenFromPayload(payload) || firebaseIdToken;
          setAuthToken(token);

          if (payload.user) {
            const normalized = toFrontendUser(payload.user, fallbackUser?.email || '');
            setUser(fallbackUser ? { ...fallbackUser, ...normalized } : normalized);
            return;
          }

          const details = await fetchUserDetails(token);
          if (details) {
            setUser(fallbackUser ? { ...fallbackUser, ...details } : details);
            return;
          }

          if (fallbackUser) {
            setUser(fallbackUser);
            return;
          }
        } catch {
          // Try next endpoint.
        }
      }

      setAuthToken(firebaseIdToken);
      if (fallbackUser) setUser(fallbackUser);
    },
    [authEndpoints.firebase, fetchUserDetails]
  );

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    const hydrateFromStoredToken = async () => {
      const token = getAuthToken();
      if (!token) return false;

      const details = await fetchUserDetails(token);
      if (!isMounted) return true;

      if (details?.id) {
        setUser(details);
        return true;
      }
      return false;
    };

    const bootstrapAuth = async () => {
      const hydrated = await hydrateFromStoredToken();

      if (!isFirebaseConfigured) {
        if (!hydrated) {
          clearAuthToken();
          setUser(null);
        }
        if (isMounted) setIsLoading(false);
        return;
      }

      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (!isMounted) return;

        if (firebaseUser) {
          const mappedUser = mapFirebaseUser(firebaseUser);
          const firebaseToken = await firebaseUser.getIdToken();
          await authenticateFirebaseWithBackend(firebaseToken, mappedUser);
          setIsLoading(false);
          return;
        }

        const tokenHydrated = await hydrateFromStoredToken();
        if (!tokenHydrated) {
          setUser(null);
          clearAuthToken();
        }
        setIsLoading(false);
      });
    };

    bootstrapAuth();

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [authenticateFirebaseWithBackend, fetchUserDetails, isFirebaseConfigured]);

  const login = useCallback(
    async (email: string, password: string) => {
      setError(null);
      setIsLoading(true);
      let firebaseError: unknown = null;

      try {
        if (isFirebaseConfigured) {
          const result = await signInWithEmailAndPassword(auth, email, password);
          if (result.user) {
            const mappedUser = mapFirebaseUser(result.user);
            const firebaseToken = await result.user.getIdToken();
            await authenticateFirebaseWithBackend(firebaseToken, mappedUser);
          }
          return { method: 'firebase' as const, user: result.user };
        }
      } catch (err) {
        firebaseError = err;
      }

      try {
        let lastErrorMessage: string | null = null;
        let sawCloudflareChallenge = false;

        for (const endpoint of authEndpoints.login) {
          try {
            const response = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password }),
            });

            const bodyText = await response.text();
            const payload = (() => {
              try {
                return bodyText ? (JSON.parse(bodyText) as AuthPayload) : null;
              } catch {
                return null;
              }
            })();

            if (!response.ok) {
              const message = extractErrorMessage(payload);
              if (message) lastErrorMessage = message;
              if (isLikelyHtmlResponse(response, bodyText) && isCloudflareChallenge(bodyText)) {
                sawCloudflareChallenge = true;
              }
              continue;
            }

            if (isLikelyHtmlResponse(response, bodyText)) {
              if (isCloudflareChallenge(bodyText)) {
                sawCloudflareChallenge = true;
              }
              continue;
            }

            if (!payload) continue;

            const token = getTokenFromPayload(payload);
            if (!token) continue;

            setAuthToken(token);

            if (payload.user) {
              setUser(toFrontendUser(payload.user, email));
            } else {
              const details = await fetchUserDetails(token);
              if (details) setUser(details);
            }

            return { method: 'backend' as const };
          } catch {
            // Try next endpoint.
          }
        }

        if (lastErrorMessage) {
          throw new Error(lastErrorMessage);
        }
        if (sawCloudflareChallenge) {
          throw new Error('Cloudflare challenge blocked login. Please retry in a cleared browser tab.');
        }
        throw new Error('Failed to login');
      } catch (backendError: any) {
        const message = backendError?.message || 'Failed to login';
        setError(message);
        throw backendError || firebaseError;
      } finally {
        setIsLoading(false);
      }
    },
    [authEndpoints.login, authenticateFirebaseWithBackend, fetchUserDetails, isFirebaseConfigured]
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      setError(null);
      setIsLoading(true);

      try {
        let lastErrorMessage: string | null = null;
        let sawCloudflareChallenge = false;

        if (isFirebaseConfigured) {
          const result = await createUserWithEmailAndPassword(auth, email, password);
          if (result.user) {
            await updateProfile(result.user, { displayName: name });
            const mappedUser = mapFirebaseUser({ ...result.user, displayName: name });
            const firebaseToken = await result.user.getIdToken();
            await authenticateFirebaseWithBackend(firebaseToken, mappedUser);
          }
          return result;
        }

        const parsedName = splitName(name);
        const username = usernameFromName(name, email);

        for (const endpoint of authEndpoints.register) {
          try {
            const response = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name,
                email,
                username,
                password,
                firstName: parsedName.firstName,
                lastName: parsedName.lastName,
              }),
            });

            const bodyText = await response.text();
            const payload = (() => {
              try {
                return bodyText ? (JSON.parse(bodyText) as AuthPayload) : null;
              } catch {
                return null;
              }
            })();

            if (!response.ok) {
              const message = extractErrorMessage(payload);
              if (message) lastErrorMessage = message;
              if (isLikelyHtmlResponse(response, bodyText) && isCloudflareChallenge(bodyText)) {
                sawCloudflareChallenge = true;
              }
              continue;
            }

            if (isLikelyHtmlResponse(response, bodyText)) {
              if (isCloudflareChallenge(bodyText)) {
                sawCloudflareChallenge = true;
              }
              continue;
            }

            if (!payload) continue;

            const token = getTokenFromPayload(payload);
            if (!token) continue;

            setAuthToken(token);
            if (payload.user) {
              setUser(toFrontendUser(payload.user, email));
            } else {
              const details = await fetchUserDetails(token);
              if (details) setUser(details);
            }
            return payload;
          } catch {
            // Try next endpoint.
          }
        }

        if (lastErrorMessage) {
          throw new Error(lastErrorMessage);
        }
        if (sawCloudflareChallenge) {
          throw new Error(
            'Cloudflare challenge blocked registration. Please retry in a cleared browser tab.'
          );
        }
        throw new Error('Failed to register');
      } catch (err: any) {
        setError(err.message || 'Failed to register');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [
      authEndpoints.register,
      authenticateFirebaseWithBackend,
      fetchUserDetails,
      isFirebaseConfigured,
    ]
  );

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const popupModeEnabled = import.meta.env.VITE_GOOGLE_POPUP_MODE === 'true';
      if (!popupModeEnabled || !isFirebaseConfigured) {
        const oauthBase = (apiBaseUrl || '/api').replace(/\/$/, '');
        window.location.assign(`${oauthBase}/auth/google`);
        return { method: 'oauth-redirect' as const };
      }

      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        const mappedUser = mapFirebaseUser(result.user);
        const firebaseToken = await result.user.getIdToken();
        await authenticateFirebaseWithBackend(firebaseToken, mappedUser);
      }
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl, authenticateFirebaseWithBackend, isFirebaseConfigured]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
      clearAuthToken();
      setUser(null);
    } catch (logoutError) {
      console.error('Logout error:', logoutError);
    } finally {
      setIsLoading(false);
    }
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
