import { Injectable } from '@nestjs/common';
import { AgentCapability } from '@the-new-fuse/types';
import { AgentRepository } from '../repositories/agent.repository';
import { Agent, AgentStatus } from '../types/agent';
import { toError } from '../utils/error';
import { BaseService } from './base.service';
// Mock LocalAIDetectionService to avoid cross-package import issues
// Mock LocalAIDetectionService to avoid cross-package import issues
export class LocalAIDetectionService {
  async detectAndCreateAgents(_userId: string): Promise<any[]> {
    // Mock implementation
    return [];
  }

  async getAvailableProviders(): Promise<any[]> {
    // Mock implementation
    return [];
  }
}

@Injectable()
export class AgentService extends BaseService<Agent> {
  protected readonly repository: AgentRepository;

  constructor(
    private readonly agentRepository: AgentRepository,
    private readonly localAIDetectionService: LocalAIDetectionService
  ) {
    super('AgentService');
    this.repository = agentRepository;
  }

  /**
   * Handle errors consistently
   */
  private handleError(error: unknown, operation: string): never {
    const err = toError(error);
    this.logger.error(`Error in ${operation}: ${err.message}`, err.stack);
    throw err;
  }

  /**
   * Transform database model to API response
   */
  protected transform(agent: any): Agent {
    return {
      id: agent.id,
      name: agent.name,
      type: agent.type,
      description: agent.description ?? undefined,
      capabilities: agent.capabilities || [],
      status: agent.status || AgentStatus.IDLE,
      provider: agent.provider || 'unknown',
      lastActive: agent.lastActive || agent.createdAt,
      metadata: agent.metadata || {},
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt,
      ...(agent.deletedAt && { deletedAt: agent.deletedAt }),
    };
  }

  /**
   * Get all agents for a user
   */
  async getAgents(userId: string): Promise<Agent[]> {
    try {
      const agents = await this.agentRepository.findAll({ userId });
      return agents.map((agent) => this.transform(agent));
    } catch (error) {
      const err = toError(error);
      return this.handleError(err, 'getAgents');
    }
  }

  /**
   * Get all agents (for admin/monitoring use)
   */
  async findAll(): Promise<Agent[]> {
    try {
      const agents = await this.agentRepository.findAll({});
      return agents.map((agent) => this.transform(agent));
    } catch (error) {
      const err = toError(error);
      return this.handleError(err, 'findAll');
    }
  }

  /**
   * Get agent by ID for a specific user
   */
  async getAgentById(id: string, userId: string): Promise<Agent | null> {
    try {
      const agent = await this.agentRepository.findOne({ id, userId });
      if (!agent) {
        return null;
      }
      return this.transform(agent);
    } catch (error) {
      const err = toError(error);
      return this.handleError(err, `getAgentById(${id})`);
    }
  }

  /**
   * Create a new agent for a user
   */
  async createAgent(data: Partial<Agent>, userId: string): Promise<Agent> {
    try {
      // Convert capabilities from string[] to AgentCapability[] if needed
      const agentData = {
        ...data,
        userId,
        capabilities:
          data.capabilities?.map((cap) =>
            typeof cap === 'string' ? (cap as AgentCapability) : cap
          ) || [],
      };
      const newAgent = await this.agentRepository.create(agentData);
      return this.transform(newAgent);
    } catch (error) {
      const err = toError(error);
      return this.handleError(err, 'createAgent');
    }
  }

  /**
   * Update an agent for a user
   */
  async updateAgent(id: string, data: Partial<Agent>, userId: string): Promise<Agent> {
    try {
      const agent = await this.agentRepository.findOne({ id, userId });
      if (!agent) {
        throw new Error(`Agent with ID ${id} not found for this user`);
      }
      // Convert capabilities from string[] to AgentCapability[] if needed
      const agentData = {
        ...data,
        capabilities: data.capabilities?.map((cap) =>
          typeof cap === 'string' ? (cap as AgentCapability) : cap
        ),
      };
      const updatedAgent = await this.agentRepository.update(id, agentData);
      return this.transform(updatedAgent);
    } catch (error) {
      const err = toError(error);
      return this.handleError(err, `updateAgent(${id})`);
    }
  }

  /**
   * Delete an agent for a user
   */
  async deleteAgent(id: string, userId: string): Promise<boolean> {
    try {
      const agent = await this.agentRepository.findOne({ id, userId });
      if (!agent) {
        throw new Error(`Agent with ID ${id} not found for this user`);
      }
      return this.agentRepository.delete(id);
    } catch (error) {
      const err = toError(error);
      this.handleError(err, `deleteAgent(${id})`);
      return false;
    }
  }

  /**
   * Get agents by capability for a user
   */
  async getAgentsByCapability(capability: AgentCapability, userId: string): Promise<Agent[]> {
    try {
      const agents = await this.getAgents(userId);
      return agents.filter((agent) => {
        if (!agent.capabilities) return false;
        return agent.capabilities.includes(capability);
      });
    } catch (error) {
      const err = toError(error);
      return this.handleError(err, 'getAgentsByCapability');
    }
  }

  /**
   * Detect and register local AI providers as agents
   */
  async detectAndRegisterLocalAIs(userId: string): Promise<Agent[]> {
    this.logger.log(`🔍 Detecting local AIs for user: ${userId}`);

    const detectedAgents = await this.localAIDetectionService.detectAndCreateAgents(userId);
    const registeredAgents: Agent[] = [];

    for (const agentDto of detectedAgents) {
      try {
        const existingAgents = await this.agentRepository.findAll({ userId });
        const exists = existingAgents.some(
          (agent) => agent.configuration?.provider === agentDto.provider
        );

        if (!exists) {
          const agentData = {
            ...agentDto,
            capabilities: Array.isArray(agentDto.capabilities)
              ? agentDto.capabilities.filter((cap: any): cap is AgentCapability =>
                  Object.values(AgentCapability).includes(cap as AgentCapability)
                )
              : [],
            metadata:
              agentDto.metadata && typeof agentDto.metadata === 'object'
                ? (agentDto.metadata as Record<string, unknown>)
                : {},
            configuration:
              agentDto.configuration && typeof agentDto.configuration === 'object'
                ? (agentDto.configuration as Record<string, unknown>)
                : {},
          };
          const agent = await this.createAgent(agentData, userId);
          registeredAgents.push(agent);
          this.logger.log(`✅ Registered local AI agent: ${agentDto.name}`);
        } else {
          this.logger.debug(`⚠️ Local AI agent already exists: ${agentDto.name}`);
        }
      } catch (error) {
        this.logger.error(
          `❌ Failed to register ${agentDto.name}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    return registeredAgents;
  }

  /**
   * Get all local AI agents for a user
   */
  async getLocalAIAgents(userId: string): Promise<Agent[]> {
    try {
      const agents = await this.agentRepository.findAll({ userId });
      return agents
        .filter((agent) => agent.configuration?.localAI === true)
        .map((agent) => this.transform(agent));
    } catch (error) {
      const err = toError(error);
      return this.handleError(err, 'getLocalAIAgents');
    }
  }

  /**
   * Refresh local AI detection and update agents
   */
  async refreshLocalAIAgents(userId: string): Promise<Agent[]> {
    this.logger.log(`🔄 Refreshing local AI agents for user: ${userId}`);

    try {
      const availableProviders = await this.localAIDetectionService.getAvailableProviders();
      const availableProviderNames = availableProviders.map((p: any) => p.name);

      const existingAgents = await this.agentRepository.findAll({ userId });
      const localAIAgents = existingAgents.filter((agent) => agent.configuration?.localAI === true);

      for (const agent of localAIAgents) {
        if (!availableProviderNames.includes(agent.configuration?.provider)) {
          await this.deleteAgent(agent.id, userId);
          this.logger.log(`🗑️ Removed unavailable AI agent: ${agent.name}`);
        }
      }

      return this.detectAndRegisterLocalAIs(userId);
    } catch (error) {
      const err = toError(error);
      return this.handleError(err, 'refreshLocalAIAgents');
    }
  }

  /**
   * Create default system agents for all detected local AIs
   */
  async createSystemLocalAIAgents(): Promise<Agent[]> {
    this.logger.log('🚀 Creating default system agents for local AIs...');

    try {
      const systemAgents = await this.localAIDetectionService.detectAndCreateAgents('system');
      const registeredAgents: Agent[] = [];

      for (const agentDto of systemAgents) {
        const agentData = {
          ...agentDto,
          capabilities: Array.isArray(agentDto.capabilities)
            ? agentDto.capabilities.filter((cap: any): cap is AgentCapability =>
                Object.values(AgentCapability).includes(cap as AgentCapability)
              )
            : [],
          metadata:
            agentDto.metadata && typeof agentDto.metadata === 'object'
              ? (agentDto.metadata as Record<string, unknown>)
              : {},
          configuration:
            agentDto.configuration && typeof agentDto.configuration === 'object'
              ? (agentDto.configuration as Record<string, unknown>)
              : {},
        };
        const agent = await this.createAgent(agentData, 'system');
        registeredAgents.push(agent);
        this.logger.log(`✅ Created system agent: ${agentDto.name}`);
      }

      return registeredAgents;
    } catch (error) {
      const err = toError(error);
      return this.handleError(err, 'createSystemLocalAIAgents');
    }
  }
}
