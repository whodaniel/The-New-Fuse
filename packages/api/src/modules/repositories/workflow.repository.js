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
import { WorkflowStatus } from '@the-new-fuse/types';
let WorkflowRepository = class WorkflowRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    // Helper method to convert Prisma Workflow to App Workflow
    convertPrismaToApp(prismaWorkflow) {
        return {
            id: prismaWorkflow.id,
            name: prismaWorkflow.name,
            description: prismaWorkflow.description || undefined,
            status: prismaWorkflow.status || WorkflowStatus.DRAFT,
            steps: prismaWorkflow.steps || [],
            metadata: prismaWorkflow.metadata || {},
            userId: prismaWorkflow.userId,
            createdAt: prismaWorkflow.createdAt,
            updatedAt: prismaWorkflow.updatedAt
        };
    }
    // Implement abstract methods from BaseRepository
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
        const where = filters || {};
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
        return results.map((workflow) => this.convertPrismaToApp(workflow));
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
        const result = await this.prisma.workflow.delete({ where: { id } });
        return this.convertPrismaToApp(result);
    }
    // Additional methods for compatibility with existing services
    async findAll(filter, include, orderBy, skip, take) {
        const where = filter || {};
        const options = {
            where,
            include: include || {
                _count: {
                    select: {
                        executions: true
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
        const results = await this.prisma.workflow.findMany(options);
        return results.map((workflow) => this.convertPrismaToApp(workflow));
    }
    async findOne(filter, include) {
        const where = filter || {};
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
    async count(filter) {
        const where = filter || {};
        return this.prisma.workflow.count({ where });
    }
    async countTotal(where) {
        return this.prisma.workflow.count({ where });
    }
    // Custom repository methods
    async findByStatus(status) {
        return this.findAll({ status });
    }
    async findByUserId(userId) {
        return this.findAll({ userId });
    }
    async updateStatus(id, status) {
        return this.update(id, { status });
    }
    async searchWorkflows(query) {
        const results = await this.prisma.workflow.findMany({
            where: {
                OR: [
                    {
                        name: {
                            contains: query,
                            mode: 'insensitive',
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
        return results.map((workflow) => this.convertPrismaToApp(workflow));
    }
};
WorkflowRepository = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [typeof (_a = typeof PrismaService !== "undefined" && PrismaService) === "function" ? _a : Object])
], WorkflowRepository);
export { WorkflowRepository };
//# sourceMappingURL=workflow.repository.js.map