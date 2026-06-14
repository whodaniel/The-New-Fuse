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
exports.AdminOpenClawOAuthController = void 0;
const common_1 = require("@nestjs/common");
// @ts-ignore
// @ts-ignore
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../decorators/current-user.decorator");
const openclaw_oauth_rotation_dto_1 = require("../dto/openclaw-oauth-rotation.dto");
const admin_guard_1 = require("../guards/admin.guard");
const secure_auth_guard_1 = require("../guards/secure-auth.guard");
const audit_service_1 = require("../services/audit.service");
const openclaw_oauth_rotation_service_1 = require("../services/openclaw-oauth-rotation.service");
let AdminOpenClawOAuthController = class AdminOpenClawOAuthController {
    constructor(rotationService, auditService) {
        this.rotationService = rotationService;
        this.auditService = auditService;
    }
    assertSuperAdmin(user) {
        const roles = Array.isArray(user?.roles) ? user.roles : [user?.role];
        const isSuper = roles.some((role) => String(role || '').toUpperCase() === 'SUPER_ADMIN');
        if (!isSuper)
            throw new common_1.ForbiddenException('SUPER_ADMIN required');
    }
    normalizeProvider(provider) {
        const normalized = provider.trim().toLowerCase();
        if (!openclaw_oauth_rotation_dto_1.OPENCLAW_PROVIDERS.includes(normalized)) {
            throw new common_1.ForbiddenException(`Unsupported provider '${provider}'`);
        }
        return normalized;
    }
    async getRotationAuditSnapshot(limit = 100) {
        const boundedLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 10), 300) : 100;
        const logs = await this.auditService.getLogs({
            resourceType: 'openclaw_oauth_binding',
            limit: boundedLimit,
        });
        const events = logs
            .filter((log) => String(log.action || '').startsWith('openclaw.oauth.'))
            .map((log) => {
            const details = log.details && typeof log.details === 'object'
                ? log.details
                : {};
            return {
                id: String(log.id || ''),
                action: String(log.action || ''),
                status: String(log.status || 'info'),
                createdAt: log.createdAt ? new Date(log.createdAt).toISOString() : null,
                userId: log.userId ?? null,
                tenantId: String(details.tenantId || '') || null,
                service: String(details.service || '') || null,
                provider: String(details.provider || '') || null,
                details,
            };
        });
        const totals = {
            total: events.length,
            success: events.filter((e) => e.status === 'success').length,
            warning: events.filter((e) => e.status === 'warning').length,
            error: events.filter((e) => e.status === 'error').length,
        };
        const latestMap = new Map();
        const findings = [];
        for (const event of events) {
            const service = event.service || 'unknown';
            const provider = event.provider || 'unknown';
            if (event.action !== 'openclaw.oauth.binding.executed')
                continue;
            const deployStatus = String(event.details.deployStatus || '') || null;
            const overviewRaw = event.details.overviewStatus;
            const overviewStatus = typeof overviewRaw === 'number'
                ? overviewRaw
                : Number.isFinite(Number(overviewRaw))
                    ? Number(overviewRaw)
                    : null;
            const runStatus = deployStatus === 'SUCCESS' && overviewStatus === 200 ? 'healthy' : 'degraded';
            latestMap.set(`${service}:${provider}`, {
                service,
                provider,
                status: runStatus,
                deployStatus,
                overviewStatus,
                at: event.createdAt,
            });
            if (deployStatus && deployStatus !== 'SUCCESS') {
                findings.push({
                    severity: 'P0',
                    service,
                    provider,
                    issue: `Deployment status is ${deployStatus}`,
                    at: event.createdAt,
                });
            }
            if (overviewStatus !== null && overviewStatus !== 200) {
                findings.push({
                    severity: 'P1',
                    service,
                    provider,
                    issue: `Overview endpoint returned HTTP ${overviewStatus}`,
                    at: event.createdAt,
                });
            }
        }
        return {
            events,
            rollup: {
                totals,
                latestRunByService: Array.from(latestMap.values()),
                findings: findings.slice(0, 50),
            },
        };
    }
    async listBindings(user) {
        this.assertSuperAdmin(user);
        return this.rotationService.listBindings();
    }
    async upsertBinding(user, dto) {
        this.assertSuperAdmin(user);
        const binding = await this.rotationService.upsertBinding(user.id, dto);
        await this.auditService.log('openclaw.oauth.binding.upserted', {
            userId: user.id,
            resourceType: 'openclaw_oauth_binding',
            resourceId: binding.key,
            status: 'success',
            details: {
                tenantId: binding.tenantId,
                service: binding.service,
                provider: binding.provider,
                accessScope: binding.accessScope,
            },
        });
        return binding;
    }
    async deleteBinding(user, tenantId, service, provider) {
        this.assertSuperAdmin(user);
        const normalizedProvider = this.normalizeProvider(provider);
        await this.rotationService.deleteBinding(tenantId, service, normalizedProvider);
        await this.auditService.log('openclaw.oauth.binding.deleted', {
            userId: user.id,
            resourceType: 'openclaw_oauth_binding',
            resourceId: `${tenantId}:${service}:${normalizedProvider}`,
            status: 'success',
            details: { tenantId, service, provider: normalizedProvider },
        });
        return { success: true };
    }
    async execute(user, tenantId, service, provider, dto) {
        this.assertSuperAdmin(user);
        const normalizedProvider = this.normalizeProvider(provider);
        const result = await this.rotationService.executeBinding(tenantId, service, normalizedProvider, {
            waitForSuccess: dto.waitForSuccess ?? true,
            timeoutSeconds: dto.timeoutSeconds ?? 600,
        });
        await this.auditService.log('openclaw.oauth.binding.executed', {
            userId: user.id,
            resourceType: 'openclaw_oauth_binding',
            resourceId: `${tenantId}:${service}:${normalizedProvider}`,
            status: result.deployStatus === 'SUCCESS' ? 'success' : 'warning',
            details: {
                deployStatus: result.deployStatus,
                deployId: result.deployId,
                overviewStatus: result.overviewStatus,
                provider: normalizedProvider,
                service,
            },
        });
        return result;
    }
    async getActivity(user, limit) {
        this.assertSuperAdmin(user);
        const numericLimit = limit ? Number(limit) : 120;
        return this.getRotationAuditSnapshot(numericLimit);
    }
};
exports.AdminOpenClawOAuthController = AdminOpenClawOAuthController;
__decorate([
    (0, common_1.Get)('bindings'),
    (0, swagger_1.ApiOperation)({ summary: 'List encrypted OpenClaw OAuth bindings metadata' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Binding metadata list' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminOpenClawOAuthController.prototype, "listBindings", null);
__decorate([
    (0, common_1.Put)('bindings'),
    (0, swagger_1.ApiOperation)({ summary: 'Upsert encrypted OpenClaw OAuth binding' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Binding metadata' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, openclaw_oauth_rotation_dto_1.UpsertOpenClawOAuthBindingDto]),
    __metadata("design:returntype", Promise)
], AdminOpenClawOAuthController.prototype, "upsertBinding", null);
__decorate([
    (0, common_1.Delete)('bindings/:tenantId/:service/:provider'),
    (0, swagger_1.ApiOperation)({ summary: 'Soft-delete an OpenClaw OAuth binding' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Deleted' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('tenantId')),
    __param(2, (0, common_1.Param)('service')),
    __param(3, (0, common_1.Param)('provider')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], AdminOpenClawOAuthController.prototype, "deleteBinding", null);
__decorate([
    (0, common_1.Post)('execute/:tenantId/:service/:provider'),
    (0, swagger_1.ApiOperation)({ summary: 'Execute OAuth rotation for a stored binding' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Execution result' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('tenantId')),
    __param(2, (0, common_1.Param)('service')),
    __param(3, (0, common_1.Param)('provider')),
    __param(4, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, openclaw_oauth_rotation_dto_1.ExecuteOpenClawOAuthBindingDto]),
    __metadata("design:returntype", Promise)
], AdminOpenClawOAuthController.prototype, "execute", null);
__decorate([
    (0, common_1.Get)('activity'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get OpenClaw OAuth rotation activity stream snapshot with run-status and findings rollups',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Activity + rollup' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminOpenClawOAuthController.prototype, "getActivity", null);
exports.AdminOpenClawOAuthController = AdminOpenClawOAuthController = __decorate([
    (0, swagger_1.ApiTags)('admin-openclaw-oauth'),
    (0, common_1.Controller)('admin/openclaw/oauth'),
    (0, common_1.UseGuards)(secure_auth_guard_1.SecureAuthGuard, admin_guard_1.AdminGuard),
    __metadata("design:paramtypes", [openclaw_oauth_rotation_service_1.OpenClawOAuthRotationService,
        audit_service_1.AuditService])
], AdminOpenClawOAuthController);
//# sourceMappingURL=admin-openclaw-oauth.controller.js.map