/**
 * Base handler class for MCP tool handlers
 * Provides common functionality and patterns
 */
import { McpTool, ToolCallResult } from '../types';
import { ApiClient } from '../core/api-client';
export declare abstract class BaseHandler {
    protected apiClient: ApiClient;
    constructor(apiClient: ApiClient);
    /**
     * Get all tools provided by this handler
     */
    abstract getTools(): McpTool[];
    /**
     * Handle a tool call for this handler
     */
    abstract handleTool(toolName: string, args: any): Promise<ToolCallResult>;
    /**
     * Check if this handler can handle the given tool
     */
    canHandle(toolName: string): boolean;
    /**
     * Get the tool prefix for this handler (e.g., 'auth', 'agent')
     */
    abstract getToolPrefix(): string;
    /**
     * Helper method to create success response
     */
    protected createSuccessResponse(message: string, data?: any): ToolCallResult;
    /**
     * Helper method to create error response
     */
    protected createErrorResponse(message: string): ToolCallResult;
}
//# sourceMappingURL=base.handler.d.ts.map