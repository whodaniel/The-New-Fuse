import { ConfigService } from '../config/config-service.js';
import { EventBus } from '../events/event-bus.js';
import { MFAService } from '../../services/MFAService.js';
import { SecurityLogger } from '../../services/SecurityLogger.js';
import { SessionManager } from '../../services/SessionManager.js';
export interface User {
  id: string;
  email: string;
  password: string;
  roles: string[];
  mfaEnabled: boolean;
  mfaSecret?: string;
  lastLogin?: Date;
  status: "active" | "inactive" | "locked";
}
export interface AuthToken {
  token: string;
  refreshToken: string;
  expiresAt: Date;
}
export interface LoginAttempt {
  email: string;
  ip: string;
  timestamp: Date;
  success: boolean;
}
export declare class AuthService {
  private config;
  private cache;
  private logger;
  private time;
  private eventBus;
  private mfaService;
  private securityLogger;
  private sessionManager;
  private readonly SALT_ROUNDS;
  private readonly TOKEN_SECRET;
  private readonly REFRESH_TOKEN_SECRET;
  private readonly TOKEN_EXPIRY;
  private readonly REFRESH_TOKEN_EXPIRY;
  private readonly MAX_LOGIN_ATTEMPTS;
  private readonly LOCKOUT_DURATION;
  constructor(
    config: ConfigService,
    cache: CacheService,
    logger: LoggingService,
    time: TimeService,
    eventBus: EventBus,
    mfaService: MFAService,
    securityLogger: SecurityLogger,
    sessionManager: SessionManager,
  );
  register(email: string, password: string): Promise<User>;
  login(email: string, password: string, ip: string): Promise<AuthToken>;
  validateToken(token: string): Promise<User>;
  refreshToken(refreshToken: string): Promise<AuthToken>;
  changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void>;
  enableMFA(userId: string): Promise<{
    secret: string;
    uri: string;
    qrCode: string;
  }>;
  verifyMFA(userId: string, token: string): Promise<boolean>;
  private handleFailedLogin;
  private lockAccount;
  private generateAuthToken;
  private getUserById;
  private getUserByEmail;
  private updateUser;
  private getLoginAttempts;
  private clearLoginAttempts;
  private getLockoutEnd;
}
