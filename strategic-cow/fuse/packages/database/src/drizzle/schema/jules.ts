/**
 * Drizzle ORM Schema - Jules Integration
 * Manages Jules (Google's coding agent) configurations, sessions, and usage tracking
 */
import { relations } from 'drizzle-orm';
import { jsonb, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { agents } from './agents';
import { tasks } from './tasks';
import { users } from './users';

// =============================================================================
// JULES-SPECIFIC ENUMS
// =============================================================================

export const julesConfigTypeEnum = pgEnum('jules_config_type', [
  'DISABLED',
  'BYOK', // Bring Your Own Key - customer provides their own Jules API key
  'PLATFORM', // Use platform's Jules API key
]);

export const julesSessionStatusEnum = pgEnum('jules_session_status', [
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

export const julesConfigs = pgTable('jules_configs', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Multi-tenant support
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  // Configuration type
  configType: julesConfigTypeEnum('config_type').default('DISABLED').notNull(),

  // BYOK: encrypted API key (customer's own Jules key)
  apiKeyEncrypted: text('api_key_encrypted'),

  // Webhook configuration
  webhookSecret: varchar('webhook_secret', { length: 255 }),

  // Preferences
  preferences: jsonb('preferences').$type<{
    autoApprove?: boolean;
    maxConcurrentSessions?: number;
    defaultTimeout?: number;
    notifyOnCompletion?: boolean;
  }>(),

  // Audit
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

// =============================================================================
// JULES_SESSIONS
// Links TNF tasks to Jules sessions with status tracking
// =============================================================================

export const julesSessions = pgTable('jules_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Jules session ID (from Jules API)
  julesSessionId: varchar('jules_session_id', { length: 255 }).unique().notNull(),

  // Link to TNF task
  taskId: uuid('task_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),

  // Which agent delegated this task to Jules
  delegatedByAgentId: uuid('delegated_by_agent_id')
    .notNull()
    .references(() => agents.id),

  // Multi-tenant support
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  // Session status
  status: julesSessionStatusEnum('status').default('PENDING').notNull(),

  // Session metadata
  metadata: jsonb('metadata').$type<{
    prompt?: string;
    conversationId?: string;
    webhookContext?: string;
    approvalCount?: number;
    lastWebhookAt?: string;
  }>(),

  // Result from Jules
  result: jsonb('result'),
  error: text('error'),

  // Timing
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),

  // Audit
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

// =============================================================================
// JULES_USAGE_LOGS
// Usage tracking for billing (BYOK vs platform key)
// =============================================================================

export const julesUsageLogs = pgTable('jules_usage_logs', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Link to session
  sessionId: uuid('session_id')
    .notNull()
    .references(() => julesSessions.id, { onDelete: 'cascade' }),

  // Multi-tenant support
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  // Usage type (for billing)
  usageType: varchar('usage_type', { length: 50 }).notNull(), // 'BYOK' or 'PLATFORM'

  // Metrics
  metrics: jsonb('metrics').$type<{
    apiCalls?: number;
    tokensUsed?: number;
    durationSeconds?: number;
    webhookCount?: number;
  }>(),

  // Audit
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =============================================================================
// RELATIONS
// =============================================================================

export const julesConfigsRelations = relations(julesConfigs, ({ one }) => ({
  user: one(users, {
    fields: [julesConfigs.userId],
    references: [users.id],
  }),
}));

export const julesSessionsRelations = relations(julesSessions, ({ one }) => ({
  task: one(tasks, {
    fields: [julesSessions.taskId],
    references: [tasks.id],
  }),
  delegatedByAgent: one(agents, {
    fields: [julesSessions.delegatedByAgentId],
    references: [agents.id],
  }),
  user: one(users, {
    fields: [julesSessions.userId],
    references: [users.id],
  }),
}));

export const julesUsageLogsRelations = relations(julesUsageLogs, ({ one }) => ({
  session: one(julesSessions, {
    fields: [julesUsageLogs.sessionId],
    references: [julesSessions.id],
  }),
  user: one(users, {
    fields: [julesUsageLogs.userId],
    references: [users.id],
  }),
}));
