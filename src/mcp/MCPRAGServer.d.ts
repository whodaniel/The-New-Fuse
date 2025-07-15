import { MCPRAGClientService } from './services/mcp-rag-client.service.js';
export declare class MCPRAGServer {
    private readonly ragClient;
    private readonly logger;
    constructor(ragClient: MCPRAGClientService);
    /**
     * Get available tools for MCP protocol
     */
    getTools(): Promise<{
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
    /**
     * Handle tool execution
     */
    callTool(name: string, arguments_: any): Promise<any>;
    /**
     * Initialize the RAG server
     */
    initialize(): Promise<any>;
    /**
     * Get server capabilities
     */
    getCapabilities(): {
        tools: {};
        logging: {};
        resources: {};
        prompts: {};
    };
    /**
     * Handle MCP protocol requests
     */
    handleRequest(request: any): Promise<{
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
    } | {
        protocolVersion: string;
        capabilities: {
            tools: {};
            logging: {};
            resources: {};
            prompts: {};
        };
        serverInfo: {
            name: string;
            version: string;
        };
        content?: undefined;
    } | {
        content: {
            type: string;
            text: string;
        }[];
        protocolVersion?: undefined;
        capabilities?: undefined;
        serverInfo?: undefined;
    }>;
    /**
     * Get available documentation collections
     */
    getCollections(): Promise<any>;
    /**
     * Orchestrate documentation crawling for all supported platforms
     */
    crawlAllDocumentation(): Promise<{
        vscode: any;
        copilot: any;
        typescript: any;
        nestjs: any;
        errors: any[];
    }>;
}
//# sourceMappingURL=MCPRAGServer.d.ts.map