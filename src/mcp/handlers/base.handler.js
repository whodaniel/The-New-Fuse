"use strict";
/**
 * Base handler class for MCP tool handlers
 * Provides common functionality and patterns
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseHandler = void 0;
class BaseHandler {
    apiClient;
    constructor(apiClient) {
        this.apiClient = apiClient;
    }
    /**
     * Check if this handler can handle the given tool
     */
    canHandle(toolName) {
        const tools = this.getTools();
        return tools.some(tool => tool.name === toolName);
    }
    /**
     * Helper method to create success response
     */
    createSuccessResponse(message, data) {
        const content = [message];
        if (data) {
            content.push(`\n${JSON.stringify(data, null, 2)}`);
        }
        return {
            content: [{
                    type: 'text',
                    text: content.join('\n'),
                }],
        };
    }
    /**
     * Helper method to create error response
     */
    createErrorResponse(message) {
        return {
            content: [{
                    type: 'text',
                    text: message,
                }],
            isError: true,
        };
    }
}
exports.BaseHandler = BaseHandler;
//# sourceMappingURL=base.handler.js.map