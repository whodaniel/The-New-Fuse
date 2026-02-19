import {
  createUserWithEmailAndPassword,
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  UserCredential,
} from 'firebase/auth';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { auth, googleProvider } from '../lib/firebase';

// Define user type
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  roles?: string[]; // Support for multiple roles
  photoURL?: string;
  agencyId?: string; // For agency-scoped users
  tenantId?: string; // For tenant isolation
}

// Define auth context type
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ method: 'firebase' | 'backend'; user?: FirebaseUser }>;
  register: (name: string, email: string, password: string) => Promise<UserCredential>;
  signInWithGoogle: () => Promise<UserCredential>;
  loginWithUnstoppableDomains?: (udUser: any) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

// Create auth context
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => ({ method: 'backend' }),
  register: async () => ({}) as UserCredential,
  signInWithGoogle: async () => ({}) as UserCredential,
  logout: async () => {},
  error: null,
});

/**
 * Auth provider component
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiBaseUrl = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

  const AUTH_TOKEN_KEY = 'auth_token'; // Single source of truth for token storage
  const LEGACY_AUTH_TOKEN_KEYS = ['token', 'authToken'];
  const isFirebaseConfigured =
    !!import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_API_KEY !== '${VITE_FIREBASE_API_KEY}';

  const setAuthToken = (token: string) => {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    for (const key of LEGACY_AUTH_TOKEN_KEYS) {
      localStorage.setItem(key, token);
    }
  };

  const clearAuthToken = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    for (const key of LEGACY_AUTH_TOKEN_KEYS) {
      localStorage.removeItem(key);
    }
  };

  const getAuthToken = () => {
    return (
      localStorage.getItem(AUTH_TOKEN_KEY) ||
      LEGACY_AUTH_TOKEN_KEYS.map((key) => localStorage.getItem(key)).find(Boolean) ||
      null
    );
  };

  // Map Firebase user to our User type
  const mapUser = (firebaseUser: FirebaseUser): User => {
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      name: firebaseUser.displayName || firebaseUser.email || '',
      role: 'user', // Default role, will be updated from backend
      photoURL: firebaseUser.photoURL || undefined,
    };
  };

  // Fetch authenticated user from backend
  const fetchUserDetails = useCallback(
    async (token: string): Promise<User | null> => {
      const endpoints = [`${apiBaseUrl}/auth/me`, '/api/auth/me', '/auth/me'];

      try {
        for (const endpoint of endpoints) {
          const response = await fetch(endpoint, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            continue;
          }

          const contentType = response.headers.get('content-type') || '';
          if (!contentType.includes('application/json')) {
            continue;
          }

          const userData = await response.json();
          const payload =
            userData && typeof userData === 'object' && 'user' in userData
              ? (userData as any).user
              : userData;

          if (!payload || typeof payload !== 'object') {
            continue;
          }

          return {
            id: String((payload as any).id || (payload as any).sub || ''),
            email: String((payload as any).email || ''),
            name: String((payload as any).name || (payload as any).email || 'User'),
            role: String((payload as any).role || 'user'),
            roles: Array.isArray((payload as any).roles)
              ? (payload as any).roles
              : [(payload as any).role || 'user'],
            agencyId: (payload as any).agencyId,
            tenantId: (payload as any).tenantId,
            photoURL: (payload as any).photoURL,
          };
        }

        console.error('Failed to fetch user details from all /auth/me endpoints');
        return null;
      } catch (error) {
        console.error('Error fetching user details:', error);
        return null;
      }
    },
    [apiBaseUrl]
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
