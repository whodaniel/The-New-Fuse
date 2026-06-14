var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
let AuthService = class AuthService {
    constructor(jwtService, configService) {
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async generateToken(userId) {
        try {
            const secret = this.configService.get('JWT_SECRET');
            if (!secret) {
                throw new Error('JWT_SECRET not configured');
            }
            return this.jwtService.sign({ sub: userId }, {
                secret,
                expiresIn: '1d',
                algorithm: 'HS256'
            });
        }
        catch (error) {
            console.error('Error generating token:', error);
            throw new Error('Failed to generate authentication token');
        }
    }
    async validateUser(token) {
        try {
            const secret = this.configService.get('JWT_SECRET');
            if (!secret) {
                throw new Error('JWT_SECRET not configured');
            }
            return this.jwtService.verify(token, { secret });
        }
        catch (error) {
            if (error instanceof Error) {
                console.error('Error validating user:', error.message);
            }
            throw new Error('Invalid or expired token');
        }
    }
    async refreshToken(token) {
        try {
            const payload = await this.validateUser(token);
            if (!payload) {
                return null;
            }
            return this.generateToken(payload.sub);
        }
        catch (error) {
            console.error('Error refreshing token:', error);
            return null;
        }
    }
};
AuthService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [JwtService,
        ConfigService])
], AuthService);
export { AuthService };
//# sourceMappingURL=auth.service.js.map