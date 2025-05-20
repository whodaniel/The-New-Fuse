/**
 * Agent Repository Implementation
 * Follows standardized repository pattern
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
// Create local type definition until types package issue is resolved
export interface Agent {
  id: string;
  name: string;
  description?: string;
  type: string;
  status: string;
  role?: string;
  capabilities: string[];
  metadata: Record<string, unknown>;
  userId?: string;
  deletedAt?: Date | null;
}
import { IBaseRepository } from '../services/base.service.js';

// Enums should be imported from types package to maintain consistency
// This is a temporary definition that should be moved to the types package
export enum AgentType {
  ASSISTANT = 'assistant',
  WORKER = 'worker',
  SUPERVISOR = 'supervisor',
  SPECIALIST = 'specialist'
}

@Injectable()
export class AgentRepository implements IBaseRepository<Agent> {
  protected readonly modelName: string = 'agent';
  
  constructor(private prisma: PrismaService) {}

  async findAll(filter?: Record<string, any>): Promise<Agent[]> {
    const where = this.buildWhereClause(filter);
    const agents = await this.prisma.agent.findMany({
      where
    });
    return agents as unknown as Agent[];
  }

  async findById(id: string): Promise<Agent | null> {
    const agent = await this.prisma.agent.findUnique({
      where: { id }
    });
    return agent as unknown as Agent;
  }

  async findOne(filter: Record<string, any>): Promise<Agent | null> {
    const where = this.buildWhereClause(filter);
    const agent = await this.prisma.agent.findFirst({
      where
    });
    return agent as unknown as Agent;
  }

  async findByUserId(userId: string): Promise<Agent[]> {
    return this.findAll({ userId });
  }

  async create(data: Partial<Agent>): Promise<Agent> {
    const agent = await this.prisma.agent.create({
      data: data as any
    });
    return agent as unknown as Agent;
  }

  async update(id: string, data: Partial<Agent>): Promise<Agent | null> {
    const agent = await this.prisma.agent.update({
      where: { id },
      data: data as any
    });
    return agent as unknown as Agent;
  }

  async delete(id: string): Promise<boolean> {
    await this.prisma.agent.delete({
      where: { id }
    });
    return true;
  }

  async count(filter?: Record<string, any>): Promise<number> {
    const where = this.buildWhereClause(filter);
    return this.prisma.agent.count({
      where
    });
  }

  /**
   * Helper method to build a where clause from a filter object
   * This handles type safety by casting the filter to the appropriate type
   */
  private buildWhereClause(filter?: Record<string, any>): any {
    if (!filter) return {};
    
    // Create a safe copy of the filter
    const safeFilter: Record<string, any> = {};
    
    // Handle special case for userId which might not be in the prisma schema
    if (filter.userId) {
      safeFilter.userId = filter.userId;
    }
    
    // Copy other standard filter properties
    if (filter.id) safeFilter.id = filter.id;
    if (filter.name) safeFilter.name = filter.name;
    if (filter.type) safeFilter.type = filter.type;
    if (filter.status) safeFilter.status = filter.status;
    
    return safeFilter;
  }
}