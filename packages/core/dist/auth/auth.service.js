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
    async validateUser(email, password) {
        // This is a placeholder implementation
        // In a real app, you would validate against a database
        if (email && password) {
            return {
                id: '1',
                email,
                name: 'Test User',
                roles: ['user'],
            };
        }
        return null;
    }
    async login(user) {
        const payload = {
            email: user.email,
            sub: user.id,
            roles: user.roles || ['user'],
        };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                roles: user.roles,
            },
        };
    }
    async register(userData) {
        // This is a placeholder implementation
        // In a real app, you would save to a database
        return {
            id: Date.now().toString(),
            email: userData.email,
            name: userData.name || 'New User',
            roles: ['user'],
        };
    }
    async validateToken(token) {
        try {
            const payload = this.jwtService.verify(token);
            return {
                id: payload.sub,
                email: payload.email,
                roles: payload.roles,
            };
        }
        catch {
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