"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GqlAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const graphql_1 = require("@nestjs/graphql");
const jwt_1 = require("@nestjs/jwt");
const security_logging_service_1 = require("../../security/security-logging.service");
let GqlAuthGuard = class GqlAuthGuard {
    constructor(jwtService, securityLogging) {
        this.jwtService = jwtService;
        this.securityLogging = securityLogging;
    }
    async canActivate(context) {
        const ctx = graphql_1.GqlExecutionContext.create(context);
        const { req } = ctx.getContext();
        const authHeader = req.headers?.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new common_1.UnauthorizedException('Authentication required');
        }
        const token = authHeader.substring(7);
        try {
            const payload = await this.jwtService.verifyAsync(token);
            const user = {
                id: payload.sub,
                email: payload.email,
                roles: payload.roles || [],
                permissions: payload.permissions || [],
            };
            req.user = user;
            this.securityLogging.logAuthEvent('login', {
                userId: user.id,
                ip: this.getClientIP(req),
                endpoint: ctx.getInfo()?.fieldName,
                success: true,
            });
            return true;
        }
        catch (error) {
            this.securityLogging.logAuthEvent('auth_failure', {
                ip: this.getClientIP(req),
                endpoint: ctx.getInfo()?.fieldName,
                success: false,
                reason: 'Invalid or expired token',
                metadata: { error: error.message },
            });
            throw new common_1.UnauthorizedException('Invalid or expired token');
        }
    }
    getClientIP(req) {
        return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
            req.headers['x-real-ip'] ||
            req.connection?.remoteAddress ||
            req.ip ||
            'unknown';
    }
};
exports.GqlAuthGuard = GqlAuthGuard;
exports.GqlAuthGuard = GqlAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        security_logging_service_1.SecurityLoggingService])
], GqlAuthGuard);
//# sourceMappingURL=gql-auth.guard.js.map