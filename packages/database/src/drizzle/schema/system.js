"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationsRelations = exports.notifications = exports.errorLogs = exports.businessMetrics = exports.validationDatasets = exports.llmConfigs = exports.registeredEntities = void 0;
/**
 * Drizzle ORM Schema - Entity Registry, LLM Config, Prompts, Monitoring
 */
const drizzle_orm_1 = require("drizzle-orm");
const pg_core_1 = require("drizzle-orm/pg-core");
const enums_1 = require("./enums");
// =============================================================================
// REGISTERED ENTITY
// =============================================================================
exports.registeredEntities = (0, pg_core_1.pgTable)('registered_entities', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    type: (0, enums_1.registeredEntityTypeEnum)('type').notNull(),
    description: (0, pg_core_1.text)('description'),
    metadata: (0, pg_core_1.jsonb)('metadata'),
    config: (0, pg_core_1.jsonb)('config'),
    status: (0, enums_1.entityStatusEnum)('status').default('ACTIVE').notNull(),
    version: (0, pg_core_1.varchar)('version', { length: 20 }).default('1.0.0').notNull(),
    namespace: (0, pg_core_1.varchar)('namespace', { length: 100 }),
    tags: (0, pg_core_1.jsonb)('tags').$type().default([]).notNull(),
    capabilities: (0, pg_core_1.jsonb)('capabilities').$type().default([]).notNull(),
    dependencies: (0, pg_core_1.jsonb)('dependencies').$type().default([]).notNull(),
    isPublic: (0, pg_core_1.boolean)('is_public').default(false).notNull(),
    ownerId: (0, pg_core_1.uuid)('owner_id'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
    deletedAt: (0, pg_core_1.timestamp)('deleted_at'),
});
// =============================================================================
// LLM CONFIG
// =============================================================================
exports.llmConfigs = (0, pg_core_1.pgTable)('llm_configs', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    provider: (0, pg_core_1.varchar)('provider', { length: 100 }).notNull(),
    modelName: (0, pg_core_1.varchar)('model_name', { length: 255 }).notNull(),
    apiKey: (0, pg_core_1.varchar)('api_key', { length: 512 }).notNull(), // Should be encrypted
    apiEndpoint: (0, pg_core_1.text)('api_endpoint'),
    isCustom: (0, pg_core_1.boolean)('is_custom').default(false).notNull(),
    enabled: (0, pg_core_1.boolean)('enabled').default(true).notNull(),
    priority: (0, pg_core_1.integer)('priority').default(10).notNull(),
    retryConfig: (0, pg_core_1.jsonb)('retry_config'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
    deletedAt: (0, pg_core_1.timestamp)('deleted_at'),
});
// Prompt definitions moved to ./prompt-templates.ts
// =============================================================================
// VALIDATION DATASET
// =============================================================================
exports.validationDatasets = (0, pg_core_1.pgTable)('validation_datasets', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    description: (0, pg_core_1.text)('description'),
    items: (0, pg_core_1.jsonb)('items').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
// =============================================================================
// BUSINESS METRIC
// =============================================================================
exports.businessMetrics = (0, pg_core_1.pgTable)('business_metrics', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    value: (0, pg_core_1.real)('value').notNull(),
    tags: (0, pg_core_1.jsonb)('tags'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
// =============================================================================
// ERROR LOG
// =============================================================================
exports.errorLogs = (0, pg_core_1.pgTable)('error_logs', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    message: (0, pg_core_1.text)('message').notNull(),
    stack: (0, pg_core_1.text)('stack'),
    context: (0, pg_core_1.jsonb)('context'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
// =============================================================================
// NOTIFICATIONS
// =============================================================================
const users_1 = require("./users");
exports.notifications = (0, pg_core_1.pgTable)('notifications', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => users_1.users.id, { onDelete: 'cascade' }),
    type: (0, pg_core_1.varchar)('type', { length: 100 }).notNull(),
    title: (0, pg_core_1.varchar)('title', { length: 255 }).notNull(),
    message: (0, pg_core_1.text)('message').notNull(),
    read: (0, pg_core_1.boolean)('read').default(false).notNull(),
    metadata: (0, pg_core_1.jsonb)('metadata'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
exports.notificationsRelations = (0, drizzle_orm_1.relations)(exports.notifications, ({ one }) => ({
    user: one(users_1.users, {
        fields: [exports.notifications.userId],
        references: [users_1.users.id],
    }),
}));
// =============================================================================
// RELATIONS
// =============================================================================
// Prompt relations moved to ./prompt-templates.ts
//# sourceMappingURL=system.js.map