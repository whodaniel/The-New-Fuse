import { db } from './db-client.js';
import { logger } from './logger.js';
import crypto from 'crypto';

/**
 * AgentManager handles database operations for agent entities
 */
export class AgentManager {
  /**
   * Register a new agent
   * @param name Agent name
   * @param description Agent description
   * @param type Agent type (e.g., "assistant", "copilot")
   * @param capabilities Array of agent capabilities
   * @returns The created agent details with API key
   */
  async registerAgent(
    name: string,
    description: string,
    type: string,
    capabilities: string[] = []
  ): Promise<any> {
    try {
      // Generate a secure API key
      const apiKey = this.generateApiKey();
      
      // Create the agent record
      const agent = await db.agent.create({
        data: {
          name,
          description,
          type,
          capabilities,
          apiKey,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      });
      
      logger.info(`Registered new agent: ${name} (${agent.id})`);
      
      // Return agent details including the API key
      return {
        id: agent.id,
        name: agent.name,
        type: agent.type,
        apiKey,
        capabilities: agent.capabilities
      };
    } catch (error) {
      logger.error(`Error registering agent: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Verify an agent's API key
   * @param apiKey The API key to verify
   * @returns The agent ID if valid, null otherwise
   */
  async verifyApiKey(apiKey: string): Promise<string | null> {
    try {
      const agent = await db.agent.findUnique({
        where: { apiKey }
      });
      
      if (!agent || !agent.isActive) {
        return null;
      }
      
      return agent.id;
    } catch (error) {
      logger.error(`Error verifying API key: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Get agent details by ID
   * @param agentId The agent ID
   * @returns Agent details
   */
  async getAgentById(agentId: string): Promise<any> {
    try {
      const agent = await db.agent.findUnique({
        where: { id: agentId }
      });
      
      if (!agent) {
        throw new Error(`Agent with ID ${agentId} not found`);
      }
      
      // Return agent details excluding API key
      return {
        id: agent.id,
        name: agent.name,
        description: agent.description,
        type: agent.type,
        capabilities: agent.capabilities,
        createdAt: agent.createdAt,
        isActive: agent.isActive
      };
    } catch (error) {
      logger.error(`Error getting agent: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Update agent capabilities
   * @param agentId The agent ID
   * @param capabilities New capabilities array
   */
  async updateCapabilities(agentId: string, capabilities: string[]): Promise<void> {
    try {
      await db.agent.update({
        where: { id: agentId },
        data: { capabilities, updatedAt: new Date() }
      });
      
      logger.info(`Updated capabilities for agent ${agentId}`);
    } catch (error) {
      logger.error(`Error updating agent capabilities: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Set agent state data
   * @param agentId The agent ID
   * @param key State key
   * @param value State value
   */
  async setState(agentId: string, key: string, value: any): Promise<void> {
    try {
      const existing = await db.agentState.findUnique({ where: { agentId, key } });\n\n      if (existing) {\n        await db.agentState.update({\n          where: { id: existing.id },\n          data: { value, updatedAt: new Date() }\n        });\n      } else {\n        await db.agentState.create({\n          data: {\n            agentId,\n            key,\n            value,\n            createdAt: new Date(),\n            updatedAt: new Date()\n          }\n        });\n      }
      
      logger.debug(`Set state for agent ${agentId}: ${key}`);
    } catch (error) {
      logger.error(`Error setting agent state: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get agent state data
   * @param agentId The agent ID
   * @param key State key
   * @returns State value or null if not found
   */
  async getState(agentId: string, key: string): Promise<any> {
    try {
      const state = await db.agentState.findUnique({ where: { agentId, key } });
      
      return state ? state.value : null;
    } catch (error) {
      logger.error(`Error getting agent state: ${error.message}`);
      return null;
    }
  }
  
  /**
   * List all agents, optionally filtering by type or capability
   * @param type Optional type to filter by
   * @param capability Optional capability to filter by
   * @returns Array of agents
   */
  async listAgents(type?: string, capability?: string): Promise<any[]> {
    try {
      const filter: any = { isActive: true };
      
      if (type) {
        filter.type = type;
      }
      
      if (capability) {
        filter.capabilities = {
          has: capability
        };
      }
      
      const agents = await db.agent.findMany({
        where: filter,
        orderBy: { createdAt: 'desc' }
      });
      
      logger.info(`Retrieved ${agents.length} agents`);
      return agents;
    } catch (error) {
      logger.error(`Error listing agents: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Deactivate an agent
   * @param agentId The agent ID to deactivate
   */
  async deactivateAgent(agentId: string): Promise<void> {
    try {
      await db.agent.update({
        where: { id: agentId },
        data: { isActive: false, updatedAt: new Date() }
      });
      
      logger.info(`Deactivated agent ${agentId}`);
    } catch (error) {
      logger.error(`Error deactivating agent: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Generate a secure API key
   * @returns A random API key
   */
  private generateApiKey(): string {
    const buffer = crypto.randomBytes(32);
    return buffer.toString('hex');
  }
}
