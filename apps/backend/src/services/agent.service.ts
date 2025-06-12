import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Agent, AgentStatus } from '@prisma/client';
import { CreateAgentDto, UpdateAgentDto, AgentResponseDto } from 'packages/api/src/dto/agent.dto.js';

@Injectable()
export class AgentService {
  constructor(private readonly prisma: PrismaService) {}

  async createAgent(data: CreateAgentDto, userId: string): Promise<Agent> {
    const agentData = {
      ...data,
      userId,
      capabilities: data.capabilities || [],
      status: data.status || AgentStatus.INACTIVE,
      lastActive: data.lastActive ? new Date(data.lastActive) : new Date(),
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
        status,
        lastActive: new Date()
      }
    });
    
    return updatedAgent;
  }

  async updateAgent(id: string, data: UpdateAgentDto, userId: string): Promise<Agent> {
    const updateData: any = {
      ...data,
    };

    if (data.lastActive) {
      updateData.lastActive = new Date(data.lastActive);
    }

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
      description: agent.description,
      type: agent.type,
      status: agent.status,
      capabilities: agent.capabilities,
      provider: agent.provider,
      lastActive: agent.lastActive,
      metadata: agent.metadata,
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt,
    };
  }
}