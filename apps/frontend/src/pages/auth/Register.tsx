// @ts-nocheck
import TurnstileWidget from '@/components/auth/TurnstileWidget';
import { useAuth } from '@/providers/AuthProvider';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const isTruthy = (value: string | undefined): boolean => {
  if (!value) return false;
  return ['1', 'true', 'yes', 'on', 'enabled'].includes(value.trim().toLowerCase());
};

const Register: React.FC = () => {
  const { isAuthenticated, isLoading: isAuthLoading, register, signInWithGoogle } = useAuth();
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
  const requireTurnstile = isTruthy(import.meta.env.VITE_AUTH_REQUIRE_TURNSTILE);

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
      if (requireTurnstile && !cfTurnstileToken) {
        throw new Error('Please complete Turnstile verification');
      }

      const result = await register(name, email, password, {
        inviteCode: inviteCode.trim() || undefined,
        cfTurnstileToken: cfTurnstileToken || undefined,
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
      if (result?.method !== 'google_redirect') {
        navigate('/dashboard', { replace: true });
      }
    } catch (err: unknown) {
      setError(err?.message || 'Google sign-up failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md rounded-md border border-slate-800 bg-slate-900 p-4">
        <h1 className="text-2xl font-semibold text-white">Create account</h1>
        <p className="mt-2 text-sm text-slate-400">Fresh register flow for Cloudflare auth</p>

        {error && (
          <div className="mt-4 rounded-md border border-red-900 bg-red-950 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-md mb-4">
            <label className="block text-[10px] uppercase tracking-widest text-blue-400 font-bold mb-1">
              Canonical Identity (Exacting Tracking)
            </label>
            <div className="font-mono text-xs text-blue-200/70 break-all">
              user_{name.toLowerCase().replace(/[^a-z0-9]/g, '') || '...'}_[TIMESTAMP]
            </div>
            <p className="text-[9px] text-gray-400 mt-1">
              Your unique protocol identifier for strict attribution and mesh sovereignty.
            </p>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm text-slate-300">
              Name
            </label>
            <input
              id="name"
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

        <div className="mt-4">
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={isLoading}
            className="w-full rounded-md border border-slate-700 bg-transparent px-4 py-2 font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            Continue with Google
          </button>
        </div>

        <p className="mt-6 text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/auth/login" className="text-blue-400 hover:text-blue-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
