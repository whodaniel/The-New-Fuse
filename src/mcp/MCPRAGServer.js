"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MCPRAGServer_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPRAGServer = void 0;
const common_1 = require("@nestjs/common");
const mcp_rag_client_service_1 = require("./services/mcp-rag-client.service");
let MCPRAGServer = MCPRAGServer_1 = class MCPRAGServer {
    ragClient;
    logger = new common_1.Logger(MCPRAGServer_1.name);
    constructor(ragClient) {
        this.ragClient = ragClient;
    }
    /**
     * Get available tools for MCP protocol
     */
    async getTools() {
        return {
            tools: [
                {
                    name: 'crawl_vscode_docs',
                    description: 'Crawl and index VS Code documentation',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            url: {
                                type: 'string',
                                description: 'Starting URL for VS Code documentation (optional)',
                                default: 'https://code.visualstudio.com/docs'
                            },
                            max_depth: {
                                type: 'number',
                                description: 'Maximum crawling depth',
                                default: 3
                            },
                            max_pages: {
                                type: 'number',
                                description: 'Maximum number of pages to crawl',
                                default: 100
                            }
                        }
                    }
                },
                {
                    name: 'crawl_copilot_docs',
                    description: 'Crawl and index GitHub Copilot documentation',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            url: {
                                type: 'string',
                                description: 'Starting URL for Copilot documentation (optional)',
                                default: 'https://docs.github.com/en/copilot'
                            },
                            max_depth: {
                                type: 'number',
                                description: 'Maximum crawling depth',
                                default: 3
                            },
                            max_pages: {
                                type: 'number',
                                description: 'Maximum number of pages to crawl',
                                default: 100
                            }
                        }
                    }
                },
                {
                    name: 'crawl_typescript_docs',
                    description: 'Crawl and index TypeScript documentation',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            url: {
                                type: 'string',
                                description: 'Starting URL for TypeScript documentation (optional)',
                                default: 'https://www.typescriptlang.org/docs'
                            },
                            max_depth: {
                                type: 'number',
                                description: 'Maximum crawling depth',
                                default: 3
                            },
                            max_pages: {
                                type: 'number',
                                description: 'Maximum number of pages to crawl',
                                default: 100
                            }
                        }
                    }
                },
                {
                    name: 'crawl_nestjs_docs',
                    description: 'Crawl and index NestJS documentation',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            url: {
                                type: 'string',
                                description: 'Starting URL for NestJS documentation (optional)',
                                default: 'https://docs.nestjs.com'
                            },
                            max_depth: {
                                type: 'number',
                                description: 'Maximum crawling depth',
                                default: 3
                            },
                            max_pages: {
                                type: 'number',
                                description: 'Maximum number of pages to crawl',
                                default: 100
                            }
                        }
                    }
                },
                {
                    name: 'perform_rag_query',
                    description: 'Perform a RAG query against indexed documentation',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            query: {
                                type: 'string',
                                description: 'The question or query to search for'
                            },
                            collection_name: {
                                type: 'string',
                                description: 'Optional collection name to search in (vscode, copilot, typescript, nestjs)',
                                default: 'all'
                            },
                            max_results: {
                                type: 'number',
                                description: 'Maximum number of results to return',
                                default: 5
                            },
                            include_code: {
                                type: 'boolean',
                                description: 'Whether to include code examples in results',
                                default: true
                            }
                        },
                        required: ['query']
                    }
                },
                {
                    name: 'search_code_examples',
                    description: 'Search for specific code examples in the indexed documentation',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            query: {
                                type: 'string',
                                description: 'Code pattern or functionality to search for'
                            },
                            language: {
                                type: 'string',
                                description: 'Programming language (typescript, javascript, etc.)',
                                default: 'typescript'
                            },
                            framework: {
                                type: 'string',
                                description: 'Framework context (vscode, nestjs, etc.)',
                                default: 'any'
                            },
                            max_results: {
                                type: 'number',
                                description: 'Maximum number of code examples to return',
                                default: 5
                            }
                        },
                        required: ['query']
                    }
                },
                {
                    name: 'search_vscode_api',
                    description: 'Search for specific VS Code API information',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            api_name: {
                                type: 'string',
                                description: 'VS Code API name or functionality to search for'
                            },
                            include_examples: {
                                type: 'boolean',
                                description: 'Whether to include usage examples',
                                default: true
                            },
                            max_results: {
                                type: 'number',
                                description: 'Maximum number of results to return',
                                default: 5
                            }
                        },
                        required: ['api_name']
                    }
                },
                {
                    name: 'search_copilot_docs',
                    description: 'Search for specific GitHub Copilot documentation',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            topic: {
                                type: 'string',
                                description: 'Copilot topic or feature to search for'
                            },
                            include_examples: {
                                type: 'boolean',
                                description: 'Whether to include usage examples',
                                default: true
                            },
                            max_results: {
                                type: 'number',
                                description: 'Maximum number of results to return',
                                default: 5
                            }
                        },
                        required: ['topic']
                    }
                },
                {
                    name: 'get_rag_status',
                    description: 'Get the status of the RAG system and indexed collections',
                    inputSchema: {
                        type: 'object',
                        properties: {}
                    }
                }
            ]
        };
    }
    /**
     * Handle tool execution
     */
    async callTool(name, arguments_) {
        this.logger.log(`Executing RAG tool: ${name} with arguments:`, arguments_);
        try {
            switch (name) {
                case 'crawl_vscode_docs':
                    return await this.ragClient.crawlVSCodeDocs(arguments_.url, arguments_.max_depth, arguments_.max_pages);
                case 'crawl_copilot_docs':
                    return await this.ragClient.crawlCopilotDocs(arguments_.url, arguments_.max_depth, arguments_.max_pages);
                case 'crawl_typescript_docs':
                    return await this.ragClient.crawlTypeScriptDocs(arguments_.url, arguments_.max_depth, arguments_.max_pages);
                case 'crawl_nestjs_docs':
                    return await this.ragClient.crawlNestJSDocs(arguments_.url, arguments_.max_depth, arguments_.max_pages);
                case 'perform_rag_query':
                    return await this.ragClient.performRAGQuery(arguments_.query, arguments_.collection_name, arguments_.max_results, arguments_.include_code);
                case 'search_code_examples':
                    return await this.ragClient.searchCodeExamples(arguments_.query, arguments_.language, arguments_.framework, arguments_.max_results);
                case 'search_vscode_api':
                    return await this.ragClient.searchVSCodeAPI(arguments_.api_name, arguments_.include_examples, arguments_.max_results);
                case 'search_copilot_docs':
                    return await this.ragClient.searchCopilotDocs(arguments_.topic, arguments_.include_examples, arguments_.max_results);
                case 'get_rag_status':
                    return await this.ragClient.getRAGStatus();
                default: throw new Error(`Unknown tool: ${name}`);
            }
        }
        catch (error) {
            this.logger.error(`Error executing RAG tool ${name}:`, error);
            throw error;
        }
    }
    /**
     * Initialize the RAG server
     */
    async initialize() {
        this.logger.log('Initializing MCP RAG Server...');
        try {
            // Check if the RAG service is available
            const status = await this.ragClient.getRAGStatus();
            this.logger.log('RAG Server initialized successfully', status);
            return status;
        }
        catch (error) {
            this.logger.warn('RAG Server not available during initialization:', error.message);
            // Don't throw error - allow the server to start even if RAG service is unavailable
            return { status: 'unavailable', error: error.message };
        }
    }
    /**
     * Get server capabilities
     */
    getCapabilities() {
        return {
            tools: {},
            logging: {},
            resources: {},
            prompts: {}
        };
    }
    /**
     * Handle MCP protocol requests
     */
    async handleRequest(request) {
        const { method, params } = request;
        switch (method) {
            case 'initialize':
                return {
                    protocolVersion: '2024-11-05',
                    capabilities: this.getCapabilities(),
                    serverInfo: {
                        name: 'fuse-rag-server',
                        version: '1.0.0'
                    }
                };
            case 'tools/list':
                return await this.getTools();
            case 'tools/call':
                const { name, arguments: args } = params;
                const result = await this.callTool(name, args);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2)
                        }
                    ]
                };
            default: throw new Error(`Unknown method: ${method}`);
        }
    }
    /**
     * Get available documentation collections
     */
    async getCollections() {
        try {
            const status = await this.ragClient.getRAGStatus();
            return status.collections || [];
        }
        catch (error) {
            this.logger.error('Error getting collections:', error);
            return [];
        }
    }
    /**
     * Orchestrate documentation crawling for all supported platforms
     */
    async crawlAllDocumentation() {
        this.logger.log('Starting comprehensive documentation crawling...');
        const results = {
            vscode: null,
            copilot: null,
            typescript: null,
            nestjs: null,
            errors: []
        };
        try {
            // Crawl VS Code docs
            this.logger.log('Crawling VS Code documentation...');
            results.vscode = await this.ragClient.crawlVSCodeDocs();
        }
        catch (error) {
            this.logger.error('Error crawling VS Code docs:', error);
            results.errors.push({ source: 'vscode', error: error.message });
        }
        try {
            // Crawl Copilot docs
            this.logger.log('Crawling GitHub Copilot documentation...');
            results.copilot = await this.ragClient.crawlCopilotDocs();
        }
        catch (error) {
            this.logger.error('Error crawling Copilot docs:', error);
            results.errors.push({ source: 'copilot', error: error.message });
        }
        try {
            // Crawl TypeScript docs
            this.logger.log('Crawling TypeScript documentation...');
            results.typescript = await this.ragClient.crawlTypeScriptDocs();
        }
        catch (error) {
            this.logger.error('Error crawling TypeScript docs:', error);
            results.errors.push({ source: 'typescript', error: error.message });
        }
        try {
            // Crawl NestJS docs
            this.logger.log('Crawling NestJS documentation...');
            results.nestjs = await this.ragClient.crawlNestJSDocs();
        }
        catch (error) {
            this.logger.error('Error crawling NestJS docs:', error);
            results.errors.push({ source: 'nestjs', error: error.message });
        }
        this.logger.log('Documentation crawling completed', {
            successful: Object.values(results).filter(v => v !== null && !Array.isArray(v)).length,
            errors: results.errors.length
        });
        return results;
    }
};
exports.MCPRAGServer = MCPRAGServer;
exports.MCPRAGServer = MCPRAGServer = MCPRAGServer_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mcp_rag_client_service_1.MCPRAGClientService])
], MCPRAGServer);
//# sourceMappingURL=MCPRAGServer.js.map