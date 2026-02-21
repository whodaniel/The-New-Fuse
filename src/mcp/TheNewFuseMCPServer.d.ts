/**
 * Complete MCP Server Implementation for The New Fuse
 * Provides Model Context Protocol server for AI agency platform capabilities
 */
interface ServiceInterface {
    agent?: any;
    chat?: any;
    workflow?: any;
    monitoring?: any;
    claudeDev?: any;
}
/**
 * The New Fuse MCP Server
 * Provides comprehensive AI agency platform capabilities via MCP
 */
export declare class TheNewFuseMCPServer {
    private server;
    private isRemote;
    private services;
    constructor(isRemote?: boolean);
    /**
     * Set service implementations
     */
    setServices(services: ServiceInterface): void;
    /**
     * Setup all MCP tool handlers
     */
    private setupToolHandlers;
    private handleListAgents;
    private handleCreateAgent;
    private handleGetAgentStatus;
    private handleListChatRooms;
    private handleCreateChatRoom;
    private handleSendMessage;
    private handleListWorkflows;
    private handleCreateWorkflow;
    private handleExecuteWorkflow;
    private handleListAutomationTemplates;
    private handleCreateAutomationFromTemplate;
    private handleGetPlatformStats;
    private handleGetSystemHealth;
    private handleListTasks;
    private handleCreateTask;
    /**
     * Start the MCP server
     */
    start(transport?: 'stdio' | 'http', port?: number): Promise<void>;
    /**
     * Stop the server
     */
    stop(): Promise<void>;
}
export {};
//# sourceMappingURL=TheNewFuseMCPServer.d.ts.map