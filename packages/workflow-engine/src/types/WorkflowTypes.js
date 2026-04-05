"use strict";
/**
 * Unified Workflow Types for The New Fuse Framework
 *
 * Consolidates all workflow-related types from scattered locations into a single source of truth.
 * Integrates with existing Drizzle schema and provides enhanced type safety.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionSortField = exports.WorkflowSortField = exports.WorkflowEventType = exports.NodeExecutionStatus = exports.TriggerType = exports.VariableScope = exports.VariableType = exports.WorkflowNodeType = exports.AgentType = exports.WorkflowExecutionStatus = exports.WorkflowStatus = void 0;
exports.isAgentTaskNode = isAgentTaskNode;
exports.isAgentHandoffNode = isAgentHandoffNode;
exports.isConditionNode = isConditionNode;
exports.isLLMPromptNode = isLLMPromptNode;
// Define enums locally since they may not exist in @drizzle/client
var WorkflowStatus;
(function (WorkflowStatus) {
    WorkflowStatus["DRAFT"] = "DRAFT";
    WorkflowStatus["PUBLISHED"] = "PUBLISHED";
    WorkflowStatus["ARCHIVED"] = "ARCHIVED";
    WorkflowStatus["PAUSED"] = "PAUSED";
})(WorkflowStatus || (exports.WorkflowStatus = WorkflowStatus = {}));
var WorkflowExecutionStatus;
(function (WorkflowExecutionStatus) {
    WorkflowExecutionStatus["PENDING"] = "PENDING";
    WorkflowExecutionStatus["RUNNING"] = "RUNNING";
    WorkflowExecutionStatus["COMPLETED"] = "COMPLETED";
    WorkflowExecutionStatus["FAILED"] = "FAILED";
    WorkflowExecutionStatus["CANCELLED"] = "CANCELLED";
    WorkflowExecutionStatus["PAUSED"] = "PAUSED";
})(WorkflowExecutionStatus || (exports.WorkflowExecutionStatus = WorkflowExecutionStatus = {}));
var AgentType;
(function (AgentType) {
    AgentType["DEVELOPER"] = "DEVELOPER";
    AgentType["RESEARCHER"] = "RESEARCHER";
    AgentType["ANALYST"] = "ANALYST";
    AgentType["COORDINATOR"] = "COORDINATOR";
    AgentType["CUSTOM"] = "CUSTOM";
})(AgentType || (exports.AgentType = AgentType = {}));
var WorkflowNodeType;
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
    // Sandbox nodes
    WorkflowNodeType["SANDBOX_EXECUTION"] = "sandbox_execution";
    // Custom nodes
    WorkflowNodeType["CUSTOM"] = "custom";
})(WorkflowNodeType || (exports.WorkflowNodeType = WorkflowNodeType = {}));
var VariableType;
(function (VariableType) {
    VariableType["STRING"] = "string";
    VariableType["NUMBER"] = "number";
    VariableType["BOOLEAN"] = "boolean";
    VariableType["OBJECT"] = "object";
    VariableType["ARRAY"] = "array";
    VariableType["DATE"] = "date";
    VariableType["FILE"] = "file";
    VariableType["SECRET"] = "secret";
})(VariableType || (exports.VariableType = VariableType = {}));
var VariableScope;
(function (VariableScope) {
    VariableScope["GLOBAL"] = "global";
    VariableScope["WORKFLOW"] = "workflow";
    VariableScope["NODE"] = "node";
    VariableScope["EXECUTION"] = "execution";
})(VariableScope || (exports.VariableScope = VariableScope = {}));
var TriggerType;
(function (TriggerType) {
    TriggerType["MANUAL"] = "manual";
    TriggerType["SCHEDULED"] = "scheduled";
    TriggerType["WEBHOOK"] = "webhook";
    TriggerType["FILE_CHANGE"] = "file_change";
    TriggerType["AGENT_EVENT"] = "agent_event";
    TriggerType["RELAY_MESSAGE"] = "relay_message";
    TriggerType["DATABASE_CHANGE"] = "database_change";
    TriggerType["API_ENDPOINT"] = "api_endpoint";
})(TriggerType || (exports.TriggerType = TriggerType = {}));
var NodeExecutionStatus;
(function (NodeExecutionStatus) {
    NodeExecutionStatus["PENDING"] = "pending";
    NodeExecutionStatus["RUNNING"] = "running";
    NodeExecutionStatus["COMPLETED"] = "completed";
    NodeExecutionStatus["FAILED"] = "failed";
    NodeExecutionStatus["SKIPPED"] = "skipped";
    NodeExecutionStatus["CANCELLED"] = "cancelled";
    NodeExecutionStatus["RETRYING"] = "retrying";
})(NodeExecutionStatus || (exports.NodeExecutionStatus = NodeExecutionStatus = {}));
var WorkflowEventType;
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
})(WorkflowEventType || (exports.WorkflowEventType = WorkflowEventType = {}));
var WorkflowSortField;
(function (WorkflowSortField) {
    WorkflowSortField["NAME"] = "name";
    WorkflowSortField["CREATED_AT"] = "createdAt";
    WorkflowSortField["UPDATED_AT"] = "updatedAt";
    WorkflowSortField["LAST_EXECUTED_AT"] = "lastExecutedAt";
    WorkflowSortField["EXECUTION_COUNT"] = "executionCount";
    WorkflowSortField["SUCCESS_RATE"] = "successRate";
})(WorkflowSortField || (exports.WorkflowSortField = WorkflowSortField = {}));
var ExecutionSortField;
(function (ExecutionSortField) {
    ExecutionSortField["STARTED_AT"] = "startedAt";
    ExecutionSortField["COMPLETED_AT"] = "completedAt";
    ExecutionSortField["DURATION"] = "duration";
    ExecutionSortField["STATUS"] = "status";
})(ExecutionSortField || (exports.ExecutionSortField = ExecutionSortField = {}));
// Export utility functions for type checking
function isAgentTaskNode(node) {
    return node.type === WorkflowNodeType.AGENT_TASK;
}
function isAgentHandoffNode(node) {
    return node.type === WorkflowNodeType.AGENT_HANDOFF;
}
function isConditionNode(node) {
    return node.type === WorkflowNodeType.CONDITION;
}
function isLLMPromptNode(node) {
    return node.type === WorkflowNodeType.LLM_PROMPT;
}
//# sourceMappingURL=WorkflowTypes.js.map