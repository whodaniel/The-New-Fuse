import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@the-new-fuse/database/src/prisma.service';
import { ConfigService } from '@nestjs/config';
import { AgentFactory } from './agent.factory';
import { CreateAgentDto, UpdateAgentDto } from './dto/agent.dto';
import { UnifiedMonitoringService } from '@the-new-fuse/core';

@Injectable()
export class AgentsService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private monitoring: UnifiedMonitoringService,
    private agentFactory: AgentFactory,
  ) {}

  async create(userId: string, dto: CreateAgentDto) {
    try {
      const agent = await this.prisma.agent.create({
        data: {
          ...dto,
          userId,
          config: this.agentFactory.getDefaultConfig(dto.type)
        }
      });

      this.monitoring.recordMetric('agent.created', 1, {
        type: dto.type,
        userId
      });

      return agent;
    } catch (error) {
      this.monitoring.captureError(error, { userId, dto });
      throw error;
    }
  }

  async findAll(userId: string) {
    return this.prisma.agent.findMany({
      where: { userId },
      include: {
        chats: {
          take: 1,
          orderBy: { updatedAt: 'desc' }
        }
      }
    });
  }

  async update(id: string, userId: string, dto: UpdateAgentDto) {
    const agent = await this.prisma.agent.findFirst({
      where: { id, userId }
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    return this.prisma.agent.update({
      where: { id },
      data: dto
    });
  }
}