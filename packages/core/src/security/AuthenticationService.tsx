import { Injectable, OnModuleInit } from '@nestjs/common';
import { Logger } from '@the-new-fuse/utils';
import { DatabaseService } from '@the-new-fuse/database';
import { Redis } from 'ioredis';
import { EventEmitter } from 'events';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  roles: string[];
  permissions: string[];
  metadata: Record<string, unknown>;
  lastLogin?: Date;
  status: 'active' | 'inactive' | 'suspended';
}

interface Session {
  id: string;
  userId: string;
  token: string;
  ip: string;
  userAgent: string;
  createdAt: Date;
  expiresAt: Date;
  metadata: Record<string, unknown>;
  regenerate: (callback: (err: unknown) => void) => void;
  destroy: (callback: (err: unknown) => void) => void;
  reload: (callback: (err: unknown) => void) => void;
  save: (callback: (err: unknown) => void) => void;
  touch: () => void;
  cookie: unknown;
}

interface AuthenticationAttempt {
  id: string;
  userId: string;
  success: boolean;
  ip: string;
  userAgent: string;
  timestamp: Date;
  metadata: Record<string, unknown>;
}

interface LoginContext {
  ip: string;
  userAgent: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuthenticationService extends EventEmitter implements OnModuleInit {
  private logger: Logger;
  private redis: Redis;
  private db: DatabaseService;
  private readonly saltRounds = 10;
  private readonly jwtSecret: string;
  private readonly tokenExpiration: number;
  private readonly maxLoginAttempts: number;
  private readonly lockoutDuration: number;

  constructor() {
    super();
    const redisOptions = process.env.REDIS_URL ? { url: process.env.REDIS_URL } : undefined;
    this.redis = redisOptions ? new Redis(redisOptions) : undefined;
    this.jwtSecret = process.env.JWT_SECRET || 'default-secret';
    this.tokenExpiration = parseInt(process.env.TOKEN_EXPIRATION || '3600', 10);
    this.maxLoginAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10);
    this.lockoutDuration = parseInt(process.env.LOCKOUT_DURATION || '1800', 10);
  }

  async onModuleInit(): Promise<void> {
    await this.cleanupExpiredSessions();
  }

  async register(
    username: string,
    email: string,
    password: string,
    metadata: Record<string, unknown> = {}
  ): Promise<User> {
    try {
      if (!username || !email || !password) {
        throw new Error('Missing required fields');
      }

      const existingUser = await this.db.users.findFirst({
        where: {
          OR: [{ username }, { email }]
        }
      });

      if (existingUser) {
        throw new Error('User already exists');
      }

      const hashedPassword = await bcrypt.hash(password, this.saltRounds);
      const user: User = {
        id: uuidv4(),
        username,
        email,
        password: hashedPassword,
        roles: ['user'],
        permissions: [],
        metadata,
        status: 'active'
      };

      const createdUser = await this.db.users.create({
        data: {
          ...user,
          metadata: JSON.stringify(metadata)
        }
      });

      this.emit('userRegistered', {
        userId: user.id,
        username: user.username,
        email: user.email
      });

      return createdUser;
    } catch (error) {
      this.logger.error('Registration failed:', error);
      throw error;
    }
  }

  async login(
    username: string,
    password: string,
    context: LoginContext
  ): Promise<{ user: User; session: Session }> {
    try {
      const isLocked = await this.checkLockout(username);
      if (isLocked) {
        throw new Error('Account is temporarily locked');
      }

      const user = await this.db.users.findFirst({
        where: {
          OR: [{ username }, { email: username }]
        }
      });

      if (!user) {
        await this.recordFailedAttempt(username, context);
        throw new Error('Invalid credentials');
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        await this.recordFailedAttempt(user.id, context);
        throw new Error('Invalid credentials');
      }

      await this.db.users.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });

      const session = await this.createSession(user, context);
      await this.recordSuccessfulAttempt(user.id, context);
      await this.clearFailedAttempts(user.id);

      this.emit('userLoggedIn', {
        userId: user.id,
        username: user.username,
        sessionId: session.id
      });

      return { user, session };
    } catch (error) {
      this.logger.error('Login failed:', error);
      throw error;
    }
  }

  async logout(sessionId: string): Promise<void> {
    try {
      const session = await this.db.sessions.findUnique({
        where: { id: sessionId }
      });

      if (!session) {
        throw new Error('Session not found');
      }

      await this.db.sessions.delete({
        where: { id: sessionId }
      });

      await this.redis.del(`session:${sessionId}`);

      this.emit('userLoggedOut', {
        sessionId,
        userId: session.userId
      });
    } catch (error) {
      this.logger.error('Logout failed:', error);
      throw error;
    }
  }

  private async createSession(user: User, context: LoginContext): Promise<Session> {
    const session: Session = {
      id: uuidv4(),
      userId: user.id,
      token: this.generateToken(user),
      ip: context.ip,
      userAgent: context.userAgent,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.tokenExpiration * 1000),
      metadata: context.metadata || {},
      regenerate: () => {},
      destroy: () => {},
      reload: () => {},
      save: () => {},
      touch: () => {},
      cookie: null
    };

    await this.db.sessions.create({
      data: {
        ...session,
        metadata: JSON.stringify(session.metadata)
      }
    });

    await this.redis.set(
      `session:${session.id}`,
      JSON.stringify(session),
      'EX',
      this.tokenExpiration
    );

    return session;
  }

  private generateToken(user: User): string {
    return jwt.sign(
      {
        userId: user.id,
        username: user.username,
        roles: user.roles,
        permissions: user.permissions
      },
      this.jwtSecret,
      { expiresIn: this.tokenExpiration }
    );
  }

  async validateToken(token: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      return await this.db.users.findUnique({
        where: { id: decoded.userId }
      });
    } catch (error) {
      return null;
    }
  }

  async validateSession(sessionId: string): Promise<Session | null> {
    const cached = await this.redis.get(`session:${sessionId}`);
    if (cached) {
      const session = JSON.parse(cached);
      if (new Date(session.expiresAt) > new Date()) {
        return session;
      }
      await this.redis.del(`session:${sessionId}`);
    }

    const session = await this.db.sessions.findUnique({
      where: { id: sessionId }
    });

    if (session && new Date(session.expiresAt) > new Date()) {
      await this.redis.set(
        `session:${session.id}`,
        JSON.stringify(session),
        'EX',
        this.tokenExpiration
      );
      return session;
    }

    return null;
  }

  private async recordFailedAttempt(userId: string, context: LoginContext): Promise<void> {
    const attempt: AuthenticationAttempt = {
      id: uuidv4(),
      userId,
      success: false,
      ip: context.ip,
      userAgent: context.userAgent,
      timestamp: new Date(),
      metadata: context.metadata || {}
    };

    await this.db.authenticationAttempts.create({
      data: {
        ...attempt,
        metadata: JSON.stringify(attempt.metadata)
      }
    });

    const key = `failed_attempts:${userId}`;
    const attempts = await this.redis.incr(key);
    
    if (attempts === 1) {
      await this.redis.expire(key, this.lockoutDuration);
    }

    if (attempts >= this.maxLoginAttempts) {
      await this.redis.set(
        `lockout:${userId}`,
        '1',
        'EX',
        this.lockoutDuration
      );

      this.emit('accountLocked', {
        userId,
        attempts,
        duration: this.lockoutDuration
      });
    }
  }

  private async recordSuccessfulAttempt(userId: string, context: LoginContext): Promise<void> {
    const attempt: AuthenticationAttempt = {
      id: uuidv4(),
      userId,
      success: true,
      ip: context.ip,
      userAgent: context.userAgent,
      timestamp: new Date(),
      metadata: context.metadata || {}
    };

    await this.db.authenticationAttempts.create({
      data: {
        ...attempt,
        metadata: JSON.stringify(attempt.metadata)
      }
    });
  }

  private async checkLockout(userId: string): Promise<boolean> {
    return Boolean(await this.redis.get(`lockout:${userId}`));
  }

  private async clearFailedAttempts(userId: string): Promise<void> {
    await this.redis.del(`failed_attempts:${userId}`);
  }

  private async cleanupExpiredSessions(): Promise<void> {
    await this.db.sessions.deleteMany({
      where: {
        expiresAt: { lt: new Date() }
      }
    });

    setInterval(async () => {
      await this.db.sessions.deleteMany({
        where: {
          expiresAt: { lt: new Date() }
        }
      });
    }, 3600000); // Clean up every hour
  }

  async getAuthenticationHistory(
    userId: string,
    options: {
      startTime?: Date;
      endTime?: Date;
      success?: boolean;
    } = {}
  ): Promise<AuthenticationAttempt[]> {
    return this.db.authenticationAttempts.findMany({
      where: {
        userId,
        success: options.success,
        timestamp: {
          gte: options.startTime,
          lte: options.endTime
        }
      },
      orderBy: { timestamp: 'desc' }
    });
  }

  async getActiveSessions(userId: string): Promise<Session[]> {
    return this.db.sessions.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async revokeAllSessions(userId: string): Promise<void> {
    const sessions = await this.getActiveSessions(userId);

    await this.db.sessions.deleteMany({
      where: { userId }
    });

    await Promise.all(
      sessions.map(session =>
        this.redis.del(`session:${session.id}`)
      )
    );

    this.emit('sessionsRevoked', {
      userId,
      sessionCount: sessions.length
    });
  }

  async cleanup(options: {
    olderThan?: Date;
  } = {}): Promise<void> {
    await this.db.authenticationAttempts.deleteMany({
      where: {
        timestamp: options.olderThan
          ? { lt: options.olderThan }
          : undefined
      }
    });

    await this.cleanupExpiredSessions();
  }
}
