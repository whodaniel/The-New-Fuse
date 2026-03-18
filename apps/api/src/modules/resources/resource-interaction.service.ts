import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@the-new-fuse/database/drizzle';
import { randomUUID } from 'crypto';

export type ResourceShareRecord = {
  id: string;
  resourceId: string;
  fromUserId: string;
  toAgentId: string;
  notes: string | null;
  sharedAt: string;
};

@Injectable()
export class ResourceInteractionService {
  private ensureTablesPromise: Promise<void> | null = null;

  constructor(private readonly db: DatabaseService) {}

  private escapeSqlLiteral(value: string): string {
    return String(value).replace(/'/g, "''");
  }

  private async ensureTables(): Promise<void> {
    if (!this.ensureTablesPromise) {
      this.ensureTablesPromise = this.createTables().catch((error) => {
        this.ensureTablesPromise = null;
        throw error;
      });
    }
    return this.ensureTablesPromise;
  }

  private async createTables(): Promise<void> {
    await this.db.executeRaw(`
      CREATE TABLE IF NOT EXISTS resource_favorites (
        id varchar(64) PRIMARY KEY,
        resource_id varchar(255) NOT NULL,
        user_id varchar(255) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE(resource_id, user_id)
      )
    `);
    await this.db.executeRaw(
      'CREATE INDEX IF NOT EXISTS idx_resource_favorites_user_id ON resource_favorites (user_id)'
    );
    await this.db.executeRaw(
      'CREATE INDEX IF NOT EXISTS idx_resource_favorites_resource_id ON resource_favorites (resource_id)'
    );

    await this.db.executeRaw(`
      CREATE TABLE IF NOT EXISTS resource_shares (
        id varchar(64) PRIMARY KEY,
        resource_id varchar(255) NOT NULL,
        from_user_id varchar(255) NOT NULL,
        to_agent_id varchar(255) NOT NULL,
        notes text,
        shared_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await this.db.executeRaw(
      'CREATE INDEX IF NOT EXISTS idx_resource_shares_from_user_id ON resource_shares (from_user_id)'
    );
    await this.db.executeRaw(
      'CREATE INDEX IF NOT EXISTS idx_resource_shares_to_agent_id ON resource_shares (to_agent_id)'
    );
    await this.db.executeRaw(
      'CREATE INDEX IF NOT EXISTS idx_resource_shares_resource_id ON resource_shares (resource_id)'
    );
  }

  async toggleFavorite(resourceId: string, userId: string): Promise<{ favorite: boolean }> {
    await this.ensureTables();

    const safeResourceId = this.escapeSqlLiteral(resourceId);
    const safeUserId = this.escapeSqlLiteral(userId);
    const existing = await this.db.executeRaw<{ id: string }>(
      `SELECT id
       FROM resource_favorites
       WHERE resource_id = '${safeResourceId}'
         AND user_id = '${safeUserId}'
       LIMIT 1`
    );

    if (existing.length > 0) {
      await this.db.executeRaw(
        `DELETE FROM resource_favorites
         WHERE resource_id = '${safeResourceId}'
           AND user_id = '${safeUserId}'`
      );
      return { favorite: false };
    }

    const id = `fav_${randomUUID()}`;
    await this.db.executeRaw(
      `INSERT INTO resource_favorites (id, resource_id, user_id)
       VALUES ('${this.escapeSqlLiteral(id)}', '${safeResourceId}', '${safeUserId}')`
    );
    return { favorite: true };
  }

  async shareResource(input: {
    resourceId: string;
    fromUserId: string;
    toAgentId: string;
    notes?: string | null;
  }): Promise<ResourceShareRecord> {
    await this.ensureTables();

    const id = `shr_${randomUUID()}`;
    const sharedAt = new Date().toISOString();
    const notes = input.notes?.trim() || null;

    await this.db.executeRaw(
      `INSERT INTO resource_shares (id, resource_id, from_user_id, to_agent_id, notes, shared_at)
       VALUES (
         '${this.escapeSqlLiteral(id)}',
         '${this.escapeSqlLiteral(input.resourceId)}',
         '${this.escapeSqlLiteral(input.fromUserId)}',
         '${this.escapeSqlLiteral(input.toAgentId)}',
         ${notes ? `'${this.escapeSqlLiteral(notes)}'` : 'NULL'},
         '${this.escapeSqlLiteral(sharedAt)}'
       )`
    );

    return {
      id,
      resourceId: input.resourceId,
      fromUserId: input.fromUserId,
      toAgentId: input.toAgentId,
      notes,
      sharedAt,
    };
  }
}
