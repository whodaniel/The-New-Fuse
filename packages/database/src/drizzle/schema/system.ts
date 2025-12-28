/**
 * Drizzle ORM Schema - Entity Registry, LLM Config, Prompts, Monitoring
 */
import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { entityStatusEnum, registeredEntityTypeEnum } from './enums';

// =============================================================================
// REGISTERED ENTITY
// =============================================================================

export const registeredEntities = pgTable('registered_entities', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  type: registeredEntityTypeEnum('type').notNull(),
  description: text('description'),
  metadata: jsonb('metadata'),
  config: jsonb('config'),
  status: entityStatusEnum('status').default('ACTIVE').notNull(),
  version: varchar('version', { length: 20 }).default('1.0.0').notNull(),
  namespace: varchar('namespace', { length: 100 }),
  tags: jsonb('tags').$type<string[]>().default([]).notNull(),
  capabilities: jsonb('capabilities').$type<string[]>().default([]).notNull(),
  dependencies: jsonb('dependencies').$type<string[]>().default([]).notNull(),
  isPublic: boolean('is_public').default(false).notNull(),
  ownerId: uuid('owner_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

// =============================================================================
// LLM CONFIG
// =============================================================================

export const llmConfigs = pgTable('llm_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  provider: varchar('provider', { length: 100 }).notNull(),
  modelName: varchar('model_name', { length: 255 }).notNull(),
  apiKey: varchar('api_key', { length: 512 }).notNull(), // Should be encrypted
  apiEndpoint: text('api_endpoint'),
  isCustom: boolean('is_custom').default(false).notNull(),
  enabled: boolean('enabled').default(true).notNull(),
  priority: integer('priority').default(10).notNull(),
  retryConfig: jsonb('retry_config'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

// =============================================================================
// PROMPT TEMPLATE
// =============================================================================

export const promptTemplates = pgTable('prompt_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  currentVersionId: uuid('current_version_id'),
  isPublic: boolean('is_public').default(false).notNull(),
  category: varchar('category', { length: 100 }),
  tags: jsonb('tags').$type<string[]>().default([]).notNull(),
  analytics: jsonb('analytics'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =============================================================================
// PROMPT VERSION
// =============================================================================

export const promptVersions = pgTable('prompt_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateId: uuid('template_id')
    .notNull()
    .references(() => promptTemplates.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  label: varchar('label', { length: 100 }),
  content: text('content').notNull(),
  variables: jsonb('variables'),
  metrics: jsonb('metrics'),
  changelog: text('changelog'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// =============================================================================
// PROMPT SNIPPET
// =============================================================================

export const promptSnippets = pgTable('prompt_snippets', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  content: text('content').notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  category: varchar('category', { length: 100 }),
  tags: jsonb('tags').$type<string[]>().default([]).notNull(),
  usageCount: integer('usage_count').default(0).notNull(),
  description: text('description'),
  isStarred: boolean('is_starred').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =============================================================================
// VALIDATION DATASET
// =============================================================================

export const validationDatasets = pgTable('validation_datasets', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  items: jsonb('items').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =============================================================================
// BUSINESS METRIC
// =============================================================================

export const businessMetrics = pgTable('business_metrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  value: real('value').notNull(),
  tags: jsonb('tags'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// =============================================================================
// ERROR LOG
// =============================================================================

export const errorLogs = pgTable('error_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  message: text('message').notNull(),
  stack: text('stack'),
  context: jsonb('context'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// =============================================================================
// RELATIONS
// =============================================================================

export const promptTemplatesRelations = relations(promptTemplates, ({ many }) => ({
  versions: many(promptVersions),
}));

export const promptVersionsRelations = relations(promptVersions, ({ one }) => ({
  template: one(promptTemplates, {
    fields: [promptVersions.templateId],
    references: [promptTemplates.id],
  }),
}));
