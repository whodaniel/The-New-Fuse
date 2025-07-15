var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from "@nestjs/common";
import { DatabaseService } from '../database/database.service.tsx';
import { TaskStatus, TaskPriority, TaskType, } from "@the-new-fuse/types";
let TaskService = class TaskService {
    db;
    constructor(db) {
        this.db = db;
    }
    async findStuckTasks() {
        const stuckTasks = await this.db.client.task.findMany({
            where: {
                status: TaskStatus.RUNNING,
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
            status: TaskStatus.PENDING,
            priority: data.priority || TaskPriority.MEDIUM,
            type: data.type || TaskType.Generic,
            metadata: {
                priority: data.priority || TaskPriority.MEDIUM,
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
                status: TaskStatus.PENDING,
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
TaskService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [DatabaseService])
], TaskService);
export { TaskService };
