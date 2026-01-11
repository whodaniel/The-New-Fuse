/**
 * AgentService - Migrated to Drizzle ORM
 * Simple agent CRUD operations
 */
import { Injectable } from '@nestjs/common';
import { Agent, DatabaseService } from '@the-new-fuse/database';

@Injectable()
export class AgentService {
  constructor(private db: DatabaseService) {}

  async findAll(): Promise<Agent[]> {
    return this.db.agents.findAll();
  }

  async findOne(id: string): Promise<Agent | null> {
    return this.db.agents.findById(id);
  }

  async create(data: any): Promise<Agent> {
    return this.db.agents.create(data);
  }

  async update(id: string, data: Partial<Agent>): Promise<Agent | null> {
    // Remove readonly/relational fields that shouldn't be updated
    const { id: _id, createdAt: _createdAt, userId: _userId, ...updateData } = data as any;
    return this.db.agents.update(id, {
      ...updateData,
      updatedAt: new Date(),
    });
  }

  async delete(id: string): Promise<boolean> {
    return this.db.agents.softDelete(id);
  }
}
