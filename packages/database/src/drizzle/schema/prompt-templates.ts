/**
 * Drizzle ORM Schema - Prompt Templating System
 */
import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { users } from './users';

// =============================================================================
// PROMPT TEMPLATES
// =============================================================================

export const promptTemplates = pgTable('prompt_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  currentVersionId: uuid('current_version_id'), // Reference to the active version
  tags: jsonb('tags').$type<string[]>().default([]).notNull(),
  category: varchar('category', { length: 100 }).default('General').notNull(),
  isPublic: boolean('is_public').default(false).notNull(),

  // Analytics summary (can be updated periodically)
  analytics: jsonb('analytics').default({
    totalRuns: 0,
    successRate: 0,
    popularVariables: [],
    recentActivity: [],
  }),

  userId: uuid('user_id')
    .notNull() // Enforce tenant isolation
    .references(() => users.id, { onDelete: 'cascade' }),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =============================================================================
// PROMPT VERSIONS
// =============================================================================

export const promptVersions = pgTable('prompt_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateId: uuid('template_id')
    .notNull()
    .references(() => promptTemplates.id, { onDelete: 'cascade' }),

  versionNumber: integer('version_number').notNull(),
  name: varchar('name', { length: 255 }),
  label: varchar('label', { length: 50 }).default('development'), // staging, production, etc.

  content: text('content').notNull(),
  variables: jsonb('variables').$type<Record<string, any>>().default({}).notNull(),
  blocks: jsonb('blocks').$type<any[]>().default([]).notNull(), // Stores the visual block structure

  isActive: boolean('is_active').default(true).notNull(),

  metrics: jsonb('metrics').default({
    successRate: 0,
    totalRuns: 0,
    avgResponseTime: 0,
  }),

  changelog: text('changelog'),

  createdBy: varchar('created_by', { length: 255 }), // User ID or System
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// =============================================================================
// PROMPT SNIPPETS
// =============================================================================

export const promptSnippets = pgTable('prompt_snippets', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  content: text('content').notNull(),
  type: varchar('type', { length: 50 }).notNull(), // system, user, function, etc.
  category: varchar('category', { length: 100 }).default('General').notNull(),
  tags: jsonb('tags').$type<string[]>().default([]).notNull(),
  description: text('description'),
  parameters: jsonb('parameters'),

  usageCount: integer('usage_count').default(0).notNull(),
  isStarred: boolean('is_starred').default(false).notNull(),

  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =============================================================================
// PROMPT EXECUTION RESULTS
// =============================================================================

export const promptExecutionResults = pgTable('prompt_execution_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateId: uuid('template_id')
    .notNull()
    .references(() => promptTemplates.id, { onDelete: 'cascade' }),
  versionId: uuid('version_id')
    .notNull()
    .references(() => promptVersions.id, { onDelete: 'cascade' }),

  executedAt: timestamp('executed_at').defaultNow().notNull(),
  success: boolean('success').notNull(),
  responseTime: integer('response_time').notNull(), // in ms
  tokenUsage: integer('token_usage'),

  variables: jsonb('variables').$type<Record<string, any>>().default({}).notNull(),
  result: jsonb('result'), // Store the actual response
  error: text('error'),
});

// =============================================================================
// RELATIONS
// =============================================================================

export const promptTemplatesRelations = relations(promptTemplates, ({ many }) => ({
  versions: many(promptVersions),
  executions: many(promptExecutionResults),
}));

export const promptVersionsRelations = relations(promptVersions, ({ one, many }) => ({
  template: one(promptTemplates, {
    fields: [promptVersions.templateId],
    references: [promptTemplates.id],
  }),
  executions: many(promptExecutionResults),
}));

export const promptExecutionResultsRelations = relations(promptExecutionResults, ({ one }) => ({
  template: one(promptTemplates, {
    fields: [promptExecutionResults.templateId],
    references: [promptTemplates.id],
  }),
  version: one(promptVersions, {
    fields: [promptExecutionResults.versionId],
    references: [promptVersions.id],
  }),
}));
