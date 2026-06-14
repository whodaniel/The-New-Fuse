import { useState, useEffect, useCallback } from 'react';
/**
 * Hook for authentication
 * @param options Authentication hook options
 * @returns Authentication hook result
 *
 * @example
 * // Create auth service
 * const authService = new AuthService(apiClient, tokenStorage);
 *
 * // Use auth hook
 * const { isAuthenticated, isLoading, user, login, logout } = useAuth({ authService });
 *
 * // Login
 * const handleLogin = async (email, password) => {
 *   try {
 *     await login({ email, password });
 *     // Redirect to dashboard
 *   } catch (error) {
 *     // Handle error
 *   }
 * };
 */
export function useAuth(options) {
    const { authService, checkOnMount = true } = options;
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);
    const checkAuth = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const isAuth = await authService.isAuthenticated();
            setIsAuthenticated(isAuth);
            if (isAuth) {
                const userData = await authService.getCurrentUser();
                setUser(userData);
            }
            else {
                setUser(null);
            }
        }
        catch (err) {
            setError(err);
            setIsAuthenticated(false);
            setUser(null);
        }
        finally {
            setIsLoading(false);
        }
    }, [authService]);
    const login = useCallback(async (credentials) => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await authService.login(credentials);
            setIsAuthenticated(true);
            setUser(response.user);
        }
        catch (err) {
            setError(err);
            throw err;
        }
        finally {
            setIsLoading(false);
        }
    }, [authService]);
    const register = useCallback(async (data) => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await authService.register(data);
            setIsAuthenticated(true);
            setUser(response.user);
        }
        catch (err) {
            setError(err);
            throw err;
        }
        finally {
            setIsLoading(false);
        }
    }, [authService]);
    const logout = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            await authService.logout();
            setIsAuthenticated(false);
            setUser(null);
        }
        catch (err) {
            setError(err);
            throw err;
        }
        finally {
            setIsLoading(false);
        }
    }, [authService]);
    useEffect(() => {
        if (checkOnMount) {
            checkAuth();
        }
    }, [checkOnMount, checkAuth]);
    return {
        isAuthenticated,
        isLoading,
        error,
        user,
        login,
        register,
        logout,
    };
}
//# sourceMappingURL=useAuth.js.map