"use strict";
/**
 * @the-new-fuse/jules-skill
 * Jules CLI integration skill for AI agent delegation
 *
 * This package provides:
 * 1. JulesClient - Programmatic interface to Jules CLI
 * 2. MCP Server - Model Context Protocol server for AI agent tools
 * 3. Types - TypeScript definitions for Jules operations
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
exports.julesClient = exports.JulesClient = void 0;
// Export types
__exportStar(require("./types.js"), exports);
// Export client
var client_js_1 = require("./client.js");
Object.defineProperty(exports, "JulesClient", { enumerable: true, get: function () { return client_js_1.JulesClient; } });
Object.defineProperty(exports, "julesClient", { enumerable: true, get: function () { return client_js_1.julesClient; } });
//# sourceMappingURL=index.js.map