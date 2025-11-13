"use strict";
/**
 * The New Fuse - Unified Orchestration System
 *
 * This is the main entry point for the unified orchestration package,
 * providing a complete solution for multi-agent coordination, messaging,
 * and workflow management.
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
exports.BUILD_DATE = exports.VERSION = exports.mergeConfigurations = exports.calculateAgentScore = exports.validateAgentConfiguration = exports.createDefaultConfig = exports.MasterOrchestrator = exports.UnifiedAgentRegistry = void 0;
// Core types and interfaces
__exportStar(require("./types/UnifiedAgentTypes"), exports);
// Agent registry and management
var UnifiedAgentRegistry_1 = require("./registry/UnifiedAgentRegistry");
Object.defineProperty(exports, "UnifiedAgentRegistry", { enumerable: true, get: function () { return UnifiedAgentRegistry_1.UnifiedAgentRegistry; } });
// Master orchestrator
var MasterOrchestrator_1 = require("./orchestration/MasterOrchestrator");
Object.defineProperty(exports, "MasterOrchestrator", { enumerable: true, get: function () { return MasterOrchestrator_1.MasterOrchestrator; } });
// Unified messaging system
__exportStar(require("./messaging"), exports);
// Utility functions and helpers
var ConfigUtils_1 = require("./utils/ConfigUtils");
Object.defineProperty(exports, "createDefaultConfig", { enumerable: true, get: function () { return ConfigUtils_1.createDefaultConfig; } });
Object.defineProperty(exports, "validateAgentConfiguration", { enumerable: true, get: function () { return ConfigUtils_1.validateAgentConfiguration; } });
Object.defineProperty(exports, "calculateAgentScore", { enumerable: true, get: function () { return ConfigUtils_1.calculateAgentScore; } });
Object.defineProperty(exports, "mergeConfigurations", { enumerable: true, get: function () { return ConfigUtils_1.mergeConfigurations; } });
// Version information
exports.VERSION = '1.0.0';
exports.BUILD_DATE = new Date().toISOString();
//# sourceMappingURL=index.js.map