export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  roles: string[];
  permissions?: string[];
  isActive: boolean;
  lastLogin?: Date;
  token?: string;
}
export interface AuthCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}
export interface AuthResponse {
  user: AuthUser;
  token: string;
  refreshToken?: string;
  expiresIn?: number;
}
export interface TokenPayload {
  sub: string;
  email: string;
  roles: string[];
  permissions?: string[];
  iat?: number;
  exp?: number;
}
export interface RefreshTokenPayload {
  id: string;
  userId: string;
  expiresAt: Date;
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
}
export interface AuthEvent {
  type: AuthEventType;
  userId?: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}
