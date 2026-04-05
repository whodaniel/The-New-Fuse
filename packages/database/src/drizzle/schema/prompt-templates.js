"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promptExecutionResultsRelations = exports.promptVersionsRelations = exports.promptTemplatesRelations = exports.promptExecutionResults = exports.promptSnippets = exports.promptVersions = exports.promptTemplates = void 0;
/**
 * Drizzle ORM Schema - Prompt Templating System
 */
const drizzle_orm_1 = require("drizzle-orm");
const pg_core_1 = require("drizzle-orm/pg-core");
const users_1 = require("./users");
// =============================================================================
// PROMPT TEMPLATES
// =============================================================================
exports.promptTemplates = (0, pg_core_1.pgTable)('prompt_templates', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    description: (0, pg_core_1.text)('description'),
    currentVersionId: (0, pg_core_1.uuid)('current_version_id'), // Reference to the active version
    tags: (0, pg_core_1.jsonb)('tags').$type().default([]).notNull(),
    category: (0, pg_core_1.varchar)('category', { length: 100 }).default('General').notNull(),
    isPublic: (0, pg_core_1.boolean)('is_public').default(false).notNull(),
    // Analytics summary (can be updated periodically)
    analytics: (0, pg_core_1.jsonb)('analytics').default({
        totalRuns: 0,
        successRate: 0,
        popularVariables: [],
        recentActivity: [],
    }),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull() // Enforce tenant isolation
        .references(() => users_1.users.id, { onDelete: 'cascade' }),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
// =============================================================================
// PROMPT VERSIONS
// =============================================================================
exports.promptVersions = (0, pg_core_1.pgTable)('prompt_versions', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    templateId: (0, pg_core_1.uuid)('template_id')
        .notNull()
        .references(() => exports.promptTemplates.id, { onDelete: 'cascade' }),
    versionNumber: (0, pg_core_1.integer)('version_number').notNull(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }),
    label: (0, pg_core_1.varchar)('label', { length: 50 }).default('development'), // staging, production, etc.
    content: (0, pg_core_1.text)('content').notNull(),
    variables: (0, pg_core_1.jsonb)('variables').$type().default({}).notNull(),
    blocks: (0, pg_core_1.jsonb)('blocks').$type().default([]).notNull(), // Stores the visual block structure
    isActive: (0, pg_core_1.boolean)('is_active').default(true).notNull(),
    metrics: (0, pg_core_1.jsonb)('metrics').default({
        successRate: 0,
        totalRuns: 0,
        avgResponseTime: 0,
    }),
    changelog: (0, pg_core_1.text)('changelog'),
    createdBy: (0, pg_core_1.varchar)('created_by', { length: 255 }), // User ID or System
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
// =============================================================================
// PROMPT SNIPPETS
// =============================================================================
exports.promptSnippets = (0, pg_core_1.pgTable)('prompt_snippets', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    content: (0, pg_core_1.text)('content').notNull(),
    type: (0, pg_core_1.varchar)('type', { length: 50 }).notNull(), // system, user, function, etc.
    category: (0, pg_core_1.varchar)('category', { length: 100 }).default('General').notNull(),
    tags: (0, pg_core_1.jsonb)('tags').$type().default([]).notNull(),
    description: (0, pg_core_1.text)('description'),
    parameters: (0, pg_core_1.jsonb)('parameters'),
    usageCount: (0, pg_core_1.integer)('usage_count').default(0).notNull(),
    isStarred: (0, pg_core_1.boolean)('is_starred').default(false).notNull(),
    createdBy: (0, pg_core_1.uuid)('created_by').references(() => users_1.users.id),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
// =============================================================================
// PROMPT EXECUTION RESULTS
// =============================================================================
exports.promptExecutionResults = (0, pg_core_1.pgTable)('prompt_execution_results', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    templateId: (0, pg_core_1.uuid)('template_id')
        .notNull()
        .references(() => exports.promptTemplates.id, { onDelete: 'cascade' }),
    versionId: (0, pg_core_1.uuid)('version_id')
        .notNull()
        .references(() => exports.promptVersions.id, { onDelete: 'cascade' }),
    executedAt: (0, pg_core_1.timestamp)('executed_at').defaultNow().notNull(),
    success: (0, pg_core_1.boolean)('success').notNull(),
    responseTime: (0, pg_core_1.integer)('response_time').notNull(), // in ms
    tokenUsage: (0, pg_core_1.integer)('token_usage'),
    variables: (0, pg_core_1.jsonb)('variables').$type().default({}).notNull(),
    result: (0, pg_core_1.jsonb)('result'), // Store the actual response
    error: (0, pg_core_1.text)('error'),
});
// =============================================================================
// RELATIONS
// =============================================================================
exports.promptTemplatesRelations = (0, drizzle_orm_1.relations)(exports.promptTemplates, ({ many }) => ({
    versions: many(exports.promptVersions),
    executions: many(exports.promptExecutionResults),
}));
exports.promptVersionsRelations = (0, drizzle_orm_1.relations)(exports.promptVersions, ({ one, many }) => ({
    template: one(exports.promptTemplates, {
        fields: [exports.promptVersions.templateId],
        references: [exports.promptTemplates.id],
    }),
    executions: many(exports.promptExecutionResults),
}));
exports.promptExecutionResultsRelations = (0, drizzle_orm_1.relations)(exports.promptExecutionResults, ({ one }) => ({
    template: one(exports.promptTemplates, {
        fields: [exports.promptExecutionResults.templateId],
        references: [exports.promptTemplates.id],
    }),
    version: one(exports.promptVersions, {
        fields: [exports.promptExecutionResults.versionId],
        references: [exports.promptVersions.id],
    }),
}));
//# sourceMappingURL=prompt-templates.js.map