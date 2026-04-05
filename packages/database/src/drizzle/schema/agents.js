"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentPromptVersionsRelations = exports.agentDirectoryEntriesRelations = exports.agentMetricsRelations = exports.agentOnboardingEventsRelations = exports.agentCapabilityRegistryRelations = exports.agentRegistrationsRelations = exports.agentNftsRelations = exports.agentMetadataRelations = exports.agentsRelations = exports.agentMetrics = exports.agentPromptVersions = exports.agentDirectoryEntries = exports.agentOnboardingEvents = exports.agentCapabilityRegistry = exports.agentRegistrations = exports.agentNfts = exports.agentMetadata = exports.agents = void 0;
/**
 * Drizzle ORM Schema - Agent System
 */
const drizzle_orm_1 = require("drizzle-orm");
const pg_core_1 = require("drizzle-orm/pg-core");
const enums_1 = require("./enums");
const users_1 = require("./users");
// =============================================================================
// AGENT
// =============================================================================
exports.agents = (0, pg_core_1.pgTable)('agents', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    type: (0, enums_1.agentTypeEnum)('type').notNull(),
    status: (0, enums_1.agentStatusEnum)('status').default('INACTIVE').notNull(),
    description: (0, pg_core_1.text)('description'),
    systemPrompt: (0, pg_core_1.text)('system_prompt'),
    config: (0, pg_core_1.jsonb)('config'),
    capabilities: (0, pg_core_1.jsonb)('capabilities').$type().default([]).notNull(),
    provider: (0, pg_core_1.varchar)('provider', { length: 100 }).default('default').notNull(),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => users_1.users.id, { onDelete: 'cascade' }),
    // Agent self-describing profile (about me, personality, capabilities description)
    profile: (0, pg_core_1.jsonb)('profile').$type().default({}),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
    deletedAt: (0, pg_core_1.timestamp)('deleted_at'),
});
// =============================================================================
// AGENT METADATA
// =============================================================================
exports.agentMetadata = (0, pg_core_1.pgTable)('agent_metadata', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    agentId: (0, pg_core_1.uuid)('agent_id')
        .unique()
        .notNull()
        .references(() => exports.agents.id, { onDelete: 'cascade' }),
    metadata: (0, pg_core_1.jsonb)('metadata').default({}).notNull(),
    version: (0, pg_core_1.varchar)('version', { length: 20 }).default('1.0.0').notNull(),
    config: (0, pg_core_1.jsonb)('config'),
});
// =============================================================================
// AGENT NFT
// =============================================================================
exports.agentNfts = (0, pg_core_1.pgTable)('agent_nfts', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    agentId: (0, pg_core_1.uuid)('agent_id')
        .unique()
        .notNull()
        .references(() => exports.agents.id),
    tokenId: (0, pg_core_1.integer)('token_id').unique().notNull(),
    contractAddress: (0, pg_core_1.varchar)('contract_address', { length: 100 }).notNull(),
    smartAccountAddress: (0, pg_core_1.varchar)('smart_account_address', { length: 100 }),
    isFractionalized: (0, pg_core_1.boolean)('is_fractionalized').default(false).notNull(),
    totalShares: (0, pg_core_1.integer)('total_shares').default(0).notNull(),
    metadataUri: (0, pg_core_1.text)('metadata_uri'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
// =============================================================================
// AGENT REGISTRATION
// =============================================================================
exports.agentRegistrations = (0, pg_core_1.pgTable)('agent_registrations', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    // Indexed for faster agent lookups (see migration: 20240725120000_add_performance_indexes.sql)
    agentId: (0, pg_core_1.uuid)('agent_id')
        .notNull()
        .references(() => exports.agents.id, { onDelete: 'cascade' }),
    encryptedAuthToken: (0, pg_core_1.varchar)('encrypted_auth_token', { length: 1024 }).unique().notNull(),
    registrationData: (0, pg_core_1.jsonb)('registration_data').notNull(),
    verificationStatus: (0, pg_core_1.varchar)('verification_status', { length: 50 }).default('PENDING').notNull(),
    onboardingStatus: (0, pg_core_1.varchar)('onboarding_status', { length: 50 }).default('INITIALIZED').notNull(),
    onboardingProgress: (0, pg_core_1.real)('onboarding_progress').default(0).notNull(),
    heartbeatInterval: (0, pg_core_1.integer)('heartbeat_interval').default(60000).notNull(),
    isOnline: (0, pg_core_1.boolean)('is_online').default(false).notNull(),
    lastHeartbeat: (0, pg_core_1.timestamp)('last_heartbeat'),
    metadata: (0, pg_core_1.jsonb)('metadata'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
// =============================================================================
// AGENT CAPABILITY REGISTRY
// =============================================================================
exports.agentCapabilityRegistry = (0, pg_core_1.pgTable)('agent_capability_registry', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    registrationId: (0, pg_core_1.uuid)('registration_id')
        .notNull()
        .references(() => exports.agentRegistrations.id, { onDelete: 'cascade' }),
    capabilityName: (0, pg_core_1.varchar)('capability_name', { length: 255 }).notNull(),
    capabilityType: (0, pg_core_1.varchar)('capability_type', { length: 100 }).notNull(),
    version: (0, pg_core_1.varchar)('version', { length: 20 }).notNull(),
    description: (0, pg_core_1.text)('description'),
    parameters: (0, pg_core_1.jsonb)('parameters'),
    verificationStatus: (0, pg_core_1.varchar)('verification_status', { length: 50 }).default('PENDING').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
// =============================================================================
// AGENT ONBOARDING EVENT
// =============================================================================
exports.agentOnboardingEvents = (0, pg_core_1.pgTable)('agent_onboarding_events', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    registrationId: (0, pg_core_1.uuid)('registration_id')
        .notNull()
        .references(() => exports.agentRegistrations.id, { onDelete: 'cascade' }),
    eventType: (0, pg_core_1.varchar)('event_type', { length: 100 }).notNull(),
    message: (0, pg_core_1.text)('message').notNull(),
    eventData: (0, pg_core_1.jsonb)('event_data'),
    timestamp: (0, pg_core_1.timestamp)('timestamp').defaultNow().notNull(),
});
// =============================================================================
// AGENT DIRECTORY ENTRY
// =============================================================================
exports.agentDirectoryEntries = (0, pg_core_1.pgTable)('agent_directory_entries', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    agentId: (0, pg_core_1.uuid)('agent_id')
        .unique()
        .notNull()
        .references(() => exports.agents.id, { onDelete: 'cascade' }),
    displayName: (0, pg_core_1.varchar)('display_name', { length: 255 }).notNull(),
    description: (0, pg_core_1.text)('description'),
    category: (0, pg_core_1.varchar)('category', { length: 100 }).notNull(),
    tags: (0, pg_core_1.jsonb)('tags').$type().default([]).notNull(),
    isPublic: (0, pg_core_1.boolean)('is_public').default(false).notNull(),
    isVerified: (0, pg_core_1.boolean)('is_verified').default(false).notNull(),
    featured: (0, pg_core_1.boolean)('featured').default(false).notNull(),
    rating: (0, pg_core_1.real)('rating').default(0).notNull(),
    usageCount: (0, pg_core_1.integer)('usage_count').default(0).notNull(),
    lastActiveAt: (0, pg_core_1.timestamp)('last_active_at').defaultNow(),
    searchableData: (0, pg_core_1.text)('searchable_data'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
// =============================================================================
// AGENT PROMPT VERSION
// =============================================================================
exports.agentPromptVersions = (0, pg_core_1.pgTable)('agent_prompt_versions', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    agentId: (0, pg_core_1.uuid)('agent_id')
        .notNull()
        .references(() => exports.agents.id, { onDelete: 'cascade' }),
    versionNumber: (0, pg_core_1.integer)('version_number').notNull(),
    instruction: (0, pg_core_1.text)('instruction').notNull(),
    exemplars: (0, pg_core_1.jsonb)('exemplars'),
    performanceMetrics: (0, pg_core_1.jsonb)('performance_metrics'),
    massStage: (0, pg_core_1.varchar)('mass_stage', { length: 50 }),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
// =============================================================================
// AGENT METRICS
// =============================================================================
exports.agentMetrics = (0, pg_core_1.pgTable)('agent_metrics', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    registrationId: (0, pg_core_1.uuid)('registration_id')
        .notNull()
        .references(() => exports.agentRegistrations.id, { onDelete: 'cascade' }),
    metricType: (0, pg_core_1.varchar)('metric_type', { length: 100 }).notNull(),
    value: (0, pg_core_1.real)('value').notNull(),
    unit: (0, pg_core_1.varchar)('unit', { length: 50 }),
    tags: (0, pg_core_1.jsonb)('tags').default({}),
    timestamp: (0, pg_core_1.timestamp)('timestamp').defaultNow().notNull(),
});
// =============================================================================
// RELATIONS
// =============================================================================
exports.agentsRelations = (0, drizzle_orm_1.relations)(exports.agents, ({ one, many }) => ({
    user: one(users_1.users, {
        fields: [exports.agents.userId],
        references: [users_1.users.id],
    }),
    metadata: one(exports.agentMetadata),
    nft: one(exports.agentNfts),
    registrations: many(exports.agentRegistrations),
    directoryEntry: one(exports.agentDirectoryEntries),
    promptVersions: many(exports.agentPromptVersions),
}));
exports.agentMetadataRelations = (0, drizzle_orm_1.relations)(exports.agentMetadata, ({ one }) => ({
    agent: one(exports.agents, {
        fields: [exports.agentMetadata.agentId],
        references: [exports.agents.id],
    }),
}));
exports.agentNftsRelations = (0, drizzle_orm_1.relations)(exports.agentNfts, ({ one, many }) => ({
    agent: one(exports.agents, {
        fields: [exports.agentNfts.agentId],
        references: [exports.agents.id],
    }),
}));
exports.agentRegistrationsRelations = (0, drizzle_orm_1.relations)(exports.agentRegistrations, ({ one, many }) => ({
    agent: one(exports.agents, {
        fields: [exports.agentRegistrations.agentId],
        references: [exports.agents.id],
    }),
    capabilities: many(exports.agentCapabilityRegistry),
    onboardingEvents: many(exports.agentOnboardingEvents),
    metrics: many(exports.agentMetrics),
}));
exports.agentCapabilityRegistryRelations = (0, drizzle_orm_1.relations)(exports.agentCapabilityRegistry, ({ one }) => ({
    registration: one(exports.agentRegistrations, {
        fields: [exports.agentCapabilityRegistry.registrationId],
        references: [exports.agentRegistrations.id],
    }),
}));
exports.agentOnboardingEventsRelations = (0, drizzle_orm_1.relations)(exports.agentOnboardingEvents, ({ one }) => ({
    registration: one(exports.agentRegistrations, {
        fields: [exports.agentOnboardingEvents.registrationId],
        references: [exports.agentRegistrations.id],
    }),
}));
exports.agentMetricsRelations = (0, drizzle_orm_1.relations)(exports.agentMetrics, ({ one }) => ({
    registration: one(exports.agentRegistrations, {
        fields: [exports.agentMetrics.registrationId],
        references: [exports.agentRegistrations.id],
    }),
}));
exports.agentDirectoryEntriesRelations = (0, drizzle_orm_1.relations)(exports.agentDirectoryEntries, ({ one }) => ({
    agent: one(exports.agents, {
        fields: [exports.agentDirectoryEntries.agentId],
        references: [exports.agents.id],
    }),
}));
exports.agentPromptVersionsRelations = (0, drizzle_orm_1.relations)(exports.agentPromptVersions, ({ one }) => ({
    agent: one(exports.agents, {
        fields: [exports.agentPromptVersions.agentId],
        references: [exports.agents.id],
    }),
}));
//# sourceMappingURL=agents.js.map