"use strict";
/**
 * Temporary database types for relay-core
 * This replaces the @the-new-fuse/database imports
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskPriority = exports.TaskStatus = exports.AgentStatus = exports.AgentType = void 0;
var AgentType;
(function (AgentType) {
    AgentType["BASIC"] = "BASIC";
    AgentType["CHAT"] = "CHAT";
    AgentType["WORKFLOW"] = "WORKFLOW";
    AgentType["TASK"] = "TASK";
    AgentType["ASSISTANT"] = "ASSISTANT";
    AgentType["ANALYSIS"] = "ANALYSIS";
    AgentType["CONVERSATIONAL"] = "CONVERSATIONAL";
    AgentType["IDE_EXTENSION"] = "IDE_EXTENSION";
    AgentType["API"] = "API";
})(AgentType || (exports.AgentType = AgentType = {}));
var AgentStatus;
(function (AgentStatus) {
    AgentStatus["ACTIVE"] = "ACTIVE";
    AgentStatus["INACTIVE"] = "INACTIVE";
    AgentStatus["IDLE"] = "IDLE";
    AgentStatus["BUSY"] = "BUSY";
    AgentStatus["ERROR"] = "ERROR";
    AgentStatus["OFFLINE"] = "OFFLINE";
    AgentStatus["INITIALIZING"] = "INITIALIZING";
    AgentStatus["READY"] = "READY";
    AgentStatus["TERMINATED"] = "TERMINATED";
})(AgentStatus || (exports.AgentStatus = AgentStatus = {}));
var TaskStatus;
(function (TaskStatus) {
    TaskStatus["PENDING"] = "PENDING";
    TaskStatus["IN_PROGRESS"] = "IN_PROGRESS";
    TaskStatus["COMPLETED"] = "COMPLETED";
    TaskStatus["FAILED"] = "FAILED";
    TaskStatus["CANCELLED"] = "CANCELLED";
})(TaskStatus || (exports.TaskStatus = TaskStatus = {}));
var TaskPriority;
(function (TaskPriority) {
    TaskPriority["LOW"] = "LOW";
    TaskPriority["MEDIUM"] = "MEDIUM";
    TaskPriority["HIGH"] = "HIGH";
    TaskPriority["URGENT"] = "URGENT";
})(TaskPriority || (exports.TaskPriority = TaskPriority = {}));
//# sourceMappingURL=database.js.map