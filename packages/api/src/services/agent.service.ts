import { v4 as uuidv4 } from 'uuid';
import { Agent, AgentStatus } from '../types/agent.js';
import { BaseService } from './base.service.js';
import { toError } from '../utils/error.js';

export class AgentService extends BaseService<Agent> {
  public constructor() {
    super('Agent');
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
      createdAt: agent.createdAt.toISOString(),
      updatedAt: agent.updatedAt.toISOString(),
      ...(agent.deletedAt && { deletedAt: agent.deletedAt.toISOString() }),
    };
  }

  /**
   * Get all agents
   */
  async findAll(): Promise<Agent[]> {
    try {
      const agents = await this.prisma.agent.findMany();
      return agents
        .filter(agent => !(agent as any).deletedAt)
        .map(agent => this.transform(agent));
    } catch (error: unknown) {
      const err = toError(error);
      return this.handleError(err, 'findAll'); 
    }
  }

  /**
   * Get agent by ID
   */
  async findById(id: string): Promise<Agent | null> {
    try {
      const agent = await this.prisma.agent.findUnique({
        where: { id },
      });

      if (!agent || (agent as any).deletedAt) {
        return null;
      }

      return this.transform(agent);
    } catch (error: unknown) {
      const err = toError(error);
      return this.handleError(err, `findById(${id})`);
    }
  }

  /**
   * Create a new agent
   */
  async create(data: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>): Promise<Agent> {
    try {
      this.log('create', `Creating new agent: ${data.name}`);
      
      const createData: any = {
        id: uuidv4(),
        name: data.name,
        type: data.type,
        provider: data.provider,
        capabilities: data.capabilities || [],
        status: data.status || AgentStatus.IDLE,
        lastActive: new Date(),
      };

      if (data.description) {
        createData.description = data.description;
      }

      if (data.metadata) {
        createData.metadata = data.metadata;
      }

      const agent = await this.prisma.agent.create({
        data: createData,
      });

      return this.transform(agent);
    } catch (error: unknown) {
      const err = toError(error);
      return this.handleError(err, 'create');
    }
  }

  /**
   * Update an agent
   */
  async update(id: string, data: Partial<Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Agent | null> {
    try {
      this.log('update', `Updating agent ${id}`, data);

      const updateData: any = {};
      if (data.name) updateData.name = data.name;
      if (data.type) updateData.type = data.type;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.capabilities) updateData.capabilities = data.capabilities;
      if (data.status) updateData.status = data.status;
      if (data.provider) updateData.provider = data.provider;
      if (data.metadata !== undefined) updateData.metadata = data.metadata;
      
      updateData.lastActive = new Date();

      const agent = await this.prisma.agent.update({
        where: { id },
        data: updateData,
      });

      return this.transform(agent);
    } catch (error: unknown) {
      const err = toError(error);
      return this.handleError(err, `update(${id})`);
    }
  }

  /**
   * Delete an agent (soft delete by marking name)
   */
  async delete(id: string): Promise<boolean> {
    try {
      this.log('delete', `Deleting agent ${id}`);

      await this.prisma.agent.update({
        where: { id },
        data: {
          name: `[DELETED] ${id}`,
        },
      });
      return true;
    } catch (error: unknown) {
      const err = toError(error);
      this.handleError(err, `delete(${id})`);
      return false;
    }
  }
  
  /**
   * Check if an agent has a specific capability
   */
  hasCapability(agent: Agent, capability: string): boolean {
    if (!agent.capabilities || !Array.isArray(agent.capabilities)) {
      return false;
    }
    
    return agent.capabilities.some((cap: string) => {
      return cap === capability;
    });
  }

  /**
   * Find agents with filtering (alias for findAll with filters)
   */
  async findAgents(filters?: any, _userId?: string): Promise<Agent[]> {
    try {
      const whereClause: any = {};
      
      if (filters?.type) {
        whereClause.type = filters.type;
      }
      if (filters?.status) {
        whereClause.status = filters.status;
      }
      if (filters?.provider) {
        whereClause.provider = filters.provider;
      }

      const agents = await this.prisma.agent.findMany({
        where: whereClause,
      });
      
      return agents
        .filter(agent => !(agent as any).deletedAt)
        .map(agent => this.addMetadataIfMissing(agent));
    } catch (error: unknown) {
      const err = toError(error);
      return this.handleError(err, 'findAgents');
    }
  }

  /**
   * Get agents (alias for findAll)
   */
  async getAgents(_userId?: string): Promise<Agent[]> {
    return this.findAll();
  }

  /**
   * Get agent by ID with user context
   */
  async getAgentById(id: string, _userId?: string): Promise<Agent | null> {
    return this.findById(id);
  }

  /**
   * Create agent with user context
   */
  async createAgent(data: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>, _userId?: string): Promise<Agent> {
    return this.create(data);
  }

  /**
   * Update agent with user context
   */
  async updateAgent(id: string, data: Partial<Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>>, _userId?: string): Promise<Agent | null> {
    return this.update(id, data);
  }

  /**
   * Delete agent with user context
   */
  async deleteAgent(id: string, _userId?: string): Promise<boolean> {
    return this.delete(id);
  }

  /**
   * Add metadata if missing from agent object
   */
  private addMetadataIfMissing(agent: any): Agent {
    return this.transform(agent);
  }
}

// Create a singleton instance
const agentService = new AgentService();

export default agentService;
