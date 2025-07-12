/**
 * Agent Service Implementation
 * Follows standardized service pattern
 */

import { Injectable } from '@nestjs/common';
import { BaseService } from './base.service';
import { AgentRepository, Agent } from '../repositories/agent.repository';
import { LocalAIDetectionService } from '@the-new-fuse/core/src/services/LocalAIDetectionService';
import { AgentCapability } from '@the-new-fuse/types/src/core/enums';

@Injectable()
export class AgentService extends BaseService<Agent> {
  protected readonly repository: AgentRepository;

  constructor(
    repository: AgentRepository,
    private localAIDetection: LocalAIDetectionService
  ) {
    super('AgentService');
    this.repository = repository;
  }

  /**
   * Get all agents for a user
   */
  async getAgents(userId: string): Promise<Agent[]> {
    return this.repository.findAll({ userId });
  }

  /**
   * Get all agents (for admin/monitoring use)
   */
  async findAll(): Promise<Agent[]> {
    return this.repository.findAll({});
  }

  /**
   * Get agent by ID for a specific user
   */
  async getAgentById(id: string, userId: string): Promise<Agent | null> {
    return this.repository.findOne({ id, userId });
  }

  /**
   * Create a new agent for a user
   */
  async createAgent(data: Partial<Agent>, userId: string): Promise<Agent> {
    return this.create({ ...data, userId });
  }

  /**
   * Update an agent for a user
   */
  async updateAgent(id: string, data: Partial<Agent>, userId: string): Promise<Agent> {
    // First verify the agent belongs to this user
    const agent = await this.repository.findOne({ id, userId });
    if (!agent) {
      throw new Error(`Agent with ID ${id} not found for this user`);
    }
    
    return this.update(id, data);
  }

  /**
   * Delete an agent for a user
   */
  async deleteAgent(id: string, userId: string): Promise<boolean> {
    // First verify the agent belongs to this user
    const agent = await this.repository.findOne({ id, userId });
    if (!agent) {
      throw new Error(`Agent with ID ${id} not found for this user`);
    }
    
    return this.delete(id);
  }

  /**
   * Get agents by capability for a user
   */
  async getAgentsByCapability(capability: AgentCapability, userId: string): Promise<Agent[]> {
    const agents = await this.getAgents(userId);
    
    // Filter agents by capability
    return agents.filter(agent => {
      if (!agent.capabilities) return false;
      
      // Check if the agent has the capability
      return agent.capabilities.includes(capability);
    });
  }

  /**
   * Detect and register local AI providers as agents
   */
  async detectAndRegisterLocalAIs(userId: string): Promise<Agent[]> {
    this.logger.log(`🔍 Detecting local AIs for user: ${userId}`);
    
    const detectedAgents = await this.localAIDetection.detectAndCreateAgents(userId);
    const registeredAgents: Agent[] = [];

    for (const agentDto of detectedAgents) {
      try {
        // Check if agent with this provider already exists
        const existingAgents = await this.getAgents(userId);
        const exists = existingAgents.some(agent => 
          agent.configuration?.provider === agentDto.provider
        );

        if (!exists) {
          const agentData = {
          ...agentDto,
          capabilities: Array.isArray(agentDto.capabilities) 
            ? agentDto.capabilities.filter((cap): cap is AgentCapability => 
                Object.values(AgentCapability).includes(cap as AgentCapability))
            : [],
          metadata: agentDto.metadata && typeof agentDto.metadata === 'object' 
            ? agentDto.metadata as Record<string, unknown>
            : {},
          configuration: agentDto.configuration && typeof agentDto.configuration === 'object'
            ? agentDto.configuration as Record<string, unknown>
            : {}
        };
        const agent = await this.createAgent(agentData, userId);
          registeredAgents.push(agent);
          this.logger.log(`✅ Registered local AI agent: ${agentDto.name}`);
        } else {
          this.logger.debug(`⚠️ Local AI agent already exists: ${agentDto.name}`);
        }
      } catch (error) {
        this.logger.error(`❌ Failed to register ${agentDto.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return registeredAgents;
  }

  /**
   * Get all local AI agents for a user
   */
  async getLocalAIAgents(userId: string): Promise<Agent[]> {
    const agents = await this.getAgents(userId);
    return agents.filter(agent => 
      agent.configuration?.localAI === true
    );
  }

  /**
   * Refresh local AI detection and update agents
   */
  async refreshLocalAIAgents(userId: string): Promise<Agent[]> {
    this.logger.log(`🔄 Refreshing local AI agents for user: ${userId}`);
    
    // Get currently available local AIs
    const availableProviders = await this.localAIDetection.detectAvailableAIs();
    const availableProviderNames = availableProviders.map((p: any) => p.name);
    
    // Get existing local AI agents
    const existingAgents = await this.getLocalAIAgents(userId);
    
    // Remove agents for providers that are no longer available
    for (const agent of existingAgents) {
      if (!availableProviderNames.includes(agent.configuration?.provider)) {
        await this.deleteAgent(agent.id, userId);
        this.logger.log(`🗑️ Removed unavailable AI agent: ${agent.name}`);
      }
    }
    
    // Add new agents for newly detected providers
    return this.detectAndRegisterLocalAIs(userId);
  }

  /**
   * Create default system agents for all detected local AIs
   */
  async createSystemLocalAIAgents(): Promise<Agent[]> {
    this.logger.log('🚀 Creating default system agents for local AIs...');
    
    const systemAgents = await this.localAIDetection.createDefaultSystemAgents();
    const registeredAgents: Agent[] = [];

    for (const agentDto of systemAgents) {
      try {
        const agentData = {
          ...agentDto,
          capabilities: Array.isArray(agentDto.capabilities) 
            ? agentDto.capabilities.filter((cap): cap is AgentCapability => 
                Object.values(AgentCapability).includes(cap as AgentCapability))
            : [],
          metadata: agentDto.metadata && typeof agentDto.metadata === 'object' 
            ? agentDto.metadata as Record<string, unknown>
            : {},
          configuration: agentDto.configuration && typeof agentDto.configuration === 'object'
            ? agentDto.configuration as Record<string, unknown>
            : {}
        };
        const agent = await this.createAgent(agentData, 'system');
        registeredAgents.push(agent);
        this.logger.log(`✅ Created system agent: ${agentDto.name}`);
      } catch (error) {
        this.logger.error(`❌ Failed to create system agent ${agentDto.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return registeredAgents;
  }
}