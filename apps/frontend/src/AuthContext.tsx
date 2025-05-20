/* global localStorage */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase.js';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  user: User | null;
  setToken: (token: string | null) => void;
  isInitialized: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  token: null,
  user: null,
  setToken: () => {},
  isInitialized: false
});

export const AuthProvider: React.React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const token = await user.getIdToken();
        setToken(token);
        localStorage.setItem('auth_token', token);
      } else {
        setToken(null);
        localStorage.removeItem('auth_token');
      }
      setIsInitialized(true);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    isAuthenticated: !!token && !!user,
    token,
    user,
    isInitialized,
    setToken: (newToken: string | null) => {
      setToken(newToken);
      if (newToken) {
        localStorage.setItem('auth_token', newToken);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  };

  if (!isInitialized) {
    return <div className="min-h-screen flex items-center justify-center">
      <div role="status" className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
    </div>;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
