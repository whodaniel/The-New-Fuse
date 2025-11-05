var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
let GoogleAuthService = class GoogleAuthService {
    configService;
    prisma;
    jwtService;
    oauth2Client;
    constructor(configService, prisma, jwtService) {
        this.configService = configService;
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.oauth2Client = new OAuth2Client(configService.get('GOOGLE_CLIENT_ID'), configService.get('GOOGLE_CLIENT_SECRET'), configService.get('GOOGLE_REDIRECT_URI'));
    }
    async handleCallback(code) {
        const { tokens } = await this.oauth2Client.getToken(code);
        if (!tokens.id_token) {
            throw new Error('No ID token received from Google');
        }
        const ticket = await this.oauth2Client.verifyIdToken({
            idToken: tokens.id_token,
            audience: this.configService.get('GOOGLE_CLIENT_ID'),
        });
        const payload = ticket.getPayload();
        if (!payload) {
            throw new Error('Failed to get payload from Google token');
        }
        // Find or create user
        const user = await this.prisma.user.upsert({
            where: { email: payload.email },
            update: {
                name: payload.name || null,
            },
            create: {
                email: payload.email,
                name: payload.name || null,
                hashedPassword: 'google-oauth-user',
                role: 'USER',
            },
        });
        // Generate JWT
        const jwt = this.jwtService.sign({
            sub: user.id,
            email: user.email,
            role: user.role,
        });
        return { token: jwt, user };
    }
};
GoogleAuthService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService, typeof (_a = typeof PrismaService !== "undefined" && PrismaService) === "function" ? _a : Object, JwtService])
], GoogleAuthService);
export { GoogleAuthService };
//# sourceMappingURL=google.service.js.map