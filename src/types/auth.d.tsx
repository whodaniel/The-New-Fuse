import { z } from "zod";
import { BaseEntity } from './index.js';
export interface User extends BaseEntity {
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  roles: string[];
  permissions: string[];
  mfaEnabled: boolean;
  mfaSecret?: string;
  lastLogin?: Date;
  status: UserStatus;
  emailVerified: boolean;
  preferences?: Record<string, any>;
  metadata?: UserMetadata;
}
export type UserStatus = "active" | "inactive" | "locked";
export declare enum AuthMethod {
  PASSWORD = "password",
  TOKEN = "token",
  OAUTH = "oauth",
  JWT = "jwt",
  API_KEY = "api_key",
  CERTIFICATE = "certificate",
}
export declare enum AuthEventType {
  LOGIN_SUCCESS = "login_success",
  LOGIN_FAILURE = "login_failure",
  LOGOUT = "logout",
  PASSWORD_RESET_REQUEST = "password_reset_request",
  PASSWORD_RESET_SUCCESS = "password_reset_success",
  PASSWORD_CHANGE = "password_change",
  ACCOUNT_LOCKED = "account_locked",
  ACCOUNT_UNLOCKED = "account_unlocked",
  TOKEN_REFRESH = "token_refresh",
  SESSION_REVOKED = "session_revoked",
}
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
}
export interface AuthToken {
  token: string;
  refreshToken: string;
  expiresAt: Date;
  type: "access" | "refresh";
}
export interface TokenPayload {
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
  mfaEnabled: boolean;
  deviceId?: string;
  iat?: number;
  exp?: number;
}
export interface LoginCredentials {
  email: string;
  password: string;
  mfaToken?: string;
  rememberMe?: boolean;
  deviceInfo?: DeviceInfo;
}
export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn?: number;
}
export interface AuthSession extends BaseEntity {
  userId: string;
  token: string;
  expiresAt: Date;
  ip?: string;
  userAgent?: string;
  deviceInfo?: DeviceInfo;
  authenticated: boolean;
}
export interface DeviceInfo {
  id?: string;
  name?: string;
  type?: string;
  ip: string;
  userAgent: string;
  lastUsed?: Date;
}
export interface UserMetadata {
  passwordHistory: string[];
  failedLoginAttempts: number;
  lastFailedLogin?: Date;
  devices: DeviceInfo[];
  [key: string]: unknown;
}
export interface MFAConfig {
  enabled: boolean;
  secret?: string;
  backupCodes?: string[];
  recoveryEmail?: string;
  lastVerified?: Date;
}
export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  username?: string;
  terms: boolean;
}
export interface ResetPasswordData {
  email?: string;
  code?: string;
  newPassword?: string;
  confirmPassword?: string;
}
export declare const UserCredentialsSchema: z.ZodObject<
  {
    username: z.ZodString;
    password: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
  },
  "strip",
  z.ZodTypeAny,
  {
    email?: string;
    password?: string;
    username?: string;
  },
  {
    email?: string;
    password?: string;
    username?: string;
  }
>;
export declare const TokenPayloadSchema: z.ZodObject<
  {
    sub: z.ZodString;
    email: z.ZodString;
    roles: z.ZodArray<z.ZodString, "many">;
    permissions: z.ZodArray<z.ZodString, "many">;
    exp: z.ZodOptional<z.ZodNumber>;
    iat: z.ZodOptional<z.ZodNumber>;
  },
  "strip",
  z.ZodTypeAny,
  {
    sub?: string;
    email?: string;
    roles?: string[];
    permissions?: string[];
    exp?: number;
    iat?: number;
  },
  {
    sub?: string;
    email?: string;
    roles?: string[];
    permissions?: string[];
    exp?: number;
    iat?: number;
  }
>;
export type UserCredentials = z.infer<typeof UserCredentialsSchema>;
export type ValidatedTokenPayload = z.infer<typeof TokenPayloadSchema>;
export interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  refreshTokenExpiresIn: string;
  bcryptSaltRounds: number;
  sessionTimeout: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    maxAge: number;
  };
}
export interface AuthEvent extends BaseEntity {
  type: AuthEventType;
  userId: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  success: boolean;
  metadata?: Record<string, any>;
}
