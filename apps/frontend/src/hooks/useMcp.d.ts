export interface McpToolParameter {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    description?: string;
    required?: boolean;
    default?: any;
}
export interface McpTool {
    name: string;
    description?: string;
    parameters?: Record<string, McpToolParameter>;
    returns?: {
        type: string;
        description?: string;
    };
}
export interface McpServer {
    id: string;
    name: string;
    url: string;
    status: 'online' | 'offline' | 'error';
    tools: McpTool[];
}
export declare const useMcp: () => {
    servers: McpServer[];
    loading: boolean;
    error: Error | null;
    loadServers: () => Promise<void>;
    executeTool: (serverName: string, toolName: string, parameters: Record<string, any>) => Promise<{
        success: boolean;
        result: {
            message: string;
            timestamp: string;
        };
    }>;
};
export default useMcp;
