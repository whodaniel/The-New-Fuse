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
  const { isAuthenticated, isLoading, isSlowLoading } = useAuth();
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
        window.location.replace(`https://app.thenewfuse.com${redirectTo}${window.location.search}`);
        return;
      }

      navigate(redirectTo, { replace: true, state: { from: location } });
    }
  }, [isAuthenticated, isLoading, navigate, redirectTo, location]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-200">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6"></div>
        <div className="text-center px-6">
          <h1 className="text-xl font-bold mb-2">The New Fuse</h1>
          <p className="text-slate-400 text-sm animate-pulse">
            {isSlowLoading
              ? 'Connecting to secure session... this is taking longer than usual.'
              : 'Synchronizing system state...'}
          </p>
          {isSlowLoading && (
            <button
              onClick={() => window.location.reload()}
              className="mt-8 text-xs text-blue-400 hover:text-blue-300 underline underline-offset-4"
            >
              Reload application
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};

export default RequireAuth;
