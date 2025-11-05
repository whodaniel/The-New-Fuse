var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { compare, hash } from 'bcrypt';
import { ConfigService } from '@nestjs/config';
let AuthService = class AuthService {
    userRepository;
    jwtService;
    configService;
    constructor(userRepository, jwtService, configService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async validateToken(token) {
        try {
            const payload = await this.jwtService.verifyAsync(token);
            return this.userRepository.findOneOrFail({ where: { id: payload.sub } });
        }
        catch (error) {
            throw new UnauthorizedException('Invalid token');
        }
    }
    async login(loginDto) {
        const user = await this.userRepository.findOne({
            where: { email: loginDto.email },
        });
        if (!user || !(await compare(loginDto.password, user.password))) {
            throw new UnauthorizedException('Invalid credentials');
        }
        return this.generateTokens(user);
    }
    async register(registerDto) {
        const existingUser = await this.userRepository.findOne({
            where: [{ email: registerDto.email }, { username: registerDto.username }],
        });
        if (existingUser) {
            throw new UnauthorizedException('User already exists');
        }
        const hashedPassword = await hash(registerDto.password, 10);
        const user = this.userRepository.create({
            ...registerDto,
            password: hashedPassword,
        });
        await this.userRepository.save(user);
        return this.generateTokens(user);
    }
    async refresh(refreshToken) {
        try {
            const payload = await this.jwtService.verifyAsync(refreshToken, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
            });
            const user = await this.userRepository.findOneOrFail({
                where: { id: payload.sub },
            });
            return this.generateTokens(user);
        }
        catch (error) {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }
    async logout() {
        // Implement token blacklisting if needed
    }
    async getCurrentUser() {
        // This method will be called after AuthGuard, so user is already in request
        return null;
    }
    async generateTokens(user) {
        const payload = { sub: user.id, username: user.username };
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.configService.get('JWT_SECRET'),
                expiresIn: '15m',
            }),
            this.jwtService.signAsync(payload, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
                expiresIn: '7d',
            }),
        ]);
        return { accessToken, refreshToken };
    }
};
AuthService = __decorate([
    Injectable(),
    __param(0, InjectRepository(User)),
    __metadata("design:paramtypes", [Repository,
        JwtService,
        ConfigService])
], AuthService);
export { AuthService };
//# sourceMappingURL=auth.service.js.map