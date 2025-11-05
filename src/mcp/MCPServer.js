"use strict";
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
exports.MCPServer = void 0;
// Re-export the main MCP server implementation
__exportStar(require("./TheNewFuseMCPServer"), exports);
var TheNewFuseMCPServer_1 = require("./TheNewFuseMCPServer");
Object.defineProperty(exports, "MCPServer", { enumerable: true, get: function () { return TheNewFuseMCPServer_1.TheNewFuseMCPServer; } });
// Legacy exports for compatibility
const TheNewFuseMCPServer_2 = require("./TheNewFuseMCPServer");
exports.default = TheNewFuseMCPServer_2.TheNewFuseMCPServer;
//# sourceMappingURL=MCPServer.js.map