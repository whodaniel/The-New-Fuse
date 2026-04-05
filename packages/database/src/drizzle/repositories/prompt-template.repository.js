"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.drizzlePromptTemplateRepository = exports.DrizzlePromptTemplateRepository = void 0;
/**
 * Prompt Template Repository - Drizzle ORM Implementation
 */
const drizzle_orm_1 = require("drizzle-orm");
const client_1 = require("../client");
const schema_1 = require("../schema");
class DrizzlePromptTemplateRepository {
    // ===========================================================================
    // Template Operations
    // ===========================================================================
    async createTemplate(data) {
        const [template] = await client_1.db.insert(schema_1.promptTemplates).values(data).returning();
        return template;
    }
    // Unsafe findTemplateById removed to enforce multi-tenancy. Use findTemplateByIdAndUser instead.
    // Use findTemplateByIdAndUser for safe access
    async findTemplateByIdAndUser(id, userId) {
        const [template] = await client_1.db
            .select()
            .from(schema_1.promptTemplates)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.promptTemplates.id, id), (0, drizzle_orm_1.eq)(schema_1.promptTemplates.userId, userId)));
        // Fetch associated versions if template exists
        if (template) {
            const versions = await this.listVersions(id, userId);
            return { ...template, versions };
        }
        return null;
    }
    async updateTemplate(id, data) {
        // Note: Caller service is responsible for verifying ownership before update
        const [template] = await client_1.db
            .update(schema_1.promptTemplates)
            .set({ ...data, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.promptTemplates.id, id))
            .returning();
        return template ?? null;
    }
    async deleteTemplate(id) {
        // Cascade delete handles versions and results usually, but good to be explicit or rely on FK cascade
        const result = await client_1.db.delete(schema_1.promptTemplates).where((0, drizzle_orm_1.eq)(schema_1.promptTemplates.id, id)).returning();
        return result.length > 0;
    }
    async listTemplates(userId, filter) {
        // Basic filtering implementation with Strict Multi-Tenancy
        let query = client_1.db.select().from(schema_1.promptTemplates).where((0, drizzle_orm_1.eq)(schema_1.promptTemplates.userId, userId));
        // Add where clauses based on filter if needed
        // For now returning all, ordered by created desc
        return query.orderBy((0, drizzle_orm_1.desc)(schema_1.promptTemplates.createdAt));
    }
    // ===========================================================================
    // Version Operations
    // ===========================================================================
    async createVersion(data) {
        const [version] = await client_1.db.insert(schema_1.promptVersions).values(data).returning();
        return version;
    }
    async findVersionById(id) {
        const [version] = await client_1.db.select().from(schema_1.promptVersions).where((0, drizzle_orm_1.eq)(schema_1.promptVersions.id, id));
        return version ?? null;
    }
    async listVersions(templateId, userId) {
        return client_1.db
            .select({
            id: schema_1.promptVersions.id,
            templateId: schema_1.promptVersions.templateId,
            versionNumber: schema_1.promptVersions.versionNumber,
            name: schema_1.promptVersions.name,
            label: schema_1.promptVersions.label,
            content: schema_1.promptVersions.content,
            variables: schema_1.promptVersions.variables,
            blocks: schema_1.promptVersions.blocks,
            isActive: schema_1.promptVersions.isActive,
            metrics: schema_1.promptVersions.metrics,
            changelog: schema_1.promptVersions.changelog,
            createdBy: schema_1.promptVersions.createdBy,
            createdAt: schema_1.promptVersions.createdAt,
        })
            .from(schema_1.promptVersions)
            .innerJoin(schema_1.promptTemplates, (0, drizzle_orm_1.eq)(schema_1.promptVersions.templateId, schema_1.promptTemplates.id))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.promptVersions.templateId, templateId), (0, drizzle_orm_1.eq)(schema_1.promptTemplates.userId, userId)))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.promptVersions.versionNumber));
    }
    async setActiveVersion(templateId, versionId) {
        // First verify version belongs to template
        const version = await this.findVersionById(versionId);
        if (!version || version.templateId !== templateId)
            return null;
        // Update template
        const [template] = await client_1.db
            .update(schema_1.promptTemplates)
            .set({ currentVersionId: versionId, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.promptTemplates.id, templateId))
            .returning();
        return template ?? null;
    }
    // ===========================================================================
    // Snippet Operations
    // ===========================================================================
    async createSnippet(data) {
        const [snippet] = await client_1.db.insert(schema_1.promptSnippets).values(data).returning();
        return snippet;
    }
    async findSnippetById(id) {
        const [snippet] = await client_1.db.select().from(schema_1.promptSnippets).where((0, drizzle_orm_1.eq)(schema_1.promptSnippets.id, id));
        return snippet ?? null;
    }
    async updateSnippet(id, data) {
        const [snippet] = await client_1.db
            .update(schema_1.promptSnippets)
            .set({ ...data, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.promptSnippets.id, id))
            .returning();
        return snippet ?? null;
    }
    async deleteSnippet(id) {
        const result = await client_1.db.delete(schema_1.promptSnippets).where((0, drizzle_orm_1.eq)(schema_1.promptSnippets.id, id)).returning();
        return result.length > 0;
    }
    async listSnippets(userId, filter) {
        let query = client_1.db
            .select()
            .from(schema_1.promptSnippets)
            .where((0, drizzle_orm_1.and)(
        // Allow user's snippets OR public system snippets (null creator)
        (0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.promptSnippets.createdBy, userId), (0, drizzle_orm_1.isNull)(schema_1.promptSnippets.createdBy))));
        return query.orderBy((0, drizzle_orm_1.desc)(schema_1.promptSnippets.createdAt));
    }
    async incrementSnippetUsage(id) {
        await client_1.db.execute((0, drizzle_orm_1.sql) `UPDATE prompt_snippets SET usage_count = usage_count + 1 WHERE id = ${id}`);
    }
    // ===========================================================================
    // Execution Results
    // ===========================================================================
    async recordExecution(data) {
        const [result] = await client_1.db.insert(schema_1.promptExecutionResults).values(data).returning();
        // Also update analytics stats on template/version if possible
        // This could be done via triggers or separate update calls here
        return result;
    }
    async getTemplateAnalytics(templateId) {
        // This would ideally aggregating execution results
        const [template] = await client_1.db
            .select({ analytics: schema_1.promptTemplates.analytics })
            .from(schema_1.promptTemplates)
            .where((0, drizzle_orm_1.eq)(schema_1.promptTemplates.id, templateId));
        return template?.analytics ?? null;
    }
}
exports.DrizzlePromptTemplateRepository = DrizzlePromptTemplateRepository;
exports.drizzlePromptTemplateRepository = new DrizzlePromptTemplateRepository();
//# sourceMappingURL=prompt-template.repository.js.map