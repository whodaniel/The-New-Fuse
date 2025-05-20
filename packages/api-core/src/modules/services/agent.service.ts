/**
 * Agent Service Implementation
 * Follows standardized service pattern
 */

import { Injectable } from '@nestjs/common';
import { BaseService } from './base.service.js';
import { AgentRepository, Agent } from '../repositories/agent.repository.js';

// Define AgentCapability locally until types package issue is resolved
export enum AgentCapability {
  TEXT_GENERATION = 'text-generation',
  CODE_GENERATION = 'code-generation',
  ANALYSIS = 'analysis',
  PLANNING = 'planning',
  SEARCH = 'search',
  KNOWLEDGE_BASE = 'knowledge-base',
  COORDINATION = 'coordination',
  COMMUNICATION = 'communication'
}

@Injectable()
export class AgentService extends BaseService<Agent> {
  protected readonly repository: AgentRepository;

  constructor(repository: AgentRepository) {
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
  async getAgentsByCapability(capability: string | AgentCapability, userId: string): Promise<Agent[]> {
    const agents = await this.getAgents(userId);
    
    // Filter agents by capability
    return agents.filter(agent => {
      if (!agent.capabilities) return false;
      
      // Check if the agent has the capability
      return agent.capabilities.some((cap: string) => {
        if (typeof cap === 'string' && typeof capability === 'string') {
          return cap === capability;
        } else {
          return cap === capability;
        }
      });
    });
  }
}