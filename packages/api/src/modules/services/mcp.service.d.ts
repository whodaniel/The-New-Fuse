import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
export interface McpServer {
    id: string;
    name: string;
    description?: string;
    status: 'online' | 'offline' | 'error';
    tools: McpTool[];
}
export interface McpTool {
    name: string;
    description: string;
    parameters: Record<string, any>;
}
export declare class MCPService implements OnModuleInit, OnModuleDestroy {
    private mcpBroker;
    private servers;
    constructor();
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    registerServer(name: string, server: any): void;
    refreshServers(): Promise<void>;
    getServers(): McpServer[];
    getServerStatus(): Promise<Record<string, string>>;
    getAllCapabilities(): Record<string, Record<string, any>>;
    getAllTools(): Record<string, Record<string, any>>;
    executeDirective(serverName: string, action: string, params: Record<string, any>, options?: {
        sender?: string;
        recipient?: string;
        metadata?: Record<string, any>;
    }): Promise<any>;
}
//# sourceMappingURL=mcp.service.d.ts.map