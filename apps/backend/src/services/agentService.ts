import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class AgentService {
  constructor(private prisma: PrismaService) {}

  async createAgent(data: any, userId: string) {
    // Add userId to the data
    const agentData = {
      ...data,
      userId,
    };
    
    const agent = await this.prisma.agent.create({
      data: agentData
    });
    
    return agent;
  }

  async getAgents(userId: string) {
    const agents = await this.prisma.agent.findMany({
      where: {
        userId
      }
    });
    
    return agents;
  }

  async getAgentById(id: string, userId: string) {
    const agent = await this.prisma.agent.findFirst({
      where: {
        id,
        userId
      }
    });
    
    return agent;
  }

  async createAgentsInTransaction(agents: any[]) {
    return await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const createdAgents = [];
      
      for (const agent of agents) {
        const createdAgent = await tx.agent.create({
          data: agent
        });
        
        createdAgents.push(createdAgent);
      }
      
      return createdAgents;
    });
  }

  async updateAgentStatus(id: string, status: string, userId: string) {
    await this.prisma.agent.update({
      where: {
        id,
        userId
      },
      data: {
        status
      }
    });
    
    return this.getAgentById(id, userId);
  }

  async getActiveAgents(userId: string) {
    const agents = await this.prisma.agent.findMany({
      where: {
        userId,
        status: 'ACTIVE'
      }
    });
    
    return agents;
  }

  async getAgentsByCapability(capability: string, userId: string) {
    const agents = await this.prisma.agent.findMany({
      where: {
        userId,
        capabilities: {
          has: capability
        }
      }
    });
    
    return agents;
  }

  async updateAgent(id: string, data: any, userId: string) {
    const agent = await this.prisma.agent.update({
      where: {
        id,
        userId
      },
      data
    });
    
    return agent;
  }

  async deleteAgent(id: string, userId: string) {
    try {
      await this.prisma.agent.delete({
        where: {
          id,
          userId
        }
      });
      return true;
    } catch (error) {
      console.error(`Error deleting agent: ${error}`);
      return false;
    }
  }
}
