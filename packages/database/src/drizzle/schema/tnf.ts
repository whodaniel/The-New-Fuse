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
import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { users } from './users.js';

// =============================================================================
// ENUMS FOR TNF V2
// =============================================================================

export const tnfScopeEnum = pgEnum('TNFScope', [
  'base', // Foundational/canonical (LLM models, protocols)
  'sys', // System-level infrastructure
  'usr', // User-created or configurable
  'ext', // External/third-party
]);

export const tnfEntityStatusEnum = pgEnum('TNFEntityStatus', [
  'active',
  'inactive',
  'deprecated',
  'offline',
  'available',
  'unavailable',
]);

export const tnfSessionStatusEnum = pgEnum('TNFSessionStatus', [
  'initializing',
  'active',
  'idle',
  'busy',
  'error',
  'terminated',
]);

export const tnfAccessLevelEnum = pgEnum('TNFAccessLevel', [
  'superadmin',
  'admin',
  'dev',
  'user',
  'guest',
]);

// =============================================================================
// TNF LLM MODELS - Base LLM Model Registry
// =============================================================================

export const tnfLlmModels = pgTable('tnf_llm_models', {
  id: uuid('id').primaryKey().defaultRandom(),
  tnfId: varchar('tnf_id', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  provider: varchar('provider', { length: 100 }).notNull(),
  modelId: varchar('model_id', { length: 255 }).notNull(),
  family: varchar('family', { length: 100 }).notNull(),
  version: varchar('version', { length: 50 }),
  contextWindow: integer('context_window'),
  supportsVision: boolean('supports_vision').default(false).notNull(),
  supportsTools: boolean('supports_tools').default(false).notNull(),
  supportsStreaming: boolean('supports_streaming').default(true).notNull(),
  supportsMultimodal: boolean('supports_multimodal').default(false).notNull(),
  inputCostPer1m: integer('input_cost_per_1m_cents'),
  outputCostPer1m: integer('output_cost_per_1m_cents'),
  isCurrent: boolean('is_current').default(true).notNull(),
  supersededBy: uuid('superseded_by'),
  apiEndpoints: jsonb('api_endpoints').$type<string[]>().default([]),
  authMethod: varchar('auth_method', { length: 50 }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =============================================================================
// TNF HARNESSES - Execution Environment Registry
// =============================================================================

export const tnfHarnesses = pgTable('tnf_harnesses', {
  id: uuid('id').primaryKey().defaultRandom(),
  tnfId: varchar('tnf_id', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  platform: varchar('platform', { length: 100 }).notNull(),
  version: varchar('version', { length: 50 }),
  instance: varchar('instance', { length: 100 }),
  environment: varchar('environment', { length: 50 }).notNull(),
  endpointUrl: text('endpoint_url'),
  wsUrl: text('ws_url'),
  accessLevel: tnfAccessLevelEnum('access_level').default('user').notNull(),
  features: jsonb('features').$type<string[]>().default([]),
  allowedModelIds: jsonb('allowed_model_ids').$type<string[]>().default([]),
  status: tnfEntityStatusEnum('status').default('offline').notNull(),
  ownerId: uuid('owner_id').references(() => users.id),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =============================================================================
// TNF MCP SERVERS - MCP Server Registry
// =============================================================================

export const tnfMcpServers = pgTable('tnf_mcp_servers', {
  id: uuid('id').primaryKey().defaultRandom(),
  tnfId: varchar('tnf_id', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  protocol: varchar('protocol', { length: 50 }).default('stdio').notNull(),
  transport: varchar('transport', { length: 100 }),
  command: text('command'),
  args: jsonb('args').$type<string[]>().default([]),
  env: jsonb('env').$type<Record<string, string>>().default({}),
  endpointUrl: text('endpoint_url'),
  tools: jsonb('tools').$type<string[]>().default([]),
  resources: jsonb('resources').$type<string[]>().default([]),
  authMethod: varchar('auth_method', { length: 50 }),
  status: tnfEntityStatusEnum('status').default('available').notNull(),
  scope: tnfScopeEnum('scope').default('usr').notNull(),
  ownerId: uuid('owner_id').references(() => users.id),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =============================================================================
// TNF AGENT DEFINITIONS - Agent Templates / Personas
// =============================================================================

export const tnfAgentDefinitions = pgTable('tnf_agent_definitions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tnfId: varchar('tnf_id', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  definitionSource: text('definition_source'),
  definitionFormat: varchar('definition_format', { length: 20 }),
  systemPrompt: text('system_prompt'),
  personaSource: text('persona_source'),
  avatarUrl: text('avatar_url'),
  defaultLlmId: uuid('default_llm_id').references(() => tnfLlmModels.id),
  defaultHarnessId: uuid('default_harness_id').references(() => tnfHarnesses.id),
  skills: jsonb('skills').$type<string[]>().default([]),
  capabilities: jsonb('capabilities').$type<string[]>().default([]),
  tags: jsonb('tags').$type<string[]>().default([]),
  mcpIds: jsonb('mcp_ids').$type<string[]>().default([]),
  agentType: varchar('agent_type', { length: 50 }).default('GENERIC').notNull(),
  accessLevel: tnfAccessLevelEnum('access_level').default('user').notNull(),
  isSystem: boolean('is_system').default(false).notNull(),
  ownerId: uuid('owner_id').references(() => users.id),
  version: varchar('version', { length: 50 }).default('1.0.0').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =============================================================================
// TNF AGENT SESSIONS - Runtime Instances
// =============================================================================

export const tnfAgentSessions = pgTable('tnf_agent_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tnfId: varchar('tnf_id', { length: 255 }).unique().notNull(),
  agentDefId: uuid('agent_def_id')
    .notNull()
    .references(() => tnfAgentDefinitions.id),
  activeLlmId: uuid('active_llm_id').references(() => tnfLlmModels.id),
  harnessId: uuid('harness_id').references(() => tnfHarnesses.id),
  userId: uuid('user_id').references(() => users.id),
  status: tnfSessionStatusEnum('status').default('initializing').notNull(),
  configOverrides: jsonb('config_overrides'),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  lastHeartbeat: timestamp('last_heartbeat'),
  terminatedAt: timestamp('terminated_at'),
  metadata: jsonb('metadata'),
});

// =============================================================================
// TNF SESSION MCPs - Junction Table (Session -> MCPs)
// =============================================================================

export const tnfSessionMcps = pgTable('tnf_session_mcps', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id')
    .notNull()
    .references(() => tnfAgentSessions.id, { onDelete: 'cascade' }),
  mcpId: uuid('mcp_id')
    .notNull()
    .references(() => tnfMcpServers.id),
});

// =============================================================================
// RELATIONS
// =============================================================================

export const tnfLlmModelsRelations = relations(tnfLlmModels, ({ one, many }) => ({
  supersededByModel: one(tnfLlmModels, {
    fields: [tnfLlmModels.supersededBy],
    references: [tnfLlmModels.id],
    relationName: 'superseded_by',
  }),
  agentDefinitions: many(tnfAgentDefinitions),
  sessions: many(tnfAgentSessions),
}));

export const tnfHarnessesRelations = relations(tnfHarnesses, ({ one, many }) => ({
  owner: one(users, {
    fields: [tnfHarnesses.ownerId],
    references: [users.id],
  }),
  agentDefinitions: many(tnfAgentDefinitions),
  sessions: many(tnfAgentSessions),
}));

export const tnfMcpServersRelations = relations(tnfMcpServers, ({ one, many }) => ({
  owner: one(users, {
    fields: [tnfMcpServers.ownerId],
    references: [users.id],
  }),
  sessions: many(tnfSessionMcps),
}));

export const tnfAgentDefinitionsRelations = relations(tnfAgentDefinitions, ({ one, many }) => ({
  defaultLlm: one(tnfLlmModels, {
    fields: [tnfAgentDefinitions.defaultLlmId],
    references: [tnfLlmModels.id],
  }),
  defaultHarness: one(tnfHarnesses, {
    fields: [tnfAgentDefinitions.defaultHarnessId],
    references: [tnfHarnesses.id],
  }),
  owner: one(users, {
    fields: [tnfAgentDefinitions.ownerId],
    references: [users.id],
  }),
  sessions: many(tnfAgentSessions),
}));

export const tnfAgentSessionsRelations = relations(tnfAgentSessions, ({ one, many }) => ({
  agentDefinition: one(tnfAgentDefinitions, {
    fields: [tnfAgentSessions.agentDefId],
    references: [tnfAgentDefinitions.id],
  }),
  activeLlm: one(tnfLlmModels, {
    fields: [tnfAgentSessions.activeLlmId],
    references: [tnfLlmModels.id],
  }),
  harness: one(tnfHarnesses, {
    fields: [tnfAgentSessions.harnessId],
    references: [tnfHarnesses.id],
  }),
  user: one(users, {
    fields: [tnfAgentSessions.userId],
    references: [users.id],
  }),
  mcps: many(tnfSessionMcps),
}));

export const tnfSessionMcpsRelations = relations(tnfSessionMcps, ({ one }) => ({
  session: one(tnfAgentSessions, {
    fields: [tnfSessionMcps.sessionId],
    references: [tnfAgentSessions.id],
  }),
  mcp: one(tnfMcpServers, {
    fields: [tnfSessionMcps.mcpId],
    references: [tnfMcpServers.id],
  }),
}));

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type TnfLlmModel = typeof tnfLlmModels.$inferSelect;
export type NewTnfLlmModel = typeof tnfLlmModels.$inferInsert;

export type TnfHarness = typeof tnfHarnesses.$inferSelect;
export type NewTnfHarness = typeof tnfHarnesses.$inferInsert;

export type TnfMcpServer = typeof tnfMcpServers.$inferSelect;
export type NewTnfMcpServer = typeof tnfMcpServers.$inferInsert;

export type TnfAgentDefinition = typeof tnfAgentDefinitions.$inferSelect;
export type NewTnfAgentDefinition = typeof tnfAgentDefinitions.$inferInsert;

export type TnfAgentSession = typeof tnfAgentSessions.$inferSelect;
export type NewTnfAgentSession = typeof tnfAgentSessions.$inferInsert;

export type TnfSessionMcp = typeof tnfSessionMcps.$inferSelect;
export type NewTnfSessionMcp = typeof tnfSessionMcps.$inferInsert;
