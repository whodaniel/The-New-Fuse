import React, { createContext, useContext, useMemo, useState } from 'react';
import { UseAuthResult } from '@the-new-fuse/hooks';

/**
 * Authentication provider props
 */
export interface AuthProviderProps {
  /**
   * Children
   */
  children: React.ReactNode;
}

const AuthContext = createContext<UseAuthResult | undefined>(undefined);

/**
 * Hook to access the authentication context
 * @returns Authentication context value
 */
export function useAuthContext(): UseAuthResult {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  
  return context;
}

/**
 * Authentication provider component
 */
const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add aliases for consistent naming
  const isLoading = loading;

  const login = async (email: string, _password: string) => { // renamed password to _password
    try {
      setLoading(true);
      setError(null);
      // Implementation stub
      setIsAuthenticated(true);
      setUser({ email });
    } catch (err) {
      setError((err as Error).message || 'Failed to login');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, _password: string) => { // renamed password to _password
    try {
      setLoading(true);
      setError(null);
      // Implementation stub
      setIsAuthenticated(true);
      setUser({ name, email });
    } catch (err) {
      setError((err as Error).message || 'Failed to register');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
  };
  
  // Removed unused 'auth' variable from useAuth() hook
  
  const value = useMemo(() => ({
    isAuthenticated,
    user,
    login,
    logout,
    register,
    loading,
    error,
    isLoading,
  }), [isAuthenticated, user, loading, error, isLoading]);
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthProvider };
