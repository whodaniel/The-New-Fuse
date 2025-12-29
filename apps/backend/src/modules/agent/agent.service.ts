import { Injectable, Logger, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { Agent, CreateAgentDto, UpdateAgentDto, AgentResponseDto, AgentType, AgentStatus, AgentCapability } from '@the-new-fuse/types';
import { PrismaService } from '../../prisma/prisma.service';
import { PrismaClient, Prisma, Agent as PrismaAgent, AgentStatus as PrismaAgentStatus } from '@prisma/client';

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);

  constructor(private readonly prisma: PrismaService) {}

  private mapPrismaStatusToType(prismaStatus: PrismaAgentStatus): AgentStatus {
    return prismaStatus as unknown as AgentStatus;
  }

  private mapTypeStatusToPrisma(typeStatus: AgentStatus): PrismaAgentStatus {
    return typeStatus as unknown as PrismaAgentStatus;
  }

  private transformPrismaAgent(agent: PrismaAgent): Agent {
    return {
      id: agent.id,
      name: agent.name,
      description: agent.description || undefined,
      systemPrompt: agent.systemPrompt || undefined,
      capabilities: (agent.capabilities as string[]).map(cap => cap as AgentCapability) || [],
      status: this.mapPrismaStatusToType(agent.status),
      configuration: agent.config,
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt,
      type: agent.type as AgentType
    };
  }

  async createAgent(data: CreateAgentDto, userId: string): Promise<Agent> {
    try {
      return await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const existingAgent = await tx.agent.findFirst({
          where: { name: data.name, userId, deletedAt: null }
        });

        if (existingAgent) {
          throw new ConflictException(`Agent with name "${data.name}" already exists`);
        }

        const agent = await tx.agent.create({
          data: {
            name: data.name,
            type: data.type || 'ASSISTANT',
            description: data.description,
            systemPrompt: data.systemPrompt,
            capabilities: data.capabilities || [],
            status: this.mapTypeStatusToPrisma(AgentStatus.INACTIVE),
            config: data.configuration as any,
            provider: data.provider || 'default',
            userId
          }
        });

        this.logger.log(`Created agent: ${agent.id} (${agent.name})`);
        return this.transformPrismaAgent(agent);
      });
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to create agent: ${errorMessage}`);
      throw new InternalServerErrorException('Failed to create agent');
    }
  }

  async getAgents(userId: string, page: number = 1, limit: number = 50): Promise<{ data: Agent[], pagination: any }> {
    try {
      const skip = (page - 1) * limit;
      const [agents, total] = await Promise.all([
        this.prisma.agent.findMany({
          where: { userId, deletedAt: null },
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
            description: true,
            systemPrompt: true,
            config: true,
            capabilities: true,
            provider: true,
            userId: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true,
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.agent.count({ where: { userId, deletedAt: null } }),
      ]);
      return {
        data: agents.map(a => this.transformPrismaAgent(a as PrismaAgent)),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to get agents: ${errorMessage}`);
      throw new InternalServerErrorException('Failed to retrieve agents');
    }
  }

  async getAgentById(id: string, userId: string): Promise<Agent> {
    const agent = await this.prisma.agent.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!agent) {
      throw new NotFoundException(`Agent with id "${id}" not found`);
    }

    return this.transformPrismaAgent(agent);
  }

  async updateAgent(id: string, updates: UpdateAgentDto, userId: string): Promise<Agent> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const existingAgent = await tx.agent.findFirst({
          where: { id, userId, deletedAt: null }
        });

        if (!existingAgent) {
          throw new NotFoundException(`Agent with id "${id}" not found`);
        }

        if (updates.name) {
          const nameExists = await tx.agent.findFirst({
            where: {
              name: updates.name,
              userId,
              id: { not: id },
              deletedAt: null
            }
          });

          if (nameExists) {
            throw new ConflictException(`Agent with name "${updates.name}" already exists`);
          }
        }

        const agent = await tx.agent.update({
          where: { id },
          data: {
            ...updates,
            updatedAt: new Date()
          }
        });

        this.logger.log(`Updated agent: ${id}`);
        return this.transformPrismaAgent(agent);
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to update agent ${id}: ${errorMessage}`);
      throw new InternalServerErrorException(`Failed to update agent ${id}`);
    }
  }

  async deleteAgent(id: string, userId: string): Promise<void> {
    try {
      const agent = await this.getAgentById(id, userId);
      await this.prisma.agent.update({
        where: { id: agent.id },
        data: { deletedAt: new Date() }
      });
      this.logger.log(`Deleted agent: ${id}`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to delete agent: ${errorMessage}`);
      throw new InternalServerErrorException('Failed to delete agent');
    }
  }

  async getAgentsByCapability(capability: string, userId: string): Promise<Agent[]> {
    try {
      const agents = await this.prisma.agent.findMany({
        where: {
          userId,
          deletedAt: null,
          capabilities: {
            has: capability
          }
        },
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          description: true,
          systemPrompt: false, 
          config: false, 
          capabilities: true,
          provider: true,
          userId: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
        }
      });
      return agents.map(a => this.transformPrismaAgent(a as PrismaAgent));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to get agents by capability: ${errorMessage}`);
      throw new InternalServerErrorException('Failed to retrieve agents by capability');
    }
  }

  async getActiveAgents(userId: string): Promise<Agent[]> {
    try {
      const agents = await this.prisma.agent.findMany({
        where: {
          userId,
          deletedAt: null,
          status: this.mapTypeStatusToPrisma(AgentStatus.ACTIVE)
        },
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          description: true,
          systemPrompt: false, 
          config: false, 
          capabilities: true,
          provider: true,
          userId: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
        },
        orderBy: { updatedAt: 'desc' }
      });
      return agents.map(a => this.transformPrismaAgent(a as PrismaAgent));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to get active agents: ${errorMessage}`);
      throw new InternalServerErrorException('Failed to retrieve active agents');
    }
  }

  async updateAgentStatus(id: string, status: AgentStatus, userId: string): Promise<Agent> {
    await this.getAgentById(id, userId); // Verifies ownership and existence
    try {
      const agent = await this.prisma.agent.update({
        where: { id },
        data: { status: this.mapTypeStatusToPrisma(status) }
      });
      this.logger.log(`Updated agent status: ${id} -> ${status}`);
      return this.transformPrismaAgent(agent);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to update agent status: ${errorMessage}`);
      throw new InternalServerErrorException('Failed to update agent status');
    }
  }

  async startAgent(id: string, userId: string): Promise<Agent> {
    return this.updateAgentStatus(id, AgentStatus.ACTIVE, userId);
  }

  async stopAgent(id: string, userId: string): Promise<Agent> {
    return this.updateAgentStatus(id, AgentStatus.INACTIVE, userId);
  }

  async getAgentStatus(id: string, userId: string): Promise<{ status: AgentStatus }> {
    const agent = await this.getAgentById(id, userId);
    return { status: agent.status };
  }

  async searchAgents(query: { name?: string; type?: AgentType; capability?: AgentCapability }, userId: string): Promise<Agent[]> {
    try {
      const where: Prisma.AgentWhereInput = {
        userId,
        deletedAt: null,
      };

      if (query.name) {
        where.name = {
          contains: query.name,
          mode: 'insensitive',
        };
      }
      if (query.type) {
        where.type = query.type;
      }
      if (query.capability) {
        where.capabilities = {
          has: query.capability,
        };
      }

      const agents = await this.prisma.agent.findMany({ where });
      return agents.map(a => this.transformPrismaAgent(a as PrismaAgent));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to search agents: ${errorMessage}`);
      throw new InternalServerErrorException('Failed to search for agents');
    }
  }
} 