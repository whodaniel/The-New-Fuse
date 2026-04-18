/**
 * Drizzle ORM Schema - Task & Pipeline System
 */
import { relations } from 'drizzle-orm';
import { jsonb, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { agents } from './agents.js';
import { pipelineStatusEnum, taskPriorityEnum, taskStatusEnum } from './enums.js';
import { users } from './users.js';

// =============================================================================
// PIPELINE
// =============================================================================

export const pipelines = pgTable('pipelines', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  configuration: jsonb('configuration'),
  status: pipelineStatusEnum('status').default('DRAFT').notNull(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  agentId: uuid('agent_id')
    .notNull()
    .references(() => agents.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

// =============================================================================
// TASK
// =============================================================================

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }),
  description: text('description'),
  type: varchar('type', { length: 100 }).notNull(),
  status: taskStatusEnum('status').default('PENDING').notNull(),
  priority: taskPriorityEnum('priority').default('MEDIUM').notNull(),
  data: jsonb('data'),
  result: jsonb('result'),
  error: text('error'),
  startTime: timestamp('start_time'),
  endTime: timestamp('end_time'),
  pipelineId: uuid('pipeline_id').references(() => pipelines.id),
  assignedToId: uuid('assigned_to_id').references(() => agents.id),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  metadata: jsonb('metadata'),
});

// =============================================================================
// TASK EXECUTION
// =============================================================================

export const taskExecutions = pgTable('task_executions', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 50 }).notNull(),
  output: jsonb('output'),
  error: text('error'),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

// =============================================================================
// RELATIONS
// =============================================================================

export const pipelinesRelations = relations(pipelines, ({ one, many }) => ({
  user: one(users, {
    fields: [pipelines.userId],
    references: [users.id],
  }),
  agent: one(agents, {
    fields: [pipelines.agentId],
    references: [agents.id],
  }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  pipeline: one(pipelines, {
    fields: [tasks.pipelineId],
    references: [pipelines.id],
  }),
  assignedTo: one(agents, {
    fields: [tasks.assignedToId],
    references: [agents.id],
  }),
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
  executions: many(taskExecutions),
}));

export const taskExecutionsRelations = relations(taskExecutions, ({ one }) => ({
  task: one(tasks, {
    fields: [taskExecutions.taskId],
    references: [tasks.id],
  }),
}));
