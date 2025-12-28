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
  photoURL?: string;
}

// Define auth context type
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<UserCredential>;
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
  login: async () => ({}) as UserCredential,
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

  // Map Firebase user to our User type
  const mapUser = (firebaseUser: FirebaseUser): User => {
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      name: firebaseUser.displayName || firebaseUser.email || '',
      role: 'user', // Default role for now
      photoURL: firebaseUser.photoURL || undefined,
    };
  };

  // Check auth on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const mappedUser = mapUser(firebaseUser);
        setUser(mappedUser);
        const token = await firebaseUser.getIdToken();
        localStorage.setItem('auth_token', token);
      } else {
        setUser(null);
        localStorage.removeItem('auth_token');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Login user
  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result;
    } catch (error: any) {
      setError(error.message || 'Failed to login');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Register user
  const register = useCallback(async (name: string, email: string, password: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      if (result.user) {
        await updateProfile(result.user, { displayName: name });
        // Force update user state since onAuthStateChanged might fire before updateProfile
        setUser(mapUser({ ...result.user, displayName: name }));
      }
      return result;
    } catch (error: any) {
      setError(error.message || 'Failed to register');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result;
    } catch (error: any) {
      setError(error.message || 'Failed to sign in with Google');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

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
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to authenticate with Unstoppable Domains');
      }

      const { token, user: backendUser } = await response.json();
      
      // Store token
      localStorage.setItem('auth_token', token);
      
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
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
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
