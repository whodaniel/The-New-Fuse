import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input } from '@/components/core';
import { useAuth } from '@/hooks/useAuth';
const resetPasswordSchema = z.object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});
const ResetPassword = () => {
    var _a, _b;
    const { token } = useParams();
    const navigate = useNavigate();
    const { resetPassword } = useAuth();
    const { register, handleSubmit, formState: { errors, isSubmitting }, } = useForm({
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
                state: { message: 'Password reset successful. Please login with your new password.' }
            });
        }
        catch (error) {
            console.error('Password reset failed:', error);
        }
    };
    return (<div className="space-y-6">
      <div className="space-y-2 text-center">
        <h3 className="text-lg font-medium">Reset your password</h3>
        <p className="text-sm text-muted-foreground">
          Enter your new password below.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="New Password" type="password" error={!!errors.password} helperText={(_a = errors.password) === null || _a === void 0 ? void 0 : _a.message} {...register('password')}/>
        <Input label="Confirm New Password" type="password" error={!!errors.confirmPassword} helperText={(_b = errors.confirmPassword) === null || _b === void 0 ? void 0 : _b.message} {...register('confirmPassword')}/>
        <Button type="submit" className="w-full" loading={isSubmitting}>
          Reset Password
        </Button>
      </form>
    </div>);
};
export default ResetPassword;
//# sourceMappingURL=ResetPassword.js.map