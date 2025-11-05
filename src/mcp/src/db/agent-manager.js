"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentManager = void 0;
const prisma_client_1 = require("./prisma-client");
const logger_1 = require("./logger");
const crypto_1 = __importDefault(require("crypto"));
/**
 * AgentManager handles database operations for agent entities
 */
class AgentManager {
    /**
     * Register a new agent
     * @param name Agent name
     * @param description Agent description
     * @param type Agent type (e.g., "assistant", "copilot")
     * @param capabilities Array of agent capabilities
     * @returns The created agent details with API key
     */
    async registerAgent(name, description, type, capabilities = []) {
        try {
            // Generate a secure API key
            const apiKey = this.generateApiKey();
            // Create the agent record
            const agent = await prisma_client_1.prisma.agent.create({
                data: {
                    name,
                    description,
                    type,
                    capabilities,
                    apiKey,
                }
            });
            logger_1.logger.info(`Registered new agent: ${name} (${agent.id})`);
            // Return agent details including the API key
            return {
                id: agent.id,
                name: agent.name,
                type: agent.type,
                apiKey,
                capabilities: agent.capabilities
            };
        }
        catch (error) {
            logger_1.logger.error(`Error registering agent: ${error.message}`);
            throw error;
        }
    }
    /**
     * Verify an agent's API key
     * @param apiKey The API key to verify
     * @returns The agent ID if valid, null otherwise
     */
    async verifyApiKey(apiKey) {
        try {
            const agent = await prisma_client_1.prisma.agent.findUnique({
                where: { apiKey }
            });
            if (!agent || !agent.isActive) {
                return null;
            }
            return agent.id;
        }
        catch (error) {
            logger_1.logger.error(`Error verifying API key: ${error.message}`);
            return null;
        }
    }
    /**
     * Get agent details by ID
     * @param agentId The agent ID
     * @returns Agent details
     */
    async getAgentById(agentId) {
        try {
            const agent = await prisma_client_1.prisma.agent.findUnique({
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
        }
        catch (error) {
            logger_1.logger.error(`Error getting agent: ${error.message}`);
            throw error;
        }
    }
    /**
     * Update agent capabilities
     * @param agentId The agent ID
     * @param capabilities New capabilities array
     */
    async updateCapabilities(agentId, capabilities) {
        try {
            await prisma_client_1.prisma.agent.update({
                where: { id: agentId },
                data: { capabilities }
            });
            logger_1.logger.info(`Updated capabilities for agent ${agentId}`);
        }
        catch (error) {
            logger_1.logger.error(`Error updating agent capabilities: ${error.message}`);
            throw error;
        }
    }
    /**
     * Set agent state data
     * @param agentId The agent ID
     * @param key State key
     * @param value State value
     */
    async setState(agentId, key, value) {
        try {
            await prisma_client_1.prisma.agentState.upsert({
                where: {
                    agentId_key: {
                        agentId,
                        key
                    }
                },
                create: {
                    agentId,
                    key,
                    value
                },
                update: {
                    value,
                    updatedAt: new Date()
                }
            });
            logger_1.logger.debug(`Set state for agent ${agentId}: ${key}`);
        }
        catch (error) {
            logger_1.logger.error(`Error setting agent state: ${error.message}`);
            throw error;
        }
    }
    /**
     * Get agent state data
     * @param agentId The agent ID
     * @param key State key
     * @returns State value or null if not found
     */
    async getState(agentId, key) {
        try {
            const state = await prisma_client_1.prisma.agentState.findUnique({
                where: {
                    agentId_key: {
                        agentId,
                        key
                    }
                }
            });
            return state ? state.value : null;
        }
        catch (error) {
            logger_1.logger.error(`Error getting agent state: ${error.message}`);
            return null;
        }
    }
    /**
     * List all agents, optionally filtering by type or capability
     * @param type Optional type to filter by
     * @param capability Optional capability to filter by
     * @returns Array of agents
     */
    async listAgents(type, capability) {
        try {
            const filter = { isActive: true };
            if (type) {
                filter.type = type;
            }
            if (capability) {
                filter.capabilities = {
                    has: capability
                };
            }
            const agents = await prisma_client_1.prisma.agent.findMany({
                where: filter,
                select: {
                    id: true,
                    name: true,
                    description: true,
                    type: true,
                    capabilities: true,
                    createdAt: true
                },
                orderBy: { createdAt: 'desc' }
            });
            logger_1.logger.info(`Retrieved ${agents.length} agents`);
            return agents;
        }
        catch (error) {
            logger_1.logger.error(`Error listing agents: ${error.message}`);
            throw error;
        }
    }
    /**
     * Deactivate an agent
     * @param agentId The agent ID to deactivate
     */
    async deactivateAgent(agentId) {
        try {
            await prisma_client_1.prisma.agent.update({
                where: { id: agentId },
                data: { isActive: false }
            });
            logger_1.logger.info(`Deactivated agent ${agentId}`);
        }
        catch (error) {
            logger_1.logger.error(`Error deactivating agent: ${error.message}`);
            throw error;
        }
    }
    /**
     * Generate a secure API key
     * @returns A random API key
     */
    generateApiKey() {
        const buffer = crypto_1.default.randomBytes(32);
        return buffer.toString('hex');
    }
}
exports.AgentManager = AgentManager;
//# sourceMappingURL=agent-manager.js.map