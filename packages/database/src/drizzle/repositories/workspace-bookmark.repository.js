"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.drizzleWorkspaceBookmarkRepository = exports.DrizzleWorkspaceBookmarkRepository = void 0;
const crypto_1 = require("crypto");
const drizzle_orm_1 = require("drizzle-orm");
const client_1 = require("../client");
const schema_1 = require("../schema");
class DrizzleWorkspaceBookmarkRepository {
    async listByWorkspace(workspaceId) {
        return client_1.db
            .select()
            .from(schema_1.workspaceBookmarks)
            .where((0, drizzle_orm_1.eq)(schema_1.workspaceBookmarks.workspaceId, workspaceId))
            .orderBy((0, drizzle_orm_1.asc)(schema_1.workspaceBookmarks.createdAt));
    }
    async listByWorkspaceForUser(workspaceId, userId) {
        return client_1.db
            .select()
            .from(schema_1.workspaceBookmarks)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceBookmarks.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.workspaceBookmarks.createdByUserId, userId)))
            .orderBy((0, drizzle_orm_1.asc)(schema_1.workspaceBookmarks.createdAt));
    }
    async findById(workspaceId, id) {
        const [bookmark] = await client_1.db
            .select()
            .from(schema_1.workspaceBookmarks)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceBookmarks.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.workspaceBookmarks.id, id)));
        return bookmark ?? null;
    }
    async findByIdForUser(workspaceId, id, userId) {
        const [bookmark] = await client_1.db
            .select()
            .from(schema_1.workspaceBookmarks)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceBookmarks.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.workspaceBookmarks.id, id), (0, drizzle_orm_1.eq)(schema_1.workspaceBookmarks.createdByUserId, userId)));
        return bookmark ?? null;
    }
    async findByUrl(workspaceId, url) {
        const [bookmark] = await client_1.db
            .select()
            .from(schema_1.workspaceBookmarks)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceBookmarks.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.workspaceBookmarks.url, url)));
        return bookmark ?? null;
    }
    async findByUrlForUser(workspaceId, url, userId) {
        const [bookmark] = await client_1.db
            .select()
            .from(schema_1.workspaceBookmarks)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceBookmarks.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.workspaceBookmarks.url, url), (0, drizzle_orm_1.eq)(schema_1.workspaceBookmarks.createdByUserId, userId)));
        return bookmark ?? null;
    }
    async addBookmark(data) {
        const id = data.id || `wb_${(0, crypto_1.randomUUID)().replace(/-/g, '').slice(0, 16)}`;
        const [bookmark] = await client_1.db
            .insert(schema_1.workspaceBookmarks)
            .values({ ...data, id })
            .returning();
        return bookmark;
    }
    async updateBookmark(workspaceId, id, data) {
        const [bookmark] = await client_1.db
            .update(schema_1.workspaceBookmarks)
            .set({ ...data, updatedAt: new Date() })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceBookmarks.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.workspaceBookmarks.id, id)))
            .returning();
        return bookmark ?? null;
    }
    async updateBookmarkForUser(workspaceId, id, userId, data) {
        const [bookmark] = await client_1.db
            .update(schema_1.workspaceBookmarks)
            .set({ ...data, updatedAt: new Date() })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceBookmarks.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.workspaceBookmarks.id, id), (0, drizzle_orm_1.eq)(schema_1.workspaceBookmarks.createdByUserId, userId)))
            .returning();
        return bookmark ?? null;
    }
    async removeBookmark(workspaceId, id) {
        const rows = await client_1.db
            .delete(schema_1.workspaceBookmarks)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceBookmarks.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.workspaceBookmarks.id, id)))
            .returning();
        return rows.length > 0;
    }
    async removeBookmarkForUser(workspaceId, id, userId) {
        const rows = await client_1.db
            .delete(schema_1.workspaceBookmarks)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceBookmarks.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.workspaceBookmarks.id, id), (0, drizzle_orm_1.eq)(schema_1.workspaceBookmarks.createdByUserId, userId)))
            .returning();
        return rows.length > 0;
    }
}
exports.DrizzleWorkspaceBookmarkRepository = DrizzleWorkspaceBookmarkRepository;
exports.drizzleWorkspaceBookmarkRepository = new DrizzleWorkspaceBookmarkRepository();
//# sourceMappingURL=workspace-bookmark.repository.js.map