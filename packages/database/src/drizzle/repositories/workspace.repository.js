"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.drizzleWorkspaceRepository = exports.DrizzleWorkspaceRepository = void 0;
const crypto_1 = require("crypto");
const drizzle_orm_1 = require("drizzle-orm");
const client_1 = require("../client");
const schema_1 = require("../schema");
/**
 * Workspace Repository - provides data access for Workspace entities
 */
class DrizzleWorkspaceRepository {
    /**
     * Create a new workspace
     */
    async create(data) {
        const id = data.id || `ws_${(0, crypto_1.randomUUID)().replace(/-/g, '').slice(0, 16)}`;
        const [workspace] = await client_1.db
            .insert(schema_1.workspaces)
            .values({ ...data, id })
            .returning();
        return workspace;
    }
    /**
     * Find workspace by ID
     */
    async findById(id) {
        const [workspace] = await client_1.db.select().from(schema_1.workspaces).where((0, drizzle_orm_1.eq)(schema_1.workspaces.id, id));
        return workspace ?? null;
    }
    /**
     * Find workspace by name (slug)
     */
    async findByName(name) {
        const [workspace] = await client_1.db.select().from(schema_1.workspaces).where((0, drizzle_orm_1.eq)(schema_1.workspaces.name, name));
        return workspace ?? null;
    }
    /**
     * Find all workspaces for an owner
     */
    async findByOwner(ownerId) {
        return client_1.db
            .select()
            .from(schema_1.workspaces)
            .where((0, drizzle_orm_1.eq)(schema_1.workspaces.ownerId, ownerId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.workspaces.createdAt));
    }
    /**
     * Find first workspace by user ID (alias for ownerId)
     */
    async findByUserId(userId) {
        const userWorkspaces = await this.findByOwner(userId);
        return userWorkspaces[0] ?? null;
    }
    /**
     * Update workspace
     */
    async update(id, data) {
        const [workspace] = await client_1.db
            .update(schema_1.workspaces)
            .set({ ...data, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.workspaces.id, id))
            .returning();
        return workspace ?? null;
    }
    /**
     * Delete workspace
     */
    async delete(id) {
        const result = await client_1.db.delete(schema_1.workspaces).where((0, drizzle_orm_1.eq)(schema_1.workspaces.id, id)).returning();
        return result.length > 0;
    }
    /**
     * Find all workspaces
     */
    async findAll() {
        return client_1.db.select().from(schema_1.workspaces).orderBy((0, drizzle_orm_1.desc)(schema_1.workspaces.createdAt));
    }
    /**
     * Find workspaces by IDs
     */
    async findByIds(ids) {
        const workspaceIds = ids.filter((id) => typeof id === 'string' && id.trim().length > 0);
        if (workspaceIds.length === 0)
            return [];
        return client_1.db
            .select()
            .from(schema_1.workspaces)
            .where((0, drizzle_orm_1.inArray)(schema_1.workspaces.id, workspaceIds))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.workspaces.createdAt));
    }
    /**
     * Find workspace with related projects
     * Note: This mimics Drizzle's `include: { projects: true }`
     */
    async findByIdWithProjects(id) {
        const workspace = await this.findById(id);
        if (!workspace)
            return null;
        const relatedProjects = await client_1.db.select().from(schema_1.projects).where((0, drizzle_orm_1.eq)(schema_1.projects.workspaceId, id));
        return {
            ...workspace,
            projects: relatedProjects,
        };
    }
    /**
     * Find workspace by name with related projects
     */
    async findByNameWithProjects(name) {
        const workspace = await this.findByName(name);
        if (!workspace)
            return null;
        const relatedProjects = await client_1.db
            .select()
            .from(schema_1.projects)
            .where((0, drizzle_orm_1.eq)(schema_1.projects.workspaceId, workspace.id));
        return {
            ...workspace,
            projects: relatedProjects,
        };
    }
    /**
     * Find workspace by ID with owner
     */
    async findByIdWithOwner(id) {
        const workspace = await this.findById(id);
        if (!workspace)
            return null;
        // Get owner email
        const [owner] = await client_1.db
            .select({ email: schema_1.users.email })
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, workspace.ownerId));
        // Get projects
        const relatedProjects = await client_1.db
            .select()
            .from(schema_1.projects)
            .where((0, drizzle_orm_1.eq)(schema_1.projects.workspaceId, workspace.id));
        return {
            ...workspace,
            owner: owner ? { email: owner.email } : null,
            projects: relatedProjects,
        };
    }
    /**
     * Find workspace by name with owner
     */
    async findByNameWithOwner(name) {
        const workspace = await this.findByName(name);
        if (!workspace)
            return null;
        // Get owner email
        const [owner] = await client_1.db
            .select({ email: schema_1.users.email })
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, workspace.ownerId));
        // Get projects
        const relatedProjects = await client_1.db
            .select()
            .from(schema_1.projects)
            .where((0, drizzle_orm_1.eq)(schema_1.projects.workspaceId, workspace.id));
        return {
            ...workspace,
            owner: owner ? { email: owner.email } : null,
            projects: relatedProjects,
        };
    }
    /**
     * Find all workspaces for owner with owner details
     */
    async findByOwnerWithOwner(ownerId) {
        const ownerWorkspaces = await this.findByOwner(ownerId);
        // Get owner email once since it's the same owner
        const [owner] = await client_1.db
            .select({ email: schema_1.users.email })
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, ownerId));
        return ownerWorkspaces.map((w) => ({
            ...w,
            owner: owner ? { email: owner.email } : null,
        }));
    }
    /**
     * Find all workspaces with owner details
     */
    async findAllWithOwner() {
        const allWorkspaces = await this.findAll();
        if (allWorkspaces.length === 0)
            return [];
        // Fetch all owners
        const ownerIds = [...new Set(allWorkspaces.map((w) => w.ownerId))];
        const owners = await client_1.db
            .select({ id: schema_1.users.id, email: schema_1.users.email })
            .from(schema_1.users)
            .where((0, drizzle_orm_1.sql) `${schema_1.users.id} IN ${ownerIds}`);
        const ownerMap = new Map(owners.map((o) => [o.id, { email: o.email }]));
        return allWorkspaces.map((w) => ({
            ...w,
            owner: ownerMap.get(w.ownerId) || null,
        }));
    }
    /**
     * Find workspaces by IDs with owner details
     */
    async findByIdsWithOwner(ids) {
        const workspaceIds = ids.filter((id) => typeof id === 'string' && id.trim().length > 0);
        if (workspaceIds.length === 0)
            return [];
        const selected = await client_1.db
            .select()
            .from(schema_1.workspaces)
            .where((0, drizzle_orm_1.inArray)(schema_1.workspaces.id, workspaceIds))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.workspaces.createdAt));
        if (selected.length === 0)
            return [];
        const ownerIds = [...new Set(selected.map((w) => w.ownerId))];
        const owners = await client_1.db
            .select({ id: schema_1.users.id, email: schema_1.users.email })
            .from(schema_1.users)
            .where((0, drizzle_orm_1.sql) `${schema_1.users.id} IN ${ownerIds}`);
        const ownerMap = new Map(owners.map((o) => [o.id, { email: o.email }]));
        return selected.map((w) => ({
            ...w,
            owner: ownerMap.get(w.ownerId) || null,
        }));
    }
}
exports.DrizzleWorkspaceRepository = DrizzleWorkspaceRepository;
// Export singleton instance
exports.drizzleWorkspaceRepository = new DrizzleWorkspaceRepository();
//# sourceMappingURL=workspace.repository.js.map