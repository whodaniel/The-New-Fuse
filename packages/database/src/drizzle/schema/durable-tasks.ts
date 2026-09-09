/**
 * Drizzle ORM Schema — Cloud DurableTasks (TNF compute plane)
 * Mirrors CLI ~/.tnf/durable-tasks semantics for multi-tenant SaaS.
 */
import { relations } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

export const durableTasks = pgTable(
  'durable_tasks',
  {
    id: varchar('id', { length: 128 }).notNull(),
    ownerUserId: varchar('owner_user_id', { length: 128 }).notNull(),
    version: integer('version').notNull().default(1),
    handler: varchar('handler', { length: 128 }).notNull().default('echo'),
    description: text('description'),
    queueName: varchar('queue_name', { length: 128 }).notNull().default('default'),
    concurrencyLimit: integer('concurrency_limit').notNull().default(5),
    machine: varchar('machine', { length: 32 }).notNull().default('small'),
    deployedVersion: integer('deployed_version').notNull().default(1),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.ownerUserId, table.id], name: 'durable_tasks_pk' }),
    ownerIdx: index('durable_tasks_owner_idx').on(table.ownerUserId),
  })
);

export const durableRuns = pgTable(
  'durable_runs',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    ownerUserId: varchar('owner_user_id', { length: 128 }).notNull(),
    taskId: varchar('task_id', { length: 128 }).notNull(),
    taskVersion: integer('task_version').notNull().default(1),
    status: varchar('status', { length: 32 }).notNull().default('QUEUED'),
    payload: jsonb('payload').$type<Record<string, unknown>>().default({}).notNull(),
    attempt: integer('attempt').notNull().default(0),
    ownership: jsonb('ownership').$type<Record<string, unknown>>().default({}).notNull(),
    result: jsonb('result'),
    error: text('error'),
    publicTokenHash: varchar('public_token_hash', { length: 128 }),
    machine: varchar('machine', { length: 32 }).default('small'),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    durationMs: integer('duration_ms'),
    estimatedCostUnits: doublePrecision('estimated_cost_units'),
    authorizationId: varchar('authorization_id', { length: 128 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    ownerIdx: index('durable_runs_owner_idx').on(table.ownerUserId),
    statusIdx: index('durable_runs_status_idx').on(table.status),
    taskIdx: index('durable_runs_task_idx').on(table.ownerUserId, table.taskId),
    createdIdx: index('durable_runs_created_idx').on(table.createdAt),
  })
);

export const durableSchedules = pgTable(
  'durable_schedules',
  {
    id: varchar('id', { length: 128 }).notNull(),
    ownerUserId: varchar('owner_user_id', { length: 128 }).notNull(),
    taskId: varchar('task_id', { length: 128 }).notNull(),
    everyMs: integer('every_ms').notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>(),
    enabled: boolean('enabled').notNull().default(true),
    lastFiredAt: timestamp('last_fired_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.ownerUserId, table.id], name: 'durable_schedules_pk' }),
    ownerIdx: index('durable_schedules_owner_idx').on(table.ownerUserId),
  })
);

export const durableRunEvents = pgTable(
  'durable_run_events',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    ownerUserId: varchar('owner_user_id', { length: 128 }).notNull(),
    runId: varchar('run_id', { length: 64 }).notNull(),
    seq: integer('seq').notNull(),
    type: varchar('type', { length: 128 }).notNull(),
    data: jsonb('data'),
    at: timestamp('at').defaultNow().notNull(),
  },
  (table) => ({
    runSeqIdx: index('durable_run_events_run_seq_idx').on(table.runId, table.seq),
    ownerIdx: index('durable_run_events_owner_idx').on(table.ownerUserId),
  })
);

export const durableTasksRelations = relations(durableTasks, ({ many }) => ({
  runs: many(durableRuns),
  schedules: many(durableSchedules),
}));

export const durableRunsRelations = relations(durableRuns, ({ many }) => ({
  events: many(durableRunEvents),
}));
