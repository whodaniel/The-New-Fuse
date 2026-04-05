"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.drizzleWorkspaceMemberRepository = exports.DrizzleWorkspaceMemberRepository = void 0;
const crypto_1 = require("crypto");
const drizzle_orm_1 = require("drizzle-orm");
const client_1 = require("../client");
const schema_1 = require("../schema");
class DrizzleWorkspaceMemberRepository {
    async addMember(data) {
        const id = data.id || `wm_${(0, crypto_1.randomUUID)().replace(/-/g, '').slice(0, 16)}`;
        const [member] = await client_1.db
            .insert(schema_1.workspaceMembers)
            .values({ ...data, id })
            .returning();
        return member;
    }
    async upsertMember(data) {
        const id = data.id || `wm_${(0, crypto_1.randomUUID)().replace(/-/g, '').slice(0, 16)}`;
        const [member] = await client_1.db
            .insert(schema_1.workspaceMembers)
            .values({ ...data, id })
            .onConflictDoUpdate({
            target: [schema_1.workspaceMembers.workspaceId, schema_1.workspaceMembers.userId],
            set: {
                role: data.role,
                addedByUserId: data.addedByUserId ?? null,
                updatedAt: new Date(),
            },
        })
            .returning();
        return member;
    }
    async findMembership(workspaceId, userId) {
        const [member] = await client_1.db
            .select()
            .from(schema_1.workspaceMembers)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.userId, userId)));
        return member ?? null;
    }
    async listByWorkspace(workspaceId) {
        return client_1.db.select().from(schema_1.workspaceMembers).where((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, workspaceId));
    }
    async listByWorkspaceWithUsers(workspaceId) {
        const rows = await client_1.db
            .select({
            member: schema_1.workspaceMembers,
            userEmail: schema_1.users.email,
        })
            .from(schema_1.workspaceMembers)
            .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.userId, schema_1.users.id))
            .where((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, workspaceId));
        return rows.map((row) => ({
            ...row.member,
            userEmail: row.userEmail,
        }));
    }
    async listByUser(userId) {
        return client_1.db.select().from(schema_1.workspaceMembers).where((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.userId, userId));
    }
    async removeMember(workspaceId, userId) {
        const rows = await client_1.db
            .delete(schema_1.workspaceMembers)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.userId, userId)))
            .returning();
        return rows.length > 0;
    }
    async updateRole(workspaceId, userId, role) {
        const [member] = await client_1.db
            .update(schema_1.workspaceMembers)
            .set({ role, updatedAt: new Date() })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.userId, userId)))
            .returning();
        return member ?? null;
    }
    async listWorkspaceIdsForUser(userId) {
        const rows = await client_1.db
            .select({ workspaceId: schema_1.workspaceMembers.workspaceId })
            .from(schema_1.workspaceMembers)
            .where((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.userId, userId));
        return rows.map((row) => row.workspaceId);
    }
    async listWorkspacesForUser(userId) {
        return client_1.db
            .select({ workspaceId: schema_1.workspaceMembers.workspaceId })
            .from(schema_1.workspaceMembers)
            .where((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.userId, userId));
    }
    async listWorkspacesForUsers(userIds) {
        const ids = userIds.filter((id) => typeof id === 'string' && id.trim().length > 0);
        if (ids.length === 0)
            return [];
        return client_1.db
            .select({ workspaceId: schema_1.workspaceMembers.workspaceId, userId: schema_1.workspaceMembers.userId })
            .from(schema_1.workspaceMembers)
            .where((0, drizzle_orm_1.inArray)(schema_1.workspaceMembers.userId, ids));
    }
    async listWorkspacesWithOwnerForUser(userId) {
        const rows = await client_1.db
            .select({
            workspace: schema_1.workspaces,
            ownerEmail: schema_1.users.email,
        })
            .from(schema_1.workspaceMembers)
            .innerJoin(schema_1.workspaces, (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, schema_1.workspaces.id))
            .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.workspaces.ownerId, schema_1.users.id))
            .where((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.userId, userId));
        return rows.map((row) => ({
            workspace: row.workspace,
            ownerEmail: row.ownerEmail,
        }));
    }
}
exports.DrizzleWorkspaceMemberRepository = DrizzleWorkspaceMemberRepository;
exports.drizzleWorkspaceMemberRepository = new DrizzleWorkspaceMemberRepository();
//# sourceMappingURL=workspace-member.repository.js.map