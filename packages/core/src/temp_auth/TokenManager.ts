import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

// This is a temporary token manager. Replace with a real one.

@Injectable()
export class TokenManager {
  private readonly logger = new Logger(TokenManager.name);
  private tokens = new Map<string, any>();

  constructor() {}

  async generateRefreshToken(payload: any): Promise<string> {
    this.logger.log(`Generate refresh token for ${payload.userId}`);
    const token = uuidv4();
    this.tokens.set(token, {
      ...payload,
      issuedAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    return token;
  }

  async validateRefreshToken(token: string): Promise<any | null> {
    this.logger.log(`Validate refresh token`);
    const payload = this.tokens.get(token);
    if (!payload || payload.expiresAt < Date.now()) {
      return null;
    }
    return payload;
  }

  async revokeToken(token: string): Promise<void> {
    this.logger.log(`Revoke token`);
    this.tokens.delete(token);
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    this.logger.log(`Revoke all tokens for user ${userId}`);
    for (const [token, payload] of this.tokens.entries()) {
      if (payload.userId === userId) {
        this.tokens.delete(token);
      }
    }
  }
}
