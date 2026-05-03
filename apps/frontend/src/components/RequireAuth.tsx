import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const REQAUTH_REDIRECT_KEY = '__tnf_require_auth_redirect__';

const isLandingDomain = () => {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'thenewfuse.com' || host === 'www.thenewfuse.com';
};

interface RequireAuthProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export const RequireAuth: React.FC<RequireAuthProps> = ({
  children,
  redirectTo = '/auth/login',
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const hasRedirected = useRef(false);

  useEffect(() => {
    hasRedirected.current = false;
    sessionStorage.removeItem(REQAUTH_REDIRECT_KEY);
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !hasRedirected.current) {
      const redirectCount = parseInt(sessionStorage.getItem(REQAUTH_REDIRECT_KEY) || '0', 10);
      if (redirectCount > 3) {
        console.warn('[RequireAuth] Redirect loop detected — clearing auth state and staying.');
        sessionStorage.removeItem(REQAUTH_REDIRECT_KEY);
        return;
      }
      sessionStorage.setItem(REQAUTH_REDIRECT_KEY, String(redirectCount + 1));
      hasRedirected.current = true;

      // If on the landing domain, redirect to the app subdomain for auth
      if (isLandingDomain()) {
        window.location.replace(
          `https://app.thenewfuse.com${redirectTo}${window.location.search}`
        );
        return;
      }

      navigate(redirectTo, { replace: true, state: { from: location } });
    }
  }, [isAuthenticated, isLoading, navigate, redirectTo, location]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};

export default RequireAuth;
