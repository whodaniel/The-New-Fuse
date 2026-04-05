"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workflowTemplatesRelations = exports.workflowExecutionsRelations = exports.workflowStepsRelations = exports.workflowsRelations = exports.workflowTemplates = exports.workflowExecutions = exports.workflowSteps = exports.workflows = void 0;
/**
 * Drizzle ORM Schema - Workflow System
 */
const drizzle_orm_1 = require("drizzle-orm");
const pg_core_1 = require("drizzle-orm/pg-core");
const agents_1 = require("./agents");
const enums_1 = require("./enums");
const users_1 = require("./users");
// =============================================================================
// WORKFLOW
// =============================================================================
exports.workflows = (0, pg_core_1.pgTable)('workflows', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    description: (0, pg_core_1.text)('description'),
    definition: (0, pg_core_1.jsonb)('definition'),
    status: (0, enums_1.workflowStatusEnum)('status').default('DRAFT').notNull(),
    creatorId: (0, pg_core_1.uuid)('creator_id').references(() => users_1.users.id),
    agentId: (0, pg_core_1.uuid)('agent_id').references(() => agents_1.agents.id),
    metadata: (0, pg_core_1.jsonb)('metadata'),
    isActive: (0, pg_core_1.boolean)('is_active').default(true).notNull(),
    variables: (0, pg_core_1.jsonb)('variables'),
    triggers: (0, pg_core_1.jsonb)('triggers'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
    lastExecutedAt: (0, pg_core_1.timestamp)('last_executed_at'),
    executionCount: (0, pg_core_1.integer)('execution_count').default(0).notNull(),
    statistics: (0, pg_core_1.jsonb)('statistics'),
    deletedAt: (0, pg_core_1.timestamp)('deleted_at'),
});
// =============================================================================
// WORKFLOW STEP
// =============================================================================
exports.workflowSteps = (0, pg_core_1.pgTable)('workflow_steps', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    type: (0, pg_core_1.varchar)('type', { length: 100 }).notNull(),
    config: (0, pg_core_1.jsonb)('config'),
    order: (0, pg_core_1.integer)('order').default(0).notNull(),
    workflowId: (0, pg_core_1.uuid)('workflow_id').references(() => exports.workflows.id),
    agentId: (0, pg_core_1.uuid)('agent_id').references(() => agents_1.agents.id),
    nextSteps: (0, pg_core_1.jsonb)('next_steps').$type().default([]).notNull(),
    conditions: (0, pg_core_1.jsonb)('conditions'),
    transformations: (0, pg_core_1.jsonb)('transformations'),
    metadata: (0, pg_core_1.jsonb)('metadata'),
    isActive: (0, pg_core_1.boolean)('is_active').default(true).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
    lastExecutedAt: (0, pg_core_1.timestamp)('last_executed_at'),
    statistics: (0, pg_core_1.jsonb)('statistics'),
});
// =============================================================================
// WORKFLOW EXECUTION
// =============================================================================
exports.workflowExecutions = (0, pg_core_1.pgTable)('workflow_executions', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    workflowId: (0, pg_core_1.uuid)('workflow_id')
        .notNull()
        .references(() => exports.workflows.id),
    status: (0, enums_1.workflowExecutionStatusEnum)('status').default('PENDING').notNull(),
    input: (0, pg_core_1.jsonb)('input'),
    output: (0, pg_core_1.jsonb)('output'),
    error: (0, pg_core_1.text)('error'),
    startedAt: (0, pg_core_1.timestamp)('started_at').defaultNow().notNull(),
    completedAt: (0, pg_core_1.timestamp)('completed_at'),
    projectId: (0, pg_core_1.uuid)('project_id'),
    nodeExecutions: (0, pg_core_1.jsonb)('node_executions').default([]),
    context: (0, pg_core_1.jsonb)('context'),
    logs: (0, pg_core_1.jsonb)('logs').default([]),
    statistics: (0, pg_core_1.jsonb)('statistics'),
    metadata: (0, pg_core_1.jsonb)('metadata'),
});
// =============================================================================
// WORKFLOW TEMPLATE
// =============================================================================
exports.workflowTemplates = (0, pg_core_1.pgTable)('workflow_templates', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    description: (0, pg_core_1.text)('description'),
    category: (0, pg_core_1.varchar)('category', { length: 100 }).default('Custom').notNull(),
    definition: (0, pg_core_1.jsonb)('definition').notNull(),
    isPublic: (0, pg_core_1.boolean)('is_public').default(false).notNull(),
    creatorId: (0, pg_core_1.uuid)('creator_id').references(() => users_1.users.id),
    metadata: (0, pg_core_1.jsonb)('metadata'),
    usageCount: (0, pg_core_1.integer)('usage_count').default(0).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
// =============================================================================
// RELATIONS
// =============================================================================
exports.workflowsRelations = (0, drizzle_orm_1.relations)(exports.workflows, ({ one, many }) => ({
    creator: one(users_1.users, {
        fields: [exports.workflows.creatorId],
        references: [users_1.users.id],
    }),
    agent: one(agents_1.agents, {
        fields: [exports.workflows.agentId],
        references: [agents_1.agents.id],
    }),
    steps: many(exports.workflowSteps),
    executions: many(exports.workflowExecutions),
}));
exports.workflowStepsRelations = (0, drizzle_orm_1.relations)(exports.workflowSteps, ({ one }) => ({
    workflow: one(exports.workflows, {
        fields: [exports.workflowSteps.workflowId],
        references: [exports.workflows.id],
    }),
    agent: one(agents_1.agents, {
        fields: [exports.workflowSteps.agentId],
        references: [agents_1.agents.id],
    }),
}));
exports.workflowExecutionsRelations = (0, drizzle_orm_1.relations)(exports.workflowExecutions, ({ one }) => ({
    workflow: one(exports.workflows, {
        fields: [exports.workflowExecutions.workflowId],
        references: [exports.workflows.id],
    }),
}));
exports.workflowTemplatesRelations = (0, drizzle_orm_1.relations)(exports.workflowTemplates, ({ one }) => ({
    creator: one(users_1.users, {
        fields: [exports.workflowTemplates.creatorId],
        references: [users_1.users.id],
    }),
}));
//# sourceMappingURL=workflows.js.map