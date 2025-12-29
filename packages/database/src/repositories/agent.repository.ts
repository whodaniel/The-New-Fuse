import { Injectable } from '@nestjs/common';
import { Agent, AgentStatus, AgentType, Prisma, User, Workflow } from '../../generated/prisma';
import { PrismaService } from '../prisma.service';

// Define a type for the enriched agent object
export type AppAgent = Agent & {
  user?: User | null;
  workflows?: Workflow[];
  nft?: Record<string, unknown> | null; // Assuming NFT type is not defined in Prisma schema
};

@Injectable()
export class AgentRepository {
  constructor(private prisma: PrismaService) {}

  private convertPrismaToApp(
    prismaAgent: Agent & { user?: User | null; workflows?: Workflow[]; nft?: any }
  ): AppAgent {
    return {
      ...prismaAgent,
      nft: prismaAgent.nft || null,
      workflows: prismaAgent.workflows || [],
      user: prismaAgent.user || null,
    };
  }

  async findById(id: string): Promise<AppAgent | null> {
    const result = await this.prisma.agent.findUnique({
      where: { id },
      include: {
        user: true,
        workflows: true,
        nft: true,
      },
    });
    return result ? this.convertPrismaToApp(result) : null;
  }

  async findMany(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.AgentWhereUniqueInput;
    where?: Prisma.AgentWhereInput;
    orderBy?: Prisma.AgentOrderByWithRelationInput;
  }): Promise<AppAgent[]> {
    const { skip, take, cursor, where, orderBy } = params;
    const results = await this.prisma.agent.findMany({
      skip,
      take,
      cursor,
      where,
      include: {
        user: true,
        workflows: true,
        nft: true,
      },
      orderBy: orderBy || {
        updatedAt: 'desc',
      },
    });
    return results.map((agent: Agent & { user?: User | null; workflows?: Workflow[]; nft?: any }) =>
      this.convertPrismaToApp(agent)
    );
  }

  async create(data: Prisma.AgentCreateInput): Promise<AppAgent> {
    const result = await this.prisma.agent.create({
      data,
      include: {
        user: true,
        workflows: true,
        nft: true,
      },
    });
    return this.convertPrismaToApp(result);
  }

  async update(id: string, data: Prisma.AgentUpdateInput): Promise<AppAgent> {
    const result = await this.prisma.agent.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        user: true,
        workflows: true,
        nft: true,
      },
    });
    return this.convertPrismaToApp(result);
  }

  async delete(id: string): Promise<AppAgent> {
    const result = await this.prisma.agent.delete({
      where: { id },
      include: {
        user: true,
        workflows: true,
        nft: true,
      },
    });
    return this.convertPrismaToApp(result);
  }

  async findByStatus(status: AgentStatus): Promise<AppAgent[]> {
    const results = await this.prisma.agent.findMany({
      where: { status },
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        user: true,
        workflows: true,
        nft: true,
      },
    });
    return results.map((agent: Agent & { user?: User | null; workflows?: Workflow[]; nft?: any }) =>
      this.convertPrismaToApp(agent)
    );
  }

  async findByType(type: AgentType): Promise<AppAgent[]> {
    const results = await this.prisma.agent.findMany({
      where: { type },
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        user: true,
        workflows: true,
        nft: true,
      },
    });
    return results.map((agent: Agent & { user?: User | null; workflows?: Workflow[]; nft?: any }) =>
      this.convertPrismaToApp(agent)
    );
  }

  async findByUserId(userId: string): Promise<AppAgent[]> {
    const results = await this.prisma.agent.findMany({
      where: { userId },
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        user: true,
        workflows: true,
        nft: true,
      },
    });
    return results.map((agent: Agent & { user?: User | null; workflows?: Workflow[]; nft?: any }) =>
      this.convertPrismaToApp(agent)
    );
  }

  async updateStatus(id: string, status: AgentStatus): Promise<AppAgent> {
    const result = await this.prisma.agent.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
      },
      include: {
        user: true,
        workflows: true,
        nft: true,
      },
    });
    return this.convertPrismaToApp(result);
  }

  async findActiveAgents(): Promise<AppAgent[]> {
    return this.findByStatus(AgentStatus.IDLE);
  }

  async countByType(): Promise<Record<AgentType, number>> {
    const counts = await this.prisma.agent.groupBy({
      by: ['type'],
      _count: {
        id: true,
      },
    });

    return counts.reduce(
      (
        acc: Record<AgentType, number>,
        { type, _count }: { type: AgentType; _count: { id: number } }
      ) => {
        acc[type] = _count.id;
        return acc;
      },
      {} as Record<AgentType, number>
    );
  }

  async getAgentStats(id: string): Promise<AppAgent | null> {
    const agent = await this.prisma.agent.findUnique({
      where: { id },
      include: {
        user: true,
        workflows: true,
        nft: true,
      },
    });

    if (!agent) return null;

    return this.convertPrismaToApp(agent);
  }
}
