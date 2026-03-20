// @ts-nocheck
import TurnstileWidget from '@/components/auth/TurnstileWidget';
import { useAuth } from '@/providers/AuthProvider';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const isTruthy = (value: string | undefined): boolean => {
  if (!value) return false;
  return ['1', 'true', 'yes', 'on', 'enabled'].includes(value.trim().toLowerCase());
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
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cfTurnstileToken, setCfTurnstileToken] = useState<string | null>(null);

  const turnstileSiteKey = (import.meta.env.VITE_TURNSTILE_SITE_KEY || '').trim();
  const requireTurnstile = isTruthy(import.meta.env.VITE_AUTH_REQUIRE_TURNSTILE);

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
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
            className="w-full rounded-md border border-slate-700 bg-transparent px-4 py-2 font-medium text-slate-900 hover:bg-slate-100 disabled:opacity-50"
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
