import { Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// @ts-ignore
// @ts-ignore
// @ts-ignore
import { DatabaseService } from '@the-new-fuse/database';
import { UnifiedMonitoringService } from '../types/core';
import { AgentFactory } from './agent.factory';
import { CreateAgentDto, UpdateAgentDto } from './dto/agent.dto';

@Injectable()
export class AgentsService {
  constructor(
    private db: DatabaseService,
    private config: ConfigService,
    private agentFactory: AgentFactory,
    @Optional()
    @Inject('UnifiedMonitoringService')
    private monitoring?: UnifiedMonitoringService
  ) {}

  async create(userId: string, dto: CreateAgentDto) {
    try {
      const agent = await this.db.agents.create({
        ...(dto as any),
        userId,
        config: this.agentFactory.getDefaultConfig(dto.type) as any,
      });

      this.monitoring?.recordMetric('agent.created', 1, {
        type: dto.type,
        userId,
      });

      return agent;
    } catch (error) {
      this.monitoring?.captureError(error, { userId, dto });
      throw error;
    }
  }

  async findAll(userId: string) {
    const agents = await this.db.agents.findByUserId(userId);

    // Enrich with latest chat for compatibility
    const enrichedAgents = await Promise.all(
      agents.map(async (agent: any) => {
        // Assuming findChatsByAgentId exists and returns chats sorted by date or we sort here
        // The repository method findChatsByAgentId sorts by createdAt desc usually?
        // Let's rely on finding standard chats
        let chats: any[] = [];
        try {
          chats = await this.db.chats.findChatsByAgentId(agent.id);
        } catch (e) {
          // ignore if fails
        }

        return {
          ...agent,
          chats: chats.slice(0, 1),
        };
      })
    );

    return enrichedAgents;
  }

  async update(id: string, userId: string, dto: UpdateAgentDto) {
    // Verify ownership
    const agent = await this.db.agents.findById(id, userId);
    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    return this.db.agents.update(id, userId, {
      name: dto.name,
      description: dto.description,
      capabilities: dto.capabilities as any,
      config: dto.config,
    });
  }
}
