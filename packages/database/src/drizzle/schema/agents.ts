/**
 * Drizzle ORM Schema - Agent System
 */
import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { agentStatusEnum, agentTypeEnum } from './enums';
import { users } from './users';
import { workspaces } from './workspace';

// =============================================================================
// AGENT
// =============================================================================

export const agents = pgTable('agents', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  type: agentTypeEnum('type').notNull(),
  status: agentStatusEnum('status').default('IDLE').notNull(),
  description: text('description'),
  systemPrompt: text('systemPrompt'),
  config: jsonb('config'),
  capabilities: text('capabilities').array().notNull().default([]),
  provider: varchar('provider', { length: 100 }).default('default').notNull(),
  userId: varchar('userId', { length: 255 }),
  avatarUrl: text('avatarUrl'),
  deletedAt: timestamp('deletedAt'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
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
  authToken: varchar('auth_token', { length: 512 }).unique().notNull(),
  registrationData: jsonb('registration_data').notNull(),
  verificationStatus: varchar('verification_status', { length: 50 }).default('PENDING').notNull(),
  onboardingStatus: varchar('onboarding_status', { length: 50 }).default('INITIALIZED').notNull(),
  onboardingProgress: real('onboarding_progress').default(0).notNull(),
  heartbeatInterval: integer('heartbeat_interval').default(60000).notNull(),
  isOnline: boolean('is_online').default(false).notNull(),
  lastHeartbeat: timestamp('last_heartbeat'),
  tenantId: varchar('tenant_id', { length: 255 }),
  organizationId: varchar('organization_id', { length: 255 }),
  agencyId: uuid('agency_id'),
  identityLongTermId: varchar('identity_long_term_id', { length: 255 }),
  identityEphemeralId: varchar('identity_ephemeral_id', { length: 255 }),
  identityFederationId: varchar('identity_federation_id', { length: 255 }),
  protocolVersion: varchar('protocol_version', { length: 50 }),
  trustTier: varchar('trust_tier', { length: 50 }),
  inviteId: uuid('invite_id'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('agent_registrations_tenant_idx').on(table.tenantId),
  orgIdx: index('agent_registrations_org_idx').on(table.organizationId),
  agencyIdx: index('agent_registrations_agency_idx').on(table.agencyId),
  trustIdx: index('agent_registrations_trust_idx').on(table.trustTier),
}));

// =============================================================================
// AGENT INVITATION CODES
// =============================================================================

export const agentInvitationCodes = pgTable('agent_invitation_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  codeHash: varchar('code_hash', { length: 128 }).unique().notNull(),
  status: varchar('status', { length: 50 }).default('ACTIVE').notNull(),
  maxUses: integer('max_uses').default(1).notNull(),
  usedCount: integer('used_count').default(0).notNull(),
  expiresAt: timestamp('expires_at'),
  lastUsedAt: timestamp('last_used_at'),
  lastUsedByAgentId: uuid('last_used_by_agent_id'),
  lastUsedByRegistrationId: uuid('last_used_by_registration_id'),
  createdByUserId: uuid('created_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  agencyId: uuid('agency_id').references(() => workspaces.id, { onDelete: 'set null' }),
  tenantId: varchar('tenant_id', { length: 255 }),
  organizationId: varchar('organization_id', { length: 255 }),
  metadata: jsonb('metadata').default({}).notNull(),
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

export const agentInvitationCodesRelations = relations(agentInvitationCodes, ({ one }) => ({
  createdBy: one(users, {
    fields: [agentInvitationCodes.createdByUserId],
    references: [users.id],
  }),
  agency: one(workspaces, {
    fields: [agentInvitationCodes.agencyId],
    references: [workspaces.id],
  }),
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
