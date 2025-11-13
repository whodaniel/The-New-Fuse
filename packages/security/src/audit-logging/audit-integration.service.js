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
var AuthAuditIntegrationService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthAuditIntegrationService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@the-new-fuse/database");
let AuthAuditIntegrationService = AuthAuditIntegrationService_1 = class AuthAuditIntegrationService {
    prisma;
    logger = new common_1.Logger(AuthAuditIntegrationService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async logAuthEvent(data) {
        try {
            await this.prisma.auditLog.create({
                data: {
                    userId: data.userId,
                    action: data.action,
                    resource: data.resource,
                    ipAddress: data.ipAddress,
                    userAgent: data.userAgent,
                    success: data.success,
                    metadata: data.metadata ? JSON.stringify(data.metadata) : null,
                },
            });
        }
        catch (error) {
            this.logger.error('Failed to create audit log', error);
        }
    }
    logLogin(userId, request) {
        this.logAuthEvent({
            userId,
            action: 'LOGIN',
            resource: 'auth',
            ipAddress: request.ip || 'unknown',
            userAgent: request.get('user-agent') || 'unknown',
            success: true,
        });
    }
    logLogout(userId, request) {
        this.logAuthEvent({
            userId,
            action: 'LOGOUT',
            resource: 'auth',
            ipAddress: request.ip || 'unknown',
            userAgent: request.get('user-agent') || 'unknown',
            success: true,
        });
    }
    logFailedLogin(email, request, reason) {
        this.logAuthEvent({
            action: 'FAILED_LOGIN',
            resource: 'auth',
            ipAddress: request.ip || 'unknown',
            userAgent: request.get('user-agent') || 'unknown',
            success: false,
            metadata: { email, reason },
        });
    }
    logPasswordChange(userId, request) {
        this.logAuthEvent({
            userId,
            action: 'PASSWORD_CHANGE',
            resource: 'auth',
            ipAddress: request.ip || 'unknown',
            userAgent: request.get('user-agent') || 'unknown',
            success: true,
        });
    }
    logMfaSetup(userId, request) {
        this.logAuthEvent({
            userId,
            action: 'MFA_SETUP',
            resource: 'mfa',
            ipAddress: request.ip || 'unknown',
            userAgent: request.get('user-agent') || 'unknown',
            success: true,
        });
    }
    logMfaEnabled(userId, request) {
        this.logAuthEvent({
            userId,
            action: 'MFA_ENABLED',
            resource: 'mfa',
            ipAddress: request.ip || 'unknown',
            userAgent: request.get('user-agent') || 'unknown',
            success: true,
        });
    }
    logMfaDisabled(userId, request) {
        this.logAuthEvent({
            userId,
            action: 'MFA_DISABLED',
            resource: 'mfa',
            ipAddress: request.ip || 'unknown',
            userAgent: request.get('user-agent') || 'unknown',
            success: true,
        });
    }
    logMfaFailed(userId, request) {
        this.logAuthEvent({
            userId,
            action: 'MFA_FAILED',
            resource: 'mfa',
            ipAddress: request.ip || 'unknown',
            userAgent: request.get('user-agent') || 'unknown',
            success: false,
        });
    }
    logUnauthorizedAccess(userId, resource, request) {
        this.logAuthEvent({
            userId,
            action: 'UNAUTHORIZED_ACCESS',
            resource,
            ipAddress: request.ip || 'unknown',
            userAgent: request.get('user-agent') || 'unknown',
            success: false,
        });
    }
};
exports.AuthAuditIntegrationService = AuthAuditIntegrationService;
exports.AuthAuditIntegrationService = AuthAuditIntegrationService = AuthAuditIntegrationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof database_1.PrismaService !== "undefined" && database_1.PrismaService) === "function" ? _a : Object])
], AuthAuditIntegrationService);
//# sourceMappingURL=audit-integration.service.js.map