import { randomUUID } from 'crypto';
import { and, asc, eq } from 'drizzle-orm';
import { db } from '../client.js';
import { workspaceDomains } from '../schema.js';
export class DrizzleWorkspaceDomainRepository {
    async listByWorkspace(workspaceId) {
        return db
            .select()
            .from(workspaceDomains)
            .where(eq(workspaceDomains.workspaceId, workspaceId))
            .orderBy(asc(workspaceDomains.domain));
    }
    async findById(workspaceId, id) {
        const [domain] = await db
            .select()
            .from(workspaceDomains)
            .where(and(eq(workspaceDomains.workspaceId, workspaceId), eq(workspaceDomains.id, id)));
        return domain ?? null;
    }
    async findByDomain(domain) {
        const [entry] = await db
            .select()
            .from(workspaceDomains)
            .where(eq(workspaceDomains.domain, domain));
        return entry ?? null;
    }
    async addDomain(data) {
        const id = data.id || `wd_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
        const [domain] = await db
            .insert(workspaceDomains)
            .values({ ...data, id })
            .returning();
        return domain;
    }
    async removeDomain(workspaceId, id) {
        const rows = await db
            .delete(workspaceDomains)
            .where(and(eq(workspaceDomains.workspaceId, workspaceId), eq(workspaceDomains.id, id)))
            .returning();
        return rows.length > 0;
    }
    async updateStatus(workspaceId, id, status, verificationMessage) {
        const [domain] = await db
            .update(workspaceDomains)
            .set({ status, verificationMessage, updatedAt: new Date() })
            .where(and(eq(workspaceDomains.workspaceId, workspaceId), eq(workspaceDomains.id, id)))
            .returning();
        return domain ?? null;
    }
}
export const drizzleWorkspaceDomainRepository = new DrizzleWorkspaceDomainRepository();
//# sourceMappingURL=workspace-domain.repository.js.map