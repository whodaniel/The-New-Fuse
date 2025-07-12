var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { TaskStatus } from '../../generated/prisma';
import { PrismaService } from '../prisma.service';
let TaskRepository = class TaskRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    mapDatabaseTaskToTask(dbTask) {
        return {
            id: dbTask.id,
            title: dbTask.title,
            description: dbTask.description ?? null,
            status: dbTask.status,
            priority: dbTask.priority,
            createdAt: dbTask.createdAt,
            updatedAt: dbTask.updatedAt,
            assignedTo: dbTask.assignedTo ?? null,
            createdBy: dbTask.createdBy,
            metadata: dbTask.metadata ?? null,
            completedAt: dbTask.completedAt ?? null,
            type: dbTask.type,
            dueDate: dbTask.dueDate ?? null,
            tags: dbTask.tags,
            dependencies: dbTask.dependencies,
            error: dbTask.error ?? null,
        };
    }
    getTaskSelect() {
        return {
            id: true,
            title: true,
            description: true,
            status: true,
            priority: true,
            type: true,
            createdAt: true,
            updatedAt: true,
            dueDate: true,
            assignedTo: true,
            createdBy: true,
            metadata: true,
            tags: true,
            dependencies: true,
            error: true,
            completedAt: true,
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
    async findByCreatedBy(userId) {
        const tasks = await this.prisma.task.findMany({
            where: { createdBy: userId },
            select: this.getTaskSelect(),
            orderBy: [
                { priority: 'desc' },
                { createdAt: 'desc' }
            ]
        });
        return tasks.map(task => this.mapDatabaseTaskToTask(task));
    }
    async findByAssignedTo(agentId) {
        const tasks = await this.prisma.task.findMany({
            where: { assignedTo: agentId },
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
        if (status === TaskStatus.COMPLETED) {
            updateData.completedAt = new Date();
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
                assignedTo: agentId,
                status: TaskStatus.IN_PROGRESS,
                updatedAt: new Date()
            },
            select: this.getTaskSelect()
        });
        return this.mapDatabaseTaskToTask(task);
    }
    async getTaskStats(createdBy) {
        const where = createdBy ? { createdBy: createdBy } : {};
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
                status: TaskStatus.COMPLETED
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
    async getRecentTasks(createdBy, limit = 10) {
        const tasks = await this.prisma.task.findMany({
            where: { createdBy: createdBy },
            select: this.getTaskSelect(),
            orderBy: {
                updatedAt: 'desc'
            },
            take: limit
        });
        return tasks.map(task => this.mapDatabaseTaskToTask(task));
    }
    async searchTasks(createdBy, query) {
        const tasks = await this.prisma.task.findMany({
            where: {
                createdBy: createdBy,
                OR: [
                    {
                        title: {
                            contains: query,
                            mode: 'insensitive'
                        }
                    },
                    {
                        description: {
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
TaskRepository = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], TaskRepository);
export { TaskRepository };
