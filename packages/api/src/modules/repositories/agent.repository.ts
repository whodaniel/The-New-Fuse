import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
// Correct the import path for BaseRepository
import { BaseRepository } from '@the-new-fuse/database/src/repositories/base.repository'; 
import { AgentCapability, AgentRole, AgentStatus } from '@the-new-fuse/types';
import { Agent } from '@prisma/client'; // Assuming Agent type comes from Prisma client

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
export class AgentRepository extends BaseRepository<Agent> {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, 'agent'); // Pass model name as string
  }

  // Implement abstract methods from BaseRepository
  async findAll(filter?: any, include?: any, orderBy?: any, skip?: number, take?: number): Promise<Agent[]> {
    return this.prisma.agent.findMany({ where: filter, include, orderBy, skip, take });
  }

  async findById(id: string, include?: any): Promise<Agent | null> {
    return this.prisma.agent.findUnique({ where: { id }, include });
  }

  async findOne(filter?: any, include?: any): Promise<Agent | null> {
    return this.prisma.agent.findFirst({ where: filter, include });
  }

  async create(data: any): Promise<Agent> {
    return this.prisma.agent.create({ data });
  }

  async update(id: string, data: any): Promise<Agent | null> {
    return this.prisma.agent.update({ where: { id }, data });
  }

  async delete(id: string): Promise<boolean> {
    await this.prisma.agent.delete({ where: { id } });
    return true;
  }

  async count(filter?: any): Promise<number> {
    return this.prisma.agent.count({ where: filter });
  }

  // ... custom repository methods ...

  async findByCapability(capability: AgentCapability): Promise<Agent[]> {
    // Prisma doesn't directly support querying JSON arrays like this easily.
    // Fetch all agents and filter in memory, or use raw SQL if performance is critical.
    const allAgents = await this.findAll();
    return allAgents.filter(agent => 
      (agent as any).capabilities?.includes(capability)
    );
  }

  async findActiveAgents(): Promise<Agent[]> {
    return this.findAll({ status: AgentStatus.ACTIVE });
  }
}