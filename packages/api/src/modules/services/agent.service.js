/**
 * Agent service implementation
 * Follows the standardized service pattern
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AgentService_1;
var _a;
import { Injectable, Logger } from '@nestjs/common';
import { BaseService } from './base.service';
import { AgentRepository } from '../repositories/agent.repository';
import { Agent as AppAgent, AgentStatus, AgentCapability } from '@the-new-fuse/types';
import { PrismaService } from '../prisma/prisma.service';
import { toError } from '../../utils/error'; // Import the helper
let AgentService = AgentService_1 = class AgentService extends BaseService {
    prisma;
    // Change logger visibility to protected
    logger = new Logger(AgentService_1.name);
    repository;
    constructor(prisma) {
        // Initialize the repository with the prisma client
        const repository = new AgentRepository(prisma);
        super(repository, 'AgentService');
        this.prisma = prisma;
        this.repository = repository;
    }
    /**
     * Create a new agent
     * @param data Agent creation data
     * @param userId User ID
     * @returns Created agent
     */
    async createAgent(data, userId) {
        try {
            // Check for existing agent with same name
            const existingAgent = await this.repository.findOne({
                name: data.name,
                userId
            });
            if (existingAgent) {
                throw new Error(`Agent with name "${data.name}" already exists);
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
`, this.logger.log(`Created agent: ${agent.id}`($, { agent, : .name })));
                // Make sure metadata is included in the returned agent
                return this.addMetadataIfMissing(agent);
            }
            try { }
            catch (error) { // Change to unknown
                const err = toError(error); // Use helper`
                this.logger.error(`Error creating agent: ${err.message}`, err.stack); // Use err
                throw new Error(Could, not, create, agent, $, { err, : .message });
            }
        }
        /**
         * Get all agents for a user
         * @param userId User ID
         * @returns Array of agents
         */
        finally {
        }
        /**
         * Get all agents for a user
         * @param userId User ID
         * @returns Array of agents
         */
        async;
        getAgents(userId, string);
        Promise < AppAgent[] > {
            try: {
                const: agents = await this.repository.findAll({ userId }),
                // Make sure metadata is included in all returned agents
                return: agents.map((agent) => this.addMetadataIfMissing(agent))
            }, catch(error) {
                const err = toError(error); // Use helper`
                this.logger.error(Error, getting, agents, $, { err, : .message } `, err.stack); // Use err
      throw new Error(Could not retrieve agents: ${err.message});
    }
  }

  /**
   * Find agents with filters
   * @param filters Agent filters
   * @param userId User ID
   * @returns Array of agents
   */
  async findAgents(filters: Record<string, any>, userId: string): Promise<AppAgent[]> {
    try {
      const searchCriteria = { ...filters, userId };
      const agents = await this.repository.findAll(searchCriteria);`);
                return agents.map((agent) => this.addMetadataIfMissing(agent));
                `
    } catch (error) {
      const err = toError(error);
      this.logger.error(`;
                Error;
                finding;
                agents: $;
                {
                    err.message;
                }
                err.stack;
                ;
                `
      throw new Error(Could not find agents: ${err.message});
    }
  }

  /**
   * Get agent by ID
   * @param id Agent ID
   * @param userId User ID
   * @returns Agent or null if not found
   */
  async getAgentById(id: string, userId: string): Promise<AppAgent> {
    try {
      const agent = await this.repository.findOne({ id, userId });
      if (!agent) {
        throw new Error(Agent with ID ${id} not found);
      }
      return this.addMetadataIfMissing(agent);`;
            }, catch(error) {
                const err = toError(error); // Use helper`
                this.logger.error(Error, getting, agent, by, ID, $, { err, : .message }, err.stack); // Use err`
                throw new Error(Could, not, retrieve, agent, $, { id } `: ${err.message});
    }
  }

  /**
   * Update an agent
   * @param id Agent ID
   * @param updates Agent update data
   * @param userId User ID
   * @returns Updated agent
   */
  async updateAgent(id: string, updates: UpdateAgentDto, userId: string): Promise<AppAgent> {
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
            systemPrompt: updates.systemPrompt,
            configuration: updates.configuration
          }
        } : {}),`, updatedAt, new Date() `
      } as any);

      this.logger.log(`, Updated, agent, $, { id });
                return this.addMetadataIfMissing(agent);
                `
    } catch (error) { // Change to unknown`;
                const err = toError(error); // Use helper
                this.logger.error(Error, updating, agent, $, { err, : .message } `, err.stack); // Use err
      throw new Error(Could not update agent ${id}: ${err.message}`);
            }
        };
        /**
         * Update agent status
         * @param id Agent ID
         * @param status New status
         * @param userId User ID
         * @returns Updated agent
         */
        async;
        updateAgentStatus(id, string, status, AgentStatus, userId, string);
        Promise < AppAgent > {
            try: {
                // Check if agent exists and belongs to user
                await: this.getAgentById(id, userId),
                // Update the agent status
                const: agent = await this.repository.update(id, {
                    status,
                    updatedAt: new Date()
                }),
                this: .logger.log(Updated, agent, status, $, { id } -  > $, { status }),
                return: this.addMetadataIfMissing(agent)
            }, catch(error) {
                const err = toError(error); // Use helper`
                this.logger.error(Error, updating, agent, status, $, { err, : .message } `, err.stack); // Use err
      throw new Error(Could not update status for agent ${id}`, $, { err, : .message });
            }
        };
        /**
         * Delete an agent
         * @param id Agent ID
         * @param userId User ID
         * @returns boolean indicating success
         */
        async;
        deleteAgent(id, string, userId, string);
        Promise < boolean > {
            try: {
                // Check if agent exists and belongs to user
                await: this.getAgentById(id, userId),
                // Soft delete the agent
                await: this.repository.delete(id)
            } `
      this.logger.log(`, Deleted, agent: $
        };
        {
            id;
        }
        `);
      return true; // Return true on success
    } catch (error) { // Change to unknown
      const err = toError(error); // Use helper
      this.logger.error(Error deleting agent: ${err.message}, err.stack); // Use err
      // Rethrow specific errors or return false
      if (err.message?.includes('not found')) {
        // Or handle as needed, maybe return false if not found is not an error condition for deletion
         throw err; 
      }
      // For other errors, return false
      return false; 
      // Or rethrow if deletion failure should halt execution`;
        // throw new Error(Could not delete agent ${id}``: ${err.message});
    }
};
AgentService = AgentService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [typeof (_a = typeof PrismaService !== "undefined" && PrismaService) === "function" ? _a : Object])
], AgentService);
export { AgentService };
/**
 * Get agents by capability
 * @param capability Agent capability
 * @param userId User ID
 * @returns Array of agents
 */
async;
getAgentsByCapability(capability, AgentCapability, userId, string);
Promise < AppAgent[] > {
    try: {
        // This is a more complex query that requires custom implementation
        const: agents = await this.getAgents(userId),
        // Filter agents by capability
        return: agents.filter(agent => {
            if (!agent.capabilities)
                return false;
            // Handle AgentCapability[] enum array
            return agent.capabilities.includes(capability);
        })
    }, catch(error) {
        const err = toError(error); // Use helper`
        this.logger.error(Error, getting, agents, by, capability, $, { err, : .message } ``, err.stack); // Use err
        throw new Error(Could, not, retrieve, agents, by, capability, $, { capability }, $, { err, : .message });
    }
};
/**
 * Get active agents
 * @param userId User ID
 * @returns Array of active agents
 */
async;
getActiveAgents(userId, string);
Promise < AppAgent[] > {
    try: {
        const: agents = await this.repository.findAll({
            userId,
            status: AgentStatus.ACTIVE
        }),
        return: agents.map((agent) => this.addMetadataIfMissing(agent))
    }, catch(error) {
        const err = toError(error); // Use helper`
        this.logger.error(Error, getting, active, agents, $, { err, : .message } `, err.stack); // Use err
      throw new Error(Could not retrieve active agents: ${err.message}`);
    }
};
addMetadataIfMissing(agent, any);
AppAgent;
{
    if (!agent)
        return agent;
    if (!agent.metadata) {
        return {
            ...agent,
            metadata: {}
        };
    }
    return agent;
}
//# sourceMappingURL=agent.service.js.map