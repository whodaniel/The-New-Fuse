import { MCPAgentServer } from './MCPAgentServer.tsx';
import { MCPChatServer } from './MCPChatServer.tsx';
import { MCPWorkflowServer } from './MCPWorkflowServer.tsx';
import { MCPFuseServer } from './MCPFuseServer.tsx';
import { MCPFileCoordinationServer } from './MCPFileCoordinationServer.tsx';
import { MCPRAGServer } from './MCPRAGServer.tsx';
import { DocumentationOrchestrationService } from './services/documentation-orchestration.service.js';
import { MCPBrokerService } from './services/mcp-broker.service.tsx';
import { DirectorAgentService } from './services/director-agent.service.tsx';
interface ExecuteCapabilityDto {
    params: Record<string, any>;
    metadata?: Record<string, any>;
}
interface ExecuteToolDto {
    params: Record<string, any>;
    metadata?: Record<string, any>;
}
interface CreateTaskDto {
    type: string;
    description: string;
    params: Record<string, any>;
    priority?: 'low' | 'medium' | 'high';
    metadata?: Record<string, any>;
}
interface ExecuteDirectiveDto {
    serverName: string;
    action: string;
    params: Record<string, any>;
    sender?: string;
    recipient?: string;
    metadata?: Record<string, any>;
}
/**
 * Controller that exposes MCP server capabilities via REST API
 *
 * This controller now uses the MCPBrokerService as a central entry point
 * for all MCP directives, while maintaining backward compatibility with
 * direct server access.
 */
export declare class MCPController {
    private readonly agentServer;
    private readonly chatServer;
    private readonly workflowServer;
    private readonly fuseServer;
    private readonly fileCoordinationServer;
    private readonly ragServer;
    private readonly documentationOrchestrator;
    private readonly mcpBroker;
    private readonly directorAgent;
    constructor(agentServer: MCPAgentServer, chatServer: MCPChatServer, workflowServer: MCPWorkflowServer, fuseServer: MCPFuseServer, fileCoordinationServer: MCPFileCoordinationServer, ragServer: MCPRAGServer, documentationOrchestrator: DocumentationOrchestrationService, mcpBroker: MCPBrokerService, directorAgent: DirectorAgentService);
    getAllCapabilities(): Record<string, Record<string, any>>;
    getAllTools(): Record<string, Record<string, any>>;
    executeDirective(dto: ExecuteDirectiveDto): Promise<any>;
    getTasks(status?: string, assignedTo?: string): import("./services/director-agent.service.tsx").DirectorTask[];
    getTask(id: string): import("./services/director-agent.service.tsx").DirectorTask | undefined;
    createTask(dto: CreateTaskDto): Promise<import("./services/director-agent.service.tsx").DirectorTask>;
    getAgentCapabilities(): any;
    executeAgentCapability(name: string, dto: ExecuteCapabilityDto): Promise<unknown>;
    getChatTools(): any;
    executeChatTool(name: string, dto: ExecuteToolDto): Promise<unknown>;
    getWorkflowTools(): any;
    executeWorkflowTool(name: string, dto: ExecuteToolDto): Promise<unknown>;
    getFuseTools(): Record<string, MCPToolParams>;
    executeFuseTool(name: string, dto: ExecuteToolDto): any;
    getFileCoordinationTools(): Record<string, MCPToolParams>;
    executeFileCoordinationTool(name: string, dto: ExecuteToolDto): any;
    getRAGTools(): Promise<{
        tools: ({
            name: string;
            description: string;
            inputSchema: {
                type: string;
                properties: {
                    url: {
                        type: string;
                        description: string;
                        default: string;
                    };
                    max_depth: {
                        type: string;
                        description: string;
                        default: number;
                    };
                    max_pages: {
                        type: string;
                        description: string;
                        default: number;
                    };
                    query?: undefined;
                    collection_name?: undefined;
                    max_results?: undefined;
                    include_code?: undefined;
                    language?: undefined;
                    framework?: undefined;
                    api_name?: undefined;
                    include_examples?: undefined;
                    topic?: undefined;
                };
                required?: undefined;
            };
        } | {
            name: string;
            description: string;
            inputSchema: {
                type: string;
                properties: {
                    query: {
                        type: string;
                        description: string;
                    };
                    collection_name: {
                        type: string;
                        description: string;
                        default: string;
                    };
                    max_results: {
                        type: string;
                        description: string;
                        default: number;
                    };
                    include_code: {
                        type: string;
                        description: string;
                        default: boolean;
                    };
                    url?: undefined;
                    max_depth?: undefined;
                    max_pages?: undefined;
                    language?: undefined;
                    framework?: undefined;
                    api_name?: undefined;
                    include_examples?: undefined;
                    topic?: undefined;
                };
                required: string[];
            };
        } | {
            name: string;
            description: string;
            inputSchema: {
                type: string;
                properties: {
                    query: {
                        type: string;
                        description: string;
                    };
                    language: {
                        type: string;
                        description: string;
                        default: string;
                    };
                    framework: {
                        type: string;
                        description: string;
                        default: string;
                    };
                    max_results: {
                        type: string;
                        description: string;
                        default: number;
                    };
                    url?: undefined;
                    max_depth?: undefined;
                    max_pages?: undefined;
                    collection_name?: undefined;
                    include_code?: undefined;
                    api_name?: undefined;
                    include_examples?: undefined;
                    topic?: undefined;
                };
                required: string[];
            };
        } | {
            name: string;
            description: string;
            inputSchema: {
                type: string;
                properties: {
                    api_name: {
                        type: string;
                        description: string;
                    };
                    include_examples: {
                        type: string;
                        description: string;
                        default: boolean;
                    };
                    max_results: {
                        type: string;
                        description: string;
                        default: number;
                    };
                    url?: undefined;
                    max_depth?: undefined;
                    max_pages?: undefined;
                    query?: undefined;
                    collection_name?: undefined;
                    include_code?: undefined;
                    language?: undefined;
                    framework?: undefined;
                    topic?: undefined;
                };
                required: string[];
            };
        } | {
            name: string;
            description: string;
            inputSchema: {
                type: string;
                properties: {
                    topic: {
                        type: string;
                        description: string;
                    };
                    include_examples: {
                        type: string;
                        description: string;
                        default: boolean;
                    };
                    max_results: {
                        type: string;
                        description: string;
                        default: number;
                    };
                    url?: undefined;
                    max_depth?: undefined;
                    max_pages?: undefined;
                    query?: undefined;
                    collection_name?: undefined;
                    include_code?: undefined;
                    language?: undefined;
                    framework?: undefined;
                    api_name?: undefined;
                };
                required: string[];
            };
        } | {
            name: string;
            description: string;
            inputSchema: {
                type: string;
                properties: {
                    url?: undefined;
                    max_depth?: undefined;
                    max_pages?: undefined;
                    query?: undefined;
                    collection_name?: undefined;
                    max_results?: undefined;
                    include_code?: undefined;
                    language?: undefined;
                    framework?: undefined;
                    api_name?: undefined;
                    include_examples?: undefined;
                    topic?: undefined;
                };
                required?: undefined;
            };
        })[];
    }>;
    executeRAGTool(name: string, dto: ExecuteToolDto): Promise<any>;
    getRAGStatus(): Promise<any>;
    getRAGCollections(): Promise<any>;
    crawlAllDocumentation(): Promise<{
        vscode: null;
        copilot: null;
        typescript: null;
        nestjs: null;
        errors: never[];
    }>;
    performRAGQuery(dto: {
        query: string;
        collection_name?: string;
        max_results?: number;
        include_code?: boolean;
    }): Promise<any>;
    searchCodeExamples(dto: {
        query: string;
        language?: string;
        framework?: string;
        max_results?: number;
    }): Promise<any>;
    searchVSCodeAPI(dto: {
        api_name: string;
        include_examples?: boolean;
        max_results?: number;
    }): Promise<any>;
    searchCopilotDocs(dto: {
        topic: string;
        include_examples?: boolean;
        max_results?: number;
    }): Promise<any>;
    updateAllDocumentation(): Promise<import("./services/documentation-orchestration.service.js").DocumentationUpdateResult>;
    updateSpecificDocumentation(source: string, dto: {
        url?: string;
        max_depth?: number;
        max_pages?: number;
    }): Promise<import("./services/documentation-orchestration.service.js").DocumentationUpdateResult>;
    getDocumentationStatus(): {
        isUpdating: boolean;
        lastUpdate: import("./services/documentation-orchestration.service.js").DocumentationUpdateResult | null;
    };
    getDocumentationHealth(): Promise<{
        overallHealth: "healthy" | "degraded" | "unhealthy";
        sources: {
            [source: string]: {
                available: boolean;
                lastUpdated?: string;
                documentCount?: number;
                error?: string;
            };
        };
        ragServerStatus: any;
    }>;
    searchAllDocumentation(dto: {
        query: string;
        maxResults?: number;
        includeCode?: boolean;
        sourceFilter?: string[];
    }): Promise<{
        query: string;
        totalResults: number;
        sources: {
            [source: string]: {
                results: any[];
                count: number;
                error?: string;
            };
        };
    }>;
    getDocumentationRecommendations(): Promise<{
        recommendations: string[];
        missingTopics: string[];
        updateFrequency: string;
        healthScore: number;
    }>;
}
export {};
//# sourceMappingURL=mcp.controller.d.ts.map