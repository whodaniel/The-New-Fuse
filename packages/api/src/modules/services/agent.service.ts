/**
 * Agent service implementation
 * Follows the standardized service pattern
 */

import { Injectable, Logger } from '@nestjs/common';
import { BaseService } from './base.service.js';
import { AgentRepository } from '@the-new-fuse/database/src/repositories/agent.repository';
import { 
  Agent, 
  CreateAgentDto, 
  UpdateAgentDto, 
  AgentStatus, 
  AgentCapability 
} from '@the-new-fuse/types';
import { PrismaService } from '../../services/prisma.service.js';
import { v4 as uuidv4 } from 'uuid';
import { toError } from '../../utils/error.js'; // Import the helper

@Injectable()
export class AgentService extends BaseService<Agent> {
  // Change logger visibility to protected
  protected readonly logger = new Logger(AgentService.name);
  private readonly repository: AgentRepository;

  constructor(private readonly prisma: PrismaService) {
    // Initialize the repository with the prisma client
    const repository = new AgentRepository(prisma);
    super(repository, 'AgentService');
    this.repository = repository;
  }

  /**
   * Create a new agent
   * @param data Agent creation data
   * @param userId User ID
   * @returns Created agent
   */
  async createAgent(data: CreateAgentDto, userId: string): Promise<Agent> {
    try {
      // Check for existing agent with same name
      const existingAgent = await this.repository.findOne({ 
        name: data.name, 
        userId 
      });

      if (existingAgent) {
        throw new Error(`Agent with name "${data.name}" already exists`);
      }

      // Create the agent
      const agent = await this.repository.create({
        id: uuidv4(),
        name: data.name,
        description: data.description,
        type: data.type,
        status: AgentStatus.INACTIVE,
        role: data.role,
        capabilities: data.capabilities || [],
        metadata: {
          systemPrompt: data.systemPrompt,
          configuration: data.configuration
        },
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      } as any);

      this.logger.log(`Created agent: ${agent.id} (${agent.name})`);
      
      // Make sure metadata is included in the returned agent
      return this.addMetadataIfMissing(agent);
    } catch (error: unknown) { // Change to unknown
      const err = toError(error); // Use helper
      this.logger.error(`Error creating agent: ${err.message}`, err.stack); // Use err
      throw new Error(`Could not create agent: ${err.message}`);
    }
  }

  /**
   * Get all agents for a user
   * @param userId User ID
   * @returns Array of agents
   */
  async getAgents(userId: string): Promise<Agent[]> {
    try {
      const agents = await this.repository.findAll({ userId });
      // Make sure metadata is included in all returned agents
      return agents.map(agent => this.addMetadataIfMissing(agent));
    } catch (error: unknown) { // Change to unknown
      const err = toError(error); // Use helper
      this.logger.error(`Error getting agents: ${err.message}`, err.stack); // Use err
      throw new Error(`Could not retrieve agents: ${err.message}`);
    }
  }

  /**
   * Get agent by ID
   * @param id Agent ID
   * @param userId User ID
   * @returns Agent or null if not found
   */
  async getAgentById(id: string, userId: string): Promise<Agent> {
    try {
      const agent = await this.repository.findOne({ id, userId });
      if (!agent) {
        throw new Error(`Agent with ID ${id} not found`);
      }
      return this.addMetadataIfMissing(agent);
    } catch (error: unknown) { // Change to unknown
      const err = toError(error); // Use helper
      this.logger.error(`Error getting agent by ID: ${err.message}`, err.stack); // Use err
      throw new Error(`Could not retrieve agent ${id}: ${err.message}`);
    }
  }

  /**
   * Update an agent
   * @param id Agent ID
   * @param updates Agent update data
   * @param userId User ID
   * @returns Updated agent
   */
  async updateAgent(id: string, updates: UpdateAgentDto, userId: string): Promise<Agent> {
    try {
      // Check if agent exists and belongs to user
      await this.getAgentById(id, userId);

      // Update the agent
      const agent = await this.repository.update(id, {
        ...(updates.name && { name: updates.name }),
        ...(updates.description && { description: updates.description }),
        ...(updates.type && { type: updates.type }),
        ...(updates.role && { role: updates.role }),
        ...(updates.capabilities && { capabilities: updates.capabilities }),
        ...(updates.systemPrompt || updates.configuration ? {
          metadata: {
            ...(updates.systemPrompt && { systemPrompt: updates.systemPrompt }),
            ...(updates.configuration && { configuration: updates.configuration })
          }
        } : {}),
        updatedAt: new Date()
      } as any);

      this.logger.log(`Updated agent: ${id}`);
      return this.addMetadataIfMissing(agent);
    } catch (error: unknown) { // Change to unknown
      const err = toError(error); // Use helper
      this.logger.error(`Error updating agent: ${err.message}`, err.stack); // Use err
      throw new Error(`Could not update agent ${id}: ${err.message}`);
    }
  }

  /**
   * Update agent status
   * @param id Agent ID
   * @param status New status
   * @param userId User ID
   * @returns Updated agent
   */
  async updateAgentStatus(id: string, status: AgentStatus, userId: string): Promise<Agent> {
    try {
      // Check if agent exists and belongs to user
      await this.getAgentById(id, userId);

      // Update the agent status
      const agent = await this.repository.update(id, {
        status,
        updatedAt: new Date()
      } as any);

      this.logger.log(`Updated agent status: ${id} -> ${status}`);
      return this.addMetadataIfMissing(agent);
    } catch (error: unknown) { // Change to unknown
      const err = toError(error); // Use helper
      this.logger.error(`Error updating agent status: ${err.message}`, err.stack); // Use err
      throw new Error(`Could not update status for agent ${id}: ${err.message}`);
    }
  }

  /**
   * Delete an agent
   * @param id Agent ID
   * @param userId User ID
   * @returns boolean indicating success
   */
  async deleteAgent(id: string, userId: string): Promise<boolean> { // Change return type to boolean
    try {
      // Check if agent exists and belongs to user
      await this.getAgentById(id, userId);

      // Soft delete the agent
      await this.repository.delete(id);

      this.logger.log(`Deleted agent: ${id}`);
      return true; // Return true on success
    } catch (error: unknown) { // Change to unknown
      const err = toError(error); // Use helper
      this.logger.error(`Error deleting agent: ${err.message}`, err.stack); // Use err
      // Rethrow specific errors or return false
      if (err.message?.includes('not found')) {
        // Or handle as needed, maybe return false if not found is not an error condition for deletion
         throw err; 
      }
      // For other errors, return false
      return false; 
      // Or rethrow if deletion failure should halt execution
      // throw new Error(`Could not delete agent ${id}: ${err.message}`);
    }
  }

  /**
   * Get agents by capability
   * @param capability Agent capability
   * @param userId User ID
   * @returns Array of agents
   */
  async getAgentsByCapability(capability: string, userId: string): Promise<Agent[]> {
    try {
      // This is a more complex query that requires custom implementation
      const agents = await this.getAgents(userId);
      
      // Filter agents by capability
      return agents.filter(agent => {
        if (!agent.capabilities) return false;
        
        // Handle both string[] and AgentCapability[]
        return agent.capabilities.some((cap: string | AgentCapability) => {
          if (typeof cap === 'string') {
            return cap === capability;
          } else {
            return cap === capability;
          }
        });
      });
    } catch (error: unknown) { // Change to unknown
      const err = toError(error); // Use helper
      this.logger.error(`Error getting agents by capability: ${err.message}`, err.stack); // Use err
      throw new Error(`Could not retrieve agents by capability ${capability}: ${err.message}`);
    }
  }

  /**
   * Get active agents
   * @param userId User ID
   * @returns Array of active agents
   */
  async getActiveAgents(userId: string): Promise<Agent[]> {
    try {
      const agents = await this.repository.findAll({ 
        userId, 
        status: AgentStatus.ACTIVE 
      });
      return agents.map(agent => this.addMetadataIfMissing(agent));
    } catch (error: unknown) { // Change to unknown
      const err = toError(error); // Use helper
      this.logger.error(`Error getting active agents: ${err.message}`, err.stack); // Use err
      throw new Error(`Could not retrieve active agents: ${err.message}`);
    }
  }

  /**
   * Helper method to ensure metadata is present on agent objects
   * Adds empty metadata if missing
   */
  private addMetadataIfMissing(agent: any): Agent {
    if (!agent) return agent;
    
    if (!agent.metadata) {
      return {
        ...agent,
        metadata: {} as Record<string, unknown>
      };
    }
    
    return agent as Agent;
  }
}
