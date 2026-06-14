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
exports.TaskController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../decorators/current-user.decorator");
const unified_ledger_service_1 = require("../unified-ledger/unified-ledger.service");
const task_dto_1 = require("./dto/task.dto");
const task_service_1 = require("./task.service");
let TaskController = class TaskController {
    constructor(taskService, unifiedLedgerService) {
        this.taskService = taskService;
        this.unifiedLedgerService = unifiedLedgerService;
    }
    requireUserId(user) {
        const userId = user?.id || user?.sub;
        if (!userId) {
            throw new common_1.UnauthorizedException('Missing authenticated user');
        }
        return userId;
    }
    resolveTenantId(user) {
        const tenantId = user?.tenantId;
        if (typeof tenantId !== 'string')
            return undefined;
        const normalized = tenantId.trim();
        return normalized.length > 0 ? normalized : undefined;
    }
    scopeArgs(tenantId) {
        if (!tenantId)
            return [];
        return [{ tenantId }];
    }
    async listTasks(user, query) {
        const userId = this.requireUserId(user);
        const tenantId = this.resolveTenantId(user);
        const { tasks, total } = await this.taskService.listTasks(userId, {
            status: query.status,
            page: query.page,
            limit: query.limit,
            tenantId,
            workspaceId: query.workspaceId,
        });
        return {
            tasks,
            pagination: {
                page: query.page,
                limit: query.limit,
                total,
                pages: Math.ceil(total / query.limit),
            },
        };
    }
    async createTask(user, dto) {
        const userId = this.requireUserId(user);
        const tenantId = this.resolveTenantId(user);
        const taskInput = {
            type: dto.type,
            title: dto.title,
            description: dto.description,
            status: dto.status ?? 'PENDING',
            priority: dto.priority ?? 'MEDIUM',
            data: dto.data,
            metadata: dto.metadata,
            pipelineId: dto.pipelineId,
            assignedToId: dto.assignedToId,
            userId,
            ...(tenantId ? { tenantId } : {}),
            ...(dto.workspaceId ? { workspaceId: dto.workspaceId } : {}),
        };
        return this.taskService.createTask(taskInput);
    }
    async getTask(user, taskId) {
        const userId = this.requireUserId(user);
        const tenantId = this.resolveTenantId(user);
        const task = await this.taskService.getTaskByIdForUser(taskId, userId, ...this.scopeArgs(tenantId));
        if (!task) {
            throw new common_1.NotFoundException('Task not found');
        }
        return task;
    }
    async updateTaskStatus(user, taskId, dto) {
        const userId = this.requireUserId(user);
        const tenantId = this.resolveTenantId(user);
        const existing = await this.taskService.getTaskByIdForUser(taskId, userId, ...this.scopeArgs(tenantId));
        if (!existing) {
            throw new common_1.NotFoundException('Task not found');
        }
        const updated = await this.taskService.updateTaskStatus(taskId, dto.status);
        if (!updated) {
            throw new common_1.NotFoundException('Task not found');
        }
        return updated;
    }
    async getExecutionLogs(user, taskId) {
        const userId = this.requireUserId(user);
        const tenantId = this.resolveTenantId(user);
        const task = await this.taskService.getTaskByIdForUser(taskId, userId, ...this.scopeArgs(tenantId));
        if (!task) {
            throw new common_1.NotFoundException('Task not found');
        }
        const logs = await this.taskService.getExecutionLogs(taskId);
        return {
            taskId,
            logs,
            count: logs.length,
        };
    }
    async createExecutionLog(user, taskId, dto) {
        const userId = this.requireUserId(user);
        const tenantId = this.resolveTenantId(user);
        const task = await this.taskService.getTaskByIdForUser(taskId, userId, ...this.scopeArgs(tenantId));
        if (!task) {
            throw new common_1.NotFoundException('Task not found');
        }
        const logEntry = await this.taskService.appendExecutionLog(taskId, dto);
        const metadataWorkspaceId = typeof dto.metadata?.workspaceId === 'string' ? dto.metadata.workspaceId : undefined;
        const taskWorkspaceId = typeof task?.workspaceId === 'string' ? task.workspaceId : undefined;
        await this.unifiedLedgerService.createTimelineEvent({
            userId,
            tenantId,
            workspaceId: taskWorkspaceId || metadataWorkspaceId,
            eventType: 'historical_event',
            actor: dto.actor,
            payload: {
                category: 'task_execution_log',
                taskId,
                level: dto.level,
                source: dto.source,
                stage: dto.stage,
                message: dto.message,
                metadata: dto.metadata ?? {},
                logId: logEntry.id,
            },
        });
        const logs = await this.taskService.getExecutionLogs(taskId);
        return {
            taskId,
            logs,
            count: logs.length,
        };
    }
};
exports.TaskController = TaskController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, task_dto_1.ListTasksQueryDto]),
    __metadata("design:returntype", Promise)
], TaskController.prototype, "listTasks", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, task_dto_1.CreateTaskDto]),
    __metadata("design:returntype", Promise)
], TaskController.prototype, "createTask", null);
__decorate([
    (0, common_1.Get)(':taskId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('taskId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TaskController.prototype, "getTask", null);
__decorate([
    (0, common_1.Patch)(':taskId/status'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('taskId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, task_dto_1.UpdateTaskStatusDto]),
    __metadata("design:returntype", Promise)
], TaskController.prototype, "updateTaskStatus", null);
__decorate([
    (0, common_1.Get)(':taskId/execution-logs'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('taskId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TaskController.prototype, "getExecutionLogs", null);
__decorate([
    (0, common_1.Post)(':taskId/execution-logs'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('taskId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, task_dto_1.CreateTaskExecutionLogDto]),
    __metadata("design:returntype", Promise)
], TaskController.prototype, "createExecutionLog", null);
exports.TaskController = TaskController = __decorate([
    (0, common_1.Controller)('tasks'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [task_service_1.TaskService,
        unified_ledger_service_1.UnifiedLedgerService])
], TaskController);
//# sourceMappingURL=task.controller.js.map