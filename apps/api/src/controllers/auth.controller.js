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
var _a, _b, _c;
import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { LoginDto, RegisterDto } from '../dtos/auth.dto';
import { AuthGuard } from '../guards/auth.guard';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    async login(loginDto) {
        return this.authService.login(loginDto);
    }
    async register(registerDto) {
        return this.authService.register(registerDto);
    }
    async refresh(refreshToken) {
        return this.authService.refresh(refreshToken);
    }
    async logout() {
        return this.authService.logout();
    }
    async me() {
        return this.authService.getCurrentUser();
    }
};
__decorate([
    Post('login'),
    ApiOperation({ summary: 'User login' }),
    ApiResponse({ status: 200, description: 'Login successful' }),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof LoginDto !== "undefined" && LoginDto) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    Post('register'),
    ApiOperation({ summary: 'User registration' }),
    ApiResponse({ status: 201, description: 'Registration successful' }),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof RegisterDto !== "undefined" && RegisterDto) === "function" ? _c : Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    Post('refresh'),
    ApiOperation({ summary: 'Refresh token' }),
    ApiResponse({ status: 200, description: 'Token refreshed successfully' }),
    __param(0, Body('refreshToken')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    Post('logout'),
    UseGuards(AuthGuard),
    ApiOperation({ summary: 'User logout' }),
    ApiResponse({ status: 200, description: 'Logout successful' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    Get('me'),
    UseGuards(AuthGuard),
    ApiOperation({ summary: 'Get current user' }),
    ApiResponse({ status: 200, description: 'Return current user' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "me", null);
AuthController = __decorate([
    ApiTags('auth'),
    Controller('auth'),
    __metadata("design:paramtypes", [typeof (_a = typeof AuthService !== "undefined" && AuthService) === "function" ? _a : Object])
], AuthController);
export { AuthController };
//# sourceMappingURL=auth.controller.js.map