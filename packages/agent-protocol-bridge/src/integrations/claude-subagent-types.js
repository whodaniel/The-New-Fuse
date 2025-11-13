"use strict";
/**
 * Anthropic Claude Sub-Agent Protocol Types
 *
 * Comprehensive type definitions for Claude Sub-Agent orchestration,
 * delegation, terminal integration, and task management within
 * The New Fuse AI Agent framework.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaudeTaskStatus = exports.ClaudeSubAgentStatus = void 0;
var ClaudeSubAgentStatus;
(function (ClaudeSubAgentStatus) {
    ClaudeSubAgentStatus["IDLE"] = "IDLE";
    ClaudeSubAgentStatus["THINKING"] = "THINKING";
    ClaudeSubAgentStatus["EXECUTING_TOOL"] = "EXECUTING_TOOL";
    ClaudeSubAgentStatus["AWAITING_USER_INPUT"] = "AWAITING_USER_INPUT";
    ClaudeSubAgentStatus["ACTIVE"] = "ACTIVE";
    ClaudeSubAgentStatus["DISABLED"] = "DISABLED";
    ClaudeSubAgentStatus["ERROR"] = "ERROR";
})(ClaudeSubAgentStatus || (exports.ClaudeSubAgentStatus = ClaudeSubAgentStatus = {}));
var ClaudeTaskStatus;
(function (ClaudeTaskStatus) {
    ClaudeTaskStatus["PENDING"] = "PENDING";
    ClaudeTaskStatus["IN_PROGRESS"] = "IN_PROGRESS";
    ClaudeTaskStatus["COMPLETED"] = "COMPLETED";
    ClaudeTaskStatus["FAILED"] = "FAILED";
    ClaudeTaskStatus["AWAITING_APPROVAL"] = "AWAITING_APPROVAL";
})(ClaudeTaskStatus || (exports.ClaudeTaskStatus = ClaudeTaskStatus = {}));
//# sourceMappingURL=claude-subagent-types.js.map