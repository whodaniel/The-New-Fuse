"use strict";
/**
 * Core types for the Agent Coordination Framework
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionMode = exports.AgentStatus = exports.TaskStatus = exports.TaskPriority = void 0;
var TaskPriority;
(function (TaskPriority) {
    TaskPriority[TaskPriority["CRITICAL"] = 0] = "CRITICAL";
    TaskPriority[TaskPriority["HIGH"] = 1] = "HIGH";
    TaskPriority[TaskPriority["NORMAL"] = 2] = "NORMAL";
    TaskPriority[TaskPriority["LOW"] = 3] = "LOW";
    TaskPriority[TaskPriority["BACKGROUND"] = 4] = "BACKGROUND";
})(TaskPriority || (exports.TaskPriority = TaskPriority = {}));
var TaskStatus;
(function (TaskStatus) {
    TaskStatus["PENDING"] = "pending";
    TaskStatus["QUEUED"] = "queued";
    TaskStatus["ASSIGNED"] = "assigned";
    TaskStatus["IN_PROGRESS"] = "in_progress";
    TaskStatus["PAUSED"] = "paused";
    TaskStatus["COMPLETED"] = "completed";
    TaskStatus["FAILED"] = "failed";
    TaskStatus["CANCELLED"] = "cancelled";
})(TaskStatus || (exports.TaskStatus = TaskStatus = {}));
var AgentStatus;
(function (AgentStatus) {
    AgentStatus["IDLE"] = "idle";
    AgentStatus["BUSY"] = "busy";
    AgentStatus["OFFLINE"] = "offline";
    AgentStatus["ERROR"] = "error";
    AgentStatus["MAINTENANCE"] = "maintenance";
})(AgentStatus || (exports.AgentStatus = AgentStatus = {}));
var ExecutionMode;
(function (ExecutionMode) {
    ExecutionMode["SEQUENTIAL"] = "sequential";
    ExecutionMode["PARALLEL"] = "parallel";
    ExecutionMode["PIPELINE"] = "pipeline";
    ExecutionMode["HYBRID"] = "hybrid";
})(ExecutionMode || (exports.ExecutionMode = ExecutionMode = {}));
//# sourceMappingURL=types.js.map