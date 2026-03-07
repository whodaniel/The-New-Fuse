/**
 * Token Blacklist Service
 *
 * Manages blacklisted JWT tokens for secure logout.
 * When a user logs out, their token is added to the blacklist
 * to prevent reuse until it naturally expires.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

interface BlacklistedToken {
  token: string;
  userId: string;
  expiresAt: Date;
  reason: string;
  blacklistedAt: Date;
}

@Injectable()
export class TokenBlacklistService {
  private readonly logger = new Logger(TokenBlacklistService.name);

  // In-memory blacklist (in production, use Redis)
  private blacklist: Map<string, BlacklistedToken> = new Map();

  // Cleanup interval (every 10 minutes)
  private cleanupInterval: NodeJS.Timeout;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {
    // Start cleanup interval
    this.cleanupInterval = setInterval(() => this.cleanup(), 10 * 60 * 1000);
  }

  /**
   * Blacklist a token
   */
  async blacklistToken(token: string, userId: string, reason: string = 'logout'): Promise<void> {
    try {
      // Decode token to get expiration
      const decoded = this.jwtService.decode(token) as any;

      if (!decoded || !decoded.exp) {
        this.logger.warn('Attempted to blacklist invalid token');
        return;
      }

      const expiresAt = new Date(decoded.exp * 1000);

      const blacklistedToken: BlacklistedToken = {
        token,
        userId,
        expiresAt,
        reason,
        blacklistedAt: new Date(),
      };

      this.blacklist.set(token, blacklistedToken);

      this.logger.log(`Token blacklisted for user ${userId} (reason: ${reason})`);
    } catch (error) {
      this.logger.error('Failed to blacklist token:', error);
    }
  }

  /**
   * Check if a token is blacklisted
   */
  async isBlacklisted(token: string): Promise<boolean> {
    const blacklisted = this.blacklist.has(token);

    if (blacklisted) {
      this.logger.debug('Blacklisted token usage attempt detected');
    }

    return blacklisted;
  }

  /**
   * Blacklist all tokens for a user (e.g., on password change)
   */
  async blacklistAllUserTokens(userId: string, reason: string = 'security'): Promise<number> {
    let count = 0;

    for (const [token, entry] of this.blacklist.entries()) {
      if (entry.userId === userId) {
        await this.blacklistToken(token, userId, reason);
        count++;
      }
    }

    this.logger.log(`Blacklisted ${count} tokens for user ${userId}`);
    return count;
  }

  /**
   * Remove expired tokens from blacklist
   */
  private cleanup(): void {
    const now = new Date();
    let cleaned = 0;

    for (const [token, entry] of this.blacklist.entries()) {
      if (entry.expiresAt < now) {
        this.blacklist.delete(token);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug(`Cleaned up ${cleaned} expired blacklisted tokens`);
    }
  }

  /**
   * Get blacklist statistics
   */
  getStats(): { total: number; byReason: Record<string, number> } {
    const byReason: Record<string, number> = {};

    for (const entry of this.blacklist.values()) {
      byReason[entry.reason] = (byReason[entry.reason] || 0) + 1;
    }

    return {
      total: this.blacklist.size,
      byReason,
    };
  }

  /**
   * Cleanup on module destroy
   */
  onModuleDestroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}
