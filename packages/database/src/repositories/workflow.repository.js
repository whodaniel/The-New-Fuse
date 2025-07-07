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
import { WorkflowStatus, WorkflowExecutionStatus } from '../types';
import { PrismaService } from '../prisma.service';
import { BaseRepository } from './base.repository';
let WorkflowRepository = class WorkflowRepository extends BaseRepository {
    constructor(prisma) {
        super(prisma);
    }
    // Helper method to convert Prisma Workflow to App Workflow
    convertPrismaToApp(prismaWorkflow) {
        return {
            id: prismaWorkflow.id,
            name: prismaWorkflow.name,
            description: prismaWorkflow.description || undefined,
            status: prismaWorkflow.status,
            definition: prismaWorkflow.definition,
            createdAt: prismaWorkflow.createdAt,
            updatedAt: prismaWorkflow.updatedAt,
            executions: prismaWorkflow.executions ? prismaWorkflow.executions.map((exec) => this.convertExecutionPrismaToApp(exec)) : undefined
        };
    }
    // Helper method to convert Prisma WorkflowExecution to App WorkflowExecution
    convertExecutionPrismaToApp(prismaExecution) {
        return {
            id: prismaExecution.id,
            workflowId: prismaExecution.workflowId,
            status: prismaExecution.status,
            input: prismaExecution.input || undefined,
            output: prismaExecution.output || undefined,
            error: prismaExecution.error || undefined,
            startedAt: prismaExecution.startedAt || undefined,
            finishedAt: prismaExecution.finishedAt || undefined,
            createdAt: prismaExecution.createdAt,
            updatedAt: prismaExecution.updatedAt,
            workflow: prismaExecution.workflow ? this.convertPrismaToApp(prismaExecution.workflow) : undefined
        };
    }
    async findById(id) {
        const result = await this.prisma.workflow.findUnique({
            where: { id },
            include: {
                executions: {
                    orderBy: {
                        startedAt: 'desc'
                    },
                    take: 10
                }
            }
        });
        return result ? this.convertPrismaToApp(result) : null;
    }
    async findMany(filters) {
        const where = this.buildWhereClause(filters);
        const results = await this.prisma.workflow.findMany({
            where,
            include: {
                _count: {
                    select: {
                        executions: true
                    }
                }
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });
        return results.map(workflow => this.convertPrismaToApp(workflow));
    }
    async create(data) {
        const result = await this.prisma.workflow.create({
            data,
            include: {
                executions: true
            }
        });
        return this.convertPrismaToApp(result);
    }
    async update(id, data) {
        const result = await this.prisma.workflow.update({
            where: { id },
            data: {
                ...data,
                updatedAt: new Date()
            },
            include: {
                executions: true
            }
        });
        return this.convertPrismaToApp(result);
    }
    async delete(id) {
        const result = await this.prisma.workflow.delete({
            where: { id }
        });
        return this.convertPrismaToApp(result);
    }
    // Additional methods required by BaseRepository pattern
    async findOne(filter, include) {
        const where = this.buildWhereClause(filter);
        const result = await this.prisma.workflow.findFirst({
            where,
            include: include || {
                executions: {
                    orderBy: {
                        startedAt: 'desc'
                    },
                    take: 10
                }
            }
        });
        return result ? this.convertPrismaToApp(result) : null;
    }
    async findAll(filter, include, orderBy, skip, take) {
        const where = this.buildWhereClause(filter);
        const paginationOptions = this.getPaginationOptions(skip ? Math.floor(skip / (take || 100)) + 1 : undefined, take);
        const sortOptions = this.getSortOptions(orderBy?.field, orderBy?.direction);
        const results = await this.prisma.workflow.findMany({
            where,
            include: include || {
                _count: {
                    select: {
                        executions: true
                    }
                }
            },
            orderBy: sortOptions.orderBy || { updatedAt: 'desc' },
            skip: paginationOptions.skip,
            take: paginationOptions.take
        });
        return results.map(workflow => this.convertPrismaToApp(workflow));
    }
    async count(filter) {
        const where = this.buildWhereClause(filter);
        return this.prisma.workflow.count({ where });
    }
    async countTotal(where) {
        return this.prisma.workflow.count({ where });
    }
    // Note: Workflow model doesn't have userId field in current schema
    // This method is kept for compatibility but will return empty array
    async findByUserId(_userId) {
        // Since there's no userId field in Workflow, return empty array
        return [];
    }
    // Note: Workflow model doesn't have agentId field in current schema
    // This method is kept for compatibility but will return empty array
    async findByAgentId(_agentId) {
        // Since there's no agentId field in Workflow, return empty array
        return [];
    }
    async findByStatus(status) {
        const results = await this.prisma.workflow.findMany({
            where: { status: status },
            include: {
                _count: {
                    select: {
                        executions: true
                    }
                }
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });
        return results.map(workflow => this.convertPrismaToApp(workflow));
    }
    async updateStatus(id, status) {
        const result = await this.prisma.workflow.update({
            where: { id },
            data: {
                status: status,
                updatedAt: new Date()
            },
            include: {
                executions: true
            }
        });
        return this.convertPrismaToApp(result);
    }
    // Note: WorkflowStep model doesn't exist in current schema
    // Steps are stored in the definition JSON field
    async addStep(workflowId, stepData) {
        const workflow = await this.prisma.workflow.findUnique({
            where: { id: workflowId }
        });
        if (!workflow) {
            throw new Error('Workflow not found');
        }
        const definition = workflow.definition || { steps: [] };
        const steps = definition.steps || [];
        const newStep = { ...stepData, id: `step_${Date.now()}`, order: steps.length };
        const result = await this.prisma.workflow.update({
            where: { id: workflowId },
            data: {
                definition: {
                    ...definition,
                    steps: [...steps, newStep]
                }
            }
        });
        return this.convertPrismaToApp(result);
    }
    // Note: WorkflowStep model doesn't exist in current schema
    // Steps are stored in the definition JSON field
    async removeStep(workflowId, stepId) {
        const workflow = await this.prisma.workflow.findUnique({
            where: { id: workflowId }
        });
        if (!workflow) {
            throw new Error('Workflow not found');
        }
        const definition = workflow.definition || { steps: [] };
        const steps = definition.steps || [];
        const filteredSteps = steps.filter((step) => step.id !== stepId);
        const result = await this.prisma.workflow.update({
            where: { id: workflowId },
            data: {
                definition: {
                    ...definition,
                    steps: filteredSteps
                }
            }
        });
        return this.convertPrismaToApp(result);
    }
    // Note: WorkflowStep model doesn't exist in current schema
    // Steps are stored in the definition JSON field
    async reorderSteps(workflowId, stepOrders) {
        const workflow = await this.prisma.workflow.findUnique({
            where: { id: workflowId }
        });
        if (!workflow) {
            throw new Error('Workflow not found');
        }
        const definition = workflow.definition || { steps: [] };
        const steps = definition.steps || [];
        // Reorder steps based on stepOrders
        const reorderedSteps = steps.map((step) => {
            const orderInfo = stepOrders.find(o => o.id === step.id);
            return orderInfo ? { ...step, order: orderInfo.order } : step;
        }).sort((a, b) => a.order - b.order);
        await this.prisma.workflow.update({
            where: { id: workflowId },
            data: {
                definition: {
                    ...definition,
                    steps: reorderedSteps
                }
            }
        });
    }
    async getWorkflowStats() {
        const statusCounts = await this.prisma.workflow.groupBy({
            by: ['status'],
            _count: {
                id: true
            }
        });
        const totalWorkflows = await this.prisma.workflow.count();
        const activeWorkflows = await this.prisma.workflow.count({
            where: {
                status: WorkflowStatus.ACTIVE
            }
        });
        // Get execution stats
        const executionStats = await this.prisma.workflowExecution.groupBy({
            by: ['status'],
            _count: {
                id: true
            }
        });
        const totalExecutions = await this.prisma.workflowExecution.count();
        const successfulExecutions = await this.prisma.workflowExecution.count({
            where: {
                status: WorkflowExecutionStatus.SUCCEEDED
            }
        });
        return {
            total: totalWorkflows,
            active: activeWorkflows,
            totalExecutions,
            successfulExecutions,
            successRate: totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0,
            byStatus: statusCounts.reduce((acc, { status, _count }) => {
                acc[status] = _count.id;
                return acc;
            }, {}),
            executionsByStatus: executionStats.reduce((acc, { status, _count }) => {
                acc[status] = _count.id;
                return acc;
            }, {})
        };
    }
    async searchWorkflows(query) {
        const results = await this.prisma.workflow.findMany({
            where: {
                OR: [
                    {
                        name: {
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
            include: {
                _count: {
                    select: {
                        executions: true
                    }
                }
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });
        return results.map(workflow => this.convertPrismaToApp(workflow));
    }
};
WorkflowRepository = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], WorkflowRepository);
export { WorkflowRepository };
