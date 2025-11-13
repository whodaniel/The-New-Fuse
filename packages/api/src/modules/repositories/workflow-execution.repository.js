var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
let WorkflowExecutionRepository = class WorkflowExecutionRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    // Helper method to convert Prisma WorkflowExecution to App WorkflowExecution
    convertPrismaToApp(prismaExecution) {
        // Convert string status to proper WorkflowExecution status type
        let typedStatus = 'running';
        if (typeof prismaExecution.status === 'string') {
            const status = prismaExecution.status.toLowerCase();
            if (status === 'completed' || status === 'succeeded')
                typedStatus = 'completed';
            else if (status === 'failed')
                typedStatus = 'failed';
            else
                typedStatus = 'running';
        }
        return {
            id: prismaExecution.id,
            workflowId: prismaExecution.workflowId,
            status: typedStatus,
            startedAt: prismaExecution.startedAt,
            completedAt: prismaExecution.finishedAt || null,
            result: prismaExecution.outputs || undefined,
            error: prismaExecution.error || null,
            stepResults: prismaExecution.stepResults || {},
            deletedAt: null,
            createdAt: prismaExecution.createdAt?.toISOString() || prismaExecution.startedAt.toISOString(),
            updatedAt: prismaExecution.updatedAt?.toISOString() || new Date().toISOString()
        };
    }
    // Implement abstract methods from BaseRepository
    async findById(id) {
        const result = await this.prisma.workflowExecution.findUnique({
            where: { id },
            include: {
                workflow: {
                    select: {
                        id: true,
                        name: true,
                        status: true
                    }
                }
            }
        });
        return result ? this.convertPrismaToApp(result) : null;
    }
    async findMany(filters) {
        const where = filters || {};
        const results = await this.prisma.workflowExecution.findMany({
            where,
            include: {
                workflow: {
                    select: {
                        id: true,
                        name: true,
                        status: true
                    }
                }
            },
            orderBy: {
                startedAt: 'desc'
            }
        });
        return results.map((execution) => this.convertPrismaToApp(execution));
    }
    async create(data) {
        const result = await this.prisma.workflowExecution.create({
            data,
            include: {
                workflow: {
                    select: {
                        id: true,
                        name: true,
                        status: true
                    }
                }
            }
        });
        return this.convertPrismaToApp(result);
    }
    async update(id, data) {
        const result = await this.prisma.workflowExecution.update({
            where: { id },
            data,
            include: {
                workflow: {
                    select: {
                        id: true,
                        name: true,
                        status: true
                    }
                }
            }
        });
        return this.convertPrismaToApp(result);
    }
    async delete(id) {
        const result = await this.prisma.workflowExecution.delete({ where: { id } });
        return this.convertPrismaToApp(result);
    }
    // Additional methods for compatibility with existing services
    async findAll(filter, include, orderBy, skip, take) {
        const where = filter || {};
        const options = {
            where,
            include: include || {
                workflow: {
                    select: {
                        id: true,
                        name: true,
                        status: true
                    }
                }
            }
        };
        if (orderBy?.field) {
            options.orderBy = { [orderBy.field]: orderBy.direction || 'asc' };
        }
        if (skip !== undefined) {
            options.skip = skip;
        }
        if (take !== undefined) {
            options.take = take;
        }
        const results = await this.prisma.workflowExecution.findMany(options);
        return results.map((execution) => this.convertPrismaToApp(execution));
    }
    async findOne(filter, include) {
        const where = filter || {};
        const result = await this.prisma.workflowExecution.findFirst({
            where,
            include: include || {
                workflow: {
                    select: {
                        id: true,
                        name: true,
                        status: true
                    }
                }
            }
        });
        return result ? this.convertPrismaToApp(result) : null;
    }
    async count(filter) {
        const where = filter || {};
        return this.prisma.workflowExecution.count({ where });
    }
    async countTotal(where) {
        return this.prisma.workflowExecution.count({ where });
    }
    // Custom repository methods
    async findByWorkflowId(workflowId) {
        return this.findAll({ workflowId });
    }
    async findByStatus(status) {
        return this.findAll({ status });
    }
    async findByUserId(userId) {
        return this.findAll({ userId });
    }
    async updateStatus(id, status, output, error) {
        const updateData = { status };
        if (status === 'completed' || status === 'succeeded' || status === 'failed') {
            updateData.finishedAt = new Date();
        }
        if (output !== undefined) {
            updateData.outputs = output;
        }
        if (error) {
            updateData.error = error;
        }
        return this.update(id, updateData);
    }
    async getRunningExecutions() {
        return this.findByStatus('running');
    }
    async getPendingExecutions() {
        return this.findByStatus('pending');
    }
    async cancelExecution(id) {
        return this.updateStatus(id, 'cancelled');
    }
    async getExecutionHistory(workflowId, limit = 50) {
        const results = await this.prisma.workflowExecution.findMany({
            where: { workflowId },
            orderBy: {
                startedAt: 'desc'
            },
            take: limit
        });
        return results.map((execution) => this.convertPrismaToApp(execution));
    }
};
WorkflowExecutionRepository = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [typeof (_a = typeof PrismaService !== "undefined" && PrismaService) === "function" ? _a : Object])
], WorkflowExecutionRepository);
export { WorkflowExecutionRepository };
//# sourceMappingURL=workflow-execution.repository.js.map