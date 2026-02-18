import { MCPRAGClientService } from './services/mcp-rag-client.service';
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
                    query?: never;
                    collection_name?: never;
                    max_results?: never;
                    include_code?: never;
                    language?: never;
                    framework?: never;
                    api_name?: never;
                    include_examples?: never;
                    topic?: never;
                };
                required?: never;
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
                    url?: never;
                    max_depth?: never;
                    max_pages?: never;
                    language?: never;
                    framework?: never;
                    api_name?: never;
                    include_examples?: never;
                    topic?: never;
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
                    url?: never;
                    max_depth?: never;
                    max_pages?: never;
                    collection_name?: never;
                    include_code?: never;
                    api_name?: never;
                    include_examples?: never;
                    topic?: never;
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
                    url?: never;
                    max_depth?: never;
                    max_pages?: never;
                    query?: never;
                    collection_name?: never;
                    include_code?: never;
                    language?: never;
                    framework?: never;
                    topic?: never;
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
                    url?: never;
                    max_depth?: never;
                    max_pages?: never;
                    query?: never;
                    collection_name?: never;
                    include_code?: never;
                    language?: never;
                    framework?: never;
                    api_name?: never;
                };
                required: string[];
            };
        } | {
            name: string;
            description: string;
            inputSchema: {
                type: string;
                properties: {
                    url?: never;
                    max_depth?: never;
                    max_pages?: never;
                    query?: never;
                    collection_name?: never;
                    max_results?: never;
                    include_code?: never;
                    language?: never;
                    framework?: never;
                    api_name?: never;
                    include_examples?: never;
                    topic?: never;
                };
                required?: never;
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
                    query?: never;
                    collection_name?: never;
                    max_results?: never;
                    include_code?: never;
                    language?: never;
                    framework?: never;
                    api_name?: never;
                    include_examples?: never;
                    topic?: never;
                };
                required?: never;
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
                    url?: never;
                    max_depth?: never;
                    max_pages?: never;
                    language?: never;
                    framework?: never;
                    api_name?: never;
                    include_examples?: never;
                    topic?: never;
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
                    url?: never;
                    max_depth?: never;
                    max_pages?: never;
                    collection_name?: never;
                    include_code?: never;
                    api_name?: never;
                    include_examples?: never;
                    topic?: never;
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
                    url?: never;
                    max_depth?: never;
                    max_pages?: never;
                    query?: never;
                    collection_name?: never;
                    include_code?: never;
                    language?: never;
                    framework?: never;
                    topic?: never;
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
                    url?: never;
                    max_depth?: never;
                    max_pages?: never;
                    query?: never;
                    collection_name?: never;
                    include_code?: never;
                    language?: never;
                    framework?: never;
                    api_name?: never;
                };
                required: string[];
            };
        } | {
            name: string;
            description: string;
            inputSchema: {
                type: string;
                properties: {
                    url?: never;
                    max_depth?: never;
                    max_pages?: never;
                    query?: never;
                    collection_name?: never;
                    max_results?: never;
                    include_code?: never;
                    language?: never;
                    framework?: never;
                    api_name?: never;
                    include_examples?: never;
                    topic?: never;
                };
                required?: never;
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
        content?: never;
    } | {
        content: {
            type: string;
            text: string;
        }[];
        protocolVersion?: never;
        capabilities?: never;
        serverInfo?: never;
    }>;
    /**
     * Get available documentation collections
     */
    getCollections(): Promise<any>;
    /**
     * Orchestrate documentation crawling for all supported platforms
     */
    crawlAllDocumentation(): Promise<{
        vscode: null;
        copilot: null;
        typescript: null;
        nestjs: null;
        errors: never[];
    }>;
}
//# sourceMappingURL=MCPRAGServer.d.ts.map