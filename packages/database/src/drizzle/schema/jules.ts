/**
 * Drizzle ORM Schema - Jules Integration
 */
import { relations, desc } from 'drizzle-orm';
import {
  boolean,
  decimal,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { agents } from './agents';
import { tasks } from './tasks';

// =============================================================================
// PLACEHOLDER TENANTS TABLE
// =============================================================================
// This is a placeholder to satisfy foreign key constraints.
// A proper tenants table should be defined elsewhere.
export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  // other tenant-specific fields would go here
});

// =============================================================================
// JULES CONFIGS
// =============================================================================
export const julesConfigs = pgTable('jules_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .unique()
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  configType: varchar('config_type', {
    enum: ['own_key', 'platform', 'disabled'],
  })
    .default('disabled')
    .notNull(),
  apiKeyEncrypted: text('api_key_encrypted'),
  webhookSecret: varchar('webhook_secret', { length: 255 }),
  preferences: jsonb('preferences').default({}).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =============================================================================
// JULES SESSIONS
// =============================================================================
export const julesSessions = pgTable(
  'jules_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    taskId: uuid('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    julesSessionId: varchar('jules_session_id', { length: 255 }).unique().notNull(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    delegatedByAgentId: uuid('delegated_by_agent_id').references(() => agents.id, {
      onDelete: 'set null',
    }),
    conversationId: varchar('conversation_id', { length: 255 }),
    status: varchar('status', {
      enum: ['pending', 'in_progress', 'needs_approval', 'completed', 'failed'],
    })
      .default('pending')
      .notNull(),
    metadata: jsonb('metadata').default({}).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => {
    return {
      taskIdIdx: index('idx_jules_sessions_task_id').on(table.taskId),
      julesSessionIdIdx: index('idx_jules_sessions_jules_session_id').on(table.julesSessionId),
      tenantIdIdx: index('idx_jules_sessions_tenant_id').on(table.tenantId),
    };
  }
);

// =============================================================================
// JULES USAGE LOGS
// =============================================================================
export const julesUsageLogs = pgTable(
  'jules_usage_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    sessionId: uuid('session_id').references(() => julesSessions.id, { onDelete: 'set null' }),
    julesSessionId: varchar('jules_session_id', { length: 255 }).notNull(),
    usedCustomerKey: boolean('used_customer_key').default(false).notNull(),
    startedAt: timestamp('started_at').defaultNow().notNull(),
    completedAt: timestamp('completed_at'),
    durationMinutes: integer('duration_minutes'),
    billableAmount: decimal('billable_amount', { precision: 10, scale: 2 }),
    metadata: jsonb('metadata').default({}).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => {
    return {
      tenantIdCreatedAtIdx: index('idx_jules_usage_logs_tenant_id_created_at').on(
        table.tenantId,
        desc(table.createdAt)
      ),
    };
  }
);

// =============================================================================
// RELATIONS
// =============================================================================
export const julesConfigsRelations = relations(julesConfigs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [julesConfigs.tenantId],
    references: [tenants.id],
  }),
}));

export const julesSessionsRelations = relations(julesSessions, ({ one }) => ({
  tenant: one(tenants, {
    fields: [julesSessions.tenantId],
    references: [tenants.id],
  }),
  task: one(tasks, {
    fields: [julesSessions.taskId],
    references: [tasks.id],
  }),
  delegatedByAgent: one(agents, {
    fields: [julesSessions.delegatedByAgentId],
    references: [agents.id],
  }),
}));

export const julesUsageLogsRelations = relations(julesUsageLogs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [julesUsageLogs.tenantId],
    references: [tenants.id],
  }),
  session: one(julesSessions, {
    fields: [julesUsageLogs.sessionId],
    references: [julesSessions.id],
  }),
}));

export const tenantsRelations = relations(tenants, ({ one, many }) => ({
  julesConfig: one(julesConfigs),
  julesSessions: many(julesSessions),
  julesUsageLogs: many(julesUsageLogs),
}));
