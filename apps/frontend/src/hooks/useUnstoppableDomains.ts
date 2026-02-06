import {
  unstoppableDomainsService,
  UnstoppableDomainsUser,
} from '@/services/unstoppableDomains.service';
import { useCallback, useEffect, useState } from 'react';

export interface UseUnstoppableDomainsReturn {
  user: UnstoppableDomainsUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getDomainName: () => Promise<string | null>;
  getWalletAddress: () => Promise<string | null>;
}

/**
 * React hook for Unstoppable Domains authentication
 */
export const useUnstoppableDomains = (): UseUnstoppableDomainsReturn => {
  const [user, setUser] = useState<UnstoppableDomainsUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize the service
  useEffect(() => {
    const clientID = import.meta.env.VITE_UNSTOPPABLE_DOMAINS_CLIENT_ID;
    const redirectUri =
      import.meta.env.VITE_UNSTOPPABLE_DOMAINS_REDIRECT_URI ||
      `${window.location.origin}/auth/unstoppable-callback`;

    if (clientID) {
      unstoppableDomainsService.initialize({
        clientID,
        redirectUri,
      });
    } else {
      console.warn('Unstoppable Domains Client ID not configured');
    }
  }, []);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const authenticated = await unstoppableDomainsService.isAuthenticated();
        setIsAuthenticated(authenticated);

        if (authenticated) {
          const userData = await unstoppableDomainsService.getUser();
          setUser(userData);
        }
      } catch (err: any) {
        console.error('Error checking Unstoppable Domains auth:', err);
        setError(err.message || 'Failed to check authentication status');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await unstoppableDomainsService.login();

      // After successful login, fetch user data
      const userData = await unstoppableDomainsService.getUser();
      setUser(userData);
      setIsAuthenticated(true);
    } catch (err: any) {
      console.error('Unstoppable Domains login error:', err);
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await unstoppableDomainsService.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (err: any) {
      console.error('Unstoppable Domains logout error:', err);
      setError(err.message || 'Logout failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getDomainName = useCallback(async () => {
    try {
      return await unstoppableDomainsService.getDomainName();
    } catch (err: any) {
      console.error('Error getting domain name:', err);
      return null;
    }
  }, []);

  const getWalletAddress = useCallback(async () => {
    try {
      return await unstoppableDomainsService.getWalletAddress();
    } catch (err: any) {
      console.error('Error getting wallet address:', err);
      return null;
    }
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    getDomainName,
    getWalletAddress,
  };
};

export default useUnstoppableDomains;
