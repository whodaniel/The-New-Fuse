/**
 * MCP Service - Production ready service for Model Context Protocol integration
 */
export interface MCPServer {
    id: string;
    name: string;
    url: string;
    status: 'online' | 'offline' | 'error';
    tools: MCPTool[];
    metadata?: Record<string, any>;
}
export interface MCPTool {
    id: string;
    name: string;
    description: string;
    parameters: Record<string, MCPParameter>;
    returns: {
        type: string;
        description: string;
    };
    serverId?: string;
}
export interface MCPParameter {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    description: string;
    required?: boolean;
    default?: any;
}
export interface MCPExecutionResult {
    success: boolean;
    result?: any;
    error?: string;
    executionTime?: number;
}
declare class MCPService {
    private baseUrl;
    private apiKey?;
    constructor(baseUrl?: string, apiKey?: string);
    private request;
    getServers(): Promise<MCPServer[]>;
    getServer(serverId: string): Promise<MCPServer>;
    getTools(serverId?: string): Promise<MCPTool[]>;
    getTool(toolId: string): Promise<MCPTool>;
    executeTool(toolId: string, parameters: Record<string, any>, serverId?: string): Promise<MCPExecutionResult>;
    testConnection(serverId: string): Promise<boolean>;
    registerServer(server: Omit<MCPServer, 'id' | 'tools'>): Promise<MCPServer>;
    updateServer(serverId: string, updates: Partial<MCPServer>): Promise<MCPServer>;
    deleteServer(serverId: string): Promise<void>;
}
export declare const mcpService: MCPService;
export default MCPService;
