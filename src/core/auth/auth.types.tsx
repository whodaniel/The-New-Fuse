export interface User {
  token?: string;
  token?: string;
  token?: string;
  token?: string;
  id: string;
  email: string;
  password: string;
  name?: string;
  roles: string[];
  permissions: string[];
  mfaEnabled: boolean;
  mfaSecret?: string;
  lastLogin?: Date;
  status: UserStatus;
  preferences?: Record<string, any>;
  metadata?: UserMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export type UserStatus = "active" | "inactive" | "locked";

export interface UserMetadata {
  passwordHistory: string[];
  failedLoginAttempts: number;
  lastFailedLogin?: Date;
  devices: UserDevice[];
  [key: string]: unknown;
}

export interface UserDevice {
  id: string;
  name: string;
  type: string;
  lastUsed: Date;
  ip: string;
  userAgent: string;
}

export interface AuthToken {
  token: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
  mfaToken?: string;
  deviceInfo?: {
    name?: string;
    type?: string;
    ip: string;
    userAgent: string;
  };
}

export interface LoginAttempt {
  id: string;
  userId: string;
  email: string;
  ip: string;
  userAgent: string;
  success: boolean;
  failureReason?: string;
  timestamp: Date;
}

export interface TokenPayload {
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
  mfaEnabled: boolean;
  status: UserStatus;
  deviceId?: string;
  iat?: number;
  exp?: number;
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

export interface PasswordResetRequest {
  email: string;
  token: string;
  newPassword: string;
  confirmPassword: string;
}

// Local AuthError interface removed
// Re-exporting AuthenticationError from src/types/error.tsx as AuthError for compatibility
import { AuthenticationError } from '../../types/error.tsx';
export type { AuthenticationError as AuthError };
