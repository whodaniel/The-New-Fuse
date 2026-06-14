import { randomUUID } from 'crypto';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '../client.js';
import { users, workspaceMembers, workspaces } from '../schema.js';
export class DrizzleWorkspaceMemberRepository {
    async addMember(data) {
        const id = data.id || `wm_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
        const [member] = await db
            .insert(workspaceMembers)
            .values({ ...data, id })
            .returning();
        return member;
    }
    async upsertMember(data) {
        const id = data.id || `wm_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
        const [member] = await db
            .insert(workspaceMembers)
            .values({ ...data, id })
            .onConflictDoUpdate({
            target: [workspaceMembers.workspaceId, workspaceMembers.userId],
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
        const [member] = await db
            .select()
            .from(workspaceMembers)
            .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)));
        return member ?? null;
    }
    async listByWorkspace(workspaceId) {
        return db.select().from(workspaceMembers).where(eq(workspaceMembers.workspaceId, workspaceId));
    }
    async listByWorkspaceWithUsers(workspaceId) {
        const rows = await db
            .select({
            member: workspaceMembers,
            userEmail: users.email,
        })
            .from(workspaceMembers)
            .leftJoin(users, eq(workspaceMembers.userId, users.id))
            .where(eq(workspaceMembers.workspaceId, workspaceId));
        return rows.map((row) => ({
            ...row.member,
            userEmail: row.userEmail,
        }));
    }
    async listByUser(userId) {
        return db.select().from(workspaceMembers).where(eq(workspaceMembers.userId, userId));
    }
    async removeMember(workspaceId, userId) {
        const rows = await db
            .delete(workspaceMembers)
            .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)))
            .returning();
        return rows.length > 0;
    }
    async updateRole(workspaceId, userId, role) {
        const [member] = await db
            .update(workspaceMembers)
            .set({ role, updatedAt: new Date() })
            .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)))
            .returning();
        return member ?? null;
    }
    async listWorkspaceIdsForUser(userId) {
        const rows = await db
            .select({ workspaceId: workspaceMembers.workspaceId })
            .from(workspaceMembers)
            .where(eq(workspaceMembers.userId, userId));
        return rows.map((row) => row.workspaceId);
    }
    async listWorkspacesForUser(userId) {
        return db
            .select({ workspaceId: workspaceMembers.workspaceId })
            .from(workspaceMembers)
            .where(eq(workspaceMembers.userId, userId));
    }
    async listWorkspacesForUsers(userIds) {
        const ids = userIds.filter((id) => typeof id === 'string' && id.trim().length > 0);
        if (ids.length === 0)
            return [];
        return db
            .select({ workspaceId: workspaceMembers.workspaceId, userId: workspaceMembers.userId })
            .from(workspaceMembers)
            .where(inArray(workspaceMembers.userId, ids));
    }
    async listWorkspacesWithOwnerForUser(userId) {
        const rows = await db
            .select({
            workspace: workspaces,
            ownerEmail: users.email,
        })
            .from(workspaceMembers)
            .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
            .leftJoin(users, eq(workspaces.ownerId, users.id))
            .where(eq(workspaceMembers.userId, userId));
        return rows.map((row) => ({
            workspace: row.workspace,
            ownerEmail: row.ownerEmail,
        }));
    }
}
export const drizzleWorkspaceMemberRepository = new DrizzleWorkspaceMemberRepository();
//# sourceMappingURL=workspace-member.repository.js.map