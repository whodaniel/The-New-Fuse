"use strict";
/**
 * Unified Messaging System - Public API
 *
 * This module exports all messaging-related types, classes, and utilities
 * for the unified orchestration system.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectLegacyMessageFormat = exports.createLegacyMessageMappings = exports.TaskManagementAdapter = exports.SyncSystemAdapter = exports.WorkflowEngineAdapter = exports.CLIAgentAdapter = exports.DirectAdapter = exports.FileAdapter = exports.HTTPAdapter = exports.RedisAdapter = exports.WebSocketAdapter = exports.MessageRouter = void 0;
// Core message types and interfaces
__exportStar(require("./UnifiedMessageTypes"), exports);
// Message router and routing functionality
var MessageRouter_1 = require("./MessageRouter");
Object.defineProperty(exports, "MessageRouter", { enumerable: true, get: function () { return MessageRouter_1.MessageRouter; } });
// Protocol adapters
var ProtocolAdapter_1 = require("./ProtocolAdapter");
Object.defineProperty(exports, "WebSocketAdapter", { enumerable: true, get: function () { return ProtocolAdapter_1.WebSocketAdapter; } });
Object.defineProperty(exports, "RedisAdapter", { enumerable: true, get: function () { return ProtocolAdapter_1.RedisAdapter; } });
Object.defineProperty(exports, "HTTPAdapter", { enumerable: true, get: function () { return ProtocolAdapter_1.HTTPAdapter; } });
Object.defineProperty(exports, "FileAdapter", { enumerable: true, get: function () { return ProtocolAdapter_1.FileAdapter; } });
Object.defineProperty(exports, "DirectAdapter", { enumerable: true, get: function () { return ProtocolAdapter_1.DirectAdapter; } });
// Legacy message adapters for backward compatibility
var LegacyMessageAdapters_1 = require("./LegacyMessageAdapters");
Object.defineProperty(exports, "CLIAgentAdapter", { enumerable: true, get: function () { return LegacyMessageAdapters_1.CLIAgentAdapter; } });
Object.defineProperty(exports, "WorkflowEngineAdapter", { enumerable: true, get: function () { return LegacyMessageAdapters_1.WorkflowEngineAdapter; } });
Object.defineProperty(exports, "SyncSystemAdapter", { enumerable: true, get: function () { return LegacyMessageAdapters_1.SyncSystemAdapter; } });
Object.defineProperty(exports, "TaskManagementAdapter", { enumerable: true, get: function () { return LegacyMessageAdapters_1.TaskManagementAdapter; } });
Object.defineProperty(exports, "createLegacyMessageMappings", { enumerable: true, get: function () { return LegacyMessageAdapters_1.createLegacyMessageMappings; } });
Object.defineProperty(exports, "detectLegacyMessageFormat", { enumerable: true, get: function () { return LegacyMessageAdapters_1.detectLegacyMessageFormat; } });
//# sourceMappingURL=index.js.map