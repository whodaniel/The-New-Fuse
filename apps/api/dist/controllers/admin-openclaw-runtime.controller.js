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
exports.AdminOpenClawRuntimeController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../decorators/current-user.decorator");
const admin_guard_1 = require("../guards/admin.guard");
const secure_auth_guard_1 = require("../guards/secure-auth.guard");
const audit_service_1 = require("../services/audit.service");
const openclaw_runtime_service_1 = require("../services/openclaw-runtime.service");
let AdminOpenClawRuntimeController = class AdminOpenClawRuntimeController {
    constructor(openClawRuntimeService, auditService) {
        this.openClawRuntimeService = openClawRuntimeService;
        this.auditService = auditService;
    }
    assertSuperAdmin(user) {
        const roles = Array.isArray(user?.roles) ? user.roles : [user?.role];
        const isSuper = roles.some((role) => String(role || '').toUpperCase() === 'SUPER_ADMIN');
        if (!isSuper)
            throw new common_1.ForbiddenException('SUPER_ADMIN required');
    }
    getActorId(user) {
        return String(user?.id || user?.userId || user?.sub || 'admin');
    }
    toTargetOptions(input) {
        return {
            installationId: input?.installationId || undefined,
            instanceId: input?.instanceId || undefined,
            stateDir: input?.stateDir || undefined,
            allInstances: typeof input?.allInstances === 'string'
                ? ['1', 'true', 'yes', 'on'].includes(input.allInstances.toLowerCase())
                : Boolean(input?.allInstances),
        };
    }
    async listInstances(_user) {
        return this.openClawRuntimeService.listInstances();
    }
    async getInventory(_user, installationId, instanceId, stateDir, allInstances) {
        return this.openClawRuntimeService.getInventory(this.toTargetOptions({ installationId, instanceId, stateDir, allInstances }));
    }
    async getConfig(_user, path, installationId, instanceId, stateDir, allInstances) {
        return this.openClawRuntimeService.getConfig(path, this.toTargetOptions({ installationId, instanceId, stateDir, allInstances }));
    }
    async setConfig(user, body) {
        this.assertSuperAdmin(user);
        const result = await this.openClawRuntimeService.setConfig(body.path, body.value, body.valueType || 'string', this.toTargetOptions(body));
        await this.auditService.log('openclaw.runtime.config.updated', {
            userId: this.getActorId(user),
            resourceType: 'openclaw_runtime',
            resourceId: body.path,
            status: 'success',
            details: {
                path: body.path,
                valueType: body.valueType || 'string',
            },
        });
        return result;
    }
    async unsetConfig(user, body) {
        this.assertSuperAdmin(user);
        const result = await this.openClawRuntimeService.unsetConfig(body.path, this.toTargetOptions(body));
        await this.auditService.log('openclaw.runtime.config.unset', {
            userId: this.getActorId(user),
            resourceType: 'openclaw_runtime',
            resourceId: body.path,
            status: 'success',
            details: {
                path: body.path,
            },
        });
        return result;
    }
    async listCron(_user, installationId, instanceId, stateDir, allInstances) {
        return this.openClawRuntimeService.listCronJobs(this.toTargetOptions({ installationId, instanceId, stateDir, allInstances }));
    }
    async enableCron(user, body) {
        this.assertSuperAdmin(user);
        const result = await this.openClawRuntimeService.enableCronJob(body.job, this.toTargetOptions(body));
        await this.auditService.log('openclaw.runtime.cron.enabled', {
            userId: this.getActorId(user),
            resourceType: 'openclaw_runtime_cron',
            resourceId: body.job,
            status: 'success',
            details: {
                job: body.job,
            },
        });
        return result;
    }
    async disableCron(user, body) {
        this.assertSuperAdmin(user);
        const result = await this.openClawRuntimeService.disableCronJob(body.job, this.toTargetOptions(body));
        await this.auditService.log('openclaw.runtime.cron.disabled', {
            userId: this.getActorId(user),
            resourceType: 'openclaw_runtime_cron',
            resourceId: body.job,
            status: 'success',
            details: {
                job: body.job,
            },
        });
        return result;
    }
    async scheduleCron(user, body) {
        this.assertSuperAdmin(user);
        const result = await this.openClawRuntimeService.scheduleCronJob(body.job, body, this.toTargetOptions(body));
        await this.auditService.log('openclaw.runtime.cron.scheduled', {
            userId: this.getActorId(user),
            resourceType: 'openclaw_runtime_cron',
            resourceId: body.job,
            status: 'success',
            details: {
                job: body.job,
                cron: body.cron || null,
                tz: body.tz || null,
                everyMs: body.everyMs ?? null,
                anchorMs: body.anchorMs ?? null,
                at: body.at || null,
            },
        });
        return result;
    }
    async syncControlPlane(user, body = {}) {
        this.assertSuperAdmin(user);
        const actorId = this.getActorId(user);
        const result = await this.openClawRuntimeService.syncControlPlane(actorId, this.toTargetOptions(body));
        const snapshot = (result?.snapshot || {});
        await this.auditService.log('openclaw.runtime.synced', {
            userId: actorId,
            resourceType: 'openclaw_runtime',
            resourceId: 'control-plane',
            status: 'success',
            details: {
                snapshotUpdatedAt: snapshot.updatedAt || null,
            },
        });
        return result;
    }
    async cleanupCron(user, body) {
        this.assertSuperAdmin(user);
        const actorId = this.getActorId(user);
        const result = await this.openClawRuntimeService.cleanupCron(actorId, {
            dryRun: body?.dryRun,
            disableFailing: body?.disableFailing,
            keepLaunchValidationDuplicates: body?.keepLaunchValidationDuplicates,
            ...this.toTargetOptions(body),
        });
        const cleanup = (result?.cleanup || {});
        await this.auditService.log('openclaw.runtime.cleaned', {
            userId: actorId,
            resourceType: 'openclaw_runtime_cron',
            resourceId: 'cleanup',
            status: 'success',
            details: {
                dryRun: Boolean(body?.dryRun),
                disableFailing: Boolean(body?.disableFailing),
                changed: Boolean(result?.changed),
                removedJobs: cleanup.removedJobs?.length || 0,
                disabledJobs: cleanup.disabledJobs?.length || 0,
            },
        });
        return result;
    }
};
exports.AdminOpenClawRuntimeController = AdminOpenClawRuntimeController;
__decorate([
    (0, common_1.Get)('instances'),
    (0, swagger_1.ApiOperation)({ summary: 'List OpenClaw installations and instances known to TNF' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'OpenClaw installation and instance inventory' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminOpenClawRuntimeController.prototype, "listInstances", null);
__decorate([
    (0, common_1.Get)('inventory'),
    (0, swagger_1.ApiOperation)({ summary: 'Get redacted OpenClaw runtime inventory and TNF schedule mapping' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'OpenClaw runtime inventory' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('installationId')),
    __param(2, (0, common_1.Query)('instanceId')),
    __param(3, (0, common_1.Query)('stateDir')),
    __param(4, (0, common_1.Query)('allInstances')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AdminOpenClawRuntimeController.prototype, "getInventory", null);
__decorate([
    (0, common_1.Get)('config'),
    (0, swagger_1.ApiOperation)({ summary: 'Get redacted OpenClaw config or a subtree' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'OpenClaw config snapshot' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('path')),
    __param(2, (0, common_1.Query)('installationId')),
    __param(3, (0, common_1.Query)('instanceId')),
    __param(4, (0, common_1.Query)('stateDir')),
    __param(5, (0, common_1.Query)('allInstances')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AdminOpenClawRuntimeController.prototype, "getConfig", null);
__decorate([
    (0, common_1.Put)('config'),
    (0, swagger_1.ApiOperation)({ summary: 'Set an OpenClaw config value through TNF' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Updated OpenClaw config path' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminOpenClawRuntimeController.prototype, "setConfig", null);
__decorate([
    (0, common_1.Delete)('config'),
    (0, swagger_1.ApiOperation)({ summary: 'Unset an OpenClaw config path through TNF' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Removed OpenClaw config path' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminOpenClawRuntimeController.prototype, "unsetConfig", null);
__decorate([
    (0, common_1.Get)('cron'),
    (0, swagger_1.ApiOperation)({ summary: 'List OpenClaw cron jobs with TNF schedule mapping' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'OpenClaw cron list' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('installationId')),
    __param(2, (0, common_1.Query)('instanceId')),
    __param(3, (0, common_1.Query)('stateDir')),
    __param(4, (0, common_1.Query)('allInstances')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AdminOpenClawRuntimeController.prototype, "listCron", null);
__decorate([
    (0, common_1.Post)('cron/enable'),
    (0, swagger_1.ApiOperation)({ summary: 'Enable an OpenClaw cron job through TNF' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Enabled OpenClaw cron job' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminOpenClawRuntimeController.prototype, "enableCron", null);
__decorate([
    (0, common_1.Post)('cron/disable'),
    (0, swagger_1.ApiOperation)({ summary: 'Disable an OpenClaw cron job through TNF' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Disabled OpenClaw cron job' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminOpenClawRuntimeController.prototype, "disableCron", null);
__decorate([
    (0, common_1.Post)('cron/schedule'),
    (0, swagger_1.ApiOperation)({ summary: 'Change an OpenClaw cron job schedule through TNF' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Updated OpenClaw cron schedule' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminOpenClawRuntimeController.prototype, "scheduleCron", null);
__decorate([
    (0, common_1.Post)('sync'),
    (0, swagger_1.ApiOperation)({ summary: 'Sync live OpenClaw runtime state into TNF control-plane records' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'OpenClaw control-plane sync result' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminOpenClawRuntimeController.prototype, "syncControlPlane", null);
__decorate([
    (0, common_1.Post)('cleanup'),
    (0, swagger_1.ApiOperation)({ summary: 'Clean up duplicate/failing TNF-managed OpenClaw cron jobs' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'OpenClaw cleanup result' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminOpenClawRuntimeController.prototype, "cleanupCron", null);
exports.AdminOpenClawRuntimeController = AdminOpenClawRuntimeController = __decorate([
    (0, swagger_1.ApiTags)('admin-openclaw-runtime'),
    (0, common_1.Controller)('admin/openclaw/runtime'),
    (0, common_1.UseGuards)(secure_auth_guard_1.SecureAuthGuard, admin_guard_1.AdminGuard),
    __metadata("design:paramtypes", [openclaw_runtime_service_1.OpenClawRuntimeService,
        audit_service_1.AuditService])
], AdminOpenClawRuntimeController);
//# sourceMappingURL=admin-openclaw-runtime.controller.js.map