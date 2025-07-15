import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';
import { compare, hash } from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

enum AuthEventType {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  TOKEN_REFRESH = 'TOKEN_REFRESH',
}

interface AuthSession {
  id: string;
  userId: string;
  token: string;
  refreshToken: string;
  expiresAt: Date;
  deviceInfo: {
    ip: string;
    userAgent: string;
    deviceId?: string;
  };
}

interface LoginAttempt {
  id: string;
  userId?: string;
  username: string;
  success: boolean;
  ip: string;
  timestamp: Date;
  reason?: string;
}

@Injectable()
export class AuthenticationService extends EventEmitter {
  private readonly logger = new Logger(AuthenticationService.name);

  constructor(private readonly db: any) {
    super();
  }

  async login(username: string, password: string, deviceInfo: AuthSession['deviceInfo']): Promise<AuthSession> {
    try {
      const user = await this.db.users.findUnique({ where: { username } });
      if (!user) {
        await this.recordLoginAttempt(username, false, deviceInfo.ip, 'User not found');
        throw new Error('Invalid credentials');
      }

      const isPasswordValid = await compare(password, user.password);
      if (!isPasswordValid) {
        await this.recordLoginAttempt(user.id, false, deviceInfo.ip, 'Invalid password');
        throw new Error('Invalid credentials');
      }

      if (await this.isAccountLocked(user.id)) {
        await this.recordLoginAttempt(user.id, false, deviceInfo.ip, 'Account locked');
        throw new Error('Account is locked');
      }

      const session = await this.createSession(user.id, deviceInfo);
      await this.recordLoginAttempt(user.id, true, deviceInfo.ip, 'Success');
      
      this.emit(AuthEventType.LOGIN, { userId: user.id, sessionId: session.id });
      return session;
    } catch (error) {
      this.logger.error('Login failed:', error);
      throw error;
    }
  }

  async logout(sessionId: string, deviceInfo: AuthSession['deviceInfo']): Promise<void> {
    try {
      await this.db.authSessions.delete({ where: { id: sessionId } });
      this.emit(AuthEventType.LOGOUT, { sessionId });
    } catch (error) {
      this.logger.error('Logout failed:', error);
      throw error;
    }
  }

  async refreshToken(refreshToken: string, deviceInfo: AuthSession['deviceInfo']): Promise<AuthSession> {
    try {
      const session = await this.db.authSessions.findFirst({ where: { refreshToken } });
      if (!session) {
        throw new Error('Invalid refresh token');
      }

      const newSession = await this.createSession(session.userId, deviceInfo);
      await this.db.authSessions.delete({ where: { id: session.id } });
      
      this.emit(AuthEventType.TOKEN_REFRESH, { userId: session.userId, sessionId: newSession.id });
      return newSession;
    } catch (error) {
      this.logger.error('Token refresh failed:', error);
      throw error;
    }
  }

  async validateSession(sessionId: string): Promise<AuthSession | null> {
    try {
      const session = await this.db.authSessions.findUnique({ where: { id: sessionId } });
      if (!session || session.expiresAt < new Date()) {
        return null;
      }
      return session;
    } catch (error) {
      this.logger.error('Session validation failed:', error);
      throw error;
    }
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string, deviceInfo: AuthSession['deviceInfo']): Promise<void> {
    try {
      const user = await this.db.users.findUnique({ where: { id: userId } });
      if (!user) {
        throw new Error('User not found');
      }

      const isOldPasswordValid = await compare(oldPassword, user.password);
      if (!isOldPasswordValid) {
        throw new Error('Invalid current password');
      }

      if (!this.isPasswordStrong(newPassword)) {
        throw new Error('Password must contain at least one special character');
      }

      const hashedPassword = await hash(newPassword, 10);
      await this.db.users.update({ where: { id: userId }, data: { password: hashedPassword } });
      
      this.emit(AuthEventType.PASSWORD_CHANGE, { userId });
    } catch (error) {
      this.logger.error('Password change failed:', error);
      throw error;
    }
  }

  private async createSession(userId: string, deviceInfo: AuthSession['deviceInfo']): Promise<AuthSession> {
    const session: AuthSession = {
      id: uuidv4(),
      userId,
      token: uuidv4(),
      refreshToken: uuidv4(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      deviceInfo,
    };

    await this.db.authSessions.create({ data: session });
    return session;
  }

  private async recordLoginAttempt(
    userIdOrUsername: string,
    success: boolean,
    ip: string,
    reason?: string
  ): Promise<void> {
    await this.db.loginAttempts.create({
      data: {
        id: uuidv4(),
        userId: success ? userIdOrUsername : undefined,
        username: success ? undefined : userIdOrUsername,
        success,
        ip,
        timestamp: new Date(),
        reason,
      },
    });
  }

  private async isAccountLocked(userId: string): Promise<boolean> {
    const recentAttempts = await this.db.loginAttempts.findMany({
      where: {
        userId,
        success: false,
        timestamp: { gte: new Date(Date.now() - 15 * 60 * 1000) }, // 15 minutes
      },
    });

    return recentAttempts.length >= 5;
  }

  private isPasswordStrong(password: string): boolean {
    return /[!@#$%^&*(),.?":{}|<>]/.test(password) && password.length >= 8;
  }

  async cleanupExpiredSessions(): Promise<void> {
    try {
      const result = await this.db.authSessions.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });
      this.logger.log(`Cleaned up ${result.count} expired sessions`);
    } catch (error) {
      this.logger.error('Cleanup failed:', error);
    }
  }
}