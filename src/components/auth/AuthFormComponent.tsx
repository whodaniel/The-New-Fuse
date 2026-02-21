import { FC, useEffect, useState, JSX } from 'react';
import { FC, useState } from "react";
import { ModuleProps } from "@/types/component-types";
import { useAuth } from '@/hooks/useAuth';
import { loginSchema, registerSchema, resetSchema } from 'packages/types/src/auth/schemas';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

interface AuthFormComponentProps extends ModuleProps {
  initialMode?: 'login' | 'register' | 'reset' | 'verify' | '2fa';
}

export const AuthFormComponent: FC<AuthFormComponentProps> = ({ className, initialMode = 'login' }) => {
  const [mode, setMode] = useState< 'login' | 'register' | 'reset'>(initialMode);
  const { state, signIn, signUp, signOut, resetPassword, verify2FA, setup2FA, updateProfile, refreshSession } = useAuth();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(mode === 'login' ? loginSchema : registerSchema), // Conditional schema
  });

  const handleLoginSubmit = async (): Promise<void> {data: any) => {
    
    await signIn(data.email, data.password);
  };

  const handleRegisterSubmit = async (): Promise<void> {data: any) => { // Handler for register submit
    
    await signUp(data.email, data.password, data.name);
  };

  const onSubmit = handleSubmit(mode === 'login' ? handleLoginSubmit : handleRegisterSubmit);

  return (
    <div className={className}>
      <h1>Auth Form Component</h1>
      {state.isLoading && <div>Loading...</div>}
      {state.error && <div style={{ color: 'red' }}>Error: {state.error.message}</div>}

      {/* Conditionally render Login or Register form */}
      {mode === 'login' ? (
        <form onSubmit={onSubmit} className="space-y-4"> {/* Login Form */}
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input {...register('email')} type="email" className="w-full rounded-md border p-2" placeholder="Enter your email" />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input {...register('password')} type="password" className="w-full rounded-md border p-2" placeholder="Enter your password" />
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50">
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
          <button type="button" onClick={() => setMode('register')} className="text-sm text-blue-500 hover:underline block text-center mt-2">
            Create an account
          </button>
        </form>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4"> {/* Register form */}
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input {...register('name')} type="text" className="w-full rounded-md border p-2" placeholder="Your full name" />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input {...register('email')} type="email" className="w-full rounded-md border p-2" placeholder="Enter your email" />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input {...register('password')} type="password" className="w-full rounded-md border p-2" placeholder="Create a password" />
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Confirm Password</label>
            <input {...register('confirmPassword')} type="password" className="w-full rounded-md border p-2" placeholder="Confirm your password" />
            {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>}
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50">
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </button>
          <button type="button" onClick={() => setMode('login')} className="text-sm text-blue-500 hover:underline block text-center mt-2">
            Already have an account? Sign in
          </button>
        </form>
      )}
    </div>
  );
};
