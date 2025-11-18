import * as DataLoader from 'dataloader';
import { Injectable, Scope } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Agent } from '../../entities/agent.entity';

@Injectable({ scope: Scope.REQUEST })
export class AgentLoader {
  constructor(
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
  ) {}

  private readonly batchAgents = new DataLoader<string, Agent>(
    async (agentIds: readonly string[]) => {
      const agents = await this.agentRepository.find({
        where: { id: In([...agentIds]) },
      });

      const agentMap = new Map(agents.map((agent) => [agent.id, agent]));
      return agentIds.map((id) => agentMap.get(id) || null) as Agent[];
    },
  );

  private readonly batchAgentsByUser = new DataLoader<string, Agent[]>(
    async (userIds: readonly string[]) => {
      const agents = await this.agentRepository.find({
        where: { owner: { id: In([...userIds]) } },
        relations: ['owner'],
      });

      const agentsByUser = new Map<string, Agent[]>();
      agents.forEach((agent) => {
        const userId = agent.owner?.id;
        if (userId) {
          if (!agentsByUser.has(userId)) {
            agentsByUser.set(userId, []);
          }
          agentsByUser.get(userId)!.push(agent);
        }
      });

      return userIds.map((userId) => agentsByUser.get(userId) || []);
    },
  );

  async load(agentId: string): Promise<Agent> {
    return this.batchAgents.load(agentId);
  }

  async loadMany(agentIds: string[]): Promise<Agent[]> {
    return this.batchAgents.loadMany(agentIds) as Promise<Agent[]>;
  }

  async loadByUserId(userId: string): Promise<Agent[]> {
    return this.batchAgentsByUser.load(userId);
  }
}
