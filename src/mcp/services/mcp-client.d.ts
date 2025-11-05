/**
 * Tool definition for LLM tool use
 */
export interface Tool {
    name: string;
    description: string;
    input_schema: object;
}
export interface MessageContentPartText {
    type: 'text';
    text: string;
}
export interface MessageContentPartToolUse {
    type: 'tool_use';
    id: string;
    name: string;
    input: any;
}
export interface MessageContentPartToolResult {
    type: 'tool_result';
    tool_use_id: string;
    content: string | any[];
    is_error?: boolean;
}
export type MessageContentPart = MessageContentPartText | MessageContentPartToolUse | MessageContentPartToolResult;
export interface Message {
    role: 'user' | 'assistant';
    content: string | MessageContentPart[];
}
export interface QueryRequest {
    query: string;
}
/**
 * MCP Client Session abstraction for HTTP transport
 */
export interface MCPClientSession {
    listTools: () => Promise<Tool[]>;
    callTool: (params: {
        name: string;
        input: any;
    }) => Promise<{
        output: any;
    }>;
    close: () => Promise<void>;
}
/**
 * HTTP-based MCPClientSession implementation
 */
export declare class HttpMCPClientSession implements MCPClientSession {
    private serverUrl;
    private httpClient;
    constructor(serverUrl: string);
    listTools(): Promise<Tool[]>;
    callTool(params: {
        name: string;
        input: any;
    }): Promise<{
        output: any;
    }>;
    close(): Promise<void>;
}
/**
 * MCPClient orchestrates LLM <-> MCP server tool use
 */
export declare class MCPClient {
    private mcpServerUrl;
    private tools;
    messages: Message[];
    private session;
    constructor(mcpServerUrl: string);
    /**
     * Connect to MCP server and fetch tools
     */
    connectToServer(): Promise<boolean>;
    private getMCPTools;
    /**
     * Simulated LLM call (replace with actual LLM SDK integration)
     */
    private callLLM;
    /**
     * Orchestrate LLM <-> MCP tool use loop
     */
    processQuery(query: string): Promise<Message[]>;
    cleanup(): Promise<void>;
}
//# sourceMappingURL=mcp-client.d.ts.map