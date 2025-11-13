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
import { WorkflowStatus, WorkflowExecutionStatus } from '../../generated/prisma';
import { PrismaService } from '../prisma.service';
import { BaseRepository } from './base.repository';
let WorkflowRepository = class WorkflowRepository extends BaseRepository {
    constructor(prisma) {
        super(prisma, 'workflow');
    }
    // Helper method to convert Prisma Workflow to App Workflow
    convertPrismaToApp(prismaWorkflow) {
        return {
            id: prismaWorkflow.id,
            name: prismaWorkflow.name,
            description: prismaWorkflow.description ?? null,
            definition: prismaWorkflow.definition,
            status: prismaWorkflow.status,
            createdAt: prismaWorkflow.createdAt,
            updatedAt: prismaWorkflow.updatedAt,
            lastExecutedAt: prismaWorkflow.lastExecutedAt ?? null,
            agentId: prismaWorkflow.agentId ?? null,
            creatorId: prismaWorkflow.creatorId ?? null,
            executions: prismaWorkflow.executions?.map((exec) => this.convertExecutionPrismaToApp(exec)) ?? [],
            steps: prismaWorkflow.steps?.map((step) => ({ ...step })) ?? [],
        };
    }
    // Helper method to convert Prisma WorkflowExecution to App WorkflowExecution
    convertExecutionPrismaToApp(prismaExecution) {
        return {
            id: prismaExecution.id,
            workflowId: prismaExecution.workflowId,
            status: prismaExecution.status,
            input: prismaExecution.input ?? null,
            output: prismaExecution.output ?? null,
            error: prismaExecution.error ?? null,
            startedAt: prismaExecution.startedAt,
            completedAt: prismaExecution.completedAt ?? null,
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
                },
                agent: true,
            }
        });
        return result ? this.convertPrismaToApp(result) : null;
    }
    async findMany(filters) {
        const results = await this.prisma.workflow.findMany({
            where: filters,
            include: {
                executions: true,
                agent: true,
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
                executions: true,
                agent: true,
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
                executions: true,
                agent: true,
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
    async findByCreatorId(creatorId) {
        const results = await this.prisma.workflow.findMany({
            where: { creatorId },
            include: {
                executions: true,
                agent: true,
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });
        return results.map(workflow => this.convertPrismaToApp(workflow));
    }
    async findByAgentId(agentId) {
        const results = await this.prisma.workflow.findMany({
            where: { agentId },
            include: {
                executions: true,
                agent: true,
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });
        return results.map(workflow => this.convertPrismaToApp(workflow));
    }
    async findByStatus(status) {
        const results = await this.prisma.workflow.findMany({
            where: { status },
            include: {
                executions: true,
                agent: true,
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
                status,
                updatedAt: new Date()
            },
            include: {
                executions: true,
                agent: true,
            }
        });
        return this.convertPrismaToApp(result);
    }
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
                status: WorkflowExecutionStatus.COMPLETED
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
                executions: true,
                agent: true,
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
//# sourceMappingURL=workflow.repository.js.map