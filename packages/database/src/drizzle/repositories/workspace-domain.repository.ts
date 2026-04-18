import { randomUUID } from 'crypto';
import { and, asc, eq } from 'drizzle-orm';
import { db } from '../client.js';
import { workspaceDomains } from '../schema/index.js';
import type { NewWorkspaceDomain, WorkspaceDomain } from '../types.js';

export class DrizzleWorkspaceDomainRepository {
  async listByWorkspace(workspaceId: string): Promise<WorkspaceDomain[]> {
    return db
      .select()
      .from(workspaceDomains)
      .where(eq(workspaceDomains.workspaceId, workspaceId))
      .orderBy(asc(workspaceDomains.domain));
  }

  async findById(workspaceId: string, id: string): Promise<WorkspaceDomain | null> {
    const [domain] = await db
      .select()
      .from(workspaceDomains)
      .where(and(eq(workspaceDomains.workspaceId, workspaceId), eq(workspaceDomains.id, id)));
    return domain ?? null;
  }

  async findByDomain(domain: string): Promise<WorkspaceDomain | null> {
    const [entry] = await db.select().from(workspaceDomains).where(eq(workspaceDomains.domain, domain));
    return entry ?? null;
  }

  async addDomain(
    data: Omit<NewWorkspaceDomain, 'id'> & { id?: string }
  ): Promise<WorkspaceDomain> {
    const id = data.id || `wd_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const [domain] = await db
      .insert(workspaceDomains)
      .values({ ...data, id } as NewWorkspaceDomain)
      .returning();
    return domain;
  }

  async removeDomain(workspaceId: string, id: string): Promise<boolean> {
    const rows = await db
      .delete(workspaceDomains)
      .where(and(eq(workspaceDomains.workspaceId, workspaceId), eq(workspaceDomains.id, id)))
      .returning();
    return rows.length > 0;
  }

  async updateStatus(
    workspaceId: string,
    id: string,
    status: WorkspaceDomain['status'],
    verificationMessage: string | null
  ): Promise<WorkspaceDomain | null> {
    const [domain] = await db
      .update(workspaceDomains)
      .set({ status, verificationMessage, updatedAt: new Date() })
      .where(and(eq(workspaceDomains.workspaceId, workspaceId), eq(workspaceDomains.id, id)))
      .returning();
    return domain ?? null;
  }
}

export const drizzleWorkspaceDomainRepository = new DrizzleWorkspaceDomainRepository();
