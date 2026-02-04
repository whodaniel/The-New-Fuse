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
exports.TaskService = void 0;
const common_1 = require("@nestjs/common");
const database_service_tsx_1 = require("../database/database.service.tsx");
const types_1 = require("@the-new-fuse/types");
let TaskService = class TaskService {
    db;
    constructor(db) {
        this.db = db;
    }
    async findStuckTasks() {
        const stuckTasks = await this.db.client.task.findMany({
            where: {
                status: types_1.TaskStatus.RUNNING,
                startTime: {
                    lt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
                },
            },
        });
        return stuckTasks;
    }
    async updateTask(taskId, updates) {
        return await this.db.client.task.update({
            where: { id: taskId },
            data: updates,
        });
    }
    async findTaskById(taskId) {
        const task = await this.db.client.task.findUnique({
            where: { id: taskId },
        });
        return task;
    }
    async createTask(data) {
        const taskData = {
            ...data,
            status: types_1.TaskStatus.PENDING,
            priority: data.priority || types_1.TaskPriority.MEDIUM,
            type: data.type || types_1.TaskType.Generic,
            metadata: {
                priority: data.priority || types_1.TaskPriority.MEDIUM,
                retryCount: 0,
                maxRetries: data.metadata?.maxRetries || 3,
                resourceUsage: {
                    cpuUsage: 0,
                    memoryUsage: 0,
                    networkUsage: 0,
                    diskUsage: 0,
                },
                ...data.metadata,
            },
            dependencies: data.dependencies || [],
            input: data.input || {},
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        return await this.db.client.task.create({
            data: taskData,
        });
    }
    async getPendingTasks() {
        return this.db.client.task.findMany({
            where: {
                status: types_1.TaskStatus.PENDING,
            },
            orderBy: {
                priority: "desc",
            },
        });
    }
    async getTasksByStatus(status) {
        return this.db.client.task.findMany({
            where: { status },
        });
    }
    async getTasksByPriority(priority) {
        return this.db.client.task.findMany({
            where: { priority },
        });
    }
};
exports.TaskService = TaskService;
exports.TaskService = TaskService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_tsx_1.DatabaseService])
], TaskService);
//# sourceMappingURL=task.service.js.map