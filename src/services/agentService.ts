import {
  Agent,
  CreateAgentDto,
  UpdateAgentDto,
  AgentStatus,
} from "@the-new-fuse/types";
import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from '../lib/prisma.service.js';
import { ConfigService } from "@nestjs/config";
import { Prisma, Agent as PrismaAgent } from "@the-new-fuse/database/client";

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private transformPrismaAgent(agent: PrismaAgent): Agent {
    // Explicit type conversion with schema validation
    const transformed: Agent = {
      id: agent.id,
      name: agent.name,
      type: agent.type,
      config: agent.config as Record<string, unknown>,
      userId: agent.userId,
      createdAt: agent.createdAt.toISOString(),
      updatedAt: agent.updatedAt.toISOString(),
      status: agent.status as AgentStatus,
      // Add schema field assertions
      capabilities: (agent as unknown as { capabilities: string[] }).capabilities,
      description: (agent as unknown as { description?: string }).description,
      systemPrompt: (agent as unknown as { systemPrompt?: string }).systemPrompt,
    };

    return transformed;
  }

  async createAgent(data: CreateAgentDto, userId: string): Promise<Agent> {
    try {
      // Use transaction to ensure data consistency
      return await this.prisma.client.$transaction(async (tx) => {
        // Check for existing agent with same name
        const existingAgent = await tx.agent.findFirst({
          where: { name: data.name },
        });

        if (existingAgent) {
          throw new Error(`Agent with name "${data.name}" already exists`);
        }

        const agent = await tx.agent.create({
          data: {
            name: data.name,
            description: data.description,
            systemPrompt: data.systemPrompt,
            capabilities: data.capabilities || [],
            status: AgentStatus.INACTIVE,
            configuration: data.configuration,
            userId,
          },
        });

        this.logger.log(`Created agent ${agent.id} (${agent.name})`);
        return this.transformPrismaAgent(agent);
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Failed to create agent: ${errorMessage}`);
      throw error;
    }
  }

  async getAgents(userId: string): Promise<Agent[]> {
    try {
      const agents = await this.prisma.client.agent.findMany({
        where: { userId, deletedAt: null },
      });

      return agents.map((agent) => this.transformPrismaAgent(agent));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Failed to get agents: ${errorMessage}`);
      throw error;
    }
  }

  async getAgent(id: string, userId: string): Promise<Agent> {
    try {
      const agent = await this.prisma.client.agent.findFirst({
        where: { id, userId, deletedAt: null },
      });

      if (!agent) {
        throw new Error(`Agent with id "${id}" not found`);
      }

      return this.transformPrismaAgent(agent);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Failed to get agent: ${errorMessage}`);
      throw error;
    }
  }

  async updateAgent(
    id: string,
    updates: UpdateAgentDto,
    userId: string,
  ): Promise<Agent> {
    try {
      return await this.prisma.client.$transaction(async (tx) => {
        // Check if agent exists
        const existingAgent = await tx.agent.findFirst({
          where: { id, userId, deletedAt: null },
        });

        if (!existingAgent) {
          throw new Error(`Agent with id "${id}" not found`);
        }

        // Check if new name conflicts with existing agent
        if (updates.name && updates.name !== existingAgent.name) {
          const nameExists = await tx.agent.findFirst({
            where: {
              name: updates.name,
              id: { not: id },
              deletedAt: null,
            },
          });

          if (nameExists) {
            throw new Error(`Agent with name "${updates.name}" already exists`);
          }
        }

        const agent = await tx.agent.update({
          where: { id },
          data: {
            ...updates,
            updatedAt: new Date(),
          },
        });

        this.logger.log(`Updated agent ${id}`);
        return this.transformPrismaAgent(agent);
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Failed to update agent: ${errorMessage}`);
      throw error;
    }
  }

  async deleteAgent(id: string, userId: string): Promise<void> {
    try {
      await this.prisma.client.agent.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      this.logger.log(`Deleted agent ${id}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Failed to delete agent: ${errorMessage}`);
      throw error;
    }
  }

  async getAgentsByCapability(
    capability: string,
    userId: string,
  ): Promise<Agent[]> {
    try {
      const agents = await this.prisma.client.agent.findMany({
        where: {
          userId,
          deletedAt: null,
          capabilities: {
            has: capability,
          },
        },
      });

      return agents.map((agent) => this.transformPrismaAgent(agent));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Failed to get agents by capability: ${errorMessage}`);
      throw error;
    }
  }

  async getActiveAgents(userId: string): Promise<Agent[]> {
    try {
      const agents = await this.prisma.client.agent.findMany({
        where: {
          userId,
          deletedAt: null,
          status: AgentStatus.ACTIVE,
        },
      });

      return agents.map((agent) => this.transformPrismaAgent(agent));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Failed to get active agents: ${errorMessage}`);
      throw error;
    }
  }

  async updateAgentStatus(
    id: string,
    status: AgentStatus,
    userId: string,
  ): Promise<Agent> {
    try {
      const agent = await this.prisma.client.agent.update({
        where: { id },
        data: { status },
      });

      this.logger.log(`Updated agent status ${id} -> ${status}`);
      return this.transformPrismaAgent(agent);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Failed to update agent status: ${errorMessage}`);
      throw error;
    }
  }
}
