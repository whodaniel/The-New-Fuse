import { z } from 'zod';
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
export interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    loading: boolean;
    error: string | null;
}
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
export interface MFAState {
    isSetup: boolean;
    method: MFAMethod;
    secret?: string;
    backupCodes?: string[];
}
export type MFAMethod = 'totp' | 'sms' | 'email';
export declare const emailSchema: z.ZodString;
export declare const passwordSchema: z.ZodString;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    rememberMe: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const registerSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    confirmPassword: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    acceptTerms: z.ZodBoolean;
}, z.core.$strip>;
export declare const resetPasswordSchema: z.ZodObject<{
    email: z.ZodString;
    code: z.ZodOptional<z.ZodString>;
    newPassword: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
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
import { AuthenticationError } from '../../types/error';
export type { AuthenticationError as AuthError };
