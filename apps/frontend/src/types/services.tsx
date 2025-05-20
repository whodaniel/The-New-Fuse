import { User, DeviceInfo, LockoutStatus, AuthError } from './auth.js';

export interface SecurityService {
  checkRateLimit(ip: string): boolean;
  isAccountLocked(email: string): LockoutStatus;
  validateCaptcha(token: string): Promise<boolean>;
  validateCSRFToken(token: string): boolean;
  generateCSRFToken(): string;
}

export interface SessionService {
  createSession(userId: string, email: string, deviceInfo: DeviceInfo): string;
  validateSession(sessionId: string): boolean;
  removeSession(sessionId: string): void;
  getAllActiveSessions(userId: string): Session[];
}

export interface AuthService {
  login(credentials: LoginCredentials, deviceInfo: DeviceInfo): Promise<AuthResponse>;
  register(userData: RegisterData): Promise<AuthResponse>;
  resetPassword(email: string, code?: string, newPassword?: string): Promise<VerificationResponse>;
  verifyEmail(email: string, code: string): Promise<VerificationResponse>;
  setupMFA(userId: string, method: MFAMethod): Promise<MFAResponse>;
  verifyMFA(userId: string, code: string): Promise<MFAResponse>;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  acceptTerms: boolean;
}

export interface Session {
  id: string;
  userId: string;
  deviceInfo: DeviceInfo;
  createdAt: Date;
  expiresAt: Date;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  error?: AuthError;
}