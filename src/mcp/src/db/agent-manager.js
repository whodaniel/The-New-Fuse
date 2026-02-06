"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentManager = void 0;
const db_client_1 = require("./db-client");
const logger_1 = require("./logger");
const crypto_1 = require("crypto");

/**
 * AgentManager handles database operations for agent entities
 */
class AgentManager {
  async registerAgent(name, description, type, capabilities = []) {
    try {
      const apiKey = this.generateApiKey();
      const agent = await db_client_1.db.agent.create({
        data: {
          name,
          description,
          type,
          capabilities,
          apiKey,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      logger_1.logger.info(`Registered new agent: ${name} (${agent.id})`);
      return {
        id: agent.id,
        name: agent.name,
        type: agent.type,
        apiKey,
        capabilities: agent.capabilities,
      };
    } catch (error) {
      logger_1.logger.error(`Error registering agent: ${error.message}`);
      throw error;
    }
  }

  async verifyApiKey(apiKey) {
    try {
      const agent = await db_client_1.db.agent.findUnique({ where: { apiKey } });
      if (!agent || !agent.isActive) {
        return null;
      }
      return agent.id;
    } catch (error) {
      logger_1.logger.error(`Error verifying API key: ${error.message}`);
      return null;
    }
  }

  async getAgentById(agentId) {
    try {
      const agent = await db_client_1.db.agent.findUnique({ where: { id: agentId } });
      if (!agent) {
        throw new Error(`Agent with ID ${agentId} not found`);
      }
      return {
        id: agent.id,
        name: agent.name,
        description: agent.description,
        type: agent.type,
        capabilities: agent.capabilities,
        createdAt: agent.createdAt,
        isActive: agent.isActive,
      };
    } catch (error) {
      logger_1.logger.error(`Error getting agent: ${error.message}`);
      throw error;
    }
  }

  async updateCapabilities(agentId, capabilities) {
    try {
      await db_client_1.db.agent.update({
        where: { id: agentId },
        data: { capabilities, updatedAt: new Date() },
      });
      logger_1.logger.info(`Updated capabilities for agent ${agentId}`);
    } catch (error) {
      logger_1.logger.error(`Error updating agent capabilities: ${error.message}`);
      throw error;
    }
  }

  async setState(agentId, key, value) {
    try {
      const existing = await db_client_1.db.agentState.findUnique({ where: { agentId, key } });
      if (existing) {
        await db_client_1.db.agentState.update({
          where: { id: existing.id },
          data: { value, updatedAt: new Date() },
        });
      } else {
        await db_client_1.db.agentState.create({
          data: {
            agentId,
            key,
            value,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }
      logger_1.logger.debug(`Set state for agent ${agentId}: ${key}`);
    } catch (error) {
      logger_1.logger.error(`Error setting agent state: ${error.message}`);
      throw error;
    }
  }

  async getState(agentId, key) {
    try {
      const state = await db_client_1.db.agentState.findUnique({ where: { agentId, key } });
      return state ? state.value : null;
    } catch (error) {
      logger_1.logger.error(`Error getting agent state: ${error.message}`);
      return null;
    }
  }

  async listAgents(type, capability) {
    try {
      const filter = { isActive: true };
      if (type) {
        filter.type = type;
      }
      if (capability) {
        filter.capabilities = capability;
      }
      const agents = await db_client_1.db.agent.findMany({
        where: filter,
        orderBy: { createdAt: 'desc' },
      });
      logger_1.logger.info(`Retrieved ${agents.length} agents`);
      return agents;
    } catch (error) {
      logger_1.logger.error(`Error listing agents: ${error.message}`);
      throw error;
    }
  }

  async deactivateAgent(agentId) {
    try {
      await db_client_1.db.agent.update({
        where: { id: agentId },
        data: { isActive: false, updatedAt: new Date() },
      });
      logger_1.logger.info(`Deactivated agent ${agentId}`);
    } catch (error) {
      logger_1.logger.error(`Error deactivating agent: ${error.message}`);
      throw error;
    }
  }

  generateApiKey() {
    const buffer = (0, crypto_1.randomBytes)(32);
    return buffer.toString('hex');
  }
}
exports.AgentManager = AgentManager;
