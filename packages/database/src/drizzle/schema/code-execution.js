"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.codeExecutionUsageRelations = exports.codeExecutionSessions = exports.codeExecutionUsage = void 0;
/**
 * Drizzle ORM Schema - Code Execution System
 */
const drizzle_orm_1 = require("drizzle-orm");
const pg_core_1 = require("drizzle-orm/pg-core");
const agents_1 = require("./agents");
const enums_1 = require("./enums");
// =============================================================================
// CODE EXECUTION USAGE
// =============================================================================
exports.codeExecutionUsage = (0, pg_core_1.pgTable)('code_execution_usage', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    agentId: (0, pg_core_1.uuid)('agent_id')
        .notNull()
        .references(() => agents_1.agents.id),
    clientId: (0, pg_core_1.varchar)('client_id', { length: 255 }).notNull(),
    executionId: (0, pg_core_1.varchar)('execution_id', { length: 255 }).unique().notNull(),
    language: (0, enums_1.codeExecutionLanguageEnum)('language').notNull(),
    code: (0, pg_core_1.text)('code').notNull(),
    result: (0, pg_core_1.jsonb)('result'),
    output: (0, pg_core_1.jsonb)('output'),
    error: (0, pg_core_1.jsonb)('error'),
    executionTime: (0, pg_core_1.integer)('execution_time').notNull(), // in milliseconds
    memoryUsage: (0, pg_core_1.integer)('memory_usage').notNull(), // in bytes
    computeUnits: (0, pg_core_1.real)('compute_units').notNull(),
    cost: (0, pg_core_1.real)('cost').notNull(),
    tier: (0, enums_1.codeExecutionTierEnum)('tier').notNull(),
    environment: (0, pg_core_1.varchar)('environment', { length: 100 }).notNull(),
    status: (0, enums_1.codeExecutionStatusEnum)('status').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    completedAt: (0, pg_core_1.timestamp)('completed_at'),
}, (table) => ({
    agentIdIdx: (0, pg_core_1.index)('code_exec_agent_id_idx').on(table.agentId),
    clientIdIdx: (0, pg_core_1.index)('code_exec_client_id_idx').on(table.clientId),
    createdAtIdx: (0, pg_core_1.index)('code_exec_created_at_idx').on(table.createdAt),
    languageIdx: (0, pg_core_1.index)('code_exec_language_idx').on(table.language),
    tierIdx: (0, pg_core_1.index)('code_exec_tier_idx').on(table.tier),
    statusIdx: (0, pg_core_1.index)('code_exec_status_idx').on(table.status),
}));
// =============================================================================
// CODE EXECUTION SESSION
// =============================================================================
exports.codeExecutionSessions = (0, pg_core_1.pgTable)('code_execution_sessions', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    description: (0, pg_core_1.text)('description'),
    ownerId: (0, pg_core_1.uuid)('owner_id').notNull(),
    collaborators: (0, pg_core_1.jsonb)('collaborators').$type().default([]).notNull(),
    isPublic: (0, pg_core_1.boolean)('is_public').default(false).notNull(),
    files: (0, pg_core_1.jsonb)('files').notNull(),
    environment: (0, pg_core_1.jsonb)('environment').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
    expiresAt: (0, pg_core_1.timestamp)('expires_at'),
    storageUsage: (0, pg_core_1.integer)('storage_usage').default(0).notNull(), // in bytes
});
// =============================================================================
// RELATIONS
// =============================================================================
exports.codeExecutionUsageRelations = (0, drizzle_orm_1.relations)(exports.codeExecutionUsage, ({ one }) => ({
    agent: one(agents_1.agents, {
        fields: [exports.codeExecutionUsage.agentId],
        references: [agents_1.agents.id],
    }),
}));
//# sourceMappingURL=code-execution.js.map