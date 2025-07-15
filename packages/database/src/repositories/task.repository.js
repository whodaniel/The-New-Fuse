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
exports.TaskRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_1 = require("../../generated/prisma");
const prisma_service_1 = require("../prisma.service");
let TaskRepository = class TaskRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    mapDatabaseTaskToTask(dbTask) {
        return {
            id: dbTask.id,
            type: dbTask.type,
            status: dbTask.status,
            priority: dbTask.priority,
            data: dbTask.data,
            result: dbTask.result,
            error: dbTask.error,
            startTime: dbTask.startTime,
            endTime: dbTask.endTime,
            pipelineId: dbTask.pipelineId,
            agentId: dbTask.agentId,
            userId: dbTask.userId,
            createdAt: dbTask.createdAt,
            updatedAt: dbTask.updatedAt,
            deletedAt: dbTask.deletedAt,
        };
    }
    getTaskSelect() {
        return {
            id: true,
            type: true,
            status: true,
            priority: true,
            data: true,
            result: true,
            error: true,
            startTime: true,
            endTime: true,
            pipelineId: true,
            agentId: true,
            userId: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true,
        };
    }
    async findById(id) {
        const task = await this.prisma.task.findUnique({
            where: { id },
            select: this.getTaskSelect()
        });
        if (!task)
            return null;
        return this.mapDatabaseTaskToTask(task);
    }
    async findMany(filters) {
        const tasks = await this.prisma.task.findMany({
            where: filters,
            select: this.getTaskSelect(),
            orderBy: [
                { priority: 'desc' },
                { createdAt: 'desc' }
            ]
        });
        return tasks.map(task => this.mapDatabaseTaskToTask(task));
    }
    async create(data) {
        const task = await this.prisma.task.create({
            data,
            select: this.getTaskSelect()
        });
        return this.mapDatabaseTaskToTask(task);
    }
    async update(id, data) {
        const task = await this.prisma.task.update({
            where: { id },
            data: {
                ...data,
                updatedAt: new Date()
            },
            select: this.getTaskSelect()
        });
        return this.mapDatabaseTaskToTask(task);
    }
    async delete(id) {
        const task = await this.prisma.task.delete({
            where: { id },
            select: this.getTaskSelect()
        });
        return this.mapDatabaseTaskToTask(task);
    }
    async findByUserId(userId) {
        const tasks = await this.prisma.task.findMany({
            where: { userId },
            select: this.getTaskSelect(),
            orderBy: [
                { priority: 'desc' },
                { createdAt: 'desc' }
            ]
        });
        return tasks.map(task => this.mapDatabaseTaskToTask(task));
    }
    async findByAgentId(agentId) {
        const tasks = await this.prisma.task.findMany({
            where: { agentId },
            select: this.getTaskSelect(),
            orderBy: [
                { priority: 'desc' },
                { createdAt: 'desc' }
            ]
        });
        return tasks.map(task => this.mapDatabaseTaskToTask(task));
    }
    async findByStatus(status) {
        const tasks = await this.prisma.task.findMany({
            where: { status },
            select: this.getTaskSelect(),
            orderBy: [
                { priority: 'desc' },
                { createdAt: 'desc' }
            ]
        });
        return tasks.map(task => this.mapDatabaseTaskToTask(task));
    }
    async findByPriority(priority) {
        const tasks = await this.prisma.task.findMany({
            where: { priority },
            select: this.getTaskSelect(),
            orderBy: {
                createdAt: 'desc'
            }
        });
        return tasks.map(task => this.mapDatabaseTaskToTask(task));
    }
    async updateStatus(id, status) {
        const updateData = {
            status,
            updatedAt: new Date()
        };
        if (status === prisma_1.TaskStatus.COMPLETED) {
            updateData.endTime = new Date();
        }
        const task = await this.prisma.task.update({
            where: { id },
            data: updateData,
            select: this.getTaskSelect()
        });
        return this.mapDatabaseTaskToTask(task);
    }
    async assignToAgent(id, agentId) {
        const task = await this.prisma.task.update({
            where: { id },
            data: {
                agentId,
                status: prisma_1.TaskStatus.IN_PROGRESS,
                startTime: new Date(),
                updatedAt: new Date()
            },
            select: this.getTaskSelect()
        });
        return this.mapDatabaseTaskToTask(task);
    }
    async getTaskStats(userId) {
        const where = userId ? { userId } : {};
        const statusCounts = await this.prisma.task.groupBy({
            by: ['status'],
            where,
            _count: {
                id: true
            }
        });
        const priorityCounts = await this.prisma.task.groupBy({
            by: ['priority'],
            where,
            _count: {
                id: true
            }
        });
        const totalTasks = await this.prisma.task.count({ where });
        const completedTasks = await this.prisma.task.count({
            where: {
                ...where,
                status: prisma_1.TaskStatus.COMPLETED
            }
        });
        const overdueTasks = 0; // Not available in current schema since no dueDate field
        return {
            total: totalTasks,
            completed: completedTasks,
            overdue: overdueTasks,
            completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
            byStatus: statusCounts.reduce((acc, { status, _count }) => {
                acc[status] = _count.id;
                return acc;
            }, {}),
            byPriority: priorityCounts.reduce((acc, { priority, _count }) => {
                acc[priority] = _count.id;
                return acc;
            }, {})
        };
    }
    async getRecentTasks(userId, limit = 10) {
        const tasks = await this.prisma.task.findMany({
            where: { userId },
            select: this.getTaskSelect(),
            orderBy: {
                updatedAt: 'desc'
            },
            take: limit
        });
        return tasks.map(task => this.mapDatabaseTaskToTask(task));
    }
    async searchTasks(userId, query) {
        const tasks = await this.prisma.task.findMany({
            where: {
                userId,
                OR: [
                    {
                        type: {
                            contains: query,
                            mode: 'insensitive'
                        }
                    }
                ]
            },
            select: this.getTaskSelect(),
            orderBy: [
                { priority: 'desc' },
                { updatedAt: 'desc' }
            ]
        });
        return tasks.map(task => this.mapDatabaseTaskToTask(task));
    }
};
exports.TaskRepository = TaskRepository;
exports.TaskRepository = TaskRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TaskRepository);
