import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MetricsService } from './MetricsService.ts';
import { LoggingService } from './LoggingService.ts';

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
    private readonly prisma: PrismaService,
    private readonly metrics: MetricsService
  ) {
    this.logger = new LoggingService('AgentMetadataManager');
  }

  async registerAgent(data: Omit<AgentMetadata, 'id'>): Promise<AgentMetadata> {
    try {
      const agent = await this.prisma.agentMetadata.create({
        data: {
          name: data.name,
          version: data.version,
          capabilities: data.capabilities,
          status: data.status,
          lastSeen: new Date(),
          config: data.config || {},
        }
      });

      this.metrics.createMetric({
        name: 'agent_registered',
        value: 1,
        labels: { name: agent.name }
      });

      return agent;
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
      const agent = await this.prisma.agentMetadata.update({
        where: { id },
        data: {
          status,
          lastSeen: new Date(),
          ...(error ? { error } : {})
        }
      });

      this.metrics.createMetric({
        name: 'agent_status_updated',
        value: 1,
        labels: { name: agent.name, status }
      });

      return agent;
    } catch (error) {
      this.logger.error('Failed to update agent status', { id, status, error });
      throw error;
    }
  }

  async getAgent(id: string): Promise<AgentMetadata | null> {
    try {
      return await this.prisma.agentMetadata.findUnique({
        where: { id }
      });
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
      return await this.prisma.agentMetadata.findMany({
        where: {
          ...(status ? { status } : {}),
          ...(capability ? { capabilities: { has: capability } } : {})
        },
        orderBy: {
          lastSeen: 'desc'
        }
      });
    } catch (error) {
      this.logger.error('Failed to list agents', { status, capability, error });
      throw error;
    }
  }

  async deleteAgent(id: string): Promise<void> {
    try {
      await this.prisma.agentMetadata.delete({
        where: { id }
      });

      this.metrics.createMetric({
        name: 'agent_deleted',
        value: 1
      });
    } catch (error) {
      this.logger.error('Failed to delete agent', { id, error });
      throw error;
    }
  }

  async updateAgentConfig(id: string, config: Record<string, unknown>): Promise<AgentMetadata> {
    try {
      const agent = await this.prisma.agentMetadata.update({
        where: { id },
        data: {
          config,
          lastSeen: new Date()
        }
      });

      this.metrics.createMetric({
        name: 'agent_config_updated',
        value: 1,
        labels: { name: agent.name }
      });

      return agent;
    } catch (error) {
      this.logger.error('Failed to update agent config', { id, config, error });
      throw error;
    }
  }
}