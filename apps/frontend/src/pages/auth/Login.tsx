import { GlassCard, PremiumButton, PremiumInput } from '@/components/ui/premium';
import { useUnstoppableDomains } from '@/hooks/useUnstoppableDomains';
import { useAuth } from '@/providers/AuthProvider';
import { Key, Lock, Mail } from 'lucide-react';
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [userId, setUserId] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');

  const { login, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { login: loginWithUD } = useUnstoppableDomains();

  // Redirect to the page the user was trying to access, or dashboard by default
  const fromLocation = location.state?.from;
  const from = fromLocation
    ? `${fromLocation.pathname}${fromLocation.search}${fromLocation.hash}`
    : '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // If we are in 2FA mode
      if (requires2FA) {
        // Handle 2FA submission with backend
        const response = await fetch('/api/auth/verify-2fa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, code: twoFactorCode }),
        });

        if (!response.ok) {
          throw new Error('Invalid 2FA code');
        }

        navigate(from, { replace: true });
        return;
      }

      // Normal Login
      const result = await login(email, password);

      // Check for 2FA claim
      if (result.method === 'firebase' && result.user) {
        const idTokenResult = await result.user.getIdTokenResult();
        if (idTokenResult.claims['2faEnabled']) {
          setUserId(result.user.uid);
          setRequires2FA(true);
          setIsLoading(false);
          return;
        }
      }

      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setIsLoading(true);

      const result = await signInWithGoogle();

      if (result.method === 'oauth-redirect' || !result.user) {
        return;
      }

      const user = result.user;

      // Check if 2FA is enabled for this user
      const idTokenResult = await user.getIdTokenResult();
      if (idTokenResult.claims['2faEnabled']) {
        setUserId(user.uid);
        setRequires2FA(true);
        return;
      }

      navigate(from, { replace: true });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Google sign in failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnstoppableDomainsLogin = async () => {
    try {
      setError('');
      setIsLoading(true);
      await loginWithUD();
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('UD Login error:', err);
      setError(err.message || 'Unstoppable Domains login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Google SVG Icon Component
  const GoogleIcon = () => (
    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] relative overflow-hidden p-4 sm:p-6 lg:p-8">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-md lg:max-w-lg w-full z-10">
        <GlassCard className="p-6 sm:p-8 lg:p-10 space-y-6 lg:space-y-8">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
              {requires2FA ? 'Two-Factor Authentication' : 'Welcome back'}
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              {requires2FA
                ? 'Please enter the code from your authenticator app'
                : 'Sign in to your account'}
            </p>
          </div>

          {error && (
            <div
              className="bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-3 rounded-lg text-sm"
              role="alert"
            >
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {requires2FA ? (
              <PremiumInput
                label="Authentication Code"
                id="code"
                type="text"
                required
                autoComplete="one-time-code"
                value={twoFactorCode}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setTwoFactorCode(e.target.value)
                }
                className="text-center tracking-widest text-lg"
                placeholder="000000"
                icon={Lock}
              />
            ) : (
              <div className="space-y-4">
                <PremiumInput
                  label="Email address"
                  id="email"
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  icon={Mail}
                />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                      Password
                    </label>
                    <Link
                      to="/auth/forgot-password"
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <PremiumInput
                    id="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPassword(e.target.value)
                    }
                    placeholder="••••••••"
                    icon={Key}
                    className="mt-0"
                  />
                </div>
              </div>
            )}

            {!requires2FA && (
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-white/10 rounded bg-white/5"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-400">
                  Remember me
                </label>
              </div>
            )}

            <PremiumButton
              type="submit"
              disabled={isLoading}
              loading={isLoading}
              fullWidth
              variant="gradient"
            >
              {requires2FA ? 'Verify Code' : 'Sign in'}
            </PremiumButton>
          </form>

          {!requires2FA && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-transparent text-gray-500">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <PremiumButton
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  variant="outline"
                  fullWidth
                >
                  <GoogleIcon />
                  Google
                </PremiumButton>

                <PremiumButton
                  onClick={handleUnstoppableDomainsLogin}
                  disabled={isLoading}
                  variant="outline"
                  fullWidth
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-3.87-.96-7-5.54-7-10V8.3l7-3.5 7 3.5V10c0 4.46-3.13 9.04-7 10z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  Unstoppable Domains
                </PremiumButton>
              </div>
            </>
          )}

          <p className="text-center text-sm text-gray-400">
            Don't have an account?{' '}
            <Link
              to="/auth/register"
              className="font-medium text-blue-400 hover:text-blue-300 transition-colors"
            >
              Sign up
            </Link>
          </p>
        </GlassCard>
      </div>
    </div>
  );
};

export default Login;
