/**
 * Drizzle ORM Schema - Workflow System
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
import { agents } from './agents';
import { workflowExecutionStatusEnum, workflowStatusEnum } from './enums';
import { users } from './users';

// =============================================================================
// WORKFLOW
// =============================================================================

export const workflows = pgTable('workflows', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  definition: jsonb('definition'),
  status: workflowStatusEnum('status').default('DRAFT').notNull(),
  creatorId: uuid('creator_id').references(() => users.id),
  agentId: uuid('agent_id').references(() => agents.id),
  metadata: jsonb('metadata'),
  isActive: boolean('is_active').default(true).notNull(),
  variables: jsonb('variables'),
  triggers: jsonb('triggers'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastExecutedAt: timestamp('last_executed_at'),
  executionCount: integer('execution_count').default(0).notNull(),
  statistics: jsonb('statistics'),
  deletedAt: timestamp('deleted_at'),
});

// =============================================================================
// WORKFLOW STEP
// =============================================================================

export const workflowSteps = pgTable('workflow_steps', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 100 }).notNull(),
  config: jsonb('config'),
  order: integer('order').default(0).notNull(),
  workflowId: uuid('workflow_id').references(() => workflows.id),
  agentId: uuid('agent_id').references(() => agents.id),
  nextSteps: jsonb('next_steps').$type<string[]>().default([]).notNull(),
  conditions: jsonb('conditions'),
  transformations: jsonb('transformations'),
  metadata: jsonb('metadata'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastExecutedAt: timestamp('last_executed_at'),
  statistics: jsonb('statistics'),
});

// =============================================================================
// WORKFLOW EXECUTION
// =============================================================================

export const workflowExecutions = pgTable('workflow_executions', {
  id: uuid('id').primaryKey().defaultRandom(),
  workflowId: uuid('workflow_id')
    .notNull()
    .references(() => workflows.id),
  status: workflowExecutionStatusEnum('status').default('PENDING').notNull(),
  input: jsonb('input'),
  output: jsonb('output'),
  error: text('error'),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  projectId: uuid('project_id'),
  nodeExecutions: jsonb('node_executions').default([]),
  context: jsonb('context'),
  logs: jsonb('logs').default([]),
  statistics: jsonb('statistics'),
  metadata: jsonb('metadata'),
});

// =============================================================================
// WORKFLOW TEMPLATE
// =============================================================================

export const workflowTemplates = pgTable('workflow_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }).default('Custom').notNull(),
  definition: jsonb('definition').notNull(),
  isPublic: boolean('is_public').default(false).notNull(),
  creatorId: uuid('creator_id').references(() => users.id),
  metadata: jsonb('metadata'),
  usageCount: integer('usage_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =============================================================================
// RELATIONS
// =============================================================================

export const workflowsRelations = relations(workflows, ({ one, many }) => ({
  creator: one(users, {
    fields: [workflows.creatorId],
    references: [users.id],
  }),
  agent: one(agents, {
    fields: [workflows.agentId],
    references: [agents.id],
  }),
  steps: many(workflowSteps),
  executions: many(workflowExecutions),
}));

export const workflowStepsRelations = relations(workflowSteps, ({ one }) => ({
  workflow: one(workflows, {
    fields: [workflowSteps.workflowId],
    references: [workflows.id],
  }),
  agent: one(agents, {
    fields: [workflowSteps.agentId],
    references: [agents.id],
  }),
}));

export const workflowExecutionsRelations = relations(workflowExecutions, ({ one }) => ({
  workflow: one(workflows, {
    fields: [workflowExecutions.workflowId],
    references: [workflows.id],
  }),
}));

export const workflowTemplatesRelations = relations(workflowTemplates, ({ one }) => ({
  creator: one(users, {
    fields: [workflowTemplates.creatorId],
    references: [users.id],
  }),
}));
