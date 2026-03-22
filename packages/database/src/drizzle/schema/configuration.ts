import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { users } from './users';

// =============================================================================
// SYSTEM CONFIGURATION (Key-Value pairs for Environment/Feature flags)
// =============================================================================

export const systemConfigurations = pgTable('system_configurations', {
  key: varchar('key', { length: 255 }).primaryKey(),
  value: text('value').notNull(),
  category: varchar('category', { length: 100 }).default('general').notNull(),
  description: text('description'),
  sensitive: boolean('sensitive').default(false).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  updatedBy: varchar('updated_by', { length: 255 }),
});

// =============================================================================
// SYSTEM SETTINGS (Singleton Application Settings)
// =============================================================================

export const systemSettings = pgTable('system_settings', {
  id: integer('id').primaryKey().default(1),
  config: jsonb('config').$type<any>().notNull(), // Stores the nested settings object
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  updatedBy: varchar('updated_by', { length: 255 }),
});

// =============================================================================
// USER PROVIDER API KEYS (Per-member secure storage)
// =============================================================================

export const providerApiKeys = pgTable(
  'provider_api_keys',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: varchar('provider', { length: 100 }).notNull(),
    encryptedKey: text('encrypted_key').notNull(),
    keyPreview: varchar('key_preview', { length: 32 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userProviderUnique: uniqueIndex('provider_api_keys_user_provider_uq').on(
      table.userId,
      table.provider
    ),
  })
);

// =============================================================================
// AGENT API GRANTS (Scoped delegated API access)
// =============================================================================

export const agentApiGrants = pgTable('agent_api_grants', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  agentId: varchar('agent_id', { length: 255 }).notNull(),
  provider: varchar('provider', { length: 100 }).notNull(),
  allowedModels: jsonb('allowed_models').$type<string[]>().default([]).notNull(),
  maxRequestsPerMinute: integer('max_requests_per_minute').default(30).notNull(),
  dailyTokenBudget: integer('daily_token_budget').default(200000).notNull(),
  monthlyUsdCap: integer('monthly_usd_cap_cents').default(1000).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  revoked: boolean('revoked').default(false).notNull(),
  tokenVersion: integer('token_version').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const agentApiGrantUsage = pgTable('agent_api_grant_usage', {
  id: uuid('id').primaryKey().defaultRandom(),
  grantId: uuid('grant_id')
    .notNull()
    .references(() => agentApiGrants.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  agentId: varchar('agent_id', { length: 255 }).notNull(),
  provider: varchar('provider', { length: 100 }).notNull(),
  model: varchar('model', { length: 255 }),
  promptTokens: integer('prompt_tokens').default(0).notNull(),
  completionTokens: integer('completion_tokens').default(0).notNull(),
  totalTokens: integer('total_tokens').default(0).notNull(),
  estimatedCostCents: integer('estimated_cost_cents').default(0).notNull(),
  statusCode: integer('status_code').notNull(),
  durationMs: integer('duration_ms').default(0).notNull(),
  error: text('error'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// =============================================================================
// AGENT MANAGED ACCOUNTS (Credential vault records owned by a user)
// =============================================================================

export const agentManagedAccounts = pgTable(
  'agent_managed_accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerUserId: uuid('owner_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    accountType: varchar('account_type', { length: 50 }).notNull(), // hosted_email | chatgpt | external
    provider: varchar('provider', { length: 100 }).notNull(), // cpanel | openai | ...
    loginIdentifier: varchar('login_identifier', { length: 255 }).notNull(), // email / username
    encryptedSecret: text('encrypted_secret').notNull(),
    secretPreview: varchar('secret_preview', { length: 32 }),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),
    status: varchar('status', { length: 50 }).default('active').notNull(),
    createdByAgent: varchar('created_by_agent', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    ownerProviderLoginUnique: uniqueIndex('agent_managed_accounts_owner_provider_login_uq').on(
      table.ownerUserId,
      table.provider,
      table.loginIdentifier
    ),
  })
);

export const agentManagedAccountGrants = pgTable('agent_managed_account_grants', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id')
    .notNull()
    .references(() => agentManagedAccounts.id, { onDelete: 'cascade' }),
  ownerUserId: uuid('owner_user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  granteeAgentId: varchar('grantee_agent_id', { length: 255 }).notNull(),
  accessTokenHash: text('access_token_hash').notNull(),
  scopes: jsonb('scopes').$type<string[]>().default([]).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  revoked: boolean('revoked').default(false).notNull(),
  lastRedeemedAt: timestamp('last_redeemed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
