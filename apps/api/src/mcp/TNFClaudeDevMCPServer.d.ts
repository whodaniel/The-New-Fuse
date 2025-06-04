import { ClaudeDevAutomationService } from '../services/ClaudeDevAutomationService';
export interface MCPRequest {
    id: string;
    method: string;
    params?: any;
}
export interface MCPResponse {
    id: string;
    result?: any;
    error?: {
        code: number;
        message: string;
        data?: any;
    };
}
export interface MCPNotification {
    method: string;
    params?: any;
}
export interface MCPTool {
    name: string;
    description: string;
    inputSchema: {
        type: 'object';
        properties: Record<string, any>;
        required?: string[];
    };
}
export declare class TNFClaudeDevMCPServer {
    private readonly claudeDevService;
    private readonly logger;
    private readonly tools;
    constructor(claudeDevService: ClaudeDevAutomationService);
    private initializeTools;
    handleInitialize(): Promise<MCPResponse>;
    handleListTools(): Promise<MCPResponse>;
    handleToolCall(request: MCPRequest): Promise<MCPResponse>;
    private handleListTemplates;
    private handleGetTemplate;
    private handleExecuteAutomation;
    private handleGetAutomationResult;
    private handleListAutomations;
    private handleCancelAutomation;
    private handleCreateCustomTemplate;
    private handleGetUsageStats;
    handleMessage(message: MCPRequest): Promise<MCPResponse>;
    getAvailableTools(): MCPTool[];
    private validateRequest;
}
