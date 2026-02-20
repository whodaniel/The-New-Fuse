import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { useCallback, useContext, useEffect, useState } from 'react';
import AuthContext, { User } from '../AuthContext';
import { API_ENDPOINTS } from '../config/api';
import { auth, googleProvider } from '../lib/firebase';

// Helper functions for token management
const getAuthToken = () => localStorage.getItem('auth_token');
const setAuthToken = (token: string) => localStorage.setItem('auth_token', token);
const clearAuthToken = () => localStorage.removeItem('auth_token');

// Map Firebase user to our User interface
const mapUser = (firebaseUser: any): User => ({
  id: firebaseUser.uid || firebaseUser.id || '',
  email: firebaseUser.email || '',
  name: firebaseUser.displayName || firebaseUser.name || firebaseUser.email || 'User',
  photoURL: firebaseUser.photoURL || undefined,
  role: 'user', // Default role, will be updated by fetchUserDetails
});

/**
 * Auth provider component
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Production-aware API configuration
  const apiBaseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
  const gatewayPrefix = import.meta.env.PROD ? '/v1' : '/api';

  const isFirebaseConfigured =
    !!import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_API_KEY !== '${VITE_FIREBASE_API_KEY}';

  // Fetch authenticated user from backend with retry logic and multi-endpoint support
  const fetchUserDetails = useCallback(
    async (token: string, retries = 3, delay = 1000): Promise<User | null> => {
      // Prioritize centralized config, with fallbacks for legacy/gateway routes
      const endpoints = [
        `${apiBaseUrl}${API_ENDPOINTS.AUTH.ME}`,
        `${apiBaseUrl}${gatewayPrefix}/auth/me`,
        '/api/auth/me',
        '/v1/auth/me',
        '/auth/me',
      ];

      const attemptFetch = async (endpoint: string) => {
        const response = await fetch(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Requested-With': 'XMLHttpRequest',
          },
        });

        if (response.status === 503) {
          throw new Error('Service Unavailable (503)');
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          throw new Error('Non-JSON response');
        }

        const userData = await response.json();
        return userData?.user || userData;
      };

      for (let i = 0; i < retries; i++) {
        for (const endpoint of endpoints) {
          try {
            const payload = await attemptFetch(endpoint);
            if (!payload?.id && !payload?.sub) continue;

            return {
              id: String(payload.id || payload.sub || ''),
              email: String(payload.email || ''),
              name: String(payload.name || payload.email || 'User'),
              role: String(payload.role || 'user'),
              roles: Array.isArray(payload.roles) ? payload.roles : [payload.role || 'user'],
              agencyId: payload.agencyId,
              tenantId: payload.tenantId,
              photoURL: payload.photoURL,
            };
          } catch (err: any) {
            if (err.message?.includes('503')) {
              console.warn(`[The New Fuse] 503 at ${endpoint}, retrying...`);
              break; // Trigger outer loop retry with backoff
            }
            // Other errors (404, etc) -> try next endpoint immediately
          }
        }

        if (i < retries - 1) {
          await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
        }
      }

      setError('Authentication service is currently unavailable. Please try again later.');
      return null;
    },
    [apiBaseUrl, gatewayPrefix]
  );

  // Check auth on mount
  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    const hydrateFromStoredToken = async () => {
      const token = getAuthToken();
      if (!token) return false;

      const userDetails = await fetchUserDetails(token);
      if (!isMounted) return true;

      if (userDetails?.id) {
        setUser(userDetails);
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
          const mappedUser = mapUser(firebaseUser);
          const token = await firebaseUser.getIdToken();
          setAuthToken(token);

          const userDetails = await fetchUserDetails(token);
          if (userDetails) {
            setUser({ ...mappedUser, ...userDetails });
          } else {
            setUser(mappedUser);
          }
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
  }, [fetchUserDetails]);

  // Login user
  const login = useCallback(
    async (email: string, password: string) => {
      setError(null);
      setIsLoading(true);
      let firebaseError: any;

      try {
        if (isFirebaseConfigured) {
          const result = await signInWithEmailAndPassword(auth, email, password);
          if (result.user) {
            const mappedUser = mapUser(result.user);
            const token = await result.user.getIdToken();
            setAuthToken(token);

            const userDetails = await fetchUserDetails(token);
            if (userDetails) {
              setUser({ ...mappedUser, ...userDetails });
            } else {
              setUser(mappedUser);
            }
          }
          return { method: 'firebase' as const, user: result.user };
        }
      } catch (error: any) {
        firebaseError = error;
      }

      try {
        const endpoints = [`${apiBaseUrl}/auth/login`, '/api/auth/login', '/auth/login'];

        for (const endpoint of endpoints) {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) continue;

          const payload = await response.json();
          const token = payload?.access_token || payload?.token;

          if (!token) continue;

          setAuthToken(token);

          if (payload?.user) {
            const backendUser = payload.user;
            setUser({
              id: String(backendUser.id || ''),
              email: String(backendUser.email || email),
              name: String(backendUser.name || backendUser.email || email),
              role: String(backendUser.role || 'user'),
              roles: Array.isArray(backendUser.roles)
                ? backendUser.roles
                : [backendUser.role || 'user'],
              agencyId: backendUser.agencyId,
              tenantId: backendUser.tenantId,
              photoURL: backendUser.photoURL,
            });
          } else {
            const userDetails = await fetchUserDetails(token);
            if (userDetails) setUser(userDetails);
          }

          return { method: 'backend' as const };
        }

        throw firebaseError || new Error('Failed to login');
      } catch (backendError: any) {
        const message = backendError?.message || firebaseError?.message || 'Failed to login';
        setError(message);
        throw backendError || firebaseError;
      } finally {
        setIsLoading(false);
      }
    },
    [apiBaseUrl, fetchUserDetails, isFirebaseConfigured]
  );

  // Register user
  const register = useCallback(
    async (name: string, email: string, password: string) => {
      setError(null);
      setIsLoading(true);
      try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        if (result.user) {
          await updateProfile(result.user, { displayName: name });
          const mappedUser = mapUser({ ...result.user, displayName: name });
          const token = await result.user.getIdToken();
          setAuthToken(token);

          // Fetch user details from backend to get actual role
          const userDetails = await fetchUserDetails(token);
          if (userDetails) {
            setUser({ ...mappedUser, ...userDetails });
          } else {
            setUser(mappedUser);
          }
        }
        return result;
      } catch (error: any) {
        setError(error.message || 'Failed to register');
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchUserDetails]
  );

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // Manually update user state to prevent race conditions
      if (result.user) {
        const mappedUser = mapUser(result.user);
        const token = await result.user.getIdToken();
        setAuthToken(token);

        // Fetch user details from backend to get actual role
        const userDetails = await fetchUserDetails(token);
        if (userDetails) {
          setUser({ ...mappedUser, ...userDetails });
        } else {
          setUser(mappedUser);
        }
      }
      return result;
    } catch (error: any) {
      setError(error.message || 'Failed to sign in with Google');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fetchUserDetails]);

  // Login with Unstoppable Domains
  const loginWithUnstoppableDomains = useCallback(async (udUser: any) => {
    setError(null);
    setIsLoading(true);
    try {
      // Send UD user data to backend to create/authenticate user
      const response = await fetch('/api/auth/unstoppable-domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: udUser.sub,
          walletAddress: udUser.wallet_address,
          walletType: udUser.wallet_type_hint,
          message: udUser.eip4361_message,
          signature: udUser.eip4361_signature,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to authenticate with Unstoppable Domains');
      }

      const { token, user: backendUser } = await response.json();

      // Store token
      setAuthToken(token);

      // Set user state
      setUser({
        id: backendUser.id,
        email: backendUser.email || udUser.sub,
        name: backendUser.name || udUser.sub,
        role: backendUser.role || 'user',
        photoURL: backendUser.photoURL,
      });
    } catch (error: any) {
      setError(error.message || 'Failed to sign in with Unstoppable Domains');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout user
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      // Sign out from Firebase
      await signOut(auth);

      // Clear local storage
      clearAuthToken();

      // Clear user state
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
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
        loginWithUnstoppableDomains,
        logout,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook for accessing the auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
