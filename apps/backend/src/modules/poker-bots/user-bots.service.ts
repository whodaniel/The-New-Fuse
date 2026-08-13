import { Injectable } from '@nestjs/common';
import { AgentType } from '@the-new-fuse/types';
import { AgentService } from '../agent/agent.service';

@Injectable()
export class UserBotsService {
  constructor(private readonly agentService: AgentService) {}

  async getBots(userId: string) {
    const agents = await this.agentService.getAgents(userId, 1, 100);
    // Filter by type or search for 'poker' in config
    return agents.data
      .filter((a) => a.type === AgentType.DOMAIN_GAMING && (a.configuration as any)?.poker)
      .map((a) => ({
        id: a.id,
        name: a.name,
        temperament: (a.configuration as any).poker.temperament,
        riskBps: (a.configuration as any).poker.riskBps,
        aiAssist: (a.configuration as any).poker.aiAssist,
      }));
  }

  async createBot(userId: string, data: any) {
    return this.agentService.createAgent(
      {
        name: data.name,
        type: AgentType.DOMAIN_GAMING,
        configuration: {
          poker: {
            temperament: data.temperament,
            riskBps: data.riskBps,
            aiAssist: data.aiAssist,
          },
        },
      } as any,
      userId
    );
  }

  async updateBot(userId: string, id: string, data: any) {
    return this.agentService.updateAgent(
      id,
      {
        name: data.name,
        configuration: {
          poker: {
            temperament: data.temperament,
            riskBps: data.riskBps,
            aiAssist: data.aiAssist,
          },
        },
      } as any,
      userId
    );
  }

  async deleteBot(userId: string, id: string) {
    return this.agentService.deleteAgent(id, userId);
  }
}
