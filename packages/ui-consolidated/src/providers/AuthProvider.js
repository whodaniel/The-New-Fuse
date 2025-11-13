import React, { createContext, useContext, useMemo, useState } from 'react';
const AuthContext = createContext(undefined);
/**
 * Hook to access the authentication context
 * @returns Authentication context value
 */
export function useAuthContext() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }
    return context;
}
/**
 * Authentication provider component
 */
const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // Add aliases for consistent naming
    const isLoading = loading;
    const login = async (email, _password) => {
        try {
            setLoading(true);
            setError(null);
            // Implementation stub
            setIsAuthenticated(true);
            setUser({ email });
        }
        catch (err) {
            setError(err.message || 'Failed to login');
            throw err;
        }
        finally {
            setLoading(false);
        }
    };
    const register = async (name, email, _password) => {
        try {
            setLoading(true);
            setError(null);
            // Implementation stub
            setIsAuthenticated(true);
            setUser({ name, email });
        }
        catch (err) {
            setError(err.message || 'Failed to register');
            throw err;
        }
        finally {
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
};
export { AuthProvider };
//# sourceMappingURL=AuthProvider.js.map