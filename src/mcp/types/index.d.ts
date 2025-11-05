/**
 * Core types for MCP server architecture
 */
export interface ApiRequest {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    endpoint: string;
    data?: any;
    params?: Record<string, string>;
    query?: Record<string, string>;
    headers?: Record<string, string>;
}
export interface AuthContext {
    token?: string;
    apiKey?: string;
    userId?: string;
    role?: string;
}
export interface McpTool {
    name: string;
    description: string;
    inputSchema: {
        type: 'object';
        properties: Record<string, any>;
        required?: string[];
    };
}
export interface McpResource {
    uri: string;
    name: string;
    description: string;
    mimeType: string;
}
export interface ToolCallResult {
    content: Array<{
        type: string;
        text: string;
    }>;
    isError?: boolean;
}
export interface ResourceReadResult {
    contents: Array<{
        type: string;
        text: string;
    }>;
}
export declare class McpError extends Error {
    code?: string | undefined;
    statusCode?: number | undefined;
    constructor(message: string, code?: string | undefined, statusCode?: number | undefined);
}
//# sourceMappingURL=index.d.ts.map