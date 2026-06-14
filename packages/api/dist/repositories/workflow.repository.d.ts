/**
 * Workflow Repository - Drizzle ORM Implementation
 *
 * This repository provides data access for Workflow entities using Drizzle ORM.
 * It replaces the legacy Drizzle-based repository.
 */
import { type DrizzleClient } from '@the-new-fuse/database';
declare const workflows: import("drizzle-orm/pg-core/table", { with: { "resolution-mode": "require" } }).PgTableWithColumns<{
    name: "workflows";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core", { with: { "resolution-mode": "require" } }).PgColumn<{
            name: "id";
            tableName: "workflows";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        name: import("drizzle-orm/pg-core", { with: { "resolution-mode": "require" } }).PgColumn<{
            name: "name";
            tableName: "workflows";
            dataType: "string";
            columnType: "PgVarchar";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: 255;
        }>;
        description: import("drizzle-orm/pg-core", { with: { "resolution-mode": "require" } }).PgColumn<{
            name: "description";
            tableName: "workflows";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        definition: import("drizzle-orm/pg-core", { with: { "resolution-mode": "require" } }).PgColumn<{
            name: "definition";
            tableName: "workflows";
            dataType: "json";
            columnType: "PgJsonb";
            data: unknown;
            driverParam: unknown;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        status: import("drizzle-orm/pg-core", { with: { "resolution-mode": "require" } }).PgColumn<{
            name: "status";
            tableName: "workflows";
            dataType: "string";
            columnType: "PgEnumColumn";
            data: "ACTIVE" | "DRAFT" | "PUBLISHED" | "ARCHIVED" | "PAUSED" | "COMPLETED" | "FAILED";
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: ["DRAFT", "PUBLISHED", "ARCHIVED", "ACTIVE", "PAUSED", "COMPLETED", "FAILED"];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        creatorId: import("drizzle-orm/pg-core", { with: { "resolution-mode": "require" } }).PgColumn<{
            name: "creator_id";
            tableName: "workflows";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        agentId: import("drizzle-orm/pg-core", { with: { "resolution-mode": "require" } }).PgColumn<{
            name: "agent_id";
            tableName: "workflows";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        metadata: import("drizzle-orm/pg-core", { with: { "resolution-mode": "require" } }).PgColumn<{
            name: "metadata";
            tableName: "workflows";
            dataType: "json";
            columnType: "PgJsonb";
            data: unknown;
            driverParam: unknown;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        isActive: import("drizzle-orm/pg-core", { with: { "resolution-mode": "require" } }).PgColumn<{
            name: "is_active";
            tableName: "workflows";
            dataType: "boolean";
            columnType: "PgBoolean";
            data: boolean;
            driverParam: boolean;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        variables: import("drizzle-orm/pg-core", { with: { "resolution-mode": "require" } }).PgColumn<{
            name: "variables";
            tableName: "workflows";
            dataType: "json";
            columnType: "PgJsonb";
            data: unknown;
            driverParam: unknown;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        triggers: import("drizzle-orm/pg-core", { with: { "resolution-mode": "require" } }).PgColumn<{
            name: "triggers";
            tableName: "workflows";
            dataType: "json";
            columnType: "PgJsonb";
            data: unknown;
            driverParam: unknown;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        createdAt: import("drizzle-orm/pg-core", { with: { "resolution-mode": "require" } }).PgColumn<{
            name: "created_at";
            tableName: "workflows";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        updatedAt: import("drizzle-orm/pg-core", { with: { "resolution-mode": "require" } }).PgColumn<{
            name: "updated_at";
            tableName: "workflows";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        lastExecutedAt: import("drizzle-orm/pg-core", { with: { "resolution-mode": "require" } }).PgColumn<{
            name: "last_executed_at";
            tableName: "workflows";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        executionCount: import("drizzle-orm/pg-core", { with: { "resolution-mode": "require" } }).PgColumn<{
            name: "execution_count";
            tableName: "workflows";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        statistics: import("drizzle-orm/pg-core", { with: { "resolution-mode": "require" } }).PgColumn<{
            name: "statistics";
            tableName: "workflows";
            dataType: "json";
            columnType: "PgJsonb";
            data: unknown;
            driverParam: unknown;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        deletedAt: import("drizzle-orm/pg-core", { with: { "resolution-mode": "require" } }).PgColumn<{
            name: "deleted_at";
            tableName: "workflows";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>, workflowExecutions: import("drizzle-orm/pg-core/table", { with: { "resolution-mode": "require" } }).PgTableWithColumns<{
    name: "workflow_executions";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core", { with: { "resolution-mode": "require" } }).PgColumn<{
            name: "id";
            tableName: "workflow_executions";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        workflowId: import("drizzle-orm/pg-core", { with: { "resolution-mode": "require" } }).PgColumn<{
            name: "workflow_id";
            tableName: "workflow_executions";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        status: import("drizzle-orm/pg-core", { with: { "resolution-mode": "require" } }).PgColumn<{
            name: "status";
            tableName: "workflow_executions";
            dataType: "string";
            columnType: "PgEnumColumn";
            data: "PAUSED" | "COMPLETED" | "FAILED" | "PENDING" | "RUNNING" | "CANCELLED";
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: ["PENDING", "RUNNING", "PAUSED", "COMPLETED", "FAILED", "CANCELLED"];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        input: import("drizzle-orm/pg-core", { with: { "resolution-mode": "require" } }).PgColumn<{
            name: "input";
            tableName: "workflow_executions";
            dataType: "json";
            columnType: "PgJsonb";
            data: unknown;
            driverParam: unknown;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        output: import("drizzle-orm/pg-core", { with: { "resolution-mode": "require" } }).PgColumn<{
            name: "output";
            tableName: "workflow_executions";
            dataType: "json";
            columnType: "PgJsonb";
            data: unknown;
            driverParam: unknown;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        error: import("drizzle-orm/pg-core", { with: { "resolution-mode": "require" } }).PgColumn<{
            name: "error";
            tableName: "workflow_executions";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        startedAt: import("drizzle-orm/pg-core", { with: { "resolution-mode": "require" } }).PgColumn<{
            name: "started_at";
            tableName: "workflow_executions";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        completedAt: import("drizzle-orm/pg-core", { with: { "resolution-mode": "require" } }).PgColumn<{
            name: "completed_at";
            tableName: "workflow_executions";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        projectId: import("drizzle-orm/pg-core", { with: { "resolution-mode": "require" } }).PgColumn<{
            name: "project_id";
            tableName: "workflow_executions";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        nodeExecutions: import("drizzle-orm/pg-core", { with: { "resolution-mode": "require" } }).PgColumn<{
            name: "node_executions";
            tableName: "workflow_executions";
            dataType: "json";
            columnType: "PgJsonb";
            data: unknown;
            driverParam: unknown;
            notNull: false;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        context: import("drizzle-orm/pg-core", { with: { "resolution-mode": "require" } }).PgColumn<{
            name: "context";
            tableName: "workflow_executions";
            dataType: "json";
            columnType: "PgJsonb";
            data: unknown;
            driverParam: unknown;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        logs: import("drizzle-orm/pg-core", { with: { "resolution-mode": "require" } }).PgColumn<{
            name: "logs";
            tableName: "workflow_executions";
            dataType: "json";
            columnType: "PgJsonb";
            data: unknown;
            driverParam: unknown;
            notNull: false;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        statistics: import("drizzle-orm/pg-core", { with: { "resolution-mode": "require" } }).PgColumn<{
            name: "statistics";
            tableName: "workflow_executions";
            dataType: "json";
            columnType: "PgJsonb";
            data: unknown;
            driverParam: unknown;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        metadata: import("drizzle-orm/pg-core", { with: { "resolution-mode": "require" } }).PgColumn<{
            name: "metadata";
            tableName: "workflow_executions";
            dataType: "json";
            columnType: "PgJsonb";
            data: unknown;
            driverParam: unknown;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
type Workflow = typeof workflows.$inferSelect;
type WorkflowExecution = typeof workflowExecutions.$inferSelect;
interface WorkflowInsert {
    name: string;
    description?: string | null;
    definition?: any;
    status?: string;
    creatorId?: string | null;
    agentId?: string | null;
    metadata?: any;
    isActive?: boolean;
    variables?: any;
    triggers?: any;
    deletedAt?: Date | null;
}
interface WorkflowExecutionInsert {
    workflowId: string;
    status?: string;
    input?: any;
    output?: any;
    error?: string | null;
    completedAt?: Date | null;
    projectId?: string | null;
}
export interface IWorkflowRepository {
    create(data: WorkflowInsert): Promise<Workflow>;
    findById(id: string): Promise<Workflow | null>;
    findByUserId(userId: string): Promise<Workflow[]>;
    findAll(filter?: Partial<Workflow>): Promise<Workflow[]>;
    findOne(filter: Partial<Workflow>): Promise<Workflow | null>;
    update(id: string, data: Partial<WorkflowInsert>): Promise<Workflow | null>;
    delete(id: string): Promise<boolean>;
}
export declare class WorkflowRepository implements IWorkflowRepository {
    private readonly db;
    constructor(db: DrizzleClient);
    /**
     * Create a new workflow
     */
    create(data: WorkflowInsert): Promise<Workflow>;
    /**
     * Find workflow by ID
     */
    findById(id: string): Promise<Workflow | null>;
    /**
     * Find all workflows for a user
     */
    findByUserId(userId: string): Promise<Workflow[]>;
    /**
     * Find all workflows with optional filter
     */
    findAll(filter?: Partial<Workflow>): Promise<Workflow[]>;
    /**
     * Find one workflow matching filter
     */
    findOne(filter: Partial<Workflow>): Promise<Workflow | null>;
    /**
     * Update a workflow
     */
    update(id: string, data: Partial<WorkflowInsert>): Promise<Workflow | null>;
    /**
     * Soft delete a workflow
     */
    delete(id: string): Promise<boolean>;
}
/**
 * Workflow Execution Repository
 */
export declare class WorkflowExecutionRepository {
    private readonly db;
    constructor(db: DrizzleClient);
    /**
     * Create a new workflow execution
     */
    create(data: WorkflowExecutionInsert): Promise<WorkflowExecution>;
    /**
     * Find execution by ID
     */
    findById(id: string): Promise<WorkflowExecution | null>;
    /**
     * Find all executions for a workflow
     */
    findByWorkflowId(workflowId: string): Promise<WorkflowExecution[]>;
    /**
     * Find one execution matching filter
     */
    findOne(filter: Partial<WorkflowExecution>): Promise<WorkflowExecution | null>;
    /**
     * Find all executions matching filter
     */
    findAll(filter: Partial<WorkflowExecution>): Promise<WorkflowExecution[]>;
    /**
     * Update an execution
     */
    update(id: string, data: Partial<WorkflowExecutionInsert>): Promise<WorkflowExecution | null>;
    /**
     * Delete an execution
     */
    delete(id: string): Promise<boolean>;
}
export type { Workflow, WorkflowInsert as NewWorkflow, WorkflowExecution, WorkflowExecutionInsert as NewWorkflowExecution };
//# sourceMappingURL=workflow.repository.d.ts.map