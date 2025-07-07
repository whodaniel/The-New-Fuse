import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
// Correct the import path for BaseRepository
import { BaseRepository } from '@the-new-fuse/database/src/repositories/base.repository'; 
import { AgentCapability, AgentRole, AgentStatus, Agent as AppAgent } from '@the-new-fuse/types';
import { Agent as PrismaAgent } from '@the-new-fuse/database/generated/prisma';

export interface AgentWithCapabilities {
  id: string;
  name: string;
  description?: string;
  status: AgentStatus;
  type: string;
  role: AgentRole;
  capabilities: AgentCapability[];
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, unknown>; // Added missing metadata property
}

@Injectable()
export class AgentRepository extends BaseRepository<AppAgent> {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  // Helper method to convert Prisma Agent to App Agent
  private convertPrismaToApp(prismaAgent: any): AppAgent {
    return {
      id: prismaAgent.id,
      name: prismaAgent.name,
      description: prismaAgent.description || undefined,
      type: prismaAgent.type as any, // Type casting needed
      status: prismaAgent.status as any, // Type casting needed
      role: AgentRole.ASSISTANT, // Default role
      capabilities: (prismaAgent.capabilities || []).map((cap: string) => cap as AgentCapability),
      metadata: prismaAgent.metadata || {},
      createdAt: prismaAgent.createdAt,
      updatedAt: prismaAgent.updatedAt
    } as AppAgent;
  }

  // Implement abstract methods from BaseRepository
  async findById(id: string): Promise<AppAgent | null> {
    const result = await this.prisma.agent.findUnique({ where: { id } });
    return result ? this.convertPrismaToApp(result) : null;
  }

  async findMany(filters?: any): Promise<AppAgent[]> {
    const where = this.buildWhereClause(filters);
    const results = await this.prisma.agent.findMany({ where });
    return results.map(agent => this.convertPrismaToApp(agent));
  }

  async create(data: any): Promise<AppAgent> {
    const result = await this.prisma.agent.create({ data });
    return this.convertPrismaToApp(result);
  }

  async update(id: string, data: any): Promise<AppAgent> {
    const result = await this.prisma.agent.update({ where: { id }, data });
    return this.convertPrismaToApp(result);
  }

  async delete(id: string): Promise<AppAgent> {
    const result = await this.prisma.agent.delete({ where: { id } });
    return this.convertPrismaToApp(result);
  }

  // Additional methods for compatibility with existing services
  async findAll(filter?: any, include?: any, orderBy?: any, skip?: number, take?: number): Promise<AppAgent[]> {
    const results = await this.prisma.agent.findMany({ where: filter, include, orderBy, skip, take });
    return results.map(agent => this.convertPrismaToApp(agent));
  }

  async findOne(filter?: any, include?: any): Promise<AppAgent | null> {
    const result = await this.prisma.agent.findFirst({ where: filter, include });
    return result ? this.convertPrismaToApp(result) : null;
  }

  async count(filter?: any): Promise<number> {
    return this.prisma.agent.count({ where: filter });
  }

  protected async countTotal(where: any): Promise<number> {
    return this.prisma.agent.count({ where });
  }

  // ... custom repository methods ...

  async findByCapability(capability: AgentCapability): Promise<AppAgent[]> {
    // Prisma doesn't directly support querying JSON arrays like this easily.
    // Fetch all agents and filter in memory, or use raw SQL if performance is critical.
    const allAgents = await this.findAll();
    return allAgents.filter(agent => 
      agent.capabilities?.some(cap => {
        // Handle both string and object capability types
        if (typeof cap === 'string') {
          return cap === capability || cap === capability.toString();
        } else if (typeof cap === 'object' && cap !== null) {
          // If capability is an object, compare with its type or name property
          return (cap as any).type === capability || (cap as any).name === capability;
        }
        return false;
      })
    );
  }

  async findActiveAgents(): Promise<AppAgent[]> {
    return this.findAll({ status: AgentStatus.ACTIVE });
  }
}