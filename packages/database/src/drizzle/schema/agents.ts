/**
 * Drizzle ORM Schema - Agent System
 */
import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { agentStatusEnum, agentTypeEnum } from './enums.js';
import { users } from './users.js';

// =============================================================================
// AGENT ROLE ENUM (Phase 1, audit 2026-06-14) and DACC ROLE ENUM (Phase 8)
// =============================================================================
//
// Phasing of agent identity axes:
//
//   1. `worker_action` (AgentRole enum, formerly just `role`): the kind of
//      work this agent does. Action-typed primitives (code_generation, cli_coder,
//      orchestrator, ...). NOT a DACC hierarchy position.
//   2. `dacc_role` (DaccRole enum, Phase 8): DACC-v1 hierarchy position
//      (director, orchestrator (master-clock baton), broker, worker, participant).
//      This is the canonical runtime classification surfaced by `tnf traits list`
//      and AGENT_ROLE_TRAITS in packages/tnf-cli/src/cli.ts.
//   3. `fulfillment` (jsonb): runtime stack — vendor, model, transport,
//      protocol_version, prompt_doc_uri, tools, endpoint, raw.
//   4. `traits` (jsonb, formerly `qualities`): orthogonal agent features like
//      observability_level, autonomy_level, subAgent_capable. The term 'traits'
//      matches the canonical vocabulary used in `tnf traits list`.
//   5. `platform` (string, legacy field): coarse agent-platform label chosen
//      from PLATFORM_TAXONOMY.
//
// See docs/protocols/reports/AGENT_DEFINITION_CONSISTENCY_REVIEW_2026-06-14.md.
// =============================================================================
export const agentRoleEnum = pgEnum('AgentRole', [
  // conversation primitives
  'conversational',
  'assistant',
  'analysis',
  // code primitives
  'code_generation',
  'code_review',
  'code_refactor',
  'code_test',
  'code_debug',
  'code_architect',
  'code_optimizer',
  'code_security',
  'code_migration',
  'code_documentation',
  // orchestration primitives
  'orchestrator',
  'broker',
  'router',
  'monitor',
  'validator',
  'scheduler',
  'gateway',
  'director',
  'coordinator',
  'handoff',
  'cleanup',
  // execution primitives
  'workflow',
  'task',
  'cli_coder',
  'cli_debugger',
  'cli_devops',
  'cli_database',
  'cli_git',
  'cli_shell',
  'cli_research',
  'cli_qa',
  // research / knowledge
  'research_web',
  'research_academic',
  'research_market',
  // data primitives
  'data_analyst',
  'data_engineer',
  'data_scientist',
  // infrastructure primitives
  'infra_devops',
  'infra_cloud',
  'infra_kubernetes',
  'infra_docker',
  'infra_terraform',
  'infra_monitoring',
  // communication primitives
  'comm_translator',
  'comm_summarizer',
  'comm_writer',
  'comm_email',
  'comm_slack',
  'comm_discord',
  // TNF framework
  'tnf_core',
  'tnf_onboarding',
  'tnf_heartbeat',
  // generic / fallback
  'basic',
  'unknown',
]);

// =============================================================================
// DACC ROLE ENUM (Phase 8)
// DACC-v1 hierarchy position. Matches AGENT_ROLE_TRAITS canonical values in
// packages/tnf-cli/src/cli.ts:2958 (orchestrator, broker, worker, participant)
// plus 'director' from the DACC-v1 ROLE_DEFINITIONS.md hierarchy.
// This is the canonical runtime classification surfaced by `tnf traits list`.
// =============================================================================
export const daccRoleEnum = pgEnum('DaccRole', [
  'director', // DACC-v1: human or designated super-agent
  'orchestrator', // DACC-v1: master-clock, baton holder. Surfaces as 'orchestrator' in AGENT_ROLE_TRAITS.
  'broker', // DACC-v1 + AGENT_ROLE_TRAITS: per-channel coordinator
  'worker', // DACC-v1: agent worker. Surfaces as 'worker' in AGENT_ROLE_TRAITS.
  'participant', // AGENT_ROLE_TRAITS: a node that participates but does not yet hold a role on the bus
]);

// =============================================================================
// AGENT
// =============================================================================

export const agents = pgTable('agents', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  type: agentTypeEnum('type').notNull(),
  status: agentStatusEnum('status').default('INACTIVE').notNull(),
  description: text('description'),
  systemPrompt: text('system_prompt'),
  config: jsonb('config'),
  capabilities: jsonb('capabilities').$type<string[]>().default([]).notNull(),
  provider: varchar('provider', { length: 100 }).default('default').notNull(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  // Agent self-describing profile (about me, personality, capabilities description)
  profile: jsonb('profile')
    .$type<{
      about?: string;
      personality?: string;
      avatar?: string;
      emoji?: string;
      tags?: string[];
      creator?: string;
      version?: string;
      lastUpdated?: string;
    }>()
    .default({}),
  // Phase 1 (audit 2026-06-14) + Phase 8 alignment:
  //   - `worker_action` (Drizzle field name of the AgentRole column): the
  //     kind of work this agent does. Action-typed primitives only. Column
  //     name in DB is still `role` for backward compatibility.
  //   - `dacc_role` (Phase 8): DACC-v1 hierarchy position. Replaces the
  //     overloaded meaning of `role` = orchestrator-on-the-bus. Defaults to
  //     'worker' for backward compatibility (existing rows classify as
  //     workers and can be promoted to orchestrator/broker manually).
  //   - `fulfillment` (jsonb): runtime stack — vendor/model/transport/etc.
  //   - `traits` (jsonb, Phase 8 rename of `qualities`): orthogonal features.
  // Phase 9 (federated ID audit 2026-06-14): three federated ID namespaces
  // are now first-class columns. See `.agent/ROLE_DEFINITIONS.md` (Phase 9
  // section) and `docs/protocols/reports/FEDERATED_ID_ENCODING_AUDIT_2026-06-14.md`.
  //   - `canonicalEntityId`: TNF-namespaced hierarchical ID
  //     (`TNF:[scope:]CATEGORY:PROVIDER:NAME:INSTANCE`). Built by
  //     `buildCanonicalEntityId()` in `packages/relay-core/src/contracts/identity.ts`.
  //   - `idNumber`: federated reputation sequence in `ID#:<Base58>` format,
  //     assigned by `FederatedIdentityService` in `packages/a2a-core/src/federated-identity.service.ts`.
  //   - `federation` (jsonb): umbrella column carrying all three federated
  //     namespaces (canonicalEntityId, idNumber, mcid correlation_id, scopes).
  workerAction: agentRoleEnum('role'),
  daccRole: daccRoleEnum('dacc_role').default('worker').notNull(),
  canonicalEntityId: varchar('canonical_entity_id', { length: 255 }),
  idNumber: varchar('id_number', { length: 64 }),
  federation: jsonb('federation')
    .$type<{
      kind?: 'agent' | 'vector' | 'session' | 'unknown';
      canonicalEntityId: string | null;
      idNumber: string | null;
      mcid: string | null;
      scopes: string[];
      // Phase 9 FOLLOWUP-1: documents the cross-namespace `ID#:` caveat for
      // consumers that read the federation bundle. When `kind === 'vector'`,
      // the `idNumber` field is interpreted as `vector_id`, hash-derived.
      vector_id_prefix?: 'ID#' | 'VEC#';
    }>()
    .default({
      kind: 'unknown',
      canonicalEntityId: null,
      idNumber: null,
      mcid: null,
      scopes: [],
      vector_id_prefix: 'ID#',
    })
    .notNull(),
  fulfillment: jsonb('fulfillment')
    .$type<{
      vendor?: string;
      model?: string;
      transport?: 'stdio' | 'http' | 'websocket' | 'browser-extension' | 'ide' | 'cli' | 'unknown';
      protocol_version?: string;
      prompt_doc_uri?: string;
      tools?: string[];
      endpoint?: string;
      raw?: Record<string, unknown>;
    }>()
    .default({})
    .notNull(),
  traits: jsonb('traits')
    .$type<{
      observability?: 'native' | 'mirrored' | 'opaque';
      subAgent_capable?: boolean;
      orchestrates_agents?: boolean;
      persona_source?: 'self' | 'tnf' | 'platform' | 'fixed';
      autonomy_level?: 'supervised' | 'semiautonomous' | 'autonomous';
      description?: string;
      raw?: Record<string, unknown>;
    }>()
    .default({})
    .notNull(),
  fulfillmentUpdatedAt: timestamp('fulfillment_updated_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

// =============================================================================
// AGENT METADATA
// =============================================================================

export const agentMetadata = pgTable('agent_metadata', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentId: uuid('agent_id')
    .unique()
    .notNull()
    .references(() => agents.id, { onDelete: 'cascade' }),
  metadata: jsonb('metadata').default({}).notNull(),
  version: varchar('version', { length: 20 }).default('1.0.0').notNull(),
  config: jsonb('config'),
});

// =============================================================================
// AGENT NFT
// =============================================================================

export const agentNfts = pgTable('agent_nfts', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentId: uuid('agent_id')
    .unique()
    .notNull()
    .references(() => agents.id),
  tokenId: integer('token_id').unique().notNull(),
  contractAddress: varchar('contract_address', { length: 100 }).notNull(),
  smartAccountAddress: varchar('smart_account_address', { length: 100 }),
  isFractionalized: boolean('is_fractionalized').default(false).notNull(),
  totalShares: integer('total_shares').default(0).notNull(),
  metadataUri: text('metadata_uri'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =============================================================================
// AGENT REGISTRATION
// =============================================================================

export const agentRegistrations = pgTable('agent_registrations', {
  id: uuid('id').primaryKey().defaultRandom(),
  // Indexed for faster agent lookups (see migration: 20240725120000_add_performance_indexes.sql)
  agentId: uuid('agent_id')
    .notNull()
    .references(() => agents.id, { onDelete: 'cascade' }),
  encryptedAuthToken: varchar('encrypted_auth_token', { length: 1024 }).unique().notNull(),
  registrationData: jsonb('registration_data').notNull(),
  verificationStatus: varchar('verification_status', { length: 50 }).default('PENDING').notNull(),
  onboardingStatus: varchar('onboarding_status', { length: 50 }).default('INITIALIZED').notNull(),
  onboardingProgress: real('onboarding_progress').default(0).notNull(),
  heartbeatInterval: integer('heartbeat_interval').default(60000).notNull(),
  isOnline: boolean('is_online').default(false).notNull(),
  lastHeartbeat: timestamp('last_heartbeat'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =============================================================================
// AGENT CAPABILITY REGISTRY
// =============================================================================

export const agentCapabilityRegistry = pgTable('agent_capability_registry', {
  id: uuid('id').primaryKey().defaultRandom(),
  registrationId: uuid('registration_id')
    .notNull()
    .references(() => agentRegistrations.id, { onDelete: 'cascade' }),
  capabilityName: varchar('capability_name', { length: 255 }).notNull(),
  capabilityType: varchar('capability_type', { length: 100 }).notNull(),
  version: varchar('version', { length: 20 }).notNull(),
  description: text('description'),
  parameters: jsonb('parameters'),
  verificationStatus: varchar('verification_status', { length: 50 }).default('PENDING').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =============================================================================
// AGENT ONBOARDING EVENT
// =============================================================================

export const agentOnboardingEvents = pgTable('agent_onboarding_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  registrationId: uuid('registration_id')
    .notNull()
    .references(() => agentRegistrations.id, { onDelete: 'cascade' }),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  message: text('message').notNull(),
  eventData: jsonb('event_data'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// =============================================================================
// AGENT DIRECTORY ENTRY
// =============================================================================

export const agentDirectoryEntries = pgTable('agent_directory_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentId: uuid('agent_id')
    .unique()
    .notNull()
    .references(() => agents.id, { onDelete: 'cascade' }),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }).notNull(),
  tags: jsonb('tags').$type<string[]>().default([]).notNull(),
  isPublic: boolean('is_public').default(false).notNull(),
  isVerified: boolean('is_verified').default(false).notNull(),
  featured: boolean('featured').default(false).notNull(),
  rating: real('rating').default(0).notNull(),
  usageCount: integer('usage_count').default(0).notNull(),
  lastActiveAt: timestamp('last_active_at').defaultNow(),
  searchableData: text('searchable_data'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =============================================================================
// AGENT PROMPT VERSION
// =============================================================================

export const agentPromptVersions = pgTable('agent_prompt_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentId: uuid('agent_id')
    .notNull()
    .references(() => agents.id, { onDelete: 'cascade' }),
  versionNumber: integer('version_number').notNull(),
  instruction: text('instruction').notNull(),
  exemplars: jsonb('exemplars'),
  performanceMetrics: jsonb('performance_metrics'),
  massStage: varchar('mass_stage', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// =============================================================================
// AGENT METRICS
// =============================================================================

export const agentMetrics = pgTable('agent_metrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  registrationId: uuid('registration_id')
    .notNull()
    .references(() => agentRegistrations.id, { onDelete: 'cascade' }),
  metricType: varchar('metric_type', { length: 100 }).notNull(),
  value: real('value').notNull(),
  unit: varchar('unit', { length: 50 }),
  tags: jsonb('tags').default({}),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// =============================================================================
// RELATIONS
// =============================================================================

export const agentsRelations = relations(agents, ({ one, many }) => ({
  user: one(users, {
    fields: [agents.userId],
    references: [users.id],
  }),
  metadata: one(agentMetadata),
  nft: one(agentNfts),
  registrations: many(agentRegistrations),
  directoryEntry: one(agentDirectoryEntries),
  promptVersions: many(agentPromptVersions),
}));

export const agentMetadataRelations = relations(agentMetadata, ({ one }) => ({
  agent: one(agents, {
    fields: [agentMetadata.agentId],
    references: [agents.id],
  }),
}));

export const agentNftsRelations = relations(agentNfts, ({ one, many }) => ({
  agent: one(agents, {
    fields: [agentNfts.agentId],
    references: [agents.id],
  }),
}));

export const agentRegistrationsRelations = relations(agentRegistrations, ({ one, many }) => ({
  agent: one(agents, {
    fields: [agentRegistrations.agentId],
    references: [agents.id],
  }),
  capabilities: many(agentCapabilityRegistry),
  onboardingEvents: many(agentOnboardingEvents),
  metrics: many(agentMetrics),
}));

export const agentCapabilityRegistryRelations = relations(agentCapabilityRegistry, ({ one }) => ({
  registration: one(agentRegistrations, {
    fields: [agentCapabilityRegistry.registrationId],
    references: [agentRegistrations.id],
  }),
}));

export const agentOnboardingEventsRelations = relations(agentOnboardingEvents, ({ one }) => ({
  registration: one(agentRegistrations, {
    fields: [agentOnboardingEvents.registrationId],
    references: [agentRegistrations.id],
  }),
}));

export const agentMetricsRelations = relations(agentMetrics, ({ one }) => ({
  registration: one(agentRegistrations, {
    fields: [agentMetrics.registrationId],
    references: [agentRegistrations.id],
  }),
}));

export const agentDirectoryEntriesRelations = relations(agentDirectoryEntries, ({ one }) => ({
  agent: one(agents, {
    fields: [agentDirectoryEntries.agentId],
    references: [agents.id],
  }),
}));

export const agentPromptVersionsRelations = relations(agentPromptVersions, ({ one }) => ({
  agent: one(agents, {
    fields: [agentPromptVersions.agentId],
    references: [agents.id],
  }),
}));
