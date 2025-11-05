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
var _a;
import { Controller, Post, Body, UseGuards, Get, Req, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { LoginRateLimit, RegisterRateLimit, RateLimitGuard } from '@the-new-fuse/security';
class RegisterDto {
    email;
    password;
    name;
}
__decorate([
    IsEmail(),
    __metadata("design:type", String)
], RegisterDto.prototype, "email", void 0);
__decorate([
    IsString(),
    MinLength(6),
    __metadata("design:type", String)
], RegisterDto.prototype, "password", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], RegisterDto.prototype, "name", void 0);
class LoginDto {
    email;
    password;
}
__decorate([
    IsEmail(),
    __metadata("design:type", String)
], LoginDto.prototype, "email", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], LoginDto.prototype, "password", void 0);
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    async register(registerDto, req) {
        const { email, password, name } = registerDto;
        try {
            const result = await this.authService.register(email, password, name);
            return result;
        }
        catch (error) {
            // Let rate limiter know this was a failed attempt
            throw error;
        }
    }
    async loginWithEmail(loginDto, req) {
        const { email, password } = loginDto;
        let loginSuccess = false;
        try {
            const user = await this.authService.validateUser(email, password);
            if (!user) {
                throw new Error('Invalid credentials');
            }
            const result = await this.authService.login(user, req.get('User-Agent'), req.ip, req.get('User-Agent'));
            loginSuccess = true;
            return result;
        }
        catch (error) {
            // Rate limiter will count this as a failed attempt
            throw error;
        }
    }
    async loginWithFirebase(req) {
        const firebaseToken = req.headers.authorization?.split('Bearer ')[1];
        if (!firebaseToken) {
            throw new Error('Firebase token not provided');
        }
        return this.authService.authenticate(firebaseToken);
    }
    async logout(req) {
        const token = req.headers.authorization?.split('Bearer ')[1];
        if (!token) {
            throw new Error('Token not provided');
        }
        return this.authService.logout(token);
    }
    async googleAuth(res) {
        const redirectUrl = `${process.env.FRONTEND_URL}/auth/google-callback`;
        res.redirect(redirectUrl);
    }
    async googleAuthCallback(req, res) {
        // Handle Google OAuth callback
        // This will be implemented when we set up Google OAuth
        res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
    }
};
__decorate([
    Post('register'),
    RegisterRateLimit(),
    HttpCode(HttpStatus.CREATED),
    __param(0, Body()),
    __param(1, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [RegisterDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    Post('login'),
    LoginRateLimit(),
    HttpCode(HttpStatus.OK),
    __param(0, Body()),
    __param(1, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [LoginDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "loginWithEmail", null);
__decorate([
    Post('login/firebase'),
    UseGuards(FirebaseAuthGuard),
    __param(0, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "loginWithFirebase", null);
__decorate([
    Post('logout'),
    UseGuards(FirebaseAuthGuard),
    __param(0, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    Get('google'),
    __param(0, Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleAuth", null);
__decorate([
    Get('google/callback'),
    __param(0, Req()),
    __param(1, Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleAuthCallback", null);
AuthController = __decorate([
    Controller('auth'),
    UseGuards(RateLimitGuard),
    __metadata("design:paramtypes", [typeof (_a = typeof AuthService !== "undefined" && AuthService) === "function" ? _a : Object])
], AuthController);
export { AuthController };
//# sourceMappingURL=auth.controller.js.map