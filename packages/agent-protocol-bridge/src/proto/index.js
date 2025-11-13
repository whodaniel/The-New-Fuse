"use strict";
/**
 * Protocol Buffer Type Exports
 *
 * This file exports all generated protobuf types and services for the
 * TRAYCER-style agent communication system.
 *
 * Generated files are created by running: pnpm run build:proto
 * These files are automatically generated from .proto definitions
 * and should not be edited manually.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Timestamp = exports.ListValue = exports.NullValue = exports.Value = exports.Struct = exports.McpMessage = exports.UserPrompt = exports.RpcResponse = exports.RpcRequest = exports.Status = exports.Step = exports.Task = exports.mcpPb = exports.promptPb = exports.rpcPb = exports.taskPb = void 0;
exports.isTaskStatus = isTaskStatus;
exports.isValidTaskData = isValidTaskData;
exports.isValidStepData = isValidStepData;
exports.isValidPromptData = isValidPromptData;
// Import generated protobuf modules with proper error handling
let taskPb = {};
exports.taskPb = taskPb;
let rpcPb = {};
exports.rpcPb = rpcPb;
let promptPb = {};
exports.promptPb = promptPb;
let mcpPb = {};
exports.mcpPb = mcpPb;
function loadProtoModule(modulePath, moduleName) {
    try {
        return require(modulePath);
    }
    catch (error) {
        const allowFallbacks = process.env.ALLOW_PROTO_FALLBACKS === 'true';
        const isTest = process.env.NODE_ENV === 'test';
        if (!isTest && !allowFallbacks) {
            throw new Error(`Failed to load protobuf module ${moduleName}.  +` `Please run 'pnpm run build:proto' to generate the required files.  +
        Module path: ${modulePath}`);
        }
        if (isTest || allowFallbacks) {
            console.warn($, { moduleName }, not, found - using, fallback($, { isTest, 'test mode': 'fallbacks enabled' }));
            return {};
        }
        return {};
    }
}
exports.taskPb = taskPb = loadProtoModule('./task_pb', 'task_pb');
exports.rpcPb = rpcPb = loadProtoModule('./rpc_pb', 'rpc_pb');
exports.promptPb = promptPb = loadProtoModule('./user-prompt_pb', 'user-prompt_pb');
exports.mcpPb = mcpPb = loadProtoModule('./mcp_pb', 'mcp_pb');
// Legacy named exports for backward compatibility (with fallbacks)
exports.Task = taskPb.Task || class Task {
};
exports.Step = taskPb.Step || class Step {
};
exports.Status = taskPb.Status || {};
exports.RpcRequest = rpcPb.RpcRequest || class RpcRequest {
};
exports.RpcResponse = rpcPb.RpcResponse || class RpcResponse {
};
exports.UserPrompt = promptPb.UserPrompt || class UserPrompt {
};
exports.McpMessage = mcpPb.McpMessage || class McpMessage {
};
// Google Protobuf Standard Types (re-exported for convenience)
var struct_pb_1 = require("google-protobuf/google/protobuf/struct_pb");
Object.defineProperty(exports, "Struct", { enumerable: true, get: function () { return struct_pb_1.Struct; } });
Object.defineProperty(exports, "Value", { enumerable: true, get: function () { return struct_pb_1.Value; } });
Object.defineProperty(exports, "NullValue", { enumerable: true, get: function () { return struct_pb_1.NullValue; } });
Object.defineProperty(exports, "ListValue", { enumerable: true, get: function () { return struct_pb_1.ListValue; } });
var timestamp_pb_1 = require("google-protobuf/google/protobuf/timestamp_pb");
Object.defineProperty(exports, "Timestamp", { enumerable: true, get: function () { return timestamp_pb_1.Timestamp; } });
/**
 * Type guards for runtime type checking
 */
function isTaskStatus(value) {
    return ['pending', 'in_progress', 'completed', 'failed', 'cancelled'].includes(value);
}
function isValidTaskData(obj) {
    return (typeof obj === 'object' &&
        typeof obj.id === 'string' &&
        typeof obj.agentId === 'string' &&
        typeof obj.title === 'string' &&
        typeof obj.description === 'string' &&
        isTaskStatus(obj.status));
}
function isValidStepData(obj) {
    return (typeof obj === 'object' &&
        typeof obj.id === 'string' &&
        typeof obj.taskId === 'string' &&
        typeof obj.title === 'string' &&
        typeof obj.description === 'string' &&
        isTaskStatus(obj.status));
}
function isValidPromptData(obj) {
    return (typeof obj === 'object' &&
        typeof obj.id === 'string' &&
        typeof obj.userId === 'string' &&
        typeof obj.text === 'string');
}
//# sourceMappingURL=index.js.map