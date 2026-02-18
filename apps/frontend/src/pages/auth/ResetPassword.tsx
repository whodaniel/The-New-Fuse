import { PremiumButton, PremiumInput } from '@/components/ui/premium';
import { useAuth } from '@/hooks/useAuth';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
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
  var _a, _b;
  const { token } = useParams();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
  });
  const onSubmit = async (data) => {
    try {
      if (!token) {
        throw new Error('Reset token is missing');
      }
      await resetPassword(token, data.password);
      navigate('/auth/login', {
        replace: true,
        state: { message: 'Password reset successful. Please login with your new password.' },
      });
    } catch (error) {
      console.error('Password reset failed:', error);
    }
  };
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h3 className="text-lg font-medium">Reset your password</h3>
        <p className="text-sm text-muted-foreground">Enter your new password below.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <PremiumInput label="New Password" type="password" {...register('password')} />
        <PremiumInput
          label="Confirm New Password"
          type="password"
          {...register('confirmPassword')}
        />
        <PremiumButton type="submit" fullWidth loading={isSubmitting}>
          Reset Password
        </PremiumButton>
      </form>
    </div>
  );
};
export default ResetPassword;
