/**
 * Gemini Browser MCP Server
 *
 * Exposes Gemini browser automation as MCP tools
 * Allows any TNF agent to delegate tasks to free Gemini compute
 */
export interface MCPTool {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: Record<string, any>;
        required?: string[];
    };
}
export interface MCPToolCall {
    name: string;
    arguments: Record<string, any>;
}
export interface MCPToolResponse {
    content: Array<{
        type: string;
        text: string;
    }>;
    isError?: boolean;
}
export declare class GeminiBrowserMCPServer {
    private tools;
    /**
     * Get available tools
     */
    getTools(): MCPTool[];
    /**
     * Execute a tool call
     */
    executeTool(toolCall: MCPToolCall): Promise<MCPToolResponse>;
    /**
     * Handle prompt tool call
     */
    private handlePrompt;
    /**
     * Handle status check
     */
    private handleStatus;
    /**
     * Handle initialization
     */
    private handleInitialize;
    /**
     * Handle close
     */
    private handleClose;
}
export declare const geminiBrowserMCP: GeminiBrowserMCPServer;
