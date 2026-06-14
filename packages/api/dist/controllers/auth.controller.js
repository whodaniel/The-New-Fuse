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
var AuthController_1;
/**
 * Authentication Controller
 * Handles user authentication endpoints including login, register, logout, and token refresh
 */
import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Logger, Post, UnauthorizedException, UseGuards, } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { drizzleUserRepository } from '@the-new-fuse/database';
import * as bcrypt from 'bcrypt';
import { CurrentUser } from '../modules/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../modules/guards/jwt-auth.guard.js';
/**
 * Login request DTO
 */
export class LoginDto {
}
/**
 * Register request DTO
 */
export class RegisterDto {
}
/**
 * Refresh token request DTO
 */
export class RefreshTokenDto {
}
let AuthController = AuthController_1 = class AuthController {
    constructor(jwtService, configService) {
        this.jwtService = jwtService;
        this.configService = configService;
        this.logger = new Logger(AuthController_1.name);
    }
    /**
     * Login endpoint
     * Authenticates user and returns JWT tokens
     */
    async login(loginDto) {
        this.logger.debug(`Login attempt for email: ${loginDto.email}`);
        try {
            // Find user by email
            const user = await drizzleUserRepository.findByEmail(loginDto.email);
            if (!user) {
                this.logger.warn(`Login failed: User not found for email: ${loginDto.email}`);
                throw new UnauthorizedException('Invalid credentials');
            }
            // Check if user is active
            if (!user.isActive) {
                this.logger.warn(`Login failed: User account is inactive: ${loginDto.email}`);
                throw new UnauthorizedException('Account is inactive');
            }
            // Verify password
            const isPasswordValid = await bcrypt.compare(loginDto.password, user.hashedPassword);
            if (!isPasswordValid) {
                this.logger.warn(`Login failed: Invalid password for email: ${loginDto.email}`);
                throw new UnauthorizedException('Invalid credentials');
            }
            // Update last login
            await drizzleUserRepository.updateLastLogin(user.id);
            // Generate tokens
            const tokens = await this.generateTokens(user);
            this.logger.debug(`Login successful for user: ${user.id}`);
            return {
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                tokenType: 'Bearer',
                expiresIn: this.configService.get('JWT_EXPIRES_IN', '24h'),
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username || undefined,
                    name: user.name || undefined,
                    roles: user.roles || ['USER'],
                },
            };
        }
        catch (error) {
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            this.logger.error(`Login error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw new UnauthorizedException('Authentication failed');
        }
    }
    /**
     * Register endpoint
     * Creates a new user account
     */
    async register(registerDto) {
        this.logger.debug(`Registration attempt for email: ${registerDto.email}`);
        try {
            // Check if user already exists
            const existingUser = await drizzleUserRepository.findByEmail(registerDto.email);
            if (existingUser) {
                throw new BadRequestException('Email already registered');
            }
            // Check username if provided
            if (registerDto.username) {
                const existingUsername = await drizzleUserRepository.findByUsername(registerDto.username);
                if (existingUsername) {
                    throw new BadRequestException('Username already taken');
                }
            }
            // Hash password
            const hashedPassword = await bcrypt.hash(registerDto.password, 10);
            // Create user
            const user = await drizzleUserRepository.create({
                email: registerDto.email,
                hashedPassword,
            });
            // Generate tokens
            const tokens = await this.generateTokens(user);
            this.logger.debug(`Registration successful for user: ${user.id}`);
            return {
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                tokenType: 'Bearer',
                expiresIn: this.configService.get('JWT_EXPIRES_IN', '24h'),
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username || undefined,
                    name: user.name || undefined,
                    roles: user.roles || ['USER'],
                },
            };
        }
        catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            this.logger.error(`Registration error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw new BadRequestException('Registration failed');
        }
    }
    /**
     * Logout endpoint
     * Invalidates the user's refresh token
     */
    async logout(user) {
        this.logger.debug(`Logout for user: ${user.id}`);
        try {
            // Clear refresh token
            await drizzleUserRepository.updateRefreshToken(user.id, null);
            // Delete all sessions
            await drizzleUserRepository.deleteAllSessions(user.id);
            return { message: 'Logged out successfully' };
        }
        catch (error) {
            this.logger.error(`Logout error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return { message: 'Logged out successfully' };
        }
    }
    /**
     * Refresh token endpoint
     * Generates new access token using refresh token
     */
    async refreshToken(refreshTokenDto) {
        this.logger.debug('Token refresh attempt');
        try {
            // Verify refresh token
            const payload = this.jwtService.verify(refreshTokenDto.refreshToken, {
                secret: this.configService.get('JWT_REFRESH_SECRET') ||
                    this.configService.get('JWT_SECRET'),
            });
            // Find user
            const user = await drizzleUserRepository.findById(payload.sub);
            if (!user || !user.isActive) {
                throw new UnauthorizedException('Invalid refresh token');
            }
            // Generate new tokens
            const tokens = await this.generateTokens(user);
            return {
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                tokenType: 'Bearer',
                expiresIn: this.configService.get('JWT_EXPIRES_IN', '24h'),
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username || undefined,
                    name: user.name || undefined,
                    roles: user.roles || ['USER'],
                },
            };
        }
        catch (error) {
            this.logger.error(`Token refresh error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw new UnauthorizedException('Invalid refresh token');
        }
    }
    /**
     * Get current user endpoint
     * Returns the authenticated user's profile
     */
    async getCurrentUser(user) {
        const fullUser = await drizzleUserRepository.findById(user.id);
        if (!fullUser) {
            throw new UnauthorizedException('User not found');
        }
        return {
            id: fullUser.id,
            email: fullUser.email,
            username: fullUser.username,
            name: fullUser.name,
            roles: fullUser.roles || ['USER'],
            emailVerified: fullUser.emailVerified,
            lastLogin: fullUser.lastLogin,
            createdAt: fullUser.createdAt,
        };
    }
    /**
     * Generate access and refresh tokens
     */
    async generateTokens(user) {
        const payload = {
            sub: user.id,
            email: user.email,
            username: user.username,
            roles: user.roles || ['USER'],
        };
        const accessToken = this.jwtService.sign(payload, {
            expiresIn: this.configService.get('JWT_EXPIRES_IN', '24h'),
        });
        const refreshToken = this.jwtService.sign({ sub: user.id, type: 'refresh' }, {
            secret: this.configService.get('JWT_REFRESH_SECRET') ||
                this.configService.get('JWT_SECRET'),
            expiresIn: '30d',
        });
        // Store refresh token
        await drizzleUserRepository.updateRefreshToken(user.id, refreshToken);
        return { accessToken, refreshToken };
    }
};
__decorate([
    Post('login'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'User login' }),
    ApiResponse({ status: 200, description: 'Login successful' }),
    ApiResponse({ status: 401, description: 'Invalid credentials' }),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [LoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    Post('register'),
    HttpCode(HttpStatus.CREATED),
    ApiOperation({ summary: 'User registration' }),
    ApiResponse({ status: 201, description: 'Registration successful' }),
    ApiResponse({ status: 400, description: 'Invalid data or email already exists' }),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [RegisterDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    Post('logout'),
    HttpCode(HttpStatus.OK),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth(),
    ApiOperation({ summary: 'User logout' }),
    ApiResponse({ status: 200, description: 'Logout successful' }),
    __param(0, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    Post('refresh'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Refresh access token' }),
    ApiResponse({ status: 200, description: 'Token refreshed successfully' }),
    ApiResponse({ status: 401, description: 'Invalid refresh token' }),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [RefreshTokenDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refreshToken", null);
__decorate([
    Get('me'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth(),
    ApiOperation({ summary: 'Get current user' }),
    ApiResponse({ status: 200, description: 'User profile' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    __param(0, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getCurrentUser", null);
AuthController = AuthController_1 = __decorate([
    ApiTags('auth'),
    Controller('auth'),
    __metadata("design:paramtypes", [JwtService,
        ConfigService])
], AuthController);
export { AuthController };
//# sourceMappingURL=auth.controller.js.map