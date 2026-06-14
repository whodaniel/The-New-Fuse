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
var TaskHealthMonitorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskHealthMonitorService = void 0;
const common_1 = require("@nestjs/common");
const task_service_1 = require("./task.service");
let TaskHealthMonitorService = TaskHealthMonitorService_1 = class TaskHealthMonitorService {
    constructor(taskService) {
        this.taskService = taskService;
        this.logger = new common_1.Logger(TaskHealthMonitorService_1.name);
        this.timer = null;
    }
    onModuleInit() {
        const intervalMs = this.getIntervalMs();
        this.logger.log(`Task health monitor started (interval=${intervalMs}ms)`);
        // Run once on startup, then on interval.
        void this.scanForStuckTasks();
        this.timer = setInterval(() => {
            void this.scanForStuckTasks();
        }, intervalMs);
    }
    onModuleDestroy() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    async scanForStuckTasks() {
        try {
            const stuckTasks = await this.taskService.findStuckTasksUnscoped();
            if (stuckTasks.length === 0) {
                return;
            }
            const autoFail = process.env.TASK_STUCK_AUTO_FAIL === 'true';
            this.logger.warn(`Detected ${stuckTasks.length} stuck task(s)`);
            for (const task of stuckTasks) {
                await this.taskService.appendExecutionLog(task.id, {
                    level: autoFail ? 'error' : 'warn',
                    message: autoFail
                        ? 'Task automatically marked failed after exceeding 30 minute runtime threshold'
                        : 'Task exceeded 30 minute runtime threshold',
                    actor: 'task-monitor',
                    source: 'task-health-monitor',
                    stage: 'stuck-task-scan',
                    metadata: {
                        taskId: task.id,
                        startTime: task.startTime?.toISOString?.() ?? task.startTime,
                        thresholdMinutes: 30,
                        autoFailed: autoFail,
                    },
                });
                if (autoFail) {
                    await this.taskService.updateTaskStatus(task.id, 'FAILED');
                }
            }
        }
        catch (error) {
            this.logger.error('Task health monitor scan failed', error);
        }
    }
    getIntervalMs() {
        const fromEnv = Number(process.env.TASK_HEALTH_CHECK_INTERVAL_MS);
        if (Number.isFinite(fromEnv) && fromEnv >= 60_000) {
            return fromEnv;
        }
        // Default to 30 minutes.
        return 30 * 60 * 1000;
    }
};
exports.TaskHealthMonitorService = TaskHealthMonitorService;
exports.TaskHealthMonitorService = TaskHealthMonitorService = TaskHealthMonitorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [task_service_1.TaskService])
], TaskHealthMonitorService);
//# sourceMappingURL=task-health-monitor.service.js.map