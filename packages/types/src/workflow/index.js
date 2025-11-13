export var WorkflowStatus;
(function (WorkflowStatus) {
    WorkflowStatus["DRAFT"] = "draft";
    WorkflowStatus["PUBLISHED"] = "published";
    WorkflowStatus["ACTIVE"] = "active";
    WorkflowStatus["ARCHIVED"] = "archived";
    WorkflowStatus["PAUSED"] = "paused";
    WorkflowStatus["COMPLETED"] = "completed";
    WorkflowStatus["FAILED"] = "failed";
    WorkflowStatus["RUNNING"] = "running";
    WorkflowStatus["CANCELLED"] = "cancelled";
    WorkflowStatus["STOPPED"] = "stopped";
    WorkflowStatus["PENDING"] = "pending";
    WorkflowStatus["IDLE"] = "idle";
})(WorkflowStatus || (WorkflowStatus = {}));
export var WorkflowStepType;
(function (WorkflowStepType) {
    WorkflowStepType["ACTION"] = "action";
    WorkflowStepType["CONDITION"] = "condition";
    WorkflowStepType["TRIGGER"] = "trigger";
    WorkflowStepType["WAIT"] = "wait";
    WorkflowStepType["SUB_WORKFLOW"] = "sub-workflow";
    WorkflowStepType["AGENT_TASK"] = "agent_task";
    WorkflowStepType["API_CALL"] = "api_call";
    WorkflowStepType["HUMAN_INPUT"] = "human_input";
    WorkflowStepType["TRANSFORMATION"] = "transformation";
    WorkflowStepType["LOOP"] = "loop";
})(WorkflowStepType || (WorkflowStepType = {}));
/**
 * Workflow execution status enumeration
 */
export var WorkflowExecutionStatus;
(function (WorkflowExecutionStatus) {
    WorkflowExecutionStatus["PENDING"] = "PENDING";
    WorkflowExecutionStatus["RUNNING"] = "RUNNING";
    WorkflowExecutionStatus["COMPLETED"] = "COMPLETED";
    WorkflowExecutionStatus["FAILED"] = "FAILED";
    WorkflowExecutionStatus["CANCELLED"] = "CANCELLED";
    WorkflowExecutionStatus["PAUSED"] = "PAUSED";
})(WorkflowExecutionStatus || (WorkflowExecutionStatus = {}));
/**
 * Workflow-specific agent type enumeration for workflow nodes
 * Renamed from AgentType to avoid conflicts with the main AgentType enum
 */
export var WorkflowAgentType;
(function (WorkflowAgentType) {
    WorkflowAgentType["HUMAN"] = "HUMAN";
    WorkflowAgentType["AI"] = "AI";
    WorkflowAgentType["HYBRID"] = "HYBRID";
    WorkflowAgentType["SYSTEM"] = "SYSTEM";
})(WorkflowAgentType || (WorkflowAgentType = {}));
/**
 * Workflow node type enumeration
 */
export var WorkflowNodeType;
(function (WorkflowNodeType) {
    // Basic nodes
    WorkflowNodeType["START"] = "start";
    WorkflowNodeType["END"] = "end";
    // Agent nodes
    WorkflowNodeType["AGENT_TASK"] = "agent_task";
    WorkflowNodeType["AGENT_HANDOFF"] = "agent_handoff";
    WorkflowNodeType["AGENT_COORDINATION"] = "agent_coordination";
    // Logic nodes
    WorkflowNodeType["CONDITION"] = "condition";
    WorkflowNodeType["LOOP"] = "loop";
    WorkflowNodeType["PARALLEL"] = "parallel";
    WorkflowNodeType["MERGE"] = "merge";
    // Integration nodes
    WorkflowNodeType["API_CALL"] = "api_call";
    WorkflowNodeType["DATABASE_QUERY"] = "database_query";
    WorkflowNodeType["FILE_OPERATION"] = "file_operation";
    // Communication nodes
    WorkflowNodeType["RELAY_MESSAGE"] = "relay_message";
    WorkflowNodeType["WEBHOOK"] = "webhook";
    WorkflowNodeType["EMAIL"] = "email";
    // AI/LLM nodes
    WorkflowNodeType["LLM_PROMPT"] = "llm_prompt";
    WorkflowNodeType["CODE_GENERATION"] = "code_generation";
    WorkflowNodeType["ANALYSIS"] = "analysis";
    // Custom nodes
    WorkflowNodeType["CUSTOM"] = "custom";
})(WorkflowNodeType || (WorkflowNodeType = {}));
/**
 * Variable type enumeration
 */
export var VariableType;
(function (VariableType) {
    VariableType["STRING"] = "string";
    VariableType["NUMBER"] = "number";
    VariableType["BOOLEAN"] = "boolean";
    VariableType["OBJECT"] = "object";
    VariableType["ARRAY"] = "array";
    VariableType["DATE"] = "date";
    VariableType["FILE"] = "file";
    VariableType["SECRET"] = "secret";
})(VariableType || (VariableType = {}));
/**
 * Variable scope enumeration
 */
export var VariableScope;
(function (VariableScope) {
    VariableScope["GLOBAL"] = "global";
    VariableScope["WORKFLOW"] = "workflow";
    VariableScope["NODE"] = "node";
    VariableScope["EXECUTION"] = "execution";
})(VariableScope || (VariableScope = {}));
/**
 * Trigger type enumeration
 */
export var TriggerType;
(function (TriggerType) {
    TriggerType["MANUAL"] = "manual";
    TriggerType["SCHEDULED"] = "scheduled";
    TriggerType["WEBHOOK"] = "webhook";
    TriggerType["FILE_CHANGE"] = "file_change";
    TriggerType["AGENT_EVENT"] = "agent_event";
    TriggerType["RELAY_MESSAGE"] = "relay_message";
    TriggerType["DATABASE_CHANGE"] = "database_change";
    TriggerType["API_ENDPOINT"] = "api_endpoint";
})(TriggerType || (TriggerType = {}));
/**
 * Node execution status enumeration
 */
export var NodeExecutionStatus;
(function (NodeExecutionStatus) {
    NodeExecutionStatus["PENDING"] = "pending";
    NodeExecutionStatus["RUNNING"] = "running";
    NodeExecutionStatus["COMPLETED"] = "completed";
    NodeExecutionStatus["FAILED"] = "failed";
    NodeExecutionStatus["SKIPPED"] = "skipped";
    NodeExecutionStatus["CANCELLED"] = "cancelled";
    NodeExecutionStatus["RETRYING"] = "retrying";
})(NodeExecutionStatus || (NodeExecutionStatus = {}));
/**
 * Workflow event type enumeration
 */
export var WorkflowEventType;
(function (WorkflowEventType) {
    WorkflowEventType["WORKFLOW_STARTED"] = "workflow_started";
    WorkflowEventType["WORKFLOW_COMPLETED"] = "workflow_completed";
    WorkflowEventType["WORKFLOW_FAILED"] = "workflow_failed";
    WorkflowEventType["WORKFLOW_CANCELLED"] = "workflow_cancelled";
    WorkflowEventType["NODE_STARTED"] = "node_started";
    WorkflowEventType["NODE_COMPLETED"] = "node_completed";
    WorkflowEventType["NODE_FAILED"] = "node_failed";
    WorkflowEventType["AGENT_ASSIGNED"] = "agent_assigned";
    WorkflowEventType["AGENT_HANDOFF"] = "agent_handoff";
    WorkflowEventType["VARIABLE_UPDATED"] = "variable_updated";
    WorkflowEventType["ERROR_OCCURRED"] = "error_occurred";
})(WorkflowEventType || (WorkflowEventType = {}));
/**
 * Workflow sort field enumeration
 */
export var WorkflowSortField;
(function (WorkflowSortField) {
    WorkflowSortField["NAME"] = "name";
    WorkflowSortField["CREATED_AT"] = "createdAt";
    WorkflowSortField["UPDATED_AT"] = "updatedAt";
    WorkflowSortField["LAST_EXECUTED_AT"] = "lastExecutedAt";
    WorkflowSortField["EXECUTION_COUNT"] = "executionCount";
    WorkflowSortField["SUCCESS_RATE"] = "successRate";
})(WorkflowSortField || (WorkflowSortField = {}));
/**
 * Execution sort field enumeration
 */
export var ExecutionSortField;
(function (ExecutionSortField) {
    ExecutionSortField["STARTED_AT"] = "startedAt";
    ExecutionSortField["COMPLETED_AT"] = "completedAt";
    ExecutionSortField["DURATION"] = "duration";
    ExecutionSortField["STATUS"] = "status";
})(ExecutionSortField || (ExecutionSortField = {}));
// Type guard functions
export function isAgentTaskNode(node) {
    return node && node.type === 'agent_task';
}
export function isAgentHandoffNode(node) {
    return node && node.type === 'agent_handoff';
}
export function isConditionNode(node) {
    return node && node.type === 'condition';
}
export function isLLMPromptNode(node) {
    return node && node.type === 'llm_prompt';
}
//# sourceMappingURL=index.js.map