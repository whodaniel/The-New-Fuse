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
import { WorkflowExecutionStatus } from '../types';
import { PrismaService } from '../prisma.service';
import { BaseRepository } from './base.repository';
let WorkflowExecutionRepository = class WorkflowExecutionRepository extends BaseRepository {
    constructor(prisma) {
        super(prisma);
    }
    convertPrismaToApp(prismaExecution) {
        return {
            id: prismaExecution.id,
            workflowId: prismaExecution.workflowId,
            status: prismaExecution.status,
            input: prismaExecution.input || undefined,
            output: prismaExecution.output || undefined,
            error: prismaExecution.error || undefined,
            startedAt: prismaExecution.startedAt || undefined,
            finishedAt: prismaExecution.completedAt || undefined,
            createdAt: prismaExecution.createdAt || new Date(),
            updatedAt: prismaExecution.updatedAt || new Date()
        };
    }
    async findById(id) {
        const result = await this.prisma.workflowExecution.findUnique({
            where: { id },
            select: {
                id: true,
                workflowId: true,
                status: true,
                input: true,
                output: true,
                error: true,
                startedAt: true,
                completedAt: true
            }
        });
        return result ? this.convertPrismaToApp(result) : null;
    }
    async findMany(filters) {
        const where = this.buildWhereClause(filters);
        const results = await this.prisma.workflowExecution.findMany({
            where,
            select: {
                id: true,
                workflowId: true,
                status: true,
                input: true,
                output: true,
                error: true,
                startedAt: true,
                completedAt: true
            },
            orderBy: {
                startedAt: 'desc'
            }
        });
        return results.map(result => this.convertPrismaToApp(result));
    }
    async create(data) {
        const result = await this.prisma.workflowExecution.create({
            data,
            select: {
                id: true,
                workflowId: true,
                status: true,
                input: true,
                output: true,
                error: true,
                startedAt: true,
                completedAt: true
            }
        });
        return this.convertPrismaToApp(result);
    }
    async update(id, data) {
        const result = await this.prisma.workflowExecution.update({
            where: { id },
            data: {
                ...data,
                updatedAt: new Date()
            },
            select: {
                id: true,
                workflowId: true,
                status: true,
                input: true,
                output: true,
                error: true,
                startedAt: true,
                completedAt: true
            }
        });
        return this.convertPrismaToApp(result);
    }
    async delete(id) {
        const result = await this.prisma.workflowExecution.delete({
            where: { id },
            select: {
                id: true,
                workflowId: true,
                status: true,
                input: true,
                output: true,
                error: true,
                startedAt: true,
                completedAt: true
            }
        });
        return this.convertPrismaToApp(result);
    }
    // Additional methods required by BaseRepository pattern
    async findOne(filter, include) {
        const where = this.buildWhereClause(filter);
        const result = await this.prisma.workflowExecution.findFirst({
            where,
            select: {
                id: true,
                workflowId: true,
                status: true,
                input: true,
                output: true,
                error: true,
                startedAt: true,
                completedAt: true
            }
        });
        return result ? this.convertPrismaToApp(result) : null;
    }
    async findAll(filter, orderBy, skip, take) {
        const where = this.buildWhereClause(filter);
        const paginationOptions = this.getPaginationOptions(skip ? Math.floor(skip / (take || 100)) + 1 : undefined, take);
        const sortOptions = this.getSortOptions(orderBy?.field, orderBy?.direction);
        const results = await this.prisma.workflowExecution.findMany({
            where,
            select: {
                id: true,
                workflowId: true,
                status: true,
                input: true,
                output: true,
                error: true,
                startedAt: true,
                completedAt: true
            },
            orderBy: sortOptions.orderBy || { startedAt: 'desc' },
            skip: paginationOptions.skip,
            take: paginationOptions.take
        });
        return results.map(result => this.convertPrismaToApp(result));
    }
    async count(filter) {
        const where = this.buildWhereClause(filter);
        return this.prisma.workflowExecution.count({ where });
    }
    async countTotal(where) {
        return this.prisma.workflowExecution.count({ where });
    }
    async findByWorkflowId(workflowId) {
        const results = await this.prisma.workflowExecution.findMany({
            where: { workflowId },
            select: {
                id: true,
                workflowId: true,
                status: true,
                input: true,
                output: true,
                error: true,
                startedAt: true,
                completedAt: true
            },
            orderBy: {
                startedAt: 'desc'
            }
        });
        return results.map(result => this.convertPrismaToApp(result));
    }
    async findByStatus(status) {
        const results = await this.prisma.workflowExecution.findMany({
            where: { status: status },
            select: {
                id: true,
                workflowId: true,
                status: true,
                input: true,
                output: true,
                error: true,
                startedAt: true,
                completedAt: true
            },
            orderBy: {
                startedAt: 'desc'
            }
        });
        return results.map(result => this.convertPrismaToApp(result));
    }
    async updateStatus(id, status, output, error) {
        const updateData = {
            status: status,
            updatedAt: new Date()
        };
        if (status === WorkflowExecutionStatus.SUCCEEDED || status === WorkflowExecutionStatus.FAILED) {
            updateData.completedAt = new Date();
        }
        if (output !== undefined) {
            updateData.output = output;
        }
        if (error) {
            updateData.error = error;
        }
        const result = await this.prisma.workflowExecution.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                workflowId: true,
                status: true,
                input: true,
                output: true,
                error: true,
                startedAt: true,
                completedAt: true
            }
        });
        return this.convertPrismaToApp(result);
    }
    async getRunningExecutions() {
        return this.findByStatus(WorkflowExecutionStatus.RUNNING);
    }
    async getPendingExecutions() {
        return this.findByStatus(WorkflowExecutionStatus.PENDING);
    }
    async getExecutionStats(workflowId) {
        const where = workflowId ? { workflowId } : {};
        const statusCounts = await this.prisma.workflowExecution.groupBy({
            by: ['status'],
            where,
            _count: {
                id: true
            }
        });
        const totalExecutions = await this.prisma.workflowExecution.count({ where });
        const completedExecutions = await this.prisma.workflowExecution.count({
            where: {
                ...where,
                status: WorkflowExecutionStatus.SUCCEEDED
            }
        });
        const failedExecutions = await this.prisma.workflowExecution.count({
            where: {
                ...where,
                status: WorkflowExecutionStatus.FAILED
            }
        });
        // Calculate average execution time for completed executions
        const completedWithTimes = await this.prisma.workflowExecution.findMany({
            where: {
                ...where,
                status: WorkflowExecutionStatus.SUCCEEDED,
                completedAt: { not: null }
            },
            select: {
                startedAt: true,
                completedAt: true
            }
        });
        const executionTimes = completedWithTimes
            .filter((exec) => exec.completedAt)
            .map((exec) => exec.completedAt.getTime() - exec.startedAt.getTime());
        const avgExecutionTime = executionTimes.length > 0
            ? executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length
            : 0;
        return {
            total: totalExecutions,
            completed: completedExecutions,
            failed: failedExecutions,
            successRate: totalExecutions > 0 ? (completedExecutions / totalExecutions) * 100 : 0,
            failureRate: totalExecutions > 0 ? (failedExecutions / totalExecutions) * 100 : 0,
            avgExecutionTimeMs: avgExecutionTime,
            byStatus: statusCounts.reduce((acc, { status, _count }) => {
                acc[status] = _count.id;
                return acc;
            }, {})
        };
    }
    async getRecentExecutions(workflowId, limit = 10) {
        const where = workflowId ? { workflowId } : {};
        const results = await this.prisma.workflowExecution.findMany({
            where,
            select: {
                id: true,
                workflowId: true,
                status: true,
                input: true,
                output: true,
                error: true,
                startedAt: true,
                completedAt: true
            },
            orderBy: {
                startedAt: 'desc'
            },
            take: limit
        });
        return results.map(result => this.convertPrismaToApp(result));
    }
    async getLongRunningExecutions(thresholdMinutes = 60) {
        const threshold = new Date(Date.now() - thresholdMinutes * 60 * 1000);
        const results = await this.prisma.workflowExecution.findMany({
            where: {
                status: WorkflowExecutionStatus.RUNNING,
                startedAt: {
                    lt: threshold
                }
            },
            select: {
                id: true,
                workflowId: true,
                status: true,
                input: true,
                output: true,
                error: true,
                startedAt: true,
                completedAt: true
            },
            orderBy: {
                startedAt: 'asc'
            }
        });
        return results.map(result => this.convertPrismaToApp(result));
    }
    async cancelExecution(id) {
        return this.updateStatus(id, WorkflowExecutionStatus.CANCELLED);
    }
    async retryExecution(id) {
        const execution = await this.findById(id);
        if (!execution) {
            throw new Error('Execution not found');
        }
        // Create a new execution based on the failed one
        return this.create({
            workflowId: execution.workflowId,
            input: execution.input,
            status: WorkflowExecutionStatus.PENDING
        });
    }
    async getExecutionHistory(workflowId, limit = 50) {
        const results = await this.prisma.workflowExecution.findMany({
            where: { workflowId },
            select: {
                id: true,
                workflowId: true,
                status: true,
                input: true,
                output: true,
                error: true,
                startedAt: true,
                completedAt: true
            },
            orderBy: {
                startedAt: 'desc'
            },
            take: limit
        });
        return results.map(result => this.convertPrismaToApp(result));
    }
};
WorkflowExecutionRepository = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], WorkflowExecutionRepository);
export { WorkflowExecutionRepository };
