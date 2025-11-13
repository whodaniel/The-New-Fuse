export interface WorkflowTemplate {
    id: string;
    name: string;
    description: string;
    steps: WorkflowStep[];
    context?: WorkflowContext;
}
export interface WorkflowStep {
    id: string;
    type: WorkflowStepType;
    parameters: WorkflowParameters;
    next?: string;
    _unused?: never;
}
export interface WorkflowInstance {
    id: string;
    workflowId: string;
    status: WorkflowStatus;
    startTime: Date;
    endTime?: Date;
    currentStep?: string;
}
export interface WorkflowOutput {
    stepId: string;
    result: Record<string, unknown>;
}
export declare enum WorkflowStatus {
    DRAFT = "draft",
    PUBLISHED = "published",
    ACTIVE = "active",
    ARCHIVED = "archived",
    PAUSED = "paused",
    COMPLETED = "completed",
    FAILED = "failed",
    RUNNING = "running",
    CANCELLED = "cancelled",
    STOPPED = "stopped",
    PENDING = "pending",
    IDLE = "idle"
}
export declare enum WorkflowStepType {
    ACTION = "action",
    CONDITION = "condition",
    TRIGGER = "trigger",
    WAIT = "wait",
    SUB_WORKFLOW = "sub-workflow",
    AGENT_TASK = "agent_task",
    API_CALL = "api_call",
    HUMAN_INPUT = "human_input",
    TRANSFORMATION = "transformation",
    LOOP = "loop"
}
/**
 * Workflow execution status enumeration
 */
export declare enum WorkflowExecutionStatus {
    PENDING = "PENDING",
    RUNNING = "RUNNING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    CANCELLED = "CANCELLED",
    PAUSED = "PAUSED"
}
/**
 * Workflow-specific agent type enumeration for workflow nodes
 * Renamed from AgentType to avoid conflicts with the main AgentType enum
 */
export declare enum WorkflowAgentType {
    HUMAN = "HUMAN",
    AI = "AI",
    HYBRID = "HYBRID",
    SYSTEM = "SYSTEM"
}
/**
 * Workflow node type enumeration
 */
export declare enum WorkflowNodeType {
    START = "start",
    END = "end",
    AGENT_TASK = "agent_task",
    AGENT_HANDOFF = "agent_handoff",
    AGENT_COORDINATION = "agent_coordination",
    CONDITION = "condition",
    LOOP = "loop",
    PARALLEL = "parallel",
    MERGE = "merge",
    API_CALL = "api_call",
    DATABASE_QUERY = "database_query",
    FILE_OPERATION = "file_operation",
    RELAY_MESSAGE = "relay_message",
    WEBHOOK = "webhook",
    EMAIL = "email",
    LLM_PROMPT = "llm_prompt",
    CODE_GENERATION = "code_generation",
    ANALYSIS = "analysis",
    CUSTOM = "custom"
}
/**
 * Variable type enumeration
 */
export declare enum VariableType {
    STRING = "string",
    NUMBER = "number",
    BOOLEAN = "boolean",
    OBJECT = "object",
    ARRAY = "array",
    DATE = "date",
    FILE = "file",
    SECRET = "secret"
}
/**
 * Variable scope enumeration
 */
export declare enum VariableScope {
    GLOBAL = "global",
    WORKFLOW = "workflow",
    NODE = "node",
    EXECUTION = "execution"
}
/**
 * Trigger type enumeration
 */
export declare enum TriggerType {
    MANUAL = "manual",
    SCHEDULED = "scheduled",
    WEBHOOK = "webhook",
    FILE_CHANGE = "file_change",
    AGENT_EVENT = "agent_event",
    RELAY_MESSAGE = "relay_message",
    DATABASE_CHANGE = "database_change",
    API_ENDPOINT = "api_endpoint"
}
/**
 * Node execution status enumeration
 */
export declare enum NodeExecutionStatus {
    PENDING = "pending",
    RUNNING = "running",
    COMPLETED = "completed",
    FAILED = "failed",
    SKIPPED = "skipped",
    CANCELLED = "cancelled",
    RETRYING = "retrying"
}
/**
 * Workflow event type enumeration
 */
export declare enum WorkflowEventType {
    WORKFLOW_STARTED = "workflow_started",
    WORKFLOW_COMPLETED = "workflow_completed",
    WORKFLOW_FAILED = "workflow_failed",
    WORKFLOW_CANCELLED = "workflow_cancelled",
    NODE_STARTED = "node_started",
    NODE_COMPLETED = "node_completed",
    NODE_FAILED = "node_failed",
    AGENT_ASSIGNED = "agent_assigned",
    AGENT_HANDOFF = "agent_handoff",
    VARIABLE_UPDATED = "variable_updated",
    ERROR_OCCURRED = "error_occurred"
}
/**
 * Workflow sort field enumeration
 */
export declare enum WorkflowSortField {
    NAME = "name",
    CREATED_AT = "createdAt",
    UPDATED_AT = "updatedAt",
    LAST_EXECUTED_AT = "lastExecutedAt",
    EXECUTION_COUNT = "executionCount",
    SUCCESS_RATE = "successRate"
}
/**
 * Execution sort field enumeration
 */
export declare enum ExecutionSortField {
    STARTED_AT = "startedAt",
    COMPLETED_AT = "completedAt",
    DURATION = "duration",
    STATUS = "status"
}
export interface WorkflowParameters {
    readonly [key: string]: string | number | boolean | null | undefined;
}
export interface WorkflowError {
    message: string;
    code: string;
}
export interface WorkflowDefinition {
    id: string;
    name: string;
    steps: WorkflowStep[];
}
export interface WorkflowContext {
    readonly [key: string]: unknown;
}
export declare function isAgentTaskNode(node: any): boolean;
export declare function isAgentHandoffNode(node: any): boolean;
export declare function isConditionNode(node: any): boolean;
export declare function isLLMPromptNode(node: any): boolean;
//# sourceMappingURL=index.d.ts.map