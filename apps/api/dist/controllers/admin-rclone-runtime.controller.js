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
exports.AdminRcloneRuntimeController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../decorators/current-user.decorator");
const admin_guard_1 = require("../guards/admin.guard");
const secure_auth_guard_1 = require("../guards/secure-auth.guard");
const rclone_runtime_service_1 = require("../services/rclone-runtime.service");
let AdminRcloneRuntimeController = class AdminRcloneRuntimeController {
    constructor(rcloneRuntimeService) {
        this.rcloneRuntimeService = rcloneRuntimeService;
    }
    toBoolean(value) {
        if (typeof value === 'boolean')
            return value;
        if (typeof value === 'string') {
            return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
        }
        return false;
    }
    toInteger(value, fallback) {
        const numeric = Number(value);
        if (!Number.isFinite(numeric))
            return fallback;
        return Math.floor(numeric);
    }
    getActorId(user) {
        return String(user?.id || user?.userId || user?.sub || 'admin');
    }
    async doctor(remote, probe, strict) {
        return this.rcloneRuntimeService.doctor({
            remote: remote || undefined,
            probe: this.toBoolean(probe),
            strict: this.toBoolean(strict),
        });
    }
    async providers() {
        return this.rcloneRuntimeService.getProviderProfiles();
    }
    async providerBlueprint(providerId) {
        return this.rcloneRuntimeService.getProviderBlueprint(providerId);
    }
    async preflightArdriveTurbo(user, body) {
        return this.rcloneRuntimeService.preflightArdriveTurboUpload({
            actorId: this.getActorId(user),
            fileName: String(body?.fileName || ''),
            fileSizeBytes: Number(body?.fileSizeBytes ?? 0),
            localPath: body?.localPath ? String(body.localPath) : undefined,
            contentType: body?.contentType ? String(body.contentType) : undefined,
            targetDriveId: body?.targetDriveId ? String(body.targetDriveId) : undefined,
            targetFolderId: body?.targetFolderId ? String(body.targetFolderId) : undefined,
            checksumSha256: body?.checksumSha256 ? String(body.checksumSha256) : undefined,
        });
    }
    async enqueueArdriveTurbo(user, body) {
        return this.rcloneRuntimeService.enqueueArdriveTurboUpload({
            actorId: this.getActorId(user),
            preflightId: String(body?.preflightId || ''),
            localPath: body?.localPath ? String(body.localPath) : undefined,
            targetDriveId: body?.targetDriveId ? String(body.targetDriveId) : undefined,
            targetFolderId: body?.targetFolderId ? String(body.targetFolderId) : undefined,
            checksumSha256: body?.checksumSha256 ? String(body.checksumSha256) : undefined,
        });
    }
    async listArdriveTurboQueue(limit, status) {
        return this.rcloneRuntimeService.getArdriveTurboQueue({
            limit: this.toInteger(limit, 20),
            status: status || undefined,
        });
    }
    async transitionArdriveTurboQueueItem(user, queueId, body) {
        return this.rcloneRuntimeService.transitionArdriveTurboQueueItem({
            actorId: this.getActorId(user),
            queueId: String(queueId || ''),
            status: String(body?.status || ''),
            note: body?.note ? String(body.note) : undefined,
        });
    }
    async ardriveTurboWorkerStatus() {
        return this.rcloneRuntimeService.getArdriveTurboWorkerStatus();
    }
    async ardriveTurboWorkerTick(user, body) {
        return this.rcloneRuntimeService.runArdriveTurboWorkerTick({
            actorId: this.getActorId(user),
            trigger: 'manual',
            maxItems: body?.maxItems == null ? undefined : this.toInteger(body.maxItems, 5),
        });
    }
    async ardriveTurboWorkerProcessOne(user, body) {
        return this.rcloneRuntimeService.runArdriveTurboWorkerProcessOne({
            actorId: this.getActorId(user),
            trigger: 'manual',
            queueId: body?.queueId ? String(body.queueId) : undefined,
        });
    }
    async gui(addr, baseurl, tls) {
        return this.rcloneRuntimeService.getGuiDescriptor({
            addr: addr || undefined,
            baseurl: baseurl || undefined,
            tls: this.toBoolean(tls),
        });
    }
    async runWorkflow(user, body) {
        return this.rcloneRuntimeService.runWorkflow({
            actorId: this.getActorId(user),
            presetId: body?.presetId || 'sync',
            source: String(body?.source || ''),
            destination: String(body?.destination || ''),
            dryRun: this.toBoolean(body?.dryRun),
            checksum: this.toBoolean(body?.checksum),
            bwlimit: body?.bwlimit ? String(body.bwlimit) : undefined,
            transfers: body?.transfers == null ? undefined : this.toInteger(body.transfers, 1),
            timeoutMs: body?.timeoutMs == null ? undefined : this.toInteger(body.timeoutMs, 180000),
            extraArgs: Array.isArray(body?.extraArgs)
                ? body?.extraArgs.map((item) => String(item || '')).filter(Boolean)
                : [],
        });
    }
    async pauseWorkflow(user, runId) {
        return this.rcloneRuntimeService.pauseWorkflow(runId, this.getActorId(user));
    }
    async resumeWorkflow(user, runId) {
        return this.rcloneRuntimeService.resumeWorkflow(runId, this.getActorId(user));
    }
    async stopWorkflow(user, runId) {
        return this.rcloneRuntimeService.stopWorkflow(runId, this.getActorId(user));
    }
    async getWorkflowLogs(limit, includePersistent) {
        return this.rcloneRuntimeService.getWorkflowRunLogs({
            limit: this.toInteger(limit, 15),
            includePersistent: includePersistent == null ? true : this.toBoolean(includePersistent),
        });
    }
};
exports.AdminRcloneRuntimeController = AdminRcloneRuntimeController;
__decorate([
    (0, common_1.Get)('doctor'),
    (0, swagger_1.ApiOperation)({ summary: 'Run TNF rclone doctor and return JSON status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Rclone doctor status' }),
    __param(0, (0, common_1.Query)('remote')),
    __param(1, (0, common_1.Query)('probe')),
    __param(2, (0, common_1.Query)('strict')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminRcloneRuntimeController.prototype, "doctor", null);
__decorate([
    (0, common_1.Get)('providers'),
    (0, swagger_1.ApiOperation)({ summary: 'Get TNF rclone provider profiles and integration modes' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Provider profile list' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminRcloneRuntimeController.prototype, "providers", null);
__decorate([
    (0, common_1.Get)('providers/:providerId/blueprint'),
    (0, swagger_1.ApiOperation)({ summary: 'Get implementation blueprint and compliance policy for a provider' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Provider blueprint' }),
    __param(0, (0, common_1.Param)('providerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminRcloneRuntimeController.prototype, "providerBlueprint", null);
__decorate([
    (0, common_1.Post)('providers/ardrive/turbo/preflight'),
    (0, swagger_1.ApiOperation)({ summary: 'Create ArDrive Turbo connector preflight (scaffold contract)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'ArDrive Turbo preflight response' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminRcloneRuntimeController.prototype, "preflightArdriveTurbo", null);
__decorate([
    (0, common_1.Post)('providers/ardrive/turbo/queue'),
    (0, swagger_1.ApiOperation)({ summary: 'Enqueue ArDrive Turbo upload item from preflight' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'ArDrive Turbo queue item created' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminRcloneRuntimeController.prototype, "enqueueArdriveTurbo", null);
__decorate([
    (0, common_1.Get)('providers/ardrive/turbo/queue'),
    (0, swagger_1.ApiOperation)({ summary: 'List ArDrive Turbo connector queue items' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'ArDrive Turbo queue list' }),
    __param(0, (0, common_1.Query)('limit')),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminRcloneRuntimeController.prototype, "listArdriveTurboQueue", null);
__decorate([
    (0, common_1.Post)('providers/ardrive/turbo/queue/:queueId/transition'),
    (0, swagger_1.ApiOperation)({ summary: 'Transition ArDrive Turbo queue item state in scaffold worker flow' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'ArDrive Turbo queue item transitioned' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('queueId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AdminRcloneRuntimeController.prototype, "transitionArdriveTurboQueueItem", null);
__decorate([
    (0, common_1.Get)('providers/ardrive/turbo/worker'),
    (0, swagger_1.ApiOperation)({ summary: 'Get ArDrive Turbo connector worker status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'ArDrive Turbo worker status' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminRcloneRuntimeController.prototype, "ardriveTurboWorkerStatus", null);
__decorate([
    (0, common_1.Post)('providers/ardrive/turbo/worker/tick'),
    (0, swagger_1.ApiOperation)({ summary: 'Run one manual ArDrive Turbo connector worker tick' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'ArDrive Turbo worker tick result' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminRcloneRuntimeController.prototype, "ardriveTurboWorkerTick", null);
__decorate([
    (0, common_1.Post)('providers/ardrive/turbo/worker/process-one'),
    (0, swagger_1.ApiOperation)({ summary: 'Process one ArDrive Turbo queue item (optional queueId targeting)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'ArDrive Turbo worker process-one result' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminRcloneRuntimeController.prototype, "ardriveTurboWorkerProcessOne", null);
__decorate([
    (0, common_1.Get)('gui'),
    (0, swagger_1.ApiOperation)({ summary: 'Build rclone GUI URL and launch command descriptor for admin UI' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Rclone GUI descriptor' }),
    __param(0, (0, common_1.Query)('addr')),
    __param(1, (0, common_1.Query)('baseurl')),
    __param(2, (0, common_1.Query)('tls')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminRcloneRuntimeController.prototype, "gui", null);
__decorate([
    (0, common_1.Post)('workflows/run'),
    (0, swagger_1.ApiOperation)({ summary: 'Start a policy-approved rclone workflow preset' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Workflow run started' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminRcloneRuntimeController.prototype, "runWorkflow", null);
__decorate([
    (0, common_1.Post)('workflows/:runId/pause'),
    (0, swagger_1.ApiOperation)({ summary: 'Pause an active rclone workflow process (SIGSTOP)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Workflow paused' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('runId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminRcloneRuntimeController.prototype, "pauseWorkflow", null);
__decorate([
    (0, common_1.Post)('workflows/:runId/resume'),
    (0, swagger_1.ApiOperation)({ summary: 'Resume a paused rclone workflow process (SIGCONT)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Workflow resumed' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('runId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminRcloneRuntimeController.prototype, "resumeWorkflow", null);
__decorate([
    (0, common_1.Post)('workflows/:runId/stop'),
    (0, swagger_1.ApiOperation)({ summary: 'Stop an active rclone workflow process (SIGTERM -> SIGKILL fallback)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Workflow stop requested' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('runId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminRcloneRuntimeController.prototype, "stopWorkflow", null);
__decorate([
    (0, common_1.Get)('workflows/logs'),
    (0, swagger_1.ApiOperation)({ summary: 'Get recent rclone workflow logs (runtime + persistent)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Recent workflow logs' }),
    __param(0, (0, common_1.Query)('limit')),
    __param(1, (0, common_1.Query)('includePersistent')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminRcloneRuntimeController.prototype, "getWorkflowLogs", null);
exports.AdminRcloneRuntimeController = AdminRcloneRuntimeController = __decorate([
    (0, swagger_1.ApiTags)('admin-rclone-runtime'),
    (0, common_1.Controller)('admin/rclone/runtime'),
    (0, common_1.UseGuards)(secure_auth_guard_1.SecureAuthGuard, admin_guard_1.AdminGuard),
    __metadata("design:paramtypes", [rclone_runtime_service_1.RcloneRuntimeService])
], AdminRcloneRuntimeController);
//# sourceMappingURL=admin-rclone-runtime.controller.js.map