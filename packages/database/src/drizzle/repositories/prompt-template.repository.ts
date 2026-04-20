/**
 * Prompt Template Repository - Drizzle ORM Implementation
 */
import { and, desc, eq, isNull, or, sql } from 'drizzle-orm';
import { db } from '../client.js';
import { promptExecutionResults, promptSnippets, promptTemplates, promptVersions } from '../schema.js';

export class DrizzlePromptTemplateRepository {
  // ===========================================================================
  // Template Operations
  // ===========================================================================

  async createTemplate(data: any) {
    const [template] = await db.insert(promptTemplates).values(data).returning();
    return template;
  }

  // Unsafe findTemplateById removed to enforce multi-tenancy. Use findTemplateByIdAndUser instead.

  // Use findTemplateByIdAndUser for safe access
  async findTemplateByIdAndUser(id: string, userId: string) {
    const [template] = await db
      .select()
      .from(promptTemplates)
      .where(and(eq(promptTemplates.id, id), eq(promptTemplates.userId, userId)));

    // Fetch associated versions if template exists
    if (template) {
      const versions = await this.listVersions(id, userId);
      return { ...template, versions };
    }

    return null;
  }

  async updateTemplate(id: string, data: any) {
    // Note: Caller service is responsible for verifying ownership before update
    const [template] = await db
      .update(promptTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(promptTemplates.id, id))
      .returning();

    return template ?? null;
  }

  async deleteTemplate(id: string) {
    // Cascade delete handles versions and results usually, but good to be explicit or rely on FK cascade
    const result = await db.delete(promptTemplates).where(eq(promptTemplates.id, id)).returning();
    return result.length > 0;
  }

  async listTemplates(userId: string, filter?: any) {
    // Basic filtering implementation with Strict Multi-Tenancy
    let query = db.select().from(promptTemplates).where(eq(promptTemplates.userId, userId));

    // Add where clauses based on filter if needed
    // For now returning all, ordered by created desc
    return query.orderBy(desc(promptTemplates.createdAt));
  }

  // ===========================================================================
  // Version Operations
  // ===========================================================================

  async createVersion(data: any) {
    const [version] = await db.insert(promptVersions).values(data).returning();
    return version;
  }

  async findVersionById(id: string) {
    const [version] = await db.select().from(promptVersions).where(eq(promptVersions.id, id));
    return version ?? null;
  }

  async listVersions(templateId: string, userId: string) {
    return db
      .select({
        id: promptVersions.id,
        templateId: promptVersions.templateId,
        versionNumber: promptVersions.versionNumber,
        name: promptVersions.name,
        label: promptVersions.label,
        content: promptVersions.content,
        variables: promptVersions.variables,
        blocks: promptVersions.blocks,
        isActive: promptVersions.isActive,
        metrics: promptVersions.metrics,
        changelog: promptVersions.changelog,
        createdBy: promptVersions.createdBy,
        createdAt: promptVersions.createdAt,
      })
      .from(promptVersions)
      .innerJoin(promptTemplates, eq(promptVersions.templateId, promptTemplates.id))
      .where(and(eq(promptVersions.templateId, templateId), eq(promptTemplates.userId, userId)))
      .orderBy(desc(promptVersions.versionNumber));
  }

  async setActiveVersion(templateId: string, versionId: string) {
    // First verify version belongs to template
    const version = await this.findVersionById(versionId);
    if (!version || version.templateId !== templateId) return null;

    // Update template
    const [template] = await db
      .update(promptTemplates)
      .set({ currentVersionId: versionId, updatedAt: new Date() })
      .where(eq(promptTemplates.id, templateId))
      .returning();

    return template ?? null;
  }

  // ===========================================================================
  // Snippet Operations
  // ===========================================================================

  async createSnippet(data: any) {
    const [snippet] = await db.insert(promptSnippets).values(data).returning();
    return snippet;
  }

  async findSnippetById(id: string) {
    const [snippet] = await db.select().from(promptSnippets).where(eq(promptSnippets.id, id));
    return snippet ?? null;
  }

  async updateSnippet(id: string, data: any) {
    const [snippet] = await db
      .update(promptSnippets)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(promptSnippets.id, id))
      .returning();
    return snippet ?? null;
  }

  async deleteSnippet(id: string) {
    const result = await db.delete(promptSnippets).where(eq(promptSnippets.id, id)).returning();
    return result.length > 0;
  }

  async listSnippets(userId: string, filter?: any) {
    let query = db
      .select()
      .from(promptSnippets)
      .where(
        and(
          // Allow user's snippets OR public system snippets (null creator)
          or(eq(promptSnippets.createdBy, userId), isNull(promptSnippets.createdBy))
        )
      );

    return query.orderBy(desc(promptSnippets.createdAt));
  }

  async incrementSnippetUsage(id: string) {
    await db.execute(
      sql`UPDATE prompt_snippets SET usage_count = usage_count + 1 WHERE id = ${id}`
    );
  }

  // ===========================================================================
  // Execution Results
  // ===========================================================================

  async recordExecution(data: any) {
    const [result] = await db.insert(promptExecutionResults).values(data).returning();

    // Also update analytics stats on template/version if possible
    // This could be done via triggers or separate update calls here

    return result;
  }

  async getTemplateAnalytics(templateId: string) {
    // This would ideally aggregating execution results
    const [template] = await db
      .select({ analytics: promptTemplates.analytics })
      .from(promptTemplates)
      .where(eq(promptTemplates.id, templateId));

    return template?.analytics ?? null;
  }
}

export const drizzlePromptTemplateRepository = new DrizzlePromptTemplateRepository();
