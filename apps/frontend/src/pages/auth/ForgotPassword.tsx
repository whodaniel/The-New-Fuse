import { GlassCard, PremiumButton, PremiumInput } from '@/components/ui/premium';
import { useAuth } from '@/hooks/useAuth';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, CheckCircle, Mail } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const ForgotPassword = () => {
  const { forgotPassword } = useAuth();
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: { email: string }) => {
    try {
      setError('');
      await forgotPassword(data.email);
      setIsEmailSent(true);
    } catch (err: any) {
      console.error('Password reset request failed:', err);
      setError(err.message || 'Failed to send reset link. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] relative overflow-hidden p-4 sm:p-6 lg:p-8">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-md w-full z-10">
        <GlassCard className="p-6 sm:p-8 lg:p-10 space-y-6 lg:space-y-8">
          {isEmailSent ? (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Check your email</h3>
                <p className="mt-2 text-sm text-gray-400">
                  We have sent you a password reset link. Please check your email and follow the
                  instructions.
                </p>
              </div>
              <PremiumButton variant="outline" fullWidth onClick={() => setIsEmailSent(false)}>
                Try another email
              </PremiumButton>
              <Link
                to="/auth/login"
                className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to login
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Forgot your password?
                </h2>
                <p className="mt-2 text-sm text-gray-400">
                  Enter your email address and we'll send you a link to reset your password.
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

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <PremiumInput
                  label="Email address"
                  type="email"
                  placeholder="john@example.com"
                  icon={Mail}
                  {...register('email')}
                  error={errors.email?.message}
                />

                <PremiumButton
                  type="submit"
                  disabled={isSubmitting}
                  loading={isSubmitting}
                  fullWidth
                  variant="gradient"
                >
                  Send Reset Link
                </PremiumButton>
              </form>

              <div className="text-center">
                <Link
                  to="/auth/login"
                  className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back to login
                </Link>
              </div>
            </>
          )}
        </GlassCard>
      </div>
    </div>
  );
};

export default ForgotPassword;
