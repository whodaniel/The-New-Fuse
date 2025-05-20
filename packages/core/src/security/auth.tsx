import { Injectable } from '@nestjs/common';
import {
  AuthMethod,
  AuthScope,
  AuthRole,
  AuthCredentials,
  AuthToken,
  AuthSession,
  SecurityConfig,
} from './types.js';
import { RedisService } from '../services/redis.service.js';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  private readonly config: SecurityConfig['auth'];
  private readonly jwtSecret: string;

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.config = this.loadConfig();
    this.jwtSecret = this.configService.get<string>('JWT_SECRET', 'defaultsecret');
  }

  private loadConfig(): SecurityConfig['auth'] {
    return {
      enabled: this.configService.get<boolean>('AUTH_ENABLED', true),
      methods: this.configService.get<AuthMethod[]>('AUTH_METHODS', [AuthMethod.JWT]),
      tokenExpiration: this.configService.get<number>('TOKEN_EXPIRATION', 3600),
      sessionExpiration: this.configService.get<number>('SESSION_EXPIRATION', 86400),
      maxSessions: this.configService.get<number>('MAX_SESSIONS', 5),
      passwordPolicy: {
        minLength: this.configService.get<number>('PASSWORD_MIN_LENGTH', 8),
        requireNumbers: this.configService.get<boolean>('PASSWORD_REQUIRE_NUMBERS', true),
        requireSymbols: this.configService.get<boolean>('PASSWORD_REQUIRE_SYMBOLS', true),
        requireUppercase: this.configService.get<boolean>('PASSWORD_REQUIRE_UPPERCASE', true),
        requireLowercase: this.configService.get<boolean>('PASSWORD_REQUIRE_LOWERCASE', true),
        maxAge: this.configService.get<number>('PASSWORD_MAX_AGE', 90),
        preventReuse: this.configService.get<number>('PASSWORD_PREVENT_REUSE', 5),
      },
    };
  }

  async createCredentials(
    type: AuthMethod,
    value: string,
    options?: {
      expiresIn?: number;
      source?: string;
      device?: string;
    },
  ): Promise<AuthCredentials> {
    let hashedValue = value;

    if (type === AuthMethod.PASSWORD) {
      // Validate password against policy
      this.validatePassword(value);
      hashedValue = await bcrypt.hash(value, 10);
    }

    const credentials: AuthCredentials = {
      id: uuidv4(),
      type,
      value: hashedValue,
      metadata: {
        createdAt: new Date(),
        expiresAt: options?.expiresIn
          ? new Date(Date.now() + options.expiresIn * 1000)
          : undefined,
        source: options?.source,
        device: options?.device,
      },
    };

    await this.storeCredentials(credentials);
    return credentials;
  }

  async validateCredentials(
    type: AuthMethod,
    value: string,
    storedCredentials: AuthCredentials,
  ): Promise<boolean> {
    if(!storedCredentials) {
      return false;
    }

    // Check expiration
    if (
      storedCredentials.metadata.expiresAt &&
      storedCredentials.metadata.expiresAt < new Date()
    ) {
      return false;
    }

    switch (type) {
      case AuthMethod.PASSWORD:
        return bcrypt.compare(value, storedCredentials.value);
      case AuthMethod.API_KEY:
        return value === storedCredentials.value;
      case AuthMethod.JWT:
        try {
          jwt.verify(value, this.jwtSecret);
          return true;
        } catch {
          return false;
        }
      default:
        return false;
    }
  }

  async createToken(
    userId: string,
    scopes: AuthScope[],
    options?: {
      type?: 'access' | 'refresh';
      expiresIn?: number;
      source?: string;
      device?: string;
    },
  ): Promise<AuthToken> {
    const type = options?.type || 'access';
    const expiresIn = options?.expiresIn || this.config.tokenExpiration;
    
    const tokenId = uuidv4();
    const jwtToken = this.generateToken(userId, scopes, type, expiresIn);
    
    const token: AuthToken = {
      id: tokenId,
      userId,
      token: jwtToken,
      type,
      scopes,
      metadata: {
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + expiresIn * 1000),
        source: options?.source,
        device: options?.device,
      },
    };

    await this.storeToken(token);
    return token;
  }

  async validateToken(token: string): Promise<AuthToken | null> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      const storedToken = await this.getToken(decoded.jti);

      if (!storedToken || storedToken.metadata.expiresAt < new Date()) {
        return null;
      }

      return storedToken;
    } catch {
      return null;
    }
  }

  async createSession(
    userId: string,
    token: AuthToken,
    options?: {
      source?: string;
      device?: string;
      ip?: string;
      userAgent?: string;
    },
  ): Promise<AuthSession> {
    // Check max sessions
    const activeSessions = await this.getUserActiveSessions(userId);
    
    if(activeSessions.length >= this.config.maxSessions) {
      // Remove oldest session
      const oldestSession = activeSessions.reduce((a, b) =>
        a.metadata.createdAt < b.metadata.createdAt ? a : b
      );
      await this.revokeSession(oldestSession.id);
    }
    
    const session: AuthSession = {
      id: uuidv4(),
      userId,
      token,
      status: 'active',
      metadata: {
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + this.config.sessionExpiration * 1000),
        source: options?.source,
        device: options?.device,
        ip: options?.ip,
        userAgent: options?.userAgent,
      },
    };

    await this.storeSession(session);
    this.eventEmitter.emit('session.created', {
      sessionId: session.id,
      userId: session.userId,
    });

    return session;
  }

  async validateSession(sessionId: string): Promise<AuthSession | null> {
    const session = await this.getSession(sessionId);

    if (
      !session ||
      session.status !== 'active' ||
      session.metadata.expiresAt < new Date()
    ) {
      return null;
    }

    // Update last active timestamp
    session.metadata.lastActive = new Date();
    await this.storeSession(session);

    return session;
  }

  async revokeSession(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if(!session) {
      return;
    }

    session.status = 'revoked';
    await this.storeSession(session);

    // Revoke associated token
    await this.revokeToken(session.token.id);

    this.eventEmitter.emit('session.revoked', {
      sessionId: session.id,
      userId: session.userId,
    });
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    const sessions = await this.getUserActiveSessions(userId);
    
    for (const session of sessions) {
      await this.revokeSession(session.id);
    }
  }

  private validatePassword(password: string): void {
    const policy = this.config.passwordPolicy;
    const errors: string[] = [];

    if (password.length < policy.minLength) {
      errors.push(`Password must be at least ${policy.minLength} characters long`);
    }

    if (policy.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (policy.requireSymbols && !/[!@#$%^&*]/.test(password)) {
      errors.push('Password must contain at least one symbol');
    }

    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (errors.length > 0) {
      throw new Error(`Password validation failed: ${errors.join('; ')}`);
    }
  }

  private generateToken(
    userId: string,
    scopes: AuthScope[],
    type: string,
    expiresIn: number,
  ): string {
    const tokenId = uuidv4();
    return jwt.sign(
      {
        sub: userId,
        scopes,
        type,
        jti: tokenId,
      },
      this.jwtSecret,
      { expiresIn }
    );
  }

  private async storeCredentials(credentials: AuthCredentials): Promise<void> {
    await this.redisService.set(
      `credentials:${credentials.id}`,
      JSON.stringify(credentials)
    );
  }

  private async storeToken(token: AuthToken): Promise<void> {
    await this.redisService.set(
      `token:${token.id}`,
      JSON.stringify(token)
    );
  }

  private async storeSession(session: AuthSession): Promise<void> {
    await this.redisService.set(
      `session:${session.id}`,
      JSON.stringify(session)
    );
  }
  
  private async getToken(id: string): Promise<AuthToken | null> {
    const data = await this.redisService.get(`token:${id}`);
    return data ? JSON.parse(data) : null;
  }

  private async getSession(id: string): Promise<AuthSession | null> {
    const data = await this.redisService.get(`session:${id}`);
    return data ? JSON.parse(data) : null;
  }

  private async getUserActiveSessions(userId: string): Promise<AuthSession[]> {
    const keys = await this.redisService.keys(`session:*`);
    const sessions: AuthSession[] = [];

    for (const key of keys) {
      const data = await this.redisService.get(key);
      if (data) {
        const session = JSON.parse(data) as AuthSession;
        if (
          session.userId === userId &&
          session.status === 'active' &&
          session.metadata.expiresAt > new Date()
        ) {
          sessions.push(session);
        }
      }
    }

    return sessions;
  }

  private async revokeToken(tokenId: string): Promise<void> {
    await this.redisService.del(`token:${tokenId}`);
  }
}
