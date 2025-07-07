"use strict";
/**
 * Core interface definitions for The New Fuse
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentStatus = exports.AgentRole = exports.AgentCapability = exports.TaskStatus = void 0;
// Import enums to avoid duplication
const enums_1 = require("./enums");
Object.defineProperty(exports, "TaskStatus", { enumerable: true, get: function () { return enums_1.TaskStatus; } });
const agent_types_d_1 = require("../agent-types.d");
Object.defineProperty(exports, "AgentCapability", { enumerable: true, get: function () { return agent_types_d_1.AgentCapability; } });
Object.defineProperty(exports, "AgentRole", { enumerable: true, get: function () { return agent_types_d_1.AgentRole; } });
Object.defineProperty(exports, "AgentStatus", { enumerable: true, get: function () { return agent_types_d_1.AgentStatus; } });
