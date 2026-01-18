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

// Prompt definitions moved to ./prompt-templates.ts

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
// NOTIFICATIONS
// =============================================================================

import { users } from './users';

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 100 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  read: boolean('read').default(false).notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// =============================================================================
// RELATIONS
// =============================================================================

// Prompt relations moved to ./prompt-templates.ts
