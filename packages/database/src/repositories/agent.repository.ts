import { Injectable } from '@nestjs/common';
import { Agent, AgentStatus, AgentType, Prisma } from '../../generated/prisma';
import { PrismaService } from '../prisma.service';
import { IRepository } from './base.repository';
import { AgentCapability } from '@the-new-fuse/types/src/core/enums';

@Injectable()
export class AgentRepository {
  constructor(private prisma: PrismaService) {}

  // Helper method to convert Prisma Agent to App Agent
  private convertPrismaToApp(prismaAgent: Agent & { user?: any; workflows?: any; nft?: any }): any {
    return {
      id: prismaAgent.id,
      name: prismaAgent.name,
      description: prismaAgent.description,
      type: prismaAgent.type,
      status: prismaAgent.status,
      userId: prismaAgent.userId,
      config: prismaAgent.config,
      createdAt: prismaAgent.createdAt,
      updatedAt: prismaAgent.updatedAt,
      capabilities: prismaAgent.capabilities as unknown as AgentCapability[],
      provider: prismaAgent.provider,
      nft: prismaAgent.nft || null,
      workflows: prismaAgent.workflows || [],
      user: prismaAgent.user || null
    };
  }

  async findById(id: string): Promise<any | null> {
    const result = await this.prisma.agent.findUnique({
      where: { id },
      include: {
        user: true,
        workflows: true,
        nft: true
      }
    });
    return result ? this.convertPrismaToApp(result) : null;
  }


  async findMany(filters?: Prisma.AgentWhereInput): Promise<any[]> {
    const results = await this.prisma.agent.findMany({
      where: filters,
      include: {
        user: true,
        workflows: true,
        nft: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    return results.map(agent => this.convertPrismaToApp(agent));
  }


  async create(data: Prisma.AgentCreateInput): Promise<Agent> {
    const result = await this.prisma.agent.create({
      data
    });
    return this.convertPrismaToApp(result);
  }


  async update(id: string, data: Prisma.AgentUpdateInput): Promise<Agent> {
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

  async countByType(): Promise<Record<AgentType, number>> {
    const counts = await this.prisma.agent.groupBy({
      by: ['type'],
      _count: {
        id: true
      }
    });

    return counts.reduce((acc: Record<AgentType, number>, { type, _count }: { type: AgentType, _count: { id: number } }) => {
      acc[type] = _count.id;
      return acc;
    }, {} as Record<string, number>);
  }

  async getAgentStats(id: string): Promise<Agent | null> {
    const agent = await this.prisma.agent.findUnique({
      where: { id }
    });

    if (!agent) return null;

    const convertedAgent = this.convertPrismaToApp(agent);
    return convertedAgent;
  }
}
