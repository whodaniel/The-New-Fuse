"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentManagedAccountGrants = exports.agentManagedAccounts = exports.agentApiGrantUsage = exports.agentApiGrants = exports.providerApiKeys = exports.systemSettings = exports.systemConfigurations = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const users_1 = require("./users");
// =============================================================================
// SYSTEM CONFIGURATION (Key-Value pairs for Environment/Feature flags)
// =============================================================================
exports.systemConfigurations = (0, pg_core_1.pgTable)('system_configurations', {
    key: (0, pg_core_1.varchar)('key', { length: 255 }).primaryKey(),
    value: (0, pg_core_1.text)('value').notNull(),
    category: (0, pg_core_1.varchar)('category', { length: 100 }).default('general').notNull(),
    description: (0, pg_core_1.text)('description'),
    sensitive: (0, pg_core_1.boolean)('sensitive').default(false).notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
    updatedBy: (0, pg_core_1.varchar)('updated_by', { length: 255 }),
});
// =============================================================================
// SYSTEM SETTINGS (Singleton Application Settings)
// =============================================================================
exports.systemSettings = (0, pg_core_1.pgTable)('system_settings', {
    id: (0, pg_core_1.integer)('id').primaryKey().default(1),
    config: (0, pg_core_1.jsonb)('config').$type().notNull(), // Stores the nested settings object
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
    updatedBy: (0, pg_core_1.varchar)('updated_by', { length: 255 }),
});
// =============================================================================
// USER PROVIDER API KEYS (Per-member secure storage)
// =============================================================================
exports.providerApiKeys = (0, pg_core_1.pgTable)('provider_api_keys', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => users_1.users.id, { onDelete: 'cascade' }),
    provider: (0, pg_core_1.varchar)('provider', { length: 100 }).notNull(),
    encryptedKey: (0, pg_core_1.text)('encrypted_key').notNull(),
    keyPreview: (0, pg_core_1.varchar)('key_preview', { length: 32 }),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
}, (table) => ({
    userProviderUnique: (0, pg_core_1.uniqueIndex)('provider_api_keys_user_provider_uq').on(table.userId, table.provider),
}));
// =============================================================================
// AGENT API GRANTS (Scoped delegated API access)
// =============================================================================
exports.agentApiGrants = (0, pg_core_1.pgTable)('agent_api_grants', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => users_1.users.id, { onDelete: 'cascade' }),
    agentId: (0, pg_core_1.varchar)('agent_id', { length: 255 }).notNull(),
    provider: (0, pg_core_1.varchar)('provider', { length: 100 }).notNull(),
    allowedModels: (0, pg_core_1.jsonb)('allowed_models').$type().default([]).notNull(),
    maxRequestsPerMinute: (0, pg_core_1.integer)('max_requests_per_minute').default(30).notNull(),
    dailyTokenBudget: (0, pg_core_1.integer)('daily_token_budget').default(200000).notNull(),
    monthlyUsdCap: (0, pg_core_1.integer)('monthly_usd_cap_cents').default(1000).notNull(),
    expiresAt: (0, pg_core_1.timestamp)('expires_at').notNull(),
    revoked: (0, pg_core_1.boolean)('revoked').default(false).notNull(),
    tokenVersion: (0, pg_core_1.integer)('token_version').default(1).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
exports.agentApiGrantUsage = (0, pg_core_1.pgTable)('agent_api_grant_usage', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    grantId: (0, pg_core_1.uuid)('grant_id')
        .notNull()
        .references(() => exports.agentApiGrants.id, { onDelete: 'cascade' }),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => users_1.users.id, { onDelete: 'cascade' }),
    agentId: (0, pg_core_1.varchar)('agent_id', { length: 255 }).notNull(),
    provider: (0, pg_core_1.varchar)('provider', { length: 100 }).notNull(),
    model: (0, pg_core_1.varchar)('model', { length: 255 }),
    promptTokens: (0, pg_core_1.integer)('prompt_tokens').default(0).notNull(),
    completionTokens: (0, pg_core_1.integer)('completion_tokens').default(0).notNull(),
    totalTokens: (0, pg_core_1.integer)('total_tokens').default(0).notNull(),
    estimatedCostCents: (0, pg_core_1.integer)('estimated_cost_cents').default(0).notNull(),
    statusCode: (0, pg_core_1.integer)('status_code').notNull(),
    durationMs: (0, pg_core_1.integer)('duration_ms').default(0).notNull(),
    error: (0, pg_core_1.text)('error'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
// =============================================================================
// AGENT MANAGED ACCOUNTS (Credential vault records owned by a user)
// =============================================================================
exports.agentManagedAccounts = (0, pg_core_1.pgTable)('agent_managed_accounts', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    ownerUserId: (0, pg_core_1.uuid)('owner_user_id')
        .notNull()
        .references(() => users_1.users.id, { onDelete: 'cascade' }),
    accountType: (0, pg_core_1.varchar)('account_type', { length: 50 }).notNull(), // hosted_email | chatgpt | external
    provider: (0, pg_core_1.varchar)('provider', { length: 100 }).notNull(), // cpanel | openai | ...
    loginIdentifier: (0, pg_core_1.varchar)('login_identifier', { length: 255 }).notNull(), // email / username
    encryptedSecret: (0, pg_core_1.text)('encrypted_secret').notNull(),
    secretPreview: (0, pg_core_1.varchar)('secret_preview', { length: 32 }),
    metadata: (0, pg_core_1.jsonb)('metadata').$type().default({}).notNull(),
    status: (0, pg_core_1.varchar)('status', { length: 50 }).default('active').notNull(),
    createdByAgent: (0, pg_core_1.varchar)('created_by_agent', { length: 255 }),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
}, (table) => ({
    ownerProviderLoginUnique: (0, pg_core_1.uniqueIndex)('agent_managed_accounts_owner_provider_login_uq').on(table.ownerUserId, table.provider, table.loginIdentifier),
}));
exports.agentManagedAccountGrants = (0, pg_core_1.pgTable)('agent_managed_account_grants', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    accountId: (0, pg_core_1.uuid)('account_id')
        .notNull()
        .references(() => exports.agentManagedAccounts.id, { onDelete: 'cascade' }),
    ownerUserId: (0, pg_core_1.uuid)('owner_user_id')
        .notNull()
        .references(() => users_1.users.id, { onDelete: 'cascade' }),
    granteeAgentId: (0, pg_core_1.varchar)('grantee_agent_id', { length: 255 }).notNull(),
    accessTokenHash: (0, pg_core_1.text)('access_token_hash').notNull(),
    scopes: (0, pg_core_1.jsonb)('scopes').$type().default([]).notNull(),
    expiresAt: (0, pg_core_1.timestamp)('expires_at').notNull(),
    revoked: (0, pg_core_1.boolean)('revoked').default(false).notNull(),
    lastRedeemedAt: (0, pg_core_1.timestamp)('last_redeemed_at'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
//# sourceMappingURL=configuration.js.map