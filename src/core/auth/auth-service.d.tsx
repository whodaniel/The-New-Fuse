import { Logger } from "winston";
import { ConfigService } from '../config/config.service.js';
import { ErrorHandler } from '../error/error-handler.js';
import { User, AuthToken, LoginCredentials, UserStatus } from './auth.types.js';
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
  createdAt: Date;
  updatedAt: Date;
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
}
export interface LoginAttempt {
  email: string;
  ip: string;
  timestamp: Date;
  success: boolean;
}
export interface TokenPayload {
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
  mfaEnabled: boolean;
  status: UserStatus;
  deviceId?: string;
}
export declare class AuthService {
  private logger;
  private config;
  private errorHandler;
  private readonly SALT_ROUNDS;
  private readonly TOKEN_SECRET;
  private readonly REFRESH_TOKEN_SECRET;
  private readonly TOKEN_EXPIRY;
  private readonly REFRESH_TOKEN_EXPIRY;
  private readonly MAX_LOGIN_ATTEMPTS;
  private readonly LOCKOUT_DURATION;
  constructor(
    logger: Logger,
    config: ConfigService,
    errorHandler: ErrorHandler,
  );
  login(credentials: LoginCredentials): Promise<AuthToken>;
  validateToken(token: string): Promise<User>;
  hashPassword(password: string): Promise<string>;
  validatePassword(password: string, hashedPassword: string): Promise<boolean>;
  private validateCredentials;
  private generateToken;
  private handleFailedLogin;
  private lockAccount;
  private getLoginAttempts;
  private clearLoginAttempts;
  private getLockoutEnd;
}
//# sourceMappingURL=auth-(service as any).d.ts.map
