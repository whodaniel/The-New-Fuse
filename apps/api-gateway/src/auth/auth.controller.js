"use strict";
/**
 * Authentication Controller
 * Proxies authentication requests to backend services
 */
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const proxy_service_1 = require("../proxy/proxy.service");
let AuthController = class AuthController {
    proxyService;
    constructor(proxyService) {
        this.proxyService = proxyService;
    }
    async login(body, headers, res) {
        try {
            const response = await this.proxyService.proxyRequest('backend', '/api/auth/login', 'POST', headers, body);
            return res.status(response.status).json(response.data);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return res.status(common_1.HttpStatus.BAD_GATEWAY).json({
                message: 'Authentication service unavailable',
                error: errorMessage,
            });
        }
    }
    async register(body, headers, res) {
        try {
            const response = await this.proxyService.proxyRequest('backend', '/api/auth/register', 'POST', headers, body);
            return res.status(response.status).json(response.data);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return res.status(common_1.HttpStatus.BAD_GATEWAY).json({
                message: 'Authentication service unavailable',
                error: errorMessage,
            });
        }
    }
    async refresh(body, headers, res) {
        try {
            const response = await this.proxyService.proxyRequest('backend', '/api/auth/refresh', 'POST', headers, body);
            return res.status(response.status).json(response.data);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return res.status(common_1.HttpStatus.BAD_GATEWAY).json({
                message: 'Authentication service unavailable',
                error: errorMessage,
            });
        }
    }
    async logout(headers, res) {
        try {
            const response = await this.proxyService.proxyRequest('backend', '/api/auth/logout', 'POST', headers);
            return res.status(response.status).json(response.data);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return res.status(common_1.HttpStatus.BAD_GATEWAY).json({
                message: 'Authentication service unavailable',
                error: errorMessage,
            });
        }
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('login'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({ summary: 'User login' }),
    (0, swagger_1.ApiBody)({ description: 'Login credentials' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Login successful' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid credentials' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('register'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({ summary: 'User registration' }),
    (0, swagger_1.ApiBody)({ description: 'Registration data' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Registration successful' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid registration data' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('refresh'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({ summary: 'Refresh authentication token' }),
    (0, swagger_1.ApiBody)({ description: 'Refresh token data' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Token refreshed successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid refresh token' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({ summary: 'User logout' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Logout successful' }),
    __param(0, (0, common_1.Headers)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    (0, swagger_1.ApiTags)('auth'),
    __metadata("design:paramtypes", [proxy_service_1.ProxyService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map