import { Injectable, Logger } from '@nestjs/common'; // From Current
import { v4 as uuidv4 } from 'uuid';

// Interface from Incoming
interface Token {
  id: string; // The token record's own ID
  userId: string;
  token: string; // The actual token string
  expiresAt: Date;
  type: 'access' | 'refresh';
}

@Injectable()
export class TokenManager {
  private readonly logger = new Logger(TokenManager.name); // From Current
  
  // Store by the token *string* for fast O(1) validation
  private tokens = new Map<string, Token>(); 

  constructor() {}

  // Merged: Based on 'Incoming' but async, with logging
  async generateToken(
    userId: string,
    type: 'access' | 'refresh' = 'access',
  ): Promise<Token> {
    this.logger.log(`Generate ${type} token for ${userId}`);
    const tokenString = uuidv4();
    
    const token: Token = {
      id: uuidv4(),
      userId,
      token: tokenString,
      expiresAt: new Date(
        Date.now() + (type === 'access' ? 3600000 : 604800000), // 1 hour or 7 days
      ),
      type,
    };

    this.tokens.set(token.token, token);
    return token;
  }

  // Merged: Based on 'Incoming' but async, with logging, and fast lookup
  async validateToken(tokenString: string): Promise<Token | null> {
    this.logger.log(`Validate token`);
    const token = this.tokens.get(tokenString);

    if (!token) {
      this.logger.warn('Token not found');
      return null;
    }

    if (token.expiresAt < new Date()) {
      this.logger.warn(`Token for ${token.userId} expired, removing.`);
      this.tokens.delete(tokenString); // Clean up expired token
      return null;
    }
    
    return token;
  }

  // Merged: Based on 'Incoming' but async and with logging
  async revokeToken(tokenString: string): Promise<boolean> {
    this.logger.log(`Revoke token`);
    return this.tokens.delete(tokenString);
  }

  // Merged: Based on 'Incoming' but async and with logging
  async refreshToken(refreshTokenString: string): Promise<Token | null> {
    this.logger.log(`Attempting to refresh token`);
    const refreshToken = await this.validateToken(refreshTokenString);

    if (refreshToken && refreshToken.type === 'refresh') {
      this.logger.log(`Issuing new access token for ${refreshToken.userId}`);
      // Revoke the used refresh token (optional, but good practice)
      await this.revokeToken(refreshTokenString);
      // Issue new ones
      // In a real system, you might issue a new refresh token as well
      return this.generateToken(refreshToken.userId, 'access');
    }

    this.logger.warn(`Invalid or expired refresh token provided`);
    return null;
  }
  
  // Kept from 'Current', but adapted to new structure
  async revokeAllUserTokens(userId: string): Promise<void> {
    this.logger.log(`Revoke all tokens for user ${userId}`);
    for (const [tokenString, token] of this.tokens.entries()) {
      if (token.userId === userId) {
        this.tokens.delete(tokenString);
      }
    }
  }

  // Kept from 'Incoming', but adapted to be async
  async cleanExpiredTokens(): Promise<number> {
    this.logger.log('Cleaning expired tokens...');
    let count = 0;
    for (const [tokenString, token] of this.tokens.entries()) {
      if (token.expiresAt <= new Date()) {
        this.tokens.delete(tokenString);
        count++;
      }
    }
    this.logger.log(`Removed ${count} expired tokens.`);
    return count;
  }
}