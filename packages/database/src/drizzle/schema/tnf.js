"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tnfSessionMcpsRelations = exports.tnfAgentSessionsRelations = exports.tnfAgentDefinitionsRelations = exports.tnfMcpServersRelations = exports.tnfHarnessesRelations = exports.tnfLlmModelsRelations = exports.tnfSessionMcps = exports.tnfAgentSessions = exports.tnfAgentDefinitions = exports.tnfMcpServers = exports.tnfHarnesses = exports.tnfLlmModels = exports.tnfAccessLevelEnum = exports.tnfSessionStatusEnum = exports.tnfEntityStatusEnum = exports.tnfScopeEnum = void 0;
/**
 * Drizzle ORM Schema - TNF Entity ID Taxonomy V2
 *
 * Modular Entity Classification System:
 * - LLM Models (base/foundational entities)
 * - Harnesses (execution environments)
 * - MCP Servers (tools/services)
 * - Agent Definitions (templates/personas)
 * - Agent Sessions (runtime instances)
 *
 * Reference: docs/TNF_ENTITY_ID_TAXONOMY_V2.md
 */
const drizzle_orm_1 = require("drizzle-orm");
const pg_core_1 = require("drizzle-orm/pg-core");
const users_1 = require("./users");
// =============================================================================
// ENUMS FOR TNF V2
// =============================================================================
exports.tnfScopeEnum = (0, pg_core_1.pgEnum)('TNFScope', [
    'base', // Foundational/canonical (LLM models, protocols)
    'sys', // System-level infrastructure
    'usr', // User-created or configurable
    'ext', // External/third-party
]);
exports.tnfEntityStatusEnum = (0, pg_core_1.pgEnum)('TNFEntityStatus', [
    'active',
    'inactive',
    'deprecated',
    'offline',
    'available',
    'unavailable',
]);
exports.tnfSessionStatusEnum = (0, pg_core_1.pgEnum)('TNFSessionStatus', [
    'initializing',
    'active',
    'idle',
    'busy',
    'error',
    'terminated',
]);
exports.tnfAccessLevelEnum = (0, pg_core_1.pgEnum)('TNFAccessLevel', [
    'superadmin',
    'admin',
    'dev',
    'user',
    'guest',
]);
// =============================================================================
// TNF LLM MODELS - Base LLM Model Registry
// =============================================================================
exports.tnfLlmModels = (0, pg_core_1.pgTable)('tnf_llm_models', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    tnfId: (0, pg_core_1.varchar)('tnf_id', { length: 255 }).unique().notNull(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    provider: (0, pg_core_1.varchar)('provider', { length: 100 }).notNull(),
    modelId: (0, pg_core_1.varchar)('model_id', { length: 255 }).notNull(),
    family: (0, pg_core_1.varchar)('family', { length: 100 }).notNull(),
    version: (0, pg_core_1.varchar)('version', { length: 50 }),
    contextWindow: (0, pg_core_1.integer)('context_window'),
    supportsVision: (0, pg_core_1.boolean)('supports_vision').default(false).notNull(),
    supportsTools: (0, pg_core_1.boolean)('supports_tools').default(false).notNull(),
    supportsStreaming: (0, pg_core_1.boolean)('supports_streaming').default(true).notNull(),
    supportsMultimodal: (0, pg_core_1.boolean)('supports_multimodal').default(false).notNull(),
    inputCostPer1m: (0, pg_core_1.integer)('input_cost_per_1m_cents'),
    outputCostPer1m: (0, pg_core_1.integer)('output_cost_per_1m_cents'),
    isCurrent: (0, pg_core_1.boolean)('is_current').default(true).notNull(),
    supersededBy: (0, pg_core_1.uuid)('superseded_by'),
    apiEndpoints: (0, pg_core_1.jsonb)('api_endpoints').$type().default([]),
    authMethod: (0, pg_core_1.varchar)('auth_method', { length: 50 }),
    metadata: (0, pg_core_1.jsonb)('metadata'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
// =============================================================================
// TNF HARNESSES - Execution Environment Registry
// =============================================================================
exports.tnfHarnesses = (0, pg_core_1.pgTable)('tnf_harnesses', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    tnfId: (0, pg_core_1.varchar)('tnf_id', { length: 255 }).unique().notNull(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    platform: (0, pg_core_1.varchar)('platform', { length: 100 }).notNull(),
    version: (0, pg_core_1.varchar)('version', { length: 50 }),
    instance: (0, pg_core_1.varchar)('instance', { length: 100 }),
    environment: (0, pg_core_1.varchar)('environment', { length: 50 }).notNull(),
    endpointUrl: (0, pg_core_1.text)('endpoint_url'),
    wsUrl: (0, pg_core_1.text)('ws_url'),
    accessLevel: (0, exports.tnfAccessLevelEnum)('access_level').default('user').notNull(),
    features: (0, pg_core_1.jsonb)('features').$type().default([]),
    allowedModelIds: (0, pg_core_1.jsonb)('allowed_model_ids').$type().default([]),
    status: (0, exports.tnfEntityStatusEnum)('status').default('offline').notNull(),
    ownerId: (0, pg_core_1.uuid)('owner_id').references(() => users_1.users.id),
    metadata: (0, pg_core_1.jsonb)('metadata'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
// =============================================================================
// TNF MCP SERVERS - MCP Server Registry
// =============================================================================
exports.tnfMcpServers = (0, pg_core_1.pgTable)('tnf_mcp_servers', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    tnfId: (0, pg_core_1.varchar)('tnf_id', { length: 255 }).unique().notNull(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    description: (0, pg_core_1.text)('description'),
    protocol: (0, pg_core_1.varchar)('protocol', { length: 50 }).default('stdio').notNull(),
    transport: (0, pg_core_1.varchar)('transport', { length: 100 }),
    command: (0, pg_core_1.text)('command'),
    args: (0, pg_core_1.jsonb)('args').$type().default([]),
    env: (0, pg_core_1.jsonb)('env').$type().default({}),
    endpointUrl: (0, pg_core_1.text)('endpoint_url'),
    tools: (0, pg_core_1.jsonb)('tools').$type().default([]),
    resources: (0, pg_core_1.jsonb)('resources').$type().default([]),
    authMethod: (0, pg_core_1.varchar)('auth_method', { length: 50 }),
    status: (0, exports.tnfEntityStatusEnum)('status').default('available').notNull(),
    scope: (0, exports.tnfScopeEnum)('scope').default('usr').notNull(),
    ownerId: (0, pg_core_1.uuid)('owner_id').references(() => users_1.users.id),
    metadata: (0, pg_core_1.jsonb)('metadata'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
// =============================================================================
// TNF AGENT DEFINITIONS - Agent Templates / Personas
// =============================================================================
exports.tnfAgentDefinitions = (0, pg_core_1.pgTable)('tnf_agent_definitions', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    tnfId: (0, pg_core_1.varchar)('tnf_id', { length: 255 }).unique().notNull(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    description: (0, pg_core_1.text)('description'),
    definitionSource: (0, pg_core_1.text)('definition_source'),
    definitionFormat: (0, pg_core_1.varchar)('definition_format', { length: 20 }),
    systemPrompt: (0, pg_core_1.text)('system_prompt'),
    personaSource: (0, pg_core_1.text)('persona_source'),
    avatarUrl: (0, pg_core_1.text)('avatar_url'),
    defaultLlmId: (0, pg_core_1.uuid)('default_llm_id').references(() => exports.tnfLlmModels.id),
    defaultHarnessId: (0, pg_core_1.uuid)('default_harness_id').references(() => exports.tnfHarnesses.id),
    skills: (0, pg_core_1.jsonb)('skills').$type().default([]),
    capabilities: (0, pg_core_1.jsonb)('capabilities').$type().default([]),
    tags: (0, pg_core_1.jsonb)('tags').$type().default([]),
    mcpIds: (0, pg_core_1.jsonb)('mcp_ids').$type().default([]),
    agentType: (0, pg_core_1.varchar)('agent_type', { length: 50 }).default('GENERIC').notNull(),
    accessLevel: (0, exports.tnfAccessLevelEnum)('access_level').default('user').notNull(),
    isSystem: (0, pg_core_1.boolean)('is_system').default(false).notNull(),
    ownerId: (0, pg_core_1.uuid)('owner_id').references(() => users_1.users.id),
    version: (0, pg_core_1.varchar)('version', { length: 50 }).default('1.0.0').notNull(),
    metadata: (0, pg_core_1.jsonb)('metadata'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
// =============================================================================
// TNF AGENT SESSIONS - Runtime Instances
// =============================================================================
exports.tnfAgentSessions = (0, pg_core_1.pgTable)('tnf_agent_sessions', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    tnfId: (0, pg_core_1.varchar)('tnf_id', { length: 255 }).unique().notNull(),
    agentDefId: (0, pg_core_1.uuid)('agent_def_id')
        .notNull()
        .references(() => exports.tnfAgentDefinitions.id),
    activeLlmId: (0, pg_core_1.uuid)('active_llm_id').references(() => exports.tnfLlmModels.id),
    harnessId: (0, pg_core_1.uuid)('harness_id').references(() => exports.tnfHarnesses.id),
    userId: (0, pg_core_1.uuid)('user_id').references(() => users_1.users.id),
    status: (0, exports.tnfSessionStatusEnum)('status').default('initializing').notNull(),
    configOverrides: (0, pg_core_1.jsonb)('config_overrides'),
    startedAt: (0, pg_core_1.timestamp)('started_at').defaultNow().notNull(),
    lastHeartbeat: (0, pg_core_1.timestamp)('last_heartbeat'),
    terminatedAt: (0, pg_core_1.timestamp)('terminated_at'),
    metadata: (0, pg_core_1.jsonb)('metadata'),
});
// =============================================================================
// TNF SESSION MCPs - Junction Table (Session -> MCPs)
// =============================================================================
exports.tnfSessionMcps = (0, pg_core_1.pgTable)('tnf_session_mcps', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    sessionId: (0, pg_core_1.uuid)('session_id')
        .notNull()
        .references(() => exports.tnfAgentSessions.id, { onDelete: 'cascade' }),
    mcpId: (0, pg_core_1.uuid)('mcp_id')
        .notNull()
        .references(() => exports.tnfMcpServers.id),
});
// =============================================================================
// RELATIONS
// =============================================================================
exports.tnfLlmModelsRelations = (0, drizzle_orm_1.relations)(exports.tnfLlmModels, ({ one, many }) => ({
    supersededByModel: one(exports.tnfLlmModels, {
        fields: [exports.tnfLlmModels.supersededBy],
        references: [exports.tnfLlmModels.id],
        relationName: 'superseded_by',
    }),
    agentDefinitions: many(exports.tnfAgentDefinitions),
    sessions: many(exports.tnfAgentSessions),
}));
exports.tnfHarnessesRelations = (0, drizzle_orm_1.relations)(exports.tnfHarnesses, ({ one, many }) => ({
    owner: one(users_1.users, {
        fields: [exports.tnfHarnesses.ownerId],
        references: [users_1.users.id],
    }),
    agentDefinitions: many(exports.tnfAgentDefinitions),
    sessions: many(exports.tnfAgentSessions),
}));
exports.tnfMcpServersRelations = (0, drizzle_orm_1.relations)(exports.tnfMcpServers, ({ one, many }) => ({
    owner: one(users_1.users, {
        fields: [exports.tnfMcpServers.ownerId],
        references: [users_1.users.id],
    }),
    sessions: many(exports.tnfSessionMcps),
}));
exports.tnfAgentDefinitionsRelations = (0, drizzle_orm_1.relations)(exports.tnfAgentDefinitions, ({ one, many }) => ({
    defaultLlm: one(exports.tnfLlmModels, {
        fields: [exports.tnfAgentDefinitions.defaultLlmId],
        references: [exports.tnfLlmModels.id],
    }),
    defaultHarness: one(exports.tnfHarnesses, {
        fields: [exports.tnfAgentDefinitions.defaultHarnessId],
        references: [exports.tnfHarnesses.id],
    }),
    owner: one(users_1.users, {
        fields: [exports.tnfAgentDefinitions.ownerId],
        references: [users_1.users.id],
    }),
    sessions: many(exports.tnfAgentSessions),
}));
exports.tnfAgentSessionsRelations = (0, drizzle_orm_1.relations)(exports.tnfAgentSessions, ({ one, many }) => ({
    agentDefinition: one(exports.tnfAgentDefinitions, {
        fields: [exports.tnfAgentSessions.agentDefId],
        references: [exports.tnfAgentDefinitions.id],
    }),
    activeLlm: one(exports.tnfLlmModels, {
        fields: [exports.tnfAgentSessions.activeLlmId],
        references: [exports.tnfLlmModels.id],
    }),
    harness: one(exports.tnfHarnesses, {
        fields: [exports.tnfAgentSessions.harnessId],
        references: [exports.tnfHarnesses.id],
    }),
    user: one(users_1.users, {
        fields: [exports.tnfAgentSessions.userId],
        references: [users_1.users.id],
    }),
    mcps: many(exports.tnfSessionMcps),
}));
exports.tnfSessionMcpsRelations = (0, drizzle_orm_1.relations)(exports.tnfSessionMcps, ({ one }) => ({
    session: one(exports.tnfAgentSessions, {
        fields: [exports.tnfSessionMcps.sessionId],
        references: [exports.tnfAgentSessions.id],
    }),
    mcp: one(exports.tnfMcpServers, {
        fields: [exports.tnfSessionMcps.mcpId],
        references: [exports.tnfMcpServers.id],
    }),
}));
//# sourceMappingURL=tnf.js.map