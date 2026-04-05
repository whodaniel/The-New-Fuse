"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.drizzleWorkspaceDomainRepository = exports.DrizzleWorkspaceDomainRepository = void 0;
const crypto_1 = require("crypto");
const drizzle_orm_1 = require("drizzle-orm");
const client_1 = require("../client");
const schema_1 = require("../schema");
class DrizzleWorkspaceDomainRepository {
    async listByWorkspace(workspaceId) {
        return client_1.db
            .select()
            .from(schema_1.workspaceDomains)
            .where((0, drizzle_orm_1.eq)(schema_1.workspaceDomains.workspaceId, workspaceId))
            .orderBy((0, drizzle_orm_1.asc)(schema_1.workspaceDomains.domain));
    }
    async findById(workspaceId, id) {
        const [domain] = await client_1.db
            .select()
            .from(schema_1.workspaceDomains)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceDomains.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.workspaceDomains.id, id)));
        return domain ?? null;
    }
    async findByDomain(domain) {
        const [entry] = await client_1.db.select().from(schema_1.workspaceDomains).where((0, drizzle_orm_1.eq)(schema_1.workspaceDomains.domain, domain));
        return entry ?? null;
    }
    async addDomain(data) {
        const id = data.id || `wd_${(0, crypto_1.randomUUID)().replace(/-/g, '').slice(0, 16)}`;
        const [domain] = await client_1.db
            .insert(schema_1.workspaceDomains)
            .values({ ...data, id })
            .returning();
        return domain;
    }
    async removeDomain(workspaceId, id) {
        const rows = await client_1.db
            .delete(schema_1.workspaceDomains)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceDomains.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.workspaceDomains.id, id)))
            .returning();
        return rows.length > 0;
    }
    async updateStatus(workspaceId, id, status, verificationMessage) {
        const [domain] = await client_1.db
            .update(schema_1.workspaceDomains)
            .set({ status, verificationMessage, updatedAt: new Date() })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceDomains.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.workspaceDomains.id, id)))
            .returning();
        return domain ?? null;
    }
}
exports.DrizzleWorkspaceDomainRepository = DrizzleWorkspaceDomainRepository;
exports.drizzleWorkspaceDomainRepository = new DrizzleWorkspaceDomainRepository();
//# sourceMappingURL=workspace-domain.repository.js.map