"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskExecutionsRelations = exports.tasksRelations = exports.pipelinesRelations = exports.taskExecutions = exports.tasks = exports.pipelines = void 0;
/**
 * Drizzle ORM Schema - Task & Pipeline System
 */
const drizzle_orm_1 = require("drizzle-orm");
const pg_core_1 = require("drizzle-orm/pg-core");
const agents_1 = require("./agents");
const enums_1 = require("./enums");
const users_1 = require("./users");
// =============================================================================
// PIPELINE
// =============================================================================
exports.pipelines = (0, pg_core_1.pgTable)('pipelines', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    description: (0, pg_core_1.text)('description'),
    configuration: (0, pg_core_1.jsonb)('configuration'),
    status: (0, enums_1.pipelineStatusEnum)('status').default('DRAFT').notNull(),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => users_1.users.id, { onDelete: 'cascade' }),
    agentId: (0, pg_core_1.uuid)('agent_id')
        .notNull()
        .references(() => agents_1.agents.id),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
    deletedAt: (0, pg_core_1.timestamp)('deleted_at'),
});
// =============================================================================
// TASK
// =============================================================================
exports.tasks = (0, pg_core_1.pgTable)('tasks', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    title: (0, pg_core_1.varchar)('title', { length: 255 }),
    description: (0, pg_core_1.text)('description'),
    type: (0, pg_core_1.varchar)('type', { length: 100 }).notNull(),
    status: (0, enums_1.taskStatusEnum)('status').default('PENDING').notNull(),
    priority: (0, enums_1.taskPriorityEnum)('priority').default('MEDIUM').notNull(),
    data: (0, pg_core_1.jsonb)('data'),
    result: (0, pg_core_1.jsonb)('result'),
    error: (0, pg_core_1.text)('error'),
    startTime: (0, pg_core_1.timestamp)('start_time'),
    endTime: (0, pg_core_1.timestamp)('end_time'),
    pipelineId: (0, pg_core_1.uuid)('pipeline_id').references(() => exports.pipelines.id),
    assignedToId: (0, pg_core_1.uuid)('assigned_to_id').references(() => agents_1.agents.id),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => users_1.users.id),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
    deletedAt: (0, pg_core_1.timestamp)('deleted_at'),
    metadata: (0, pg_core_1.jsonb)('metadata'),
});
// =============================================================================
// TASK EXECUTION
// =============================================================================
exports.taskExecutions = (0, pg_core_1.pgTable)('task_executions', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    taskId: (0, pg_core_1.uuid)('task_id')
        .notNull()
        .references(() => exports.tasks.id, { onDelete: 'cascade' }),
    status: (0, pg_core_1.varchar)('status', { length: 50 }).notNull(),
    output: (0, pg_core_1.jsonb)('output'),
    error: (0, pg_core_1.text)('error'),
    startedAt: (0, pg_core_1.timestamp)('started_at').defaultNow().notNull(),
    completedAt: (0, pg_core_1.timestamp)('completed_at'),
});
// =============================================================================
// RELATIONS
// =============================================================================
exports.pipelinesRelations = (0, drizzle_orm_1.relations)(exports.pipelines, ({ one, many }) => ({
    user: one(users_1.users, {
        fields: [exports.pipelines.userId],
        references: [users_1.users.id],
    }),
    agent: one(agents_1.agents, {
        fields: [exports.pipelines.agentId],
        references: [agents_1.agents.id],
    }),
    tasks: many(exports.tasks),
}));
exports.tasksRelations = (0, drizzle_orm_1.relations)(exports.tasks, ({ one, many }) => ({
    pipeline: one(exports.pipelines, {
        fields: [exports.tasks.pipelineId],
        references: [exports.pipelines.id],
    }),
    assignedTo: one(agents_1.agents, {
        fields: [exports.tasks.assignedToId],
        references: [agents_1.agents.id],
    }),
    user: one(users_1.users, {
        fields: [exports.tasks.userId],
        references: [users_1.users.id],
    }),
    executions: many(exports.taskExecutions),
}));
exports.taskExecutionsRelations = (0, drizzle_orm_1.relations)(exports.taskExecutions, ({ one }) => ({
    task: one(exports.tasks, {
        fields: [exports.taskExecutions.taskId],
        references: [exports.tasks.id],
    }),
}));
//# sourceMappingURL=tasks.js.map