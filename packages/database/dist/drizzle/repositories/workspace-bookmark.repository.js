import { randomUUID } from 'crypto';
import { and, asc, eq } from 'drizzle-orm';
import { db } from '../client.js';
import { workspaceBookmarks } from '../schema.js';
export class DrizzleWorkspaceBookmarkRepository {
    async listByWorkspace(workspaceId) {
        return db
            .select()
            .from(workspaceBookmarks)
            .where(eq(workspaceBookmarks.workspaceId, workspaceId))
            .orderBy(asc(workspaceBookmarks.createdAt));
    }
    async listByWorkspaceForUser(workspaceId, userId) {
        return db
            .select()
            .from(workspaceBookmarks)
            .where(and(eq(workspaceBookmarks.workspaceId, workspaceId), eq(workspaceBookmarks.createdByUserId, userId)))
            .orderBy(asc(workspaceBookmarks.createdAt));
    }
    async findById(workspaceId, id) {
        const [bookmark] = await db
            .select()
            .from(workspaceBookmarks)
            .where(and(eq(workspaceBookmarks.workspaceId, workspaceId), eq(workspaceBookmarks.id, id)));
        return bookmark ?? null;
    }
    async findByIdForUser(workspaceId, id, userId) {
        const [bookmark] = await db
            .select()
            .from(workspaceBookmarks)
            .where(and(eq(workspaceBookmarks.workspaceId, workspaceId), eq(workspaceBookmarks.id, id), eq(workspaceBookmarks.createdByUserId, userId)));
        return bookmark ?? null;
    }
    async findByUrl(workspaceId, url) {
        const [bookmark] = await db
            .select()
            .from(workspaceBookmarks)
            .where(and(eq(workspaceBookmarks.workspaceId, workspaceId), eq(workspaceBookmarks.url, url)));
        return bookmark ?? null;
    }
    async findByUrlForUser(workspaceId, url, userId) {
        const [bookmark] = await db
            .select()
            .from(workspaceBookmarks)
            .where(and(eq(workspaceBookmarks.workspaceId, workspaceId), eq(workspaceBookmarks.url, url), eq(workspaceBookmarks.createdByUserId, userId)));
        return bookmark ?? null;
    }
    async addBookmark(data) {
        const id = data.id || `wb_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
        const [bookmark] = await db
            .insert(workspaceBookmarks)
            .values({ ...data, id })
            .returning();
        return bookmark;
    }
    async updateBookmark(workspaceId, id, data) {
        const [bookmark] = await db
            .update(workspaceBookmarks)
            .set({ ...data, updatedAt: new Date() })
            .where(and(eq(workspaceBookmarks.workspaceId, workspaceId), eq(workspaceBookmarks.id, id)))
            .returning();
        return bookmark ?? null;
    }
    async updateBookmarkForUser(workspaceId, id, userId, data) {
        const [bookmark] = await db
            .update(workspaceBookmarks)
            .set({ ...data, updatedAt: new Date() })
            .where(and(eq(workspaceBookmarks.workspaceId, workspaceId), eq(workspaceBookmarks.id, id), eq(workspaceBookmarks.createdByUserId, userId)))
            .returning();
        return bookmark ?? null;
    }
    async removeBookmark(workspaceId, id) {
        const rows = await db
            .delete(workspaceBookmarks)
            .where(and(eq(workspaceBookmarks.workspaceId, workspaceId), eq(workspaceBookmarks.id, id)))
            .returning();
        return rows.length > 0;
    }
    async removeBookmarkForUser(workspaceId, id, userId) {
        const rows = await db
            .delete(workspaceBookmarks)
            .where(and(eq(workspaceBookmarks.workspaceId, workspaceId), eq(workspaceBookmarks.id, id), eq(workspaceBookmarks.createdByUserId, userId)))
            .returning();
        return rows.length > 0;
    }
}
export const drizzleWorkspaceBookmarkRepository = new DrizzleWorkspaceBookmarkRepository();
//# sourceMappingURL=workspace-bookmark.repository.js.map