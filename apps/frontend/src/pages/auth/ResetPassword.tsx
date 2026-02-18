import { useState } from 'react';
import { GlassCard, PremiumButton, PremiumInput } from '@/components/ui/premium';
import { useAuth } from '@/hooks/useAuth';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const oobCode = searchParams.get('oobCode');
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: { password: string; confirmPassword: string }) => {
    try {
      setError('');
      if (!oobCode) {
        throw new Error('Invalid or missing reset link. Please request a new password reset.');
      }
      await resetPassword(oobCode, data.password);
      navigate('/auth/login', {
        replace: true,
        state: { message: 'Password reset successful. Please login with your new password.' },
      });
    } catch (err: any) {
      console.error('Password reset failed:', err);
      setError(err.message || 'Failed to reset password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] relative overflow-hidden p-4 sm:p-6 lg:p-8">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-md w-full z-10">
        <GlassCard className="p-6 sm:p-8 lg:p-10 space-y-6 lg:space-y-8">
          <div className="space-y-2 text-center">
            <h3 className="text-2xl font-bold text-white">Reset your password</h3>
            <p className="text-sm text-gray-400">Enter your new password below.</p>
          </div>

          {error && (
            <div
              className="bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-3 rounded-lg text-sm"
              role="alert"
            >
              {error}
            </div>
          )}

          {!oobCode ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-red-300">
                This reset link is invalid or has expired.
              </p>
              <Link to="/auth/forgot-password">
                <PremiumButton variant="gradient" fullWidth>
                  Request a new reset link
                </PremiumButton>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <PremiumInput
                label="New Password"
                type="password"
                {...register('password')}
                error={errors.password?.message}
              />
              <PremiumInput
                label="Confirm New Password"
                type="password"
                {...register('confirmPassword')}
                error={errors.confirmPassword?.message}
              />
              <PremiumButton type="submit" fullWidth loading={isSubmitting} variant="gradient">
                Reset Password
              </PremiumButton>
            </form>
          )}

          <div className="text-center">
            <Link
              to="/auth/login"
              className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to login
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default ResetPassword;
