/**
 * @fileoverview Agent-related type definitions
 */
// Agent Status and Lifecycle
export var AgentStatus;
(function (AgentStatus) {
    AgentStatus["IDLE"] = "IDLE";
    AgentStatus["ACTIVE"] = "ACTIVE";
    AgentStatus["BUSY"] = "BUSY";
    AgentStatus["ERROR"] = "ERROR";
    AgentStatus["OFFLINE"] = "OFFLINE";
    AgentStatus["INITIALIZING"] = "INITIALIZING";
    AgentStatus["TERMINATING"] = "TERMINATING";
})(AgentStatus || (AgentStatus = {}));
export var AgentType;
(function (AgentType) {
    AgentType["WORKER"] = "WORKER";
    AgentType["COORDINATOR"] = "COORDINATOR";
    AgentType["SPECIALIST"] = "SPECIALIST";
    AgentType["MONITOR"] = "MONITOR";
})(AgentType || (AgentType = {}));
export var AgentMessageType;
(function (AgentMessageType) {
    AgentMessageType["TASK_ASSIGNMENT"] = "TASK_ASSIGNMENT";
    AgentMessageType["TASK_RESULT"] = "TASK_RESULT";
    AgentMessageType["STATUS_UPDATE"] = "STATUS_UPDATE";
    AgentMessageType["HEARTBEAT"] = "HEARTBEAT";
    AgentMessageType["ERROR_REPORT"] = "ERROR_REPORT";
    AgentMessageType["RESOURCE_REQUEST"] = "RESOURCE_REQUEST";
    AgentMessageType["COORDINATION"] = "COORDINATION";
    AgentMessageType["BROADCAST"] = "BROADCAST";
})(AgentMessageType || (AgentMessageType = {}));
//# sourceMappingURL=agent.js.map