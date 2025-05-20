import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
const forgotPasswordSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
});
const ForgotPassword = () => {
    var _a;
    const { forgotPassword } = useAuth();
    const [isEmailSent, setIsEmailSent] = useState(false);
    const { register, handleSubmit, formState: { errors, isSubmitting }, } = useForm({
        resolver: zodResolver(forgotPasswordSchema),
    });
    const onSubmit = async (data) => {
        try {
            await forgotPassword(data.email);
            setIsEmailSent(true);
        }
        catch (error) {
            console.error('Password reset request failed:', error);
        }
    };
    if (isEmailSent) {
        return (<div className="space-y-4 text-center">
        <h3 className="text-lg font-medium">Check your email</h3>
        <p className="text-sm text-muted-foreground">
          We have sent you a password reset link. Please check your email.
        </p>
        <Button variant="link" onClick={() => setIsEmailSent(false)}>
          Try another email
        </Button>
      </div>);
    }
    return (<div className="space-y-6">
      <div className="space-y-2 text-center">
        <h3 className="text-lg font-medium">Forgot your password?</h3>
        <p className="text-sm text-muted-foreground">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Email" type="email" error={!!errors.email} helperText={(_a = errors.email) === null || _a === void 0 ? void 0 : _a.message} {...register('email')}/>
        <Button type="submit" className="w-full" loading={isSubmitting}>
          Send Reset Link
        </Button>
      </form>

      <div className="text-center">
        <Link to="/auth/login" className="text-sm text-muted-foreground hover:underline">
          Back to login
        </Link>
      </div>
    </div>);
};
export default ForgotPassword;
//# sourceMappingURL=ForgotPassword.js.map