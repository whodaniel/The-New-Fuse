"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workflowTopologies = exports.optimizationJobs = void 0;
/**
 * Drizzle ORM Schema - MASS (Multi-Agent System Synthesis)
 */
const pg_core_1 = require("drizzle-orm/pg-core");
const users_1 = require("./users");
// =============================================================================
// OPTIMIZATION JOB
// =============================================================================
exports.optimizationJobs = (0, pg_core_1.pgTable)('optimization_jobs', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    type: (0, pg_core_1.varchar)('type', { length: 50 }).notNull(), // 'block_level', 'topology', 'workflow_level'
    targetId: (0, pg_core_1.varchar)('target_id', { length: 255 }).notNull(), // agentId, topologyId, etc.
    status: (0, pg_core_1.varchar)('status', { length: 50 }).default('pending').notNull(),
    config: (0, pg_core_1.jsonb)('config').notNull(),
    results: (0, pg_core_1.jsonb)('results'),
    userId: (0, pg_core_1.uuid)('user_id').references(() => users_1.users.id, { onDelete: 'cascade' }),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
    error: (0, pg_core_1.text)('error'),
});
// =============================================================================
// WORKFLOW TOPOLOGY
// =============================================================================
exports.workflowTopologies = (0, pg_core_1.pgTable)('workflow_topologies', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    description: (0, pg_core_1.text)('description'),
    nodes: (0, pg_core_1.jsonb)('nodes').notNull(), // WorkflowNode[]
    edges: (0, pg_core_1.jsonb)('edges').notNull(), // WorkflowEdge[]
    performanceMetrics: (0, pg_core_1.jsonb)('performance_metrics'),
    massOptimized: (0, pg_core_1.boolean)('mass_optimized').default(false).notNull(),
    userId: (0, pg_core_1.uuid)('user_id').references(() => users_1.users.id, { onDelete: 'cascade' }),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
//# sourceMappingURL=mass.js.map