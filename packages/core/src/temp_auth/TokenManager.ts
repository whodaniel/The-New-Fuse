import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

interface Token {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  type: 'access' | 'refresh';
}

@Injectable()
export class TokenManager {
  private tokens = new Map<string, Token>();

  generateToken(userId: string, type: 'access' | 'refresh' = 'access'): Token {
    const token: Token = {
      id: uuidv4(),
      userId,
      token: uuidv4(),
      expiresAt: new Date(Date.now() + (type === 'access' ? 3600000 : 86400000)),
      type
    };

    this.tokens.set(token.id, token);
    return token;
  }

  validateToken(tokenString: string): Token | null {
    for (const token of this.tokens.values()) {
      if (token.token === tokenString && token.expiresAt > new Date()) {
        return token;
      }
    }
    return null;
  }

  revokeToken(tokenId: string): boolean {
    return this.tokens.delete(tokenId);
  }

  refreshToken(refreshTokenString: string): Token | null {
    const refreshToken = this.validateToken(refreshTokenString);
    if (refreshToken && refreshToken.type === 'refresh') {
      return this.generateToken(refreshToken.userId, 'access');
    }
    return null;
  }

  cleanExpiredTokens(): number {
    let count = 0;
    for (const [id, token] of this.tokens.entries()) {
      if (token.expiresAt <= new Date()) {
        this.tokens.delete(id);
        count++;
      }
    }
    return count;
  }
}
