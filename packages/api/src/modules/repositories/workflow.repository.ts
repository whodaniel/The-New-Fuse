import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseRepository } from '@the-new-fuse/database/src/repositories/base.repository';
import { Workflow, WorkflowStatus } from '@the-new-fuse/types';

@Injectable()
export class WorkflowRepository extends BaseRepository<Workflow> {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  // Helper method to convert Prisma Workflow to App Workflow
  private convertPrismaToApp(prismaWorkflow: any): Workflow {
    return {
      id: prismaWorkflow.id,
      name: prismaWorkflow.name,
      description: prismaWorkflow.description || undefined,
      status: prismaWorkflow.status as WorkflowStatus || WorkflowStatus.DRAFT,
      steps: prismaWorkflow.steps || [],
      metadata: prismaWorkflow.metadata || {},
      userId: prismaWorkflow.userId,
      createdAt: prismaWorkflow.createdAt,
      updatedAt: prismaWorkflow.updatedAt
    } as Workflow;
  }

  // Implement abstract methods from BaseRepository
  async findById(id: string): Promise<Workflow | null> {
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

  async findMany(filters?: any): Promise<Workflow[]> {
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

  async create(data: any): Promise<Workflow> {
    const result = await this.prisma.workflow.create({ 
      data,
      include: {
        executions: true
      }
    });
    return this.convertPrismaToApp(result);
  }

  async update(id: string, data: any): Promise<Workflow> {
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

  async delete(id: string): Promise<Workflow> {
    const result = await this.prisma.workflow.delete({ where: { id } });
    return this.convertPrismaToApp(result);
  }

  // Additional methods for compatibility with existing services
  async findAll(filter?: any, include?: any, orderBy?: any, skip?: number, take?: number): Promise<Workflow[]> {
    const where = this.buildWhereClause(filter);
    
    const options: any = {
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
      const sortOptions = this.getSortOptions(orderBy.field, orderBy.direction);
      Object.assign(options, sortOptions);
    }
    
    if (skip !== undefined) {
      options.skip = skip;
    }
    
    if (take !== undefined) {
      options.take = take;
    }
    
    const results = await this.prisma.workflow.findMany(options);
    return results.map(workflow => this.convertPrismaToApp(workflow));
  }

  async findOne(filter?: any, include?: any): Promise<Workflow | null> {
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

  async count(filter?: any): Promise<number> {
    const where = this.buildWhereClause(filter);
    return this.prisma.workflow.count({ where });
  }

  protected async countTotal(where: any): Promise<number> {
    return this.prisma.workflow.count({ where });
  }

  // Custom repository methods
  async findByStatus(status: WorkflowStatus): Promise<Workflow[]> {
    return this.findAll({ status });
  }

  async findByUserId(userId: string): Promise<Workflow[]> {
    return this.findAll({ userId });
  }

  async updateStatus(id: string, status: WorkflowStatus): Promise<Workflow> {
    return this.update(id, { status });
  }

  async searchWorkflows(query: string): Promise<Workflow[]> {
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
}