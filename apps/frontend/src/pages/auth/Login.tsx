// @ts-nocheck
import TurnstileWidget from '@/components/auth/TurnstileWidget';
import { useAuth } from '@/providers/AuthProvider';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

const isTruthy = (value: string | undefined): boolean => {
  if (!value) return false;
  return ['1', 'true', 'yes', 'on', 'enabled'].includes(value.trim().toLowerCase());
};

const LOGIN_REDIRECT_COUNT_KEY = '__tnf_login_redirect_count__';

// Map OAuth / Supabase / generic error codes to copy that tells the user what happened
// instead of dumping a machine token into the UI.
const LOGIN_ERROR_MESSAGES: Record<string, string> = {
  auth_failed: 'Authentication failed. Please try signing in again.',
  no_auth_data: 'Sign-in callback arrived without valid credentials. Please try again.',
  invalid_token: 'The sign-in link is invalid or has been tampered with.',
  invalid_token_format: 'The sign-in token is malformed. Please request a new link.',
  access_denied: 'Access denied. The provider declined to share credentials.',
  server_error: 'The identity provider reported an error. Please try again shortly.',
};

// Defensive cap on how long a URL-supplied error message can be before we treat it as
// garbage (or a reflected XSS attempt) and replace it with a generic notice.
const URL_ERROR_MAX_LEN = 240;

const resolveUrlError = (raw: string | null): string | null => {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const mapped = LOGIN_ERROR_MESSAGES[trimmed.toLowerCase()];
  if (mapped) return mapped;
  // Strip control characters and cap length so an attacker can't inject markup via ?error=
  const sanitized = trimmed.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, URL_ERROR_MAX_LEN);
  if (!sanitized) return null;
  // Treat anything that looks like a raw OAuth error wrapped in HTML / script tags as untrusted.
  if (/<|\bon\w+=/i.test(sanitized)) {
    return 'Authentication failed. Please try signing in again.';
  }
  // Generic fallback — let the user see the upstream message if it's reasonable text.
  return `Authentication failed: ${sanitized}`;
};

const Login: React.FC = () => {
  const {
    isAuthenticated,
    isLoading: isAuthLoading,
    login,
    signInWithGoogle,
    signInWithMagicLink,
  } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(() => {
    // Read ?error=... on first mount so OAuth callbacks (e.g. ?error=auth_failed)
    // surface a real message instead of silently dumping a raw code into the URL.
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    return resolveUrlError(params.get('error')) ?? '';
  });
  const [isLoading, setIsLoading] = useState(false);
  const [cfTurnstileToken, setCfTurnstileToken] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const turnstileSiteKey = (import.meta.env.VITE_TURNSTILE_SITE_KEY || '').trim();
  const requireTurnstile = isTruthy(import.meta.env.VITE_AUTH_REQUIRE_TURNSTILE);

  useEffect(() => {
    // Re-evaluate the error message if the URL changes while the page is mounted
    // (e.g. user triggers a second OAuth attempt that fails).
    const incoming = searchParams.get('error');
    const resolved = resolveUrlError(incoming);
    if (resolved) {
      setError(resolved);
      // Strip ?error from the URL so a refresh doesn't re-show the same toast.
      const next = new URLSearchParams(searchParams);
      next.delete('error');
      next.delete('error_description');
      setSearchParams(next, { replace: true });
    }
    // We intentionally only depend on searchParams identity to avoid loops with setSearchParams.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated) return;

    const currentPath = window.location.pathname;
    if (currentPath === '/dashboard' || currentPath === '/dashboard/') {
      return;
    }

    const redirectCount = parseInt(sessionStorage.getItem(LOGIN_REDIRECT_COUNT_KEY) || '0', 10);
    if (redirectCount > 2) {
      console.warn('[Login] Redirect loop detected — clearing sessionStorage and staying on login.');
      sessionStorage.removeItem(LOGIN_REDIRECT_COUNT_KEY);
      return;
    }

    sessionStorage.setItem(LOGIN_REDIRECT_COUNT_KEY, String(redirectCount + 1));
    navigate('/dashboard', { replace: true });
  }, [isAuthenticated, isAuthLoading, navigate]);

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
      if (result) navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
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
      if (result?.method !== 'google_redirect') {
        navigate('/dashboard', { replace: true });
      }
    } catch (err: unknown) {
      setError(err?.message || 'Google sign-in failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLink = async () => {
    setError('');
    if (!email) {
      setError('Enter your email to receive a magic link.');
      return;
    }
    setIsLoading(true);
    try {
      await signInWithMagicLink(email);
      setError('Magic link sent. Check your inbox to continue.');
    } catch (err: unknown) {
      setError(err?.message || 'Failed to send magic link');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md rounded-md border border-slate-800 bg-slate-900 p-4">
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

          {requireTurnstile && turnstileSiteKey && (
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
            className="w-full rounded-md border border-slate-700 bg-transparent px-4 py-2 font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            Continue with Google
          </button>
        </div>

        <div className="mt-3">
          <button
            type="button"
            onClick={handleMagicLink}
            disabled={isLoading}
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-2 font-medium text-slate-200 hover:bg-slate-900 disabled:opacity-50"
          >
            Send magic link
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
