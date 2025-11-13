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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLoggingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const audit_logging_service_1 = require("./audit-logging.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
let AuditLoggingController = class AuditLoggingController {
    auditService;
    constructor(auditService) {
        this.auditService = auditService;
    }
    async getAuditLogs(query) {
        // Simple implementation using existing methods
        if (query.userId) {
            return this.auditService.findByUser(query.userId, query.limit);
        }
        if (query.action) {
            return this.auditService.findByAction(query.action, query.limit);
        }
        if (query.resource) {
            return this.auditService.findByResource(query.resource, undefined, query.limit);
        }
        return this.auditService.getSecurityEvents(query.limit);
    }
    async getUserAuditLogs(userId, query) {
        return this.auditService.findByUser(userId, query.limit || 50);
    }
    async getSecurityAlerts(limit = 50) {
        return this.auditService.getSecurityEvents(limit);
    }
    async getMyAuditLogs(req, query) {
        return this.auditService.findByUser(req.user.id, query.limit || 50);
    }
};
exports.AuditLoggingController = AuditLoggingController;
__decorate([
    (0, common_1.Get)('logs'),
    (0, roles_decorator_1.Roles)('admin', 'auditor'),
    (0, swagger_1.ApiOperation)({ summary: 'Get audit logs with filtering' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Audit logs retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - insufficient permissions' }),
    (0, swagger_1.ApiQuery)({ name: 'userId', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'action', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'resource', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'category', required: false, enum: ['auth', 'data', 'admin', 'security', 'system'] }),
    (0, swagger_1.ApiQuery)({ name: 'severity', required: false, enum: ['low', 'medium', 'high', 'critical'] }),
    (0, swagger_1.ApiQuery)({ name: 'outcome', required: false, enum: ['success', 'failure', 'blocked', 'partial'] }),
    (0, swagger_1.ApiQuery)({ name: 'ipAddress', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, type: Date }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false, type: Date }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'offset', required: false, type: Number }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuditLoggingController.prototype, "getAuditLogs", null);
__decorate([
    (0, common_1.Get)('logs/user/:userId'),
    (0, roles_decorator_1.Roles)('admin', 'auditor'),
    (0, swagger_1.ApiOperation)({ summary: 'Get audit logs for specific user' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User audit logs retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - insufficient permissions' }),
    __param(0, (0, common_1.Query)('userId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AuditLoggingController.prototype, "getUserAuditLogs", null);
__decorate([
    (0, common_1.Get)('security-alerts'),
    (0, roles_decorator_1.Roles)('admin', 'security'),
    (0, swagger_1.ApiOperation)({ summary: 'Get security alerts' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Security alerts retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - insufficient permissions' }),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AuditLoggingController.prototype, "getSecurityAlerts", null);
__decorate([
    (0, common_1.Get)('my-logs'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user audit logs' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User audit logs retrieved successfully' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuditLoggingController.prototype, "getMyAuditLogs", null);
exports.AuditLoggingController = AuditLoggingController = __decorate([
    (0, swagger_1.ApiTags)('audit'),
    (0, common_1.Controller)('audit'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [audit_logging_service_1.AuditLoggingService])
], AuditLoggingController);
//# sourceMappingURL=audit-logging.controller.js.map