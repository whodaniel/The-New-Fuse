/**
 * ToolManager handles database operations for tools and tool executions
 */
export declare class ToolManager {
    /**
     * Register a new tool
     * @param name Tool name
     * @param description Tool description
     * @param parameters Tool parameters schema
     * @param capability Tool capability category
     * @returns The created tool
     */
    registerTool(name: string, description: string, parameters: any, capability?: string): Promise<any>;
    /**
     * Get tool by ID
     * @param toolId The tool ID
     * @returns Tool details
     */
    getToolById(toolId: string): Promise<any>;
    /**
     * Get tool by name
     * @param name Tool name
     * @returns Tool details
     */
    getToolByName(name: string): Promise<any>;
    /**
     * List all tools, optionally filtering by capability
     * @param capability Optional capability to filter by
     * @param includeDeprecated Whether to include deprecated tools
     * @returns Array of tools
     */
    listTools(capability?: string, includeDeprecated?: boolean): Promise<any[]>;
    /**
     * Deprecate a tool
     * @param toolId The tool ID to deprecate
     */
    deprecateTool(toolId: string): Promise<void>;
    /**
     * Record a tool call
     * @param messageId Message ID that contains the tool call
     * @param toolId Tool ID
     * @param parameters Tool parameters
     * @returns The created tool call record
     */
    recordToolCall(messageId: string, toolId: string, parameters: any): Promise<any>;
    /**
     * Record a tool execution
     * @param toolCallId Tool call ID
     * @param agentId Agent ID executing the tool
     * @param result Tool execution result
     * @param error Optional error message
     * @returns The tool execution record
     */
    recordToolExecution(toolCallId: string, agentId: string, result?: any, error?: string): Promise<any>;
    /**
     * Get recent tool executions for an agent
     * @param agentId Agent ID
     * @param limit Number of executions to retrieve
     * @returns Array of tool executions
     */
    getRecentExecutions(agentId: string, limit?: number): Promise<any[]>;
}
//# sourceMappingURL=tool-manager.d.ts.map