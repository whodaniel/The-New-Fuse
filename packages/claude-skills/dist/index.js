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
var index_js_1 = require("./parser/index.js");
Object.defineProperty(exports, "SkillParser", { enumerable: true, get: function () { return index_js_1.SkillParser; } });
// Loader
var index_js_2 = require("./loader/index.js");
Object.defineProperty(exports, "SkillLoader", { enumerable: true, get: function () { return index_js_2.SkillLoader; } });
// Executor
var index_js_3 = require("./executor/index.js");
Object.defineProperty(exports, "SkillExecutor", { enumerable: true, get: function () { return index_js_3.SkillExecutor; } });
// Registry
var index_js_4 = require("./registry/index.js");
Object.defineProperty(exports, "SkillRegistry", { enumerable: true, get: function () { return index_js_4.SkillRegistry; } });
// MCP Integration
var index_js_5 = require("./integration/index.js");
Object.defineProperty(exports, "MCPSkillProvider", { enumerable: true, get: function () { return index_js_5.MCPSkillProvider; } });
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