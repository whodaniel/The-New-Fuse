"use strict";
/**
 * Core types for MCP server architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.McpError = void 0;
class McpError extends Error {
    code;
    statusCode;
    constructor(message, code, statusCode) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.name = 'McpError';
    }
}
exports.McpError = McpError;
//# sourceMappingURL=index.js.map