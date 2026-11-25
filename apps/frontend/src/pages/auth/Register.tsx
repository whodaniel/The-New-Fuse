// @ts-nocheck
import GuestFooter from '@/components/auth/GuestFooter';
import TurnstileWidget from '@/components/auth/TurnstileWidget';
import { useAuth } from '@/providers/AuthProvider';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TnfLogo } from '../../components/brand/TnfLogo';

const isTruthy = (value: string | undefined): boolean => {
  if (!value) return false;
  return ['1', 'true', 'yes', 'on', 'enabled'].includes(value.trim().toLowerCase());
};

const Register: React.FC = () => {
  const {
    isAuthenticated,
    isLoading: isAuthLoading,
    register,
    signInWithGoogle,
    signInWithGitHub,
    signInWithMagicLink,
  } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [inviteOnly, setInviteOnly] = useState(
    isTruthy(import.meta.env.VITE_AUTH_INVITE_ONLY || '')
  );
  const [cfTurnstileToken, setCfTurnstileToken] = useState<string | null>(null);

  const turnstileSiteKey = (import.meta.env.VITE_TURNSTILE_SITE_KEY || '').trim();
  const requireTurnstile =
    isTruthy(import.meta.env.VITE_AUTH_REQUIRE_TURNSTILE) && Boolean(turnstileSiteKey);

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isAuthLoading, navigate]);

  useEffect(() => {
    let ignore = false;
    const checkInvitePolicy = async () => {
      const endpoints = ['/api/auth/invite-policy', '/v1/auth/invite-policy'];
      try {
        for (const endpoint of endpoints) {
          const res = await fetch(endpoint);
          if (!res.ok) continue;
          const payload = await res.json();
          if (!ignore && typeof payload?.inviteOnly === 'boolean') {
            setInviteOnly(payload.inviteOnly);
            return;
          }
        }
      } catch {
        // Keep env fallback value.
      }
    };
    checkInvitePolicy();
    return () => {
      ignore = true;
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (inviteOnly && !inviteCode.trim()) {
      setError('Invite code is required for registration');
      return;
    }

    setIsLoading(true);
    try {
      const turnstileToken =
        cfTurnstileToken && cfTurnstileToken !== 'bypass' && cfTurnstileToken !== ' bypass'
          ? cfTurnstileToken
          : undefined;

      const result = await register(name, email, password, {
        inviteCode: inviteCode.trim() || undefined,
        cfTurnstileToken: turnstileToken,
      });

      if (result?.requiresEmailVerification) {
        setError(result.message || 'Check your email to verify your account, then sign in.');
        return;
      }

      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      setError(err?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result?.method === 'google_redirect') return;
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : (err as { message?: string })?.message;
      setError(message || 'Google sign-up failed');
      setIsLoading(false);
    }
  };

  const handleGitHubSignUp = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const result = await signInWithGitHub();
      if (result?.method === 'github_redirect') return;
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : (err as { message?: string })?.message;
      setError(message || 'GitHub sign-up failed');
      setIsLoading(false);
    }
  };

  const handleMagicLink = async () => {
    setError(null);
    if (!email) {
      setError('Enter your email to receive a magic link.');
      return;
    }
    setIsLoading(true);
    try {
      await signInWithMagicLink(email, '/dashboard');
      setError('Magic link sent. Check your inbox to continue.');
    } catch (err: unknown) {
      setError(err?.message || 'Failed to send magic link');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md rounded-md border border-slate-800 bg-slate-900 p-4">
        <div className="mb-6 flex justify-center">
          <TnfLogo size={48} showWordmark wordmarkClassName="text-lg text-white" />
        </div>
        <h1 className="text-2xl font-semibold text-white">Create account</h1>
        <p className="mt-2 text-sm text-slate-400">
          Create your The New Fuse (TNF) account to start orchestrating your AI agents.
        </p>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-md border border-red-900 bg-red-950 p-3 text-sm text-red-200"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm text-slate-300">
              Name
            </label>
            <input
              id="name"
              autoComplete="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              placeholder="Jane Doe"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm text-slate-300">
              Email
            </label>
            <input
              id="email"
              autoComplete="username"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              placeholder="you@example.com"
            />
          </div>

          {inviteOnly && (
            <div>
              <label htmlFor="inviteCode" className="block text-sm text-slate-300">
                Invite code
              </label>
              <input
                id="inviteCode"
                type="text"
                required
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                placeholder="TNF-XXXX-XXXX"
              />
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm text-slate-300">
              Password
            </label>
            <input
              id="password"
              autoComplete="new-password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              placeholder="At least 8 characters"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm text-slate-300">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              autoComplete="new-password"
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              placeholder="Repeat password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50"
          >
            {isLoading ? 'Creating account...' : 'Create account'}
          </button>

          <p className="text-sm text-slate-400">
            By creating an account, you agree to our{' '}
            <Link to="/legal/terms" className="text-blue-400 hover:text-blue-300">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/legal/privacy" className="text-blue-400 hover:text-blue-300">
              Privacy Policy
            </Link>
            .
          </p>

          {requireTurnstile && turnstileSiteKey && (
            <div className="pt-2">
              <TurnstileWidget
                siteKey={turnstileSiteKey}
                action="register"
                onTokenChange={setCfTurnstileToken}
              />
            </div>
          )}
        </form>

        <div className="mt-6 flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-slate-700" />
          <span className="text-xs uppercase tracking-wide text-slate-500">or continue with</span>
          <span className="h-px flex-1 bg-slate-700" />
        </div>

        <div className="mt-4 space-y-3">
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={isLoading}
            className="w-full rounded-md border border-slate-700 bg-transparent px-4 py-2 font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            Continue with Google
          </button>
          <button
            type="button"
            onClick={handleGitHubSignUp}
            disabled={isLoading}
            className="w-full rounded-md border border-slate-700 bg-transparent px-4 py-2 font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            Continue with GitHub
          </button>
          <button
            type="button"
            onClick={handleMagicLink}
            disabled={isLoading}
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-2 font-medium text-slate-200 hover:bg-slate-900 disabled:opacity-50"
          >
            Email me a magic link
          </button>
        </div>

        <p className="mt-6 text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/auth/login" className="text-blue-400 hover:text-blue-300">
            Sign in
          </Link>
        </p>

        <GuestFooter />
      </div>
    </main>
  );
};

export default Register;
