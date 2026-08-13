/**
 * Drizzle ORM Schema - Code Execution System
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
import { agents } from './agents.js';
import { codeExecutionLanguageEnum, codeExecutionStatusEnum, codeExecutionTierEnum } from './enums.js';

// =============================================================================
// CODE EXECUTION USAGE
// =============================================================================

export const codeExecutionUsage = pgTable(
  'code_execution_usage',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    agentId: uuid('agent_id')
      .notNull()
      .references(() => agents.id),
    clientId: varchar('client_id', { length: 255 }).notNull(),
    executionId: varchar('execution_id', { length: 255 }).unique().notNull(),
    language: codeExecutionLanguageEnum('language').notNull(),
    code: text('code').notNull(),
    result: jsonb('result'),
    output: jsonb('output'),
    error: jsonb('error'),
    executionTime: integer('execution_time').notNull(), // in milliseconds
    memoryUsage: integer('memory_usage').notNull(), // in bytes
    computeUnits: real('compute_units').notNull(),
    cost: real('cost').notNull(),
    tier: codeExecutionTierEnum('tier').notNull(),
    environment: varchar('environment', { length: 100 }).notNull(),
    status: codeExecutionStatusEnum('status').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    completedAt: timestamp('completed_at'),
  },
  (table) => ({
    agentIdIdx: index('code_exec_agent_id_idx').on(table.agentId),
    clientIdIdx: index('code_exec_client_id_idx').on(table.clientId),
    createdAtIdx: index('code_exec_created_at_idx').on(table.createdAt),
    languageIdx: index('code_exec_language_idx').on(table.language),
    tierIdx: index('code_exec_tier_idx').on(table.tier),
    statusIdx: index('code_exec_status_idx').on(table.status),
  })
);

// =============================================================================
// CODE EXECUTION SESSION
// =============================================================================

export const codeExecutionSessions = pgTable('code_execution_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  ownerId: uuid('owner_id').notNull(),
  collaborators: jsonb('collaborators').$type<string[]>().default([]).notNull(),
  isPublic: boolean('is_public').default(false).notNull(),
  files: jsonb('files').notNull(),
  environment: jsonb('environment').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'),
  storageUsage: integer('storage_usage').default(0).notNull(), // in bytes
});

// =============================================================================
// RELATIONS
// =============================================================================

export const codeExecutionUsageRelations = relations(codeExecutionUsage, ({ one }) => ({
  agent: one(agents, {
    fields: [codeExecutionUsage.agentId],
    references: [agents.id],
  }),
}));
