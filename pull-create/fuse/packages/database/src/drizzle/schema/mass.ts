/**
 * Drizzle ORM Schema - MASS (Multi-Agent System Synthesis)
 */
import { boolean, jsonb, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { users } from './users';

// =============================================================================
// OPTIMIZATION JOB
// =============================================================================

export const optimizationJobs = pgTable('optimization_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: varchar('type', { length: 50 }).notNull(), // 'block_level', 'topology', 'workflow_level'
  targetId: varchar('target_id', { length: 255 }).notNull(), // agentId, topologyId, etc.
  status: varchar('status', { length: 50 }).default('pending').notNull(),
  config: jsonb('config').notNull(),
  results: jsonb('results'),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  error: text('error'),
});

// =============================================================================
// WORKFLOW TOPOLOGY
// =============================================================================

export const workflowTopologies = pgTable('workflow_topologies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  nodes: jsonb('nodes').notNull(), // WorkflowNode[]
  edges: jsonb('edges').notNull(), // WorkflowEdge[]
  performanceMetrics: jsonb('performance_metrics'),
  massOptimized: boolean('mass_optimized').default(false).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
