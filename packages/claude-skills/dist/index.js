"use strict";
/**
 * Claude Skills Package
 *
 * Integration layer for Anthropic's Claude Skills into The New Fuse
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
exports.PACKAGE_INFO = exports.VERSION = exports.ClaudeSkillsManager = exports.MCPSkillProvider = exports.SkillRegistry = exports.SkillExecutor = exports.SkillLoader = exports.SkillParser = void 0;
// Core types
__exportStar(require("./types/index.js"), exports);
// Parser
var parser_js_1 = require("./parser.js");
Object.defineProperty(exports, "SkillParser", { enumerable: true, get: function () { return parser_js_1.SkillParser; } });
// Loader
var loader_js_1 = require("./loader.js");
Object.defineProperty(exports, "SkillLoader", { enumerable: true, get: function () { return loader_js_1.SkillLoader; } });
// Executor
var executor_js_1 = require("./executor.js");
Object.defineProperty(exports, "SkillExecutor", { enumerable: true, get: function () { return executor_js_1.SkillExecutor; } });
// Registry
var registry_js_1 = require("./registry.js");
Object.defineProperty(exports, "SkillRegistry", { enumerable: true, get: function () { return registry_js_1.SkillRegistry; } });
// MCP Integration
var integration_js_1 = require("./integration.js");
Object.defineProperty(exports, "MCPSkillProvider", { enumerable: true, get: function () { return integration_js_1.MCPSkillProvider; } });
// Main orchestrator
var ClaudeSkillsManager_js_1 = require("./ClaudeSkillsManager.js");
Object.defineProperty(exports, "ClaudeSkillsManager", { enumerable: true, get: function () { return ClaudeSkillsManager_js_1.ClaudeSkillsManager; } });
// Package metadata
exports.VERSION = '1.0.0';
exports.PACKAGE_INFO = {
    name: '@the-new-fuse/claude-skills',
    version: exports.VERSION,
    description: 'Integration layer for Anthropic Claude Skills into The New Fuse',
    author: 'The New Fuse Team',
    license: 'MIT',
};
//# sourceMappingURL=index.js.map