import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Redis } from 'ioredis';
import { Logger } from '@the-new-fuse/utils';
import { DatabaseService } from '@the-new-fuse/database';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import {
  TokenPayload,
  RefreshTokenPayload,
  AuthConfig,
  AuthEventType,
  AuthEvent
} from './AuthTypes.js';

@Injectable()
export class TokenManager extends EventEmitter {
  private logger: Logger;
  private redis: Redis;
  private readonly tokenBlacklist: Set<string>;

  constructor(
    private readonly jwtService: JwtService,
    private readonly db: DatabaseService,
    private readonly config: AuthConfig
  ) {
    super();
    this.logger = new Logger(TokenManager.name);
    this.tokenBlacklist = new Set();
    // Redis would be initialized here in actual implementation
  }

  async generateAccessToken(
    payload: Omit<TokenPayload, 'issuedAt' | 'expiresAt'>
  ): Promise<string> {
    try {
      const now = Math.floor(Date.now() / 1000);
      const tokenPayload = {
        ...payload,
        issuedAt: now,
        expiresAt: now + this.config.tokenExpiration
      };

      const token = await this.jwtService.signAsync(tokenPayload, {
        secret: this.config.jwtSecret,
        expiresIn: this.config.tokenExpiration
      });

      await this.recordTokenEvent(payload.userId, AuthEventType.TOKEN_REFRESH);
      return token;
    } catch (error) {
      this.logger.error('Failed to generate access token:', error as Error);
      throw error;
    }
  }

  async generateRefreshToken(userId: string): Promise<string> {
    try {
      const now = Math.floor(Date.now() / 1000);
      const tokenId = uuidv4();

      const payload = {
        userId,
        tokenId,
        issuedAt: now,
        expiresAt: now + this.config.refreshTokenExpiration
      };

      const token = await this.jwtService.signAsync(payload, {
        secret: this.config.jwtSecret,
        expiresIn: this.config.refreshTokenExpiration
      });

      // Store refresh token in Redis
      await this.redis.set(
        `refresh_token:${tokenId}`,
        JSON.stringify(payload)
      );
      
      return token;
    } catch (error) {
      this.logger.error('Failed to generate refresh token:', error as Error);
      throw error;
    }
  }

  async validateAccessToken(token: string): Promise<TokenPayload | null> {
    try {
      // Check blacklist
      if (this.tokenBlacklist.has(token)) {
        return null;
      }

      const payload = await this.jwtService.verifyAsync<TokenPayload>(token, {
        secret: this.config.jwtSecret
      });

      // Check expiration
      if (payload.expiresAt < Math.floor(Date.now() / 1000)) {
        return null;
      }

      return payload;
    } catch (error) {
      this.logger.error('Failed to validate access token:', error as Error);
      return null;
    }
  }

  async validateRefreshToken(token: string): Promise<RefreshTokenPayload | null> {
    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(token, {
        secret: this.config.jwtSecret
      });

      // Check if token exists in Redis
      const storedToken = await this.redis.get(`refresh_token:${payload.tokenId}`);
      
      if (!storedToken) {
        return null;
      }

      // Check expiration
      if (payload.expiresAt < Math.floor(Date.now() / 1000)) {
        await this.redis.del(`refresh_token:${payload.tokenId}`);
        return null;
      }

      return payload;
    } catch (error) {
      this.logger.error('Failed to validate refresh token:', error as Error);
      return null;
    }
  }

  async revokeToken(token: string): Promise<void> {
    try {
      const payload = await this.jwtService.decode(token);
      if (!payload) {
        throw new Error('Invalid token');
      }

      // Add to blacklist
      this.tokenBlacklist.add(token);

      // Store in Redis for persistence
      await this.redis.set(
        `revoked_token:${token}`,
        '1',
        'EX',
        Math.max(payload['exp'] - Math.floor(Date.now() / 1000), 0)
      );

      // Revoke refresh token
      if (payload['tokenId']) {
        await this.redis.del(`refresh_token:${payload['tokenId']}`);
      }
    } catch (error) {
      this.logger.error('Failed to revoke token:', error as Error);
      throw error;
    }
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    try {
      // Get all user sessions
      const sessions = await (this.db as any).authSessions.findMany({
        where: { userId, isRevoked: false }
      });

      // Revoke each session
      await Promise.all(
        sessions.map(async (session: { id: string }) => {
          await (this.db as any).authSessions.update({
            where: { id: session.id },
            data: { isRevoked: true }
          });
        })
      );

      // Clear refresh tokens
      const pattern = `refresh_token:*`;
      const keys = await this.redis.keys(pattern);
      
      for (const key of keys) {
        const token = await this.redis.get(key);
        if (token) {
          try {
            const payload = JSON.parse(token);
            if (payload.userId === userId) {
              await this.redis.del(key);
            }
          } catch (e) {
            // Skip invalid tokens
          }
        }
      }

      await this.recordTokenEvent(userId, AuthEventType.SESSION_REVOKED, {
        allSessions: true
      });
    } catch (error) {
      this.logger.error('Failed to revoke all user tokens:', error as Error);
      throw error;
    }
  }

  private async recordTokenEvent(
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
    this.emit('tokenEvent', event);
  }

  async cleanup(): Promise<void> {
    // Clear expired tokens from blacklist
    const now = Math.floor(Date.now() / 1000);
    
    for (const token of this.tokenBlacklist) {
      try {
        const payload = this.jwtService.decode(token) as any;
        if (payload && payload.exp < now) {
          this.tokenBlacklist.delete(token);
        }
      } catch (e) {
        this.tokenBlacklist.delete(token);
      }
    }
  }
}
