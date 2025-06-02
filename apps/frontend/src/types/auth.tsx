import { z } from 'zod';

// Base User interface
export interface User {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  isEmailVerified: boolean;
  isMFAEnabled: boolean;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme?: 'light' | 'dark';
  notifications?: NotificationPreferences;
  timezone?: string;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
}

// Auth States
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

// Session Types
export interface Session {
  id: string;
  userId: string;
  email: string;
  deviceInfo: DeviceInfo;
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
}

export interface DeviceInfo {
  userAgent: string;
  ip: string;
  deviceId?: string;
  platform?: string;
  browser?: string;
}

// Security Types
export interface SecurityConfig {
  maxLoginAttempts: number;
  lockoutDuration: number;
  requireCaptcha: boolean;
  mfaRequired: boolean;
  passwordPolicy: PasswordPolicy;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  maxAge: number;
}

export interface LockoutStatus {
  locked: boolean;
  remainingTime: number;
  attempts: number;
}

// MFA Types
export interface MFAState {
  isSetup: boolean;
  method: MFAMethod;
  secret?: string;
  backupCodes?: string[];
}

export type MFAMethod = 'totp' | 'sms' | 'email';

// Form Schemas
export const emailSchema = z.string().email('Invalid email address');

export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  rememberMe: z.boolean().optional(),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  acceptTerms: z.boolean().refine((val) => val === true, 'You must accept the terms'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const resetPasswordSchema = z.object({
  email: emailSchema,
  code: z.string().optional(),
  newPassword: passwordSchema.optional(),
});

// API Response Types
export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  mfaRequired?: boolean;
}

export interface MFAResponse {
  success: boolean;
  sessionToken?: string;
}

export interface VerificationResponse {
  success: boolean;
  message: string;
}

// Error Types
// Local AuthError and AuthErrorCode removed
// Re-exporting AuthenticationError from src/types/error.tsx as AuthError for compatibility
import { AuthenticationError } from '../../types/error.tsx';
export type { AuthenticationError as AuthError };
