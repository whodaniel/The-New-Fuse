import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'events';
import { Logger } from '@the-new-fuse/utils';
import { DatabaseService } from '@the-new-fuse/database';
import { Redis as RedisClient } from 'ioredis';
import { TokenManager } from './TokenManager.js';
import { UserService } from '../services/UserService.js';
import { compare, hash } from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import {
  AuthConfig,
  AuthSession,
  LoginAttempt,
  AuthEventType,
  AuthEvent,
  TokenPayload
} from './AuthTypes.js';

@Injectable()
export class AuthenticationService extends EventEmitter {
  private logger: Logger;
  private redis: RedisClient;

  constructor(
    private readonly config: AuthConfig,
    private readonly tokenManager: TokenManager,
    private readonly userService: UserService,
    private readonly db: DatabaseService
  ) {
    super();
    this.logger = new Logger(AuthenticationService.name);
    // Redis initialization would happen here
  }

  async login(
    username: string,
    password: string,
    deviceInfo: AuthSession['deviceInfo']
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    session: AuthSession;
  }> {
    try {
      // Get user
      const user = await this.userService.findByUsername(username);
      
      if (!user) {
        await this.recordLoginAttempt(username, false, deviceInfo.ip, 'User not found');
        throw new Error('Invalid credentials');
      }

      // Verify password
      const isPasswordValid = await compare(password, user.password);
      
      if (!isPasswordValid) {
        await this.recordLoginAttempt(user.id, false, deviceInfo.ip, 'Invalid password');
        throw new Error('Invalid credentials');
      }

      // Check if account is locked
      if (await this.isAccountLocked(user.id)) {
        await this.recordLoginAttempt(user.id, false, deviceInfo.ip, 'Account locked');
        throw new Error('Account is locked');
      }

      // Create session and tokens
      const { accessToken, refreshToken, session } = await this.createAccessTokens(user, deviceInfo);

      // Record login event
      await this.recordAuthEvent(user.id, AuthEventType.LOGIN, { sessionId: session.id });

      return {
        accessToken,
        refreshToken,
        session
      };
    } catch (error) {
      this.logger.error('Login failed:', error as Error);
      throw error;
    }
  }

  async logout(sessionId: string): Promise<void> {
    try {
      const session = await (this.db as any).authSessions.findUnique({
        where: { id: sessionId }
      });

      if (!session) {
        throw new Error('Session not found');
      }

      // Revoke session
      await (this.db as any).authSessions.update({
        where: { id: sessionId },
        data: { isRevoked: true }
      });

      // Record logout event
      await this.recordAuthEvent(session.userId, AuthEventType.LOGOUT, {
        sessionId
      });
    } catch (error) {
      this.logger.error('Logout failed:', error as Error);
      throw error;
    }
  }

  private async createAccessTokens(
    user: any,
    deviceInfo: AuthSession['deviceInfo']
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    session: AuthSession;
  }> {
    // Create a new session
    const session = await this.createSession(user.id, deviceInfo);

    // Generate tokens
    const accessToken = await this.tokenManager.generateAccessToken({
      userId: user.id,
      username: user.username,
      roles: user.roles,
      permissions: user.permissions,
      sessionId: session.id
    });

    const refreshToken = await this.tokenManager.generateRefreshToken(user.id);

    // Record successful login
    await this.recordLoginAttempt(user.id, true, deviceInfo.ip);
    await this.recordAuthEvent(user.id, AuthEventType.LOGIN, { sessionId: session.id });

    return {
      accessToken,
      refreshToken,
      session
    };
  }

  async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      // Validate refresh token
      const payload = await this.tokenManager.validateRefreshToken(refreshToken);
      
      if (!payload) {
        throw new Error('Invalid refresh token');
      }

      // Get user
      const user = await (this.userService as any).findById(payload.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Generate new tokens
      const accessToken = await this.tokenManager.generateAccessToken({
        userId: user.id,
        username: user.username,
        roles: user.roles,
        permissions: user.permissions,
        sessionId: uuidv4()
      });

      const newRefreshToken = await this.tokenManager.generateRefreshToken(user.id);

      // Revoke old refresh token
      await this.tokenManager.revokeToken(refreshToken);

      return {
        accessToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      this.logger.error('Token refresh failed:', error as Error);
      throw error;
    }
  }

  async validateSession(sessionId: string): Promise<boolean> {
    try {
      const session = await (this.db as any).authSessions.findUnique({
        where: { id: sessionId }
      });

      if (!session) {
        return false;
      }

      return (
        !session.isRevoked &&
        session.expiresAt > new Date()
      );
    } catch (error) {
      this.logger.error('Session validation failed:', error as Error);
      return false;
    }
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      // Get user
      const user = await (this.userService as any).findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isPasswordValid = await compare(currentPassword, user.password);
      
      if (!isPasswordValid) {
        throw new Error('Invalid current password');
      }

      // Validate new password
      this.validatePassword(newPassword);

      // Hash new password
      const hashedPassword = await hash(newPassword, 10);

      // Update password
      await (this.userService as any).updatePassword(userId, hashedPassword);

      // Revoke all sessions
      await this.tokenManager.revokeAllUserTokens(userId);

      // Record password change event
      await this.recordAuthEvent(userId, AuthEventType.PASSWORD_CHANGE);
    } catch (error) {
      this.logger.error('Password change failed:', error as Error);
      throw error;
    }
  }

  private async createSession(
    userId: string,
    deviceInfo: AuthSession['deviceInfo']
  ): Promise<AuthSession> {
    const session: AuthSession = {
      id: uuidv4(),
      userId,
      deviceInfo,
      issuedAt: new Date(),
      lastActive: new Date(),
      expiresAt: new Date(Date.now() + this.config.tokenExpiration * 1000),
      isRevoked: false
    };

    await (this.db as any).authSessions.create({ data: session });
    return session;
  }

  private async recordLoginAttempt(
    userId: string,
    success: boolean,
    ip: string,
    error?: string
  ): Promise<void> {
    const attempt: LoginAttempt = {
      id: uuidv4(),
      userId,
      timestamp: new Date(),
      success,
      ip,
      userAgent: 'Unknown',
      error
    };

    await (this.db as any).loginAttempts.create({ data: attempt });

    if (!success) {
      await this.checkLoginAttempts(userId);
    }
  }

  private async checkLoginAttempts(userId: string): Promise<void> {
    const recentAttempts = await (this.db as any).loginAttempts.count({
      where: {
        userId,
        success: false,
        timestamp: {
          gte: new Date(Date.now() - 15 * 60 * 1000) // Last 15 minutes
        }
      }
    });

    if (recentAttempts >= this.config.maxLoginAttempts) {
      await this.lockAccount(userId);
    }
  }

  private async lockAccount(userId: string): Promise<void> {
    const lockKey = `account_lock:${userId}`;
    await this.redis.set(
      lockKey,
      'locked',
      'EX',
      this.config.lockoutDuration
    );
  }

  private async isAccountLocked(userId: string): Promise<boolean> {
    const lockKey = `account_lock:${userId}`;
    return Boolean(await this.redis.exists(lockKey));
  }

  private validatePassword(password: string): void {
    const { passwordPolicy } = this.config;

    if (password.length < passwordPolicy.minLength) {
      throw new Error(`Password must be at least ${passwordPolicy.minLength} characters long`);
    }

    if (passwordPolicy.requireUppercase && !/[A-Z]/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter');
    }

    if (passwordPolicy.requireLowercase && !/[a-z]/.test(password)) {
      throw new Error('Password must contain at least one lowercase letter');
    }

    if (passwordPolicy.requireNumbers && !/\d/.test(password)) {
      throw new Error('Password must contain at least one number');
    }

    if (passwordPolicy.requireSpecialChars && !/[^A-Za-z0-9]/.test(password)) {
      throw new Error('Password must contain at least one special character');
    }
  }

  private async recordAuthEvent(
    userId: string,
    type: AuthEventType,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    const event: AuthEvent = {
      type,
      userId,
      timestamp: new Date(),
      metadata
    };

    await (this.db as any).authEvents.create({ data: event });
    this.emit('authEvent', event);
  }

  private async handleTokenEvent(event: AuthEvent): Promise<void> {
    this.logger.debug(`Token event received: ${event.type} for user ${event.userId}`);
  }

  async cleanup(): Promise<void> {
    try {
      const now = new Date();

      // Clean up expired sessions
      await (this.db as any).authSessions.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: now } },
            { isRevoked: true }
          ]
        }
      });

      // Clean up old login attempts
      await (this.db as any).loginAttempts.deleteMany({
        where: {
          timestamp: {
            lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // 30 days
          }
        }
      });

      // Clean up old auth events
      await (this.db as any).authEvents.deleteMany({
        where: {
          timestamp: {
            lt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) // 90 days
          }
        }
      });
    } catch (error) {
      this.logger.error('Cleanup failed:', error as Error);
      throw error;
    }
  }
}
