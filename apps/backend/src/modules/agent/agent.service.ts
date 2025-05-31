import { Injectable, Logger } from '@nestjs/common';
import { Agent, CreateAgentDto, UpdateAgentDto, AgentStatus } from '@the-new-fuse/types';
import { PrismaService } from '../../lib/prisma/prisma.service.js';
import { Prisma, Agent as PrismaAgent } from '@prisma/client';

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);

  constructor(private readonly prisma: PrismaService) {}

  private transformPrismaAgent(agent: PrismaAgent): Agent {
    return {
      id: agent.id,
      name: agent.name,
      description: agent.description || undefined,
      systemPrompt: agent.systemPrompt || undefined,
      capabilities: agent.capabilities,
      status: agent.status,
      configuration: agent.configuration,
      createdAt: agent.createdAt.toISOString(),
      updatedAt: agent.updatedAt.toISOString()
    };
  }

  async createAgent(data: CreateAgentDto, userId: string): Promise<Agent> {
    try {
      // Use transaction to ensure data consistency
      return await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Check for existing agent with same name
        const existingAgent = await tx.agent.findFirst({
          where: { name: data.name, deletedAt: null }
        });

        if (existingAgent) {
          throw new Error(`Agent with name "${data.name}" already exists`);
        }

        // Create the agent
        const agent = await tx.agent.create({
          data: {
            name: data.name,
            description: data.description,
            systemPrompt: data.systemPrompt,
            capabilities: data.capabilities || [],
            status: AgentStatus.INACTIVE,
            configuration: data.configuration,
            userId
          }
        });

        this.logger.log(`Created agent: ${agent.id} (${agent.name})`);
        return this.transformPrismaAgent(agent);
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to create agent: ${errorMessage}`);
      throw error;
    }
  }

  async getAgents(userId: string): Promise<Agent[]> {
    try {
      const agents = await this.prisma.agent.findMany({
        where: { userId, deletedAt: null }
      });

      return agents.map(this.transformPrismaAgent);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to get agents: ${errorMessage}`);
      throw error;
    }
  }

  async getAgentById(id: string, userId: string): Promise<Agent> {
    try {
      const agent = await this.prisma.agent.findFirst({
        where: { id, userId, deletedAt: null }
      });

      if (!agent) {
        throw new Error(`Agent with id "${id}" not found`);
      }

      return this.transformPrismaAgent(agent);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to get agent: ${errorMessage}`);
      throw error;
    }
  }

  async updateAgent(id: string, updates: UpdateAgentDto, userId: string): Promise<Agent> {
    try {
      return await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Check if agent exists
        const existingAgent = await tx.agent.findFirst({
          where: { id, userId, deletedAt: null }
        });

        if (!existingAgent) {
          throw new Error(`Agent with id "${id}" not found`);
        }

        // Check name uniqueness if name is being updated
        if (updates.name) {
          const nameExists = await tx.agent.findFirst({
            where: {
              name: updates.name,
              id: { not: id },
              deletedAt: null
            }
          });

          if (nameExists) {
            throw new Error(`Agent with name "${updates.name}" already exists`);
          }
        }

        // Update the agent
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to update agent: ${errorMessage}`);
      throw error;
    }
  }

  async deleteAgent(id: string, userId: string): Promise<void> {
    try {
      await this.prisma.agent.update({
        where: { id },
        data: { deletedAt: new Date() }
      });

      this.logger.log(`Deleted agent: ${id}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to delete agent: ${errorMessage}`);
      throw error;
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
        }
      });

      return agents.map(this.transformPrismaAgent);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to get agents by capability: ${errorMessage}`);
      throw error;
    }
  }

  async getActiveAgents(userId: string): Promise<Agent[]> {
    try {
      const agents = await this.prisma.agent.findMany({
        where: {
          userId,
          deletedAt: null,
          status: AgentStatus.ACTIVE
        }
      });

      return agents.map(this.transformPrismaAgent);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to get active agents: ${errorMessage}`);
      throw error;
    }
  }

  async updateAgentStatus(id: string, status: AgentStatus, userId: string): Promise<Agent> {
    try {
      const agent = await this.prisma.agent.update({
        where: { id },
        data: { status }
      });

      this.logger.log(`Updated agent status: ${id} -> ${status}`);
      return this.transformPrismaAgent(agent);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to update agent status: ${errorMessage}`);
      throw error;
    }
  }
} 