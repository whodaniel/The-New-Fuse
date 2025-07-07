import { Injectable } from '@nestjs/common';
import { Agent, AgentStatus, AgentType } from '../types';
import { PrismaService } from '../prisma.service';
import { IRepository } from './base.repository';

@Injectable()
export class AgentRepository implements IRepository<Agent> {
  constructor(private prisma: PrismaService) {}

  // Helper method to convert Prisma Agent to App Agent
  private convertPrismaToApp(prismaAgent: any): Agent {
    return {
      id: prismaAgent.id,
      name: prismaAgent.name,
      description: prismaAgent.description || undefined,
      type: prismaAgent.type,
      status: prismaAgent.status,
      capabilities: [], // Default empty array since not in schema
      provider: 'default', // Default provider since not in schema
      lastActive: new Date(), // Default to current time since not in schema
      userId: prismaAgent.userId,
      metadata: prismaAgent.configuration || {},
      createdAt: prismaAgent.createdAt,
      updatedAt: prismaAgent.updatedAt
    } as Agent;
  }

  async findById(id: string): Promise<Agent | null> {
    const result = await this.prisma.agent.findUnique({
      where: { id }
    });
    return result ? this.convertPrismaToApp(result) : null;
  }

  async findMany(filters?: any): Promise<Agent[]> {
    const results = await this.prisma.agent.findMany({
      where: filters,
      orderBy: {
        updatedAt: 'desc'
      }
    });
    return results.map(agent => this.convertPrismaToApp(agent));
  }

  async create(data: any): Promise<Agent> {
    const result = await this.prisma.agent.create({
      data
    });
    return this.convertPrismaToApp(result);
  }

  async update(id: string, data: any): Promise<Agent> {
    const result = await this.prisma.agent.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
    return this.convertPrismaToApp(result);
  }

  async delete(id: string): Promise<Agent> {
    const result = await this.prisma.agent.delete({
      where: { id }
    });
    return this.convertPrismaToApp(result);
  }

  async findByStatus(status: AgentStatus): Promise<Agent[]> {
    const results = await this.prisma.agent.findMany({
      where: { status: status as any },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    return results.map(agent => this.convertPrismaToApp(agent));
  }

  async findByType(type: AgentType): Promise<Agent[]> {
    const results = await this.prisma.agent.findMany({
      where: { type: type as any },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    return results.map(agent => this.convertPrismaToApp(agent));
  }

  async findByUserId(userId: string): Promise<Agent[]> {
    const results = await this.prisma.agent.findMany({
      where: { userId },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    return results.map(agent => this.convertPrismaToApp(agent));
  }

  async updateStatus(id: string, status: AgentStatus): Promise<Agent> {
    const result = await this.prisma.agent.update({
      where: { id },
      data: {
        status: status as any,
        updatedAt: new Date()
      }
    });
    return this.convertPrismaToApp(result);
  }

  async findActiveAgents(): Promise<Agent[]> {
    return this.findByStatus(AgentStatus.IDLE);
  }

  async countByType(): Promise<Record<string, number>> {
    const counts = await this.prisma.agent.groupBy({
      by: ['type'],
      _count: {
        id: true
      }
    });

    return counts.reduce((acc: Record<string, number>, { type, _count }: { type: any, _count: any }) => {
      acc[type] = _count.id;
      return acc;
    }, {} as Record<string, number>);
  }

  async getAgentStats(id: string): Promise<any> {
    const agent = await this.prisma.agent.findUnique({
      where: { id }
    });

    if (!agent) return null;

    const convertedAgent = this.convertPrismaToApp(agent);
    return {
      ...convertedAgent,
      stats: {
        lastActive: convertedAgent.lastActive
      }
    };
  }
}
