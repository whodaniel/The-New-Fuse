"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SerializationFormat = exports.TaskStatus = exports.CoordinationChannel = exports.A2APriority = exports.AgentStatus = void 0;
const a2a_core_1 = require("@the-new-fuse/a2a-core");
Object.defineProperty(exports, "AgentStatus", { enumerable: true, get: function () { return a2a_core_1.AgentStatus; } });
Object.defineProperty(exports, "A2APriority", { enumerable: true, get: function () { return a2a_core_1.A2APriority; } });
/**
 * Agent coordination channels
 */
var CoordinationChannel;
(function (CoordinationChannel) {
    CoordinationChannel["BROADCAST"] = "agent-broadcast";
    CoordinationChannel["DIRECT_MESSAGE"] = "agent-direct-message";
    CoordinationChannel["EVENTS"] = "agent-events";
    CoordinationChannel["PRESENCE"] = "agent-presence";
    CoordinationChannel["TASKS"] = "agent-tasks";
    CoordinationChannel["STATE_SYNC"] = "agent-state-sync";
})(CoordinationChannel || (exports.CoordinationChannel = CoordinationChannel = {}));
/**
 * Task status enumeration
 */
var TaskStatus;
(function (TaskStatus) {
    TaskStatus["PENDING"] = "pending";
    TaskStatus["ASSIGNED"] = "assigned";
    TaskStatus["IN_PROGRESS"] = "in_progress";
    TaskStatus["COMPLETED"] = "completed";
    TaskStatus["FAILED"] = "failed";
    TaskStatus["CANCELLED"] = "cancelled";
    TaskStatus["RETRY"] = "retry";
})(TaskStatus || (exports.TaskStatus = TaskStatus = {}));
/**
 * Serialization format options
 */
var SerializationFormat;
(function (SerializationFormat) {
    SerializationFormat["JSON"] = "json";
    SerializationFormat["MSGPACK"] = "msgpack";
})(SerializationFormat || (exports.SerializationFormat = SerializationFormat = {}));
//# sourceMappingURL=coordination.types.js.map