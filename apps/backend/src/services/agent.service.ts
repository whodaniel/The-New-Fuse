import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Agent, AgentStatus } from '@the-new-fuse/database/generated/prisma';
import { CreateAgentDto, UpdateAgentDto, AgentResponseDto } from '@the-new-fuse/types';

@Injectable()
export class AgentService {
  constructor(private readonly prisma: PrismaService) {}

  async createAgent(data: CreateAgentDto, userId: string): Promise<Agent> {
    const agentData = {
      name: data.name,
      type: data.type,
      description: data.description,
      systemPrompt: data.systemPrompt,
      capabilities: data.capabilities || [],
      config: data.configuration || {},
      provider: data.provider || 'default',
      userId,
      status: AgentStatus.INACTIVE,
    };
    
    return this.prisma.agent.create({
      data: agentData
    });
  }

  async getAgents(userId: string): Promise<Agent[]> {
    return this.prisma.agent.findMany({
      where: { userId }
    });
  }

  async getAgentById(id: string, userId: string): Promise<Agent | null> {
    return this.prisma.agent.findFirst({
      where: {
        id,
        userId
      }
    });
  }
  
  async updateAgentStatus(id: string, status: AgentStatus, userId: string): Promise<Agent | null> {
    const updatedAgent = await this.prisma.agent.update({
      where: {
        id,
        userId
      },
      data: { 
        status
      }
    });
    
    return updatedAgent;
  }

  async updateAgent(id: string, data: UpdateAgentDto, userId: string): Promise<Agent> {
    const updateData: any = {
      ...data,
    };


    return this.prisma.agent.update({
      where: {
        id,
        userId
      },
      data: updateData
    });
  }
  
  async deleteAgent(id: string, userId: string): Promise<Agent> {
    return this.prisma.agent.delete({
      where: {
        id,
        userId
      }
    });
  }

  private transformToDto(agent: Agent): AgentResponseDto {
    return {
      id: agent.id,
      name: agent.name,
      description: agent.description || undefined,
      type: agent.type as any, // Type conversion needed between Prisma and types package
      status: agent.status as any, // Type conversion needed between Prisma and types package
      capabilities: agent.capabilities as any, // Type conversion needed between Prisma and types package
      provider: agent.provider || undefined,
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt,
    };
  }
}