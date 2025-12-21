import { GlassCard, PremiumButton, PremiumInput } from '@/components/ui/premium';
import { useAuth } from '@/providers/AuthProvider';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowRight, CheckCircle, Lock, Mail, User } from 'lucide-react';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const GoogleIcon = ({ className }: { className?: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" className={className}>
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { register, signInWithGoogle } = useAuth();

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Google sign up failed.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!agreedToTerms) {
      setError('Please agree to the Terms and Privacy Policy.');
      return;
    }

    setIsLoading(true);

    try {
      await register(name, email, password);
      navigate('/dashboard');
    } catch (err: unknown) {
      console.error(err);
      const errorMessage =
        err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md lg:max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6 lg:space-y-8"
        >
          {/* Logo/Brand */}
          <div className="text-center">
            <h2 className="text-2xl lg:text-3xl font-semibold text-white mb-2">The New Fuse</h2>
            <p className="text-gray-400 text-sm lg:text-base">AI Agent Orchestration Platform</p>
          </div>

          {/* Main Card */}
          <GlassCard className="w-full p-6 sm:p-8 lg:p-10 backdrop-blur-xl border-zinc-800/50">
            <div className="space-y-6">
              {/* Header */}
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-white">Create your account</h1>
                <p className="text-gray-400">Deploy autonomous AI agents in minutes</p>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-200">{error}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <PremiumInput
                  id="name"
                  label="Full Name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                  required
                  icon={User}
                  iconPosition="left"
                />

                <PremiumInput
                  id="email"
                  type="email"
                  label="Email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  required
                  icon={Mail}
                  iconPosition="left"
                />

                <PremiumInput
                  id="password"
                  type="password"
                  label="Password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  required
                  icon={Lock}
                  iconPosition="left"
                />

                <PremiumInput
                  id="confirmPassword"
                  type="password"
                  label="Confirm Password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                  required
                  icon={Lock}
                  iconPosition="left"
                />

                {/* Terms */}
                <div className="flex items-start gap-2 pt-2">
                  <div className="relative flex items-center">
                    <input
                      id="terms"
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="peer h-4 w-4 rounded border-zinc-700 bg-black text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer appearance-none checked:bg-blue-600 checked:border-transparent"
                    />
                    <CheckCircle className="absolute hidden w-3 h-3 text-white pointer-events-none peer-checked:block left-0.5" />
                  </div>

                  <label
                    htmlFor="terms"
                    className="text-sm text-gray-400 cursor-pointer select-none"
                  >
                    I agree to the{' '}
                    <Link to="/legal/terms" className="text-blue-400 hover:text-blue-300 underline">
                      Terms
                    </Link>{' '}
                    and{' '}
                    <Link
                      to="/legal/privacy"
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      Privacy Policy
                    </Link>
                  </label>
                </div>

                {/* Submit */}
                <PremiumButton
                  type="submit"
                  disabled={isLoading}
                  fullWidth
                  variant="gradient"
                  loading={isLoading}
                  icon={ArrowRight}
                  iconPosition="right"
                >
                  Create account
                </PremiumButton>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-4 py-2">
                <div className="h-px flex-1 bg-zinc-700/50"></div>
                <span className="text-xs text-gray-500">Or</span>
                <div className="h-px flex-1 bg-zinc-700/50"></div>
              </div>

              {/* Google */}
              <PremiumButton
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                fullWidth
                variant="secondary" // Gray/Glass look
                className="bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
              >
                <GoogleIcon className="mr-2" />
                Continue with Google
              </PremiumButton>

              {/* Sign in link */}
              <p className="text-center text-sm text-gray-400">
                Already have an account?{' '}
                <Link
                  to="/auth/login"
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </GlassCard>

          {/* Footer */}
          <p className="text-center text-xs text-gray-600">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
