import TurnstileWidget from '@/components/auth/TurnstileWidget';
import { useAuth } from '@/providers/AuthProvider';
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const isTruthy = (value: string | undefined): boolean => {
  if (!value) return false;
  return ['1', 'true', 'yes', 'on', 'enabled'].includes(value.trim().toLowerCase());
};

const normalizeRole = (role: string | undefined | null): string => {
  if (!role) return '';
  return role
    .trim()
    .replace(/^role[:_\s-]*/i, '')
    .replace(/[\s-]+/g, '_')
    .toUpperCase();
};

const getRolesFromAuthResult = (authResult: any): string[] => {
  const user = authResult?.user || {};
  const rawRoles = Array.isArray(user.roles) && user.roles.length > 0 ? user.roles : [user.role];
  return rawRoles.map((role: string) => normalizeRole(role)).filter(Boolean);
};

const canAccessPath = (path: string, roles: string[]): boolean => {
  if (path.startsWith('/admin')) {
    return roles.includes('SUPER_ADMIN') || roles.includes('ADMIN');
  }

  if (path.startsWith('/agency')) {
    return ['AGENCY_OWNER', 'AGENCY_ADMIN', 'AGENCY_MANAGER'].some((role) => roles.includes(role));
  }

  return true;
};

const getSafeRedirectTarget = (candidate: string, roles: string[]): string => {
  if (!candidate || candidate === '/unauthorized') {
    return '/dashboard';
  }

  const path = candidate.startsWith('http') ? new URL(candidate).pathname : candidate;
  if (!canAccessPath(path, roles)) {
    return '/dashboard';
  }

  return candidate;
};

const Login: React.FC = () => {
  const { login, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cfTurnstileToken, setCfTurnstileToken] = useState<string | null>(null);

  const turnstileSiteKey = (import.meta.env.VITE_TURNSTILE_SITE_KEY || '').trim();
  const requireTurnstile = isTruthy(import.meta.env.VITE_AUTH_REQUIRE_TURNSTILE);

  const fromLocation = location.state?.from;
  const from = fromLocation
    ? `${fromLocation.pathname}${fromLocation.search}${fromLocation.hash}`
    : '/dashboard';

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (requireTurnstile && !cfTurnstileToken) {
        throw new Error('Please complete Turnstile verification');
      }

      const result = await login(email, password, {
        cfTurnstileToken: cfTurnstileToken || undefined,
      });
      const safeTarget = getSafeRedirectTarget(from, getRolesFromAuthResult(result));
      navigate(safeTarget, { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);
    try {
      const result = await signInWithGoogle();
      const safeTarget = getSafeRedirectTarget(from, getRolesFromAuthResult(result));
      navigate(safeTarget, { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Google sign-in failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-8">
        <h1 className="text-2xl font-semibold text-white">Sign in</h1>
        <p className="mt-2 text-sm text-slate-400">New Cloudflare-ready auth flow</p>

        {error && (
          <div className="mt-4 rounded-md border border-red-900 bg-red-950 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm text-slate-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-slate-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              placeholder="********"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>

          {turnstileSiteKey && (
            <div className="pt-2">
              <TurnstileWidget
                siteKey={turnstileSiteKey}
                action="login"
                onTokenChange={setCfTurnstileToken}
              />
            </div>
          )}
        </form>

        <div className="mt-4">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full rounded-md border border-slate-700 bg-white px-4 py-2 font-medium text-slate-900 hover:bg-slate-100 disabled:opacity-50"
          >
            Continue with Google
          </button>
        </div>

        <p className="mt-6 text-sm text-slate-400">
          Need an account?{' '}
          <Link to="/auth/register" className="text-blue-400 hover:text-blue-300">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
