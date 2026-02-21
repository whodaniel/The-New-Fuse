/**
 * Agent DataLoader - Migrated to Drizzle ORM
 * Provides efficient batched loading of agents for GraphQL resolvers
 */
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Agent } from '@the-new-fuse/database';
import { DatabaseService } from '@the-new-fuse/database';
import DataLoader from 'dataloader';

@Injectable({ scope: Scope.REQUEST })
export class AgentLoader {
  private readonly batchAgents: DataLoader<string, Agent | null>;
  private readonly batchAgentsByUser: DataLoader<string, Agent[]>;

  constructor(
    private readonly db: DatabaseService,
    @Inject(REQUEST) private readonly request: any
  ) {
    const userId = this.request?.user?.id || this.request?.req?.user?.id;

    this.batchAgents = new DataLoader<string, Agent | null>(async (agentIds: readonly string[]) => {
      // Load each agent individually since there's no batch method
      const results = await Promise.all(agentIds.map((id) => this.db.agents.findById(id, userId)));
      return results;
    });

    this.batchAgentsByUser = new DataLoader<string, Agent[]>(async (userIds: readonly string[]) => {
      // For each userId, fetch agents owned by that user
      const agentsByUser = new Map<string, Agent[]>();

      for (const userId of userIds) {
        const agents = await this.db.agents.findByUserId(userId);
        agentsByUser.set(userId, agents);
      }

      return userIds.map((userId) => agentsByUser.get(userId) || []);
    });
  }

  async load(agentId: string): Promise<Agent | null> {
    return this.batchAgents.load(agentId);
  }

  async loadMany(agentIds: string[]): Promise<(Agent | null)[]> {
    return this.batchAgents.loadMany(agentIds) as Promise<(Agent | null)[]>;
  }

  async loadByUserId(userId: string): Promise<Agent[]> {
    return this.batchAgentsByUser.load(userId);
  }
}
