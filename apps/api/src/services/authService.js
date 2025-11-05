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
import { PrismaService } from './prisma.service';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
let AuthService = class AuthService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async register({ name, email, password }) {
        const existingUser = await this.prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            throw new Error('User with this email already exists');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await this.prisma.user.create({
            data: {
                name,
                email,
                hashedPassword,
                role: 'USER',
            },
        });
        const accessToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'your-jwt-secret-key', { expiresIn: '15m' });
        const refreshToken = jwt.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET || 'your-jwt-refresh-secret-key', { expiresIn: '7d' });
        await this.prisma.user.update({
            where: { id: user.id },
            data: { refreshToken },
        });
        return {
            user,
            accessToken,
            refreshToken
        };
    }
    async login({ email, password }) {
        const user = await this.prisma.user.findUnique({
            where: { email },
            select: { id: true, hashedPassword: true, refreshToken: true, email: true, name: true, role: true },
        });
        if (!user) {
            throw new Error('Invalid email or password');
        }
        const isValidPassword = await bcrypt.compare(password, user.hashedPassword);
        if (!isValidPassword) {
            throw new Error('Invalid email or password');
        }
        const accessToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'your-jwt-secret-key', { expiresIn: '15m' });
        const refreshToken = jwt.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET || 'your-jwt-refresh-secret-key', { expiresIn: '7d' });
        await this.prisma.user.update({
            where: { id: user.id },
            data: { refreshToken },
        });
        return {
            user,
            accessToken,
            refreshToken
        };
    }
    async getCurrentUser(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    }
    async refreshToken(refreshToken) {
        try {
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'your-jwt-refresh-secret-key');
            const user = await this.prisma.user.findUnique({
                where: {
                    id: decoded.userId,
                    refreshToken,
                },
            });
            if (!user) {
                throw new Error('Invalid refresh token');
            }
            const accessToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'your-jwt-secret-key', { expiresIn: '15m' });
            const newRefreshToken = jwt.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET || 'your-jwt-refresh-secret-key', { expiresIn: '7d' });
            await this.prisma.user.update({
                where: { id: user.id },
                data: { refreshToken: newRefreshToken },
            });
            return {
                accessToken,
                refreshToken: newRefreshToken
            };
        }
        catch (error) {
            throw new Error('Invalid refresh token');
        }
    }
};
AuthService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [typeof (_a = typeof PrismaService !== "undefined" && PrismaService) === "function" ? _a : Object])
], AuthService);
export { AuthService };
//# sourceMappingURL=authService.js.map