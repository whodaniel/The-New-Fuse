import { injectable, inject } from "inversify";
import TYPES from '../di/types.js';
import { ConfigService } from '../config/config-service.js';
import { CacheService } from '../cache/cache-service.js';
import { LoggingService } from '../logging/logging-service.js';
import { TimeService } from '../utils/time.service.js';
import { EventBus } from '../events/event-bus.js';
import { MFAService } from '../../services/MFAService.js';
import { SecurityLogger } from '../../services/SecurityLogger.js';
import { SessionManager } from '../../services/SessionManager.js';
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import ms from "ms";

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

@injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 12;
  private readonly TOKEN_SECRET: string;
  private readonly REFRESH_TOKEN_SECRET: string;
  private readonly TOKEN_EXPIRY: string;
  private readonly REFRESH_TOKEN_EXPIRY: string;
  private readonly MAX_LOGIN_ATTEMPTS: number;
  private readonly LOCKOUT_DURATION: number;

  constructor(
    @inject(TYPES.ConfigService) private config: ConfigService,
    @inject(TYPES.CacheService) private cache: CacheService,
    @inject(TYPES.LoggingService) private logger: LoggingService,
    @inject(TYPES.TimeService) private time: TimeService,
    @inject(TYPES.EventBus) private eventBus: EventBus,
    @inject(TYPES.MFAService) private mfaService: MFAService,
    @inject(TYPES.SecurityLogger) private securityLogger: SecurityLogger,
    @inject(TYPES.SessionManager) private sessionManager: SessionManager,
  ) {
    this.TOKEN_SECRET = this.config.get("auth.tokenSecret", "your-secret-key");
    this.REFRESH_TOKEN_SECRET = this.config.get("auth.refreshTokenSecret", "your-refresh-secret");
    this.TOKEN_EXPIRY = this.config.get("auth.tokenExpiry", "1h");
    this.REFRESH_TOKEN_EXPIRY = this.config.get("auth.refreshTokenExpiry", "7d");
    this.MAX_LOGIN_ATTEMPTS = this.config.get("auth.maxLoginAttempts", 5);
    this.LOCKOUT_DURATION = this.config.get("auth.lockoutDuration", 30 * 60 * 1000); // 30 minutes
  }

  public async register(email: string, password: string): Promise<User> {
    // Check if user exists
    const existingUser = await this.getUserByEmail(email);
    if (existingUser) {
      throw new Error("User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

    // Create user
    const user: User = {
      id: uuidv4(),
      email,
      password: hashedPassword,
      roles: ["user"],
      mfaEnabled: false,
      status: "active",
    };

    // Store user (in a real implementation, this would be in a database)
    await this.cache.set(`user:${user.id}`, user);
    await this.cache.set(`user:email:${email}`, user.id);

    this.logger.info("User registered successfully", {
      userId: user.id,
      email,
    });
    this.eventBus.publish("user.registered", { userId: user.id, email });
    
    return user;
  }

  public async login(
    email: string,
    password: string,
    ip: string,
  ): Promise<AuthToken> {
    const user = await this.getUserByEmail(email);
    if (!user) {
      await this.handleFailedLogin(email, ip);
      throw new Error("Invalid email or password");
    }

    // Check account status
    if (user.status !== "active") {
      if (user.status === "locked") {
        const lockoutEnd = await this.getLockoutEnd(email);
        if (lockoutEnd && lockoutEnd > new Date()) {
          throw new Error("Account is locked. Please try again later.");
        }
      } else {
        throw new Error("Account is inactive");
      }
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      await this.handleFailedLogin(email, ip);
      throw new Error("Invalid email or password");
    }

    // Clear failed login attempts
    await this.clearLoginAttempts(email);

    // Update last login timestamp
    user.lastLogin = new Date();
    await this.updateUser(user);

    // Generate auth token
    const authToken = await this.generateAuthToken(user);

    // Log successful login
    await this.securityLogger.logEvent({
      type: "LOGIN_SUCCESS",
      severity: "low",
      source: "auth-service",
      details: { userId: user.id, email: user.email },
      userId: user.id,
      ip,
    });

    // Create session
    await this.sessionManager.createSession(user.id, {
      ipAddress: ip,
      userAgent: "user-agent", // In production, get from request
    });

    return authToken;
  }

  public async validateToken(token: string): Promise<User> {
    try {
      const decoded = jwt.verify(token, this.TOKEN_SECRET) as {
        userId: string;
      };
      const user = await this.getUserById(decoded.userId);
      if (!user || user.status !== "active") {
        throw new Error("Invalid user or inactive account");
      }

      return user;
    } catch (error) {
      this.logger.error("Authentication error", { error });
      throw new Error("Invalid or expired token");
    }
  }

  public async refreshToken(refreshToken: string): Promise<AuthToken> {
    try {
      const decoded = jwt.verify(refreshToken, this.REFRESH_TOKEN_SECRET) as {
        userId: string;
      };
      const user = await this.getUserById(decoded.userId);
      if (!user || user.status !== "active") {
        throw new Error("Invalid user or inactive account");
      }

      return this.generateAuthToken(user);
    } catch (error) {
      this.logger.error("Authentication error", { error });
      throw new Error("Invalid or expired refresh token");
    }
  }

  public async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Verify current password
    const passwordValid = await bcrypt.compare(currentPassword, user.password);
    if (!passwordValid) {
      throw new Error("Invalid current password");
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);
    user.password = hashedPassword;

    // Update user
    await this.updateUser(user);

    // Invalidate all sessions except current one
    await this.sessionManager.destroyUserSessions(userId);

    this.logger.info("Password changed successfully", { userId });
    this.eventBus.publish("user.password_changed", { userId });
  }

  public async setupMFA(userId: string): Promise<{ secret: string; uri: string; qrCode: string }> {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Generate MFA setup token using MFAService
    const mfaSetup = await this.mfaService.generateSetupToken(userId);
    
    // Store MFA secret for later verification
    user.mfaSecret = mfaSetup.secret;
    await this.updateUser(user);

    return {
      secret: mfaSetup.secret,
      uri: mfaSetup.otpAuthUrl,
      qrCode: mfaSetup.qrCode,
    };
  }

  public async verifyMFA(userId: string, token: string): Promise<boolean> {
    const user = await this.getUserById(userId);
    if (!user || !user.mfaSecret) {
      throw new Error("Invalid user or MFA not set up");
    }

    // Verify MFA token
    const isValid = await this.mfaService.verifyToken(userId, token, user.mfaSecret);
    
    if (isValid.success) {
      user.mfaEnabled = true;
      await this.updateUser(user);
    }

    return isValid.success;
  }

  private async handleFailedLogin(email: string, ip: string): Promise<void> {
    // Get login attempts
    const attempts = await this.getLoginAttempts(email);
    attempts.push({ email, ip, timestamp: new Date(), success: false });

    // Keep only recent attempts
    const recentAttempts = attempts.filter(
      (attempt) =>
        this.time.isAfter(
          attempt.timestamp,
          this.time.subtractFromDate(new Date(), {
            minutes: 30,
            hours: 0,
            days: 0,
            seconds: 0,
            milliseconds: 0,
          })
        )
    );

    await this.cache.set(
      `login_attempts:${email}`,
      recentAttempts,
      this.LOCKOUT_DURATION,
    );

    // Lock account if too many attempts
    if (recentAttempts.length >= this.MAX_LOGIN_ATTEMPTS) {
      await this.lockAccount(email);
    }

    await this.securityLogger.logEvent({
      type: "LOGIN_FAILURE",
      severity:
        recentAttempts.length >= this.MAX_LOGIN_ATTEMPTS - 1
          ? "high"
          : "medium",
      source: "auth-service",
      details: { email, attemptCount: recentAttempts.length },
      ip,
    });
  }

  private async lockAccount(email: string): Promise<void> {
    const user = await this.getUserByEmail(email);
    if (user) {
      user.status = "locked";
      await this.updateUser(user);
      await this.cache.set(
        `lockout:${email}`,
        new Date(Date.now() + this.LOCKOUT_DURATION),
        this.LOCKOUT_DURATION,
      );

      await this.securityLogger.logEvent({
        type: "ACCOUNT_LOCKED",
        severity: "high",
        source: "auth-service",
        details: { email, userId: user.id },
        userId: user.id,
      });
    }
  }

  private async generateAuthToken(user: User): Promise<AuthToken> {
    const token = jwt.sign({ userId: user.id }, this.TOKEN_SECRET, {
      expiresIn: this.TOKEN_EXPIRY,
    });

    const refreshToken = jwt.sign(
      { userId: user.id },
      this.REFRESH_TOKEN_SECRET,
      {
        expiresIn: this.REFRESH_TOKEN_EXPIRY,
      },
    );

    const expiresAt = this.time.addToDate(new Date(), {
      milliseconds: ms(this.TOKEN_EXPIRY),
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    });

    return { token, refreshToken, expiresAt };
  }

  private async getUserById(id: string): Promise<User | null> {
    return this.cache.get(`user:${id}`);
  }

  private async getUserByEmail(email: string): Promise<User | null> {
    const userId = await this.cache.get(`user:email:${email}`);
    if (!userId) {
      return null;
    }
    return this.getUserById(userId);
  }

  private async updateUser(user: User): Promise<void> {
    await this.cache.set(`user:${user.id}`, user);
    await this.cache.set(`user:email:${user.email}`, user.id);
  }

  private async getLoginAttempts(email: string): Promise<LoginAttempt[]> {
    return this.cache.get(`login_attempts:${email}`) || [];
  }

  private async clearLoginAttempts(email: string): Promise<void> {
    await this.cache.del(`login_attempts:${email}`);
  }

  private async getLockoutEnd(email: string): Promise<Date | null> {
    return this.cache.get(`lockout:${email}`);
  }
}
