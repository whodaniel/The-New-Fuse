import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AgentService {
  constructor(private readonly prisma: PrismaService) {}

  // Re-exporting the same methods from agentService.tsx but with
  // proper TypeScript interfaces
  
  async createAgent(data: any, userId: string) {
    const agentData = {
      ...data,
      userId,
    };
    
    return this.prisma.agent.create({
      data: agentData
    });
  }

  async getAgents(userId: string) {
    return this.prisma.agent.findMany({
      where: { userId }
    });
  }

  async getAgentById(id: string, userId: string) {
    return this.prisma.agent.findFirst({
      where: {
        id,
        userId
      }
    });
  }
  
  async updateAgentStatus(id: string, status: string, userId: string) {
    await this.prisma.agent.update({
      where: {
        id,
        userId
      },
      data: { status }
    });
    
    return this.getAgentById(id, userId);
  }
}