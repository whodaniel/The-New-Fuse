import { Injectable } from '@nestjs/common';
import { DrizzleAgentRepository } from '../../packages/database/src/drizzle/repositories/index.js';
import { LoggingService } from './LoggingService.ts';
import { MetricsService } from './MetricsService.ts';

export interface AgentMetadata {
  id: string;
  name: string;
  version: string;
  capabilities: string[];
  status: 'active' | 'inactive' | 'error';
  lastSeen?: Date;
  config?: Record<string, unknown>;
  error?: string;
}

@Injectable()
export class AgentMetadataManager {
  private readonly logger: LoggingService;

  constructor(
    private readonly agentRepository: DrizzleAgentRepository,
    private readonly metrics: MetricsService
  ) {
    this.logger = new LoggingService('AgentMetadataManager');
  }

  async registerAgent(data: Omit<AgentMetadata, 'id'>): Promise<AgentMetadata> {
    try {
      // Note: Agent metadata operations would need a specific Drizzle repository
      // This is a placeholder using the DrizzleAgentRepository for basic agent creation
      const agent = await this.agentRepository.create({
        name: data.name,
        capabilities: data.capabilities,
        status: data.status as any,
        config: data.config as any,
        // version: data.version // DrizzleAgentRepository might not have version
      });

      this.metrics.createMetric({
        name: 'agent_registered',
        value: 1,
        labels: { name: agent.name },
      });

      return { ...agent, version: data.version } as AgentMetadata;
    } catch (error) {
      this.logger.error('Failed to register agent', { data, error });
      throw error;
    }
  }

  async updateAgentStatus(
    id: string,
    status: AgentMetadata['status'],
    error?: string
  ): Promise<AgentMetadata> {
    try {
      const updateData: any = {
        status: status as any,
      };
      if (error) {
        updateData.error = error;
      }

      const agent = await this.agentRepository.update(id, updateData);

      this.metrics.createMetric({
        name: 'agent_status_updated',
        value: 1,
        labels: { name: agent.name, status },
      });

      return { ...agent, version: '1.0.0' } as AgentMetadata;
    } catch (error) {
      this.logger.error('Failed to update agent status', { id, status, error });
      throw error;
    }
  }

  async getAgent(id: string): Promise<AgentMetadata | null> {
    try {
      const agent = await this.agentRepository.findByIdSystem(id);
      return agent
        ? ({
            ...agent,
            version: '1.0.0',
            status: (agent.status || 'inactive') as any,
          } as AgentMetadata)
        : null;
    } catch (error) {
      this.logger.error('Failed to get agent', { id, error });
      throw error;
    }
  }

  async listAgents(
    status?: AgentMetadata['status'],
    capability?: string
  ): Promise<AgentMetadata[]> {
    try {
      const result = await this.agentRepository.findAllSystem();
      // Handle paginated result
      let filteredAgents = result.data || [];

      if (status) {
        filteredAgents = filteredAgents.filter((a) => a.status === status);
      }

      if (capability) {
        filteredAgents = filteredAgents.filter((a) => a.capabilities?.includes(capability));
      }

      return filteredAgents.map((a) => ({
        ...a,
        version: '1.0.0', // Default
        status: (a.status || 'inactive') as 'active' | 'inactive' | 'error',
      })) as AgentMetadata[];
    } catch (error) {
      this.logger.error('Failed to list agents', { status, capability, error });
      throw error;
    }
  }

  async deleteAgent(id: string): Promise<void> {
    try {
      await this.agentRepository.update(id, { deletedAt: new Date() } as any);

      this.metrics.createMetric({
        name: 'agent_deleted',
        value: 1,
      });
    } catch (error) {
      this.logger.error('Failed to delete agent', { id, error });
      throw error;
    }
  }

  async updateAgentConfig(id: string, config: Record<string, unknown>): Promise<AgentMetadata> {
    try {
      const agent = await this.agentRepository.update(id, { config: config as any });

      this.metrics.createMetric({
        name: 'agent_config_updated',
        value: 1,
        labels: { name: agent.name },
      });

      return {
        ...agent,
        version: '1.0.0',
        status: (agent.status || 'inactive') as any,
      } as AgentMetadata;
    } catch (error) {
      this.logger.error('Failed to update agent config', { id, config, error });
      throw error;
    }
  }
}
