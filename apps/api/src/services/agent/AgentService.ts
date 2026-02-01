/**
 * AgentService - Migrated to Drizzle ORM
 * Simple agent CRUD operations (uses system-level access for admin operations)
 */
import { Injectable } from '@nestjs/common';
import { Agent, DatabaseService } from '@the-new-fuse/database';

@Injectable()
export class AgentService {
  constructor(private db: DatabaseService) {}

  async findAll(userId?: string): Promise<Agent[]> {
    if (userId) {
      return this.db.agents.findByUserId(userId);
    }
    // Use system-level access for admin operations
    const result = await this.db.agents.findAllSystem(1, 100);
    return result.data;
  }

  async findOne(id: string, userId?: string): Promise<Agent | null> {
    if (userId) {
      return this.db.agents.findById(id, userId);
    }
    // Use system-level access
    return this.db.agents.findByIdSystem(id);
  }

  async create(data: any): Promise<Agent> {
    return this.db.agents.create(data);
  }

  async update(id: string, data: Partial<Agent>, userId?: string): Promise<Agent | null> {
    // Remove readonly/relational fields that shouldn't be updated
    const { id: _id, createdAt: _createdAt, userId: dataUserId, ...updateData } = data as any;
    const effectiveUserId = userId || dataUserId;

    if (!effectiveUserId) {
      // For system updates, use updateStatus which doesn't require userId
      return this.db.agents.updateStatus(id, (updateData as any).status || 'ACTIVE');
    }

    return this.db.agents.update(id, effectiveUserId, {
      ...updateData,
      updatedAt: new Date(),
    });
  }

  async delete(id: string, userId?: string): Promise<boolean> {
    if (!userId) {
      // System delete - get the agent first to find the userId
      const agent = await this.db.agents.findByIdSystem(id);
      if (!agent) return false;
      userId = agent.userId;
    }
    return this.db.agents.softDelete(id, userId);
  }
}
