var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TokenManager_1;
import { Injectable, Logger } from '@nestjs/common'; // From Current
import { v4 as uuidv4 } from 'uuid';
let TokenManager = TokenManager_1 = class TokenManager {
    constructor() {
        this.logger = new Logger(TokenManager_1.name); // From Current
        // Store by the token *string* for fast O(1) validation
        this.tokens = new Map();
    }
    // Merged: Based on 'Incoming' but async, with logging
    async generateToken(userId, type = 'access') {
        this.logger.log(`Generate ${type} token for ${userId}`);
        const tokenString = uuidv4();
        const token = {
            id: uuidv4(),
            userId,
            token: tokenString,
            expiresAt: new Date(Date.now() + (type === 'access' ? 3600000 : 604800000)),
            type,
        };
        this.tokens.set(token.token, token);
        return token;
    }
    // Merged: Based on 'Incoming' but async, with logging, and fast lookup
    async validateToken(tokenString) {
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
    async revokeToken(tokenString) {
        this.logger.log(`Revoke token`);
        return this.tokens.delete(tokenString);
    }
    // Merged: Based on 'Incoming' but async and with logging
    async refreshToken(refreshTokenString) {
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
    async revokeAllUserTokens(userId) {
        this.logger.log(`Revoke all tokens for user ${userId}`);
        for (const [tokenString, token] of this.tokens.entries()) {
            if (token.userId === userId) {
                this.tokens.delete(tokenString);
            }
        }
    }
    // Kept from 'Incoming', but adapted to be async
    async cleanExpiredTokens() {
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
};
TokenManager = TokenManager_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], TokenManager);
export { TokenManager };
//# sourceMappingURL=TokenManager.js.map