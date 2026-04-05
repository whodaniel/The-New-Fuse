"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.julesUsageLogsRelations = exports.julesSessionsRelations = exports.julesConfigsRelations = exports.julesUsageLogs = exports.julesSessions = exports.julesConfigs = exports.julesSessionStatusEnum = exports.julesConfigTypeEnum = void 0;
/**
 * Drizzle ORM Schema - Jules Integration
 * Manages Jules (Google's coding agent) configurations, sessions, and usage tracking
 */
const drizzle_orm_1 = require("drizzle-orm");
const pg_core_1 = require("drizzle-orm/pg-core");
const agents_1 = require("./agents");
const tasks_1 = require("./tasks");
const users_1 = require("./users");
// =============================================================================
// JULES-SPECIFIC ENUMS
// =============================================================================
exports.julesConfigTypeEnum = (0, pg_core_1.pgEnum)('jules_config_type', [
    'DISABLED',
    'BYOK', // Bring Your Own Key - customer provides their own Jules API key
    'PLATFORM', // Use platform's Jules API key
]);
exports.julesSessionStatusEnum = (0, pg_core_1.pgEnum)('jules_session_status', [
    'PENDING',
    'IN_PROGRESS',
    'NEEDS_APPROVAL',
    'USER_INPUT_REQUIRED',
    'COMPLETED',
    'FAILED',
    'CANCELLED',
]);
// =============================================================================
// JULES_CONFIGS
// Multi-tenant Jules configuration (API keys, webhooks, preferences)
// =============================================================================
exports.julesConfigs = (0, pg_core_1.pgTable)('jules_configs', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    // Multi-tenant support
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => users_1.users.id, { onDelete: 'cascade' }),
    // Configuration type
    configType: (0, exports.julesConfigTypeEnum)('config_type').default('DISABLED').notNull(),
    // BYOK: encrypted API key (customer's own Jules key)
    apiKeyEncrypted: (0, pg_core_1.text)('api_key_encrypted'),
    // Webhook configuration
    webhookSecret: (0, pg_core_1.varchar)('webhook_secret', { length: 255 }),
    // Preferences
    preferences: (0, pg_core_1.jsonb)('preferences').$type(),
    // Audit
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
    deletedAt: (0, pg_core_1.timestamp)('deleted_at'),
});
// =============================================================================
// JULES_SESSIONS
// Links TNF tasks to Jules sessions with status tracking
// =============================================================================
exports.julesSessions = (0, pg_core_1.pgTable)('jules_sessions', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    // Jules session ID (from Jules API)
    julesSessionId: (0, pg_core_1.varchar)('jules_session_id', { length: 255 }).unique().notNull(),
    // Link to TNF task
    taskId: (0, pg_core_1.uuid)('task_id')
        .notNull()
        .references(() => tasks_1.tasks.id, { onDelete: 'cascade' }),
    // Which agent delegated this task to Jules
    delegatedByAgentId: (0, pg_core_1.uuid)('delegated_by_agent_id')
        .notNull()
        .references(() => agents_1.agents.id),
    // Multi-tenant support
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => users_1.users.id, { onDelete: 'cascade' }),
    // Session status
    status: (0, exports.julesSessionStatusEnum)('status').default('PENDING').notNull(),
    // Session metadata
    metadata: (0, pg_core_1.jsonb)('metadata').$type(),
    // Result from Jules
    result: (0, pg_core_1.jsonb)('result'),
    error: (0, pg_core_1.text)('error'),
    // Timing
    startedAt: (0, pg_core_1.timestamp)('started_at'),
    completedAt: (0, pg_core_1.timestamp)('completed_at'),
    // Audit
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
    deletedAt: (0, pg_core_1.timestamp)('deleted_at'),
});
// =============================================================================
// JULES_USAGE_LOGS
// Usage tracking for billing (BYOK vs platform key)
// =============================================================================
exports.julesUsageLogs = (0, pg_core_1.pgTable)('jules_usage_logs', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    // Link to session
    sessionId: (0, pg_core_1.uuid)('session_id')
        .notNull()
        .references(() => exports.julesSessions.id, { onDelete: 'cascade' }),
    // Multi-tenant support
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => users_1.users.id, { onDelete: 'cascade' }),
    // Usage type (for billing)
    usageType: (0, pg_core_1.varchar)('usage_type', { length: 50 }).notNull(), // 'BYOK' or 'PLATFORM'
    // Metrics
    metrics: (0, pg_core_1.jsonb)('metrics').$type(),
    // Audit
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
// =============================================================================
// RELATIONS
// =============================================================================
exports.julesConfigsRelations = (0, drizzle_orm_1.relations)(exports.julesConfigs, ({ one }) => ({
    user: one(users_1.users, {
        fields: [exports.julesConfigs.userId],
        references: [users_1.users.id],
    }),
}));
exports.julesSessionsRelations = (0, drizzle_orm_1.relations)(exports.julesSessions, ({ one }) => ({
    task: one(tasks_1.tasks, {
        fields: [exports.julesSessions.taskId],
        references: [tasks_1.tasks.id],
    }),
    delegatedByAgent: one(agents_1.agents, {
        fields: [exports.julesSessions.delegatedByAgentId],
        references: [agents_1.agents.id],
    }),
    user: one(users_1.users, {
        fields: [exports.julesSessions.userId],
        references: [users_1.users.id],
    }),
}));
exports.julesUsageLogsRelations = (0, drizzle_orm_1.relations)(exports.julesUsageLogs, ({ one }) => ({
    session: one(exports.julesSessions, {
        fields: [exports.julesUsageLogs.sessionId],
        references: [exports.julesSessions.id],
    }),
    user: one(users_1.users, {
        fields: [exports.julesUsageLogs.userId],
        references: [users_1.users.id],
    }),
}));
//# sourceMappingURL=jules.js.map