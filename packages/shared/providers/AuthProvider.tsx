import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext<any>(undefined);

export const AuthProvider = ({ children }: any) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async (): Promise<void> => {
    try {
      setLoading(false);
    } catch (err) {
      setError('Authentication check failed');
      setLoading(false);
    }
  };

  const login = async (email?: string, password?: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
    } catch (err) {
      setError('Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      setUser(null);
      setError(null);
    } catch (err) {
      setError('Logout failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email?: string, password?: string, name?: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
    } catch (err) {
      setError('Signup failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        logout,
        signup,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;
