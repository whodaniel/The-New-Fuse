var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MCPRAGClientService_1;
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
/**
 * MCP RAG Client Service
 *
 * This service acts as a TypeScript client to communicate with the mcp-crawl4ai-rag
 * Python server, providing web crawling and RAG capabilities to The New Fuse agents.
 */
let MCPRAGClientService = MCPRAGClientService_1 = class MCPRAGClientService {
    configService;
    logger = new Logger(MCPRAGClientService_1.name);
    httpClient;
    ragServerUrl;
    isConnected = false;
    constructor(configService) {
        this.configService = configService;
        this.ragServerUrl = this.configService.get('MCP_RAG_SERVER_URL', 'http://localhost:3001');
        this.httpClient = axios.create({
            baseURL: this.ragServerUrl,
            timeout: 30000, // 30 second timeout for crawling operations
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        });
    }
    async onModuleInit() {
        await this.initialize();
    }
    /**
     * Initialize the RAG client service
     */
    async initialize() {
        try {
            await this.healthCheck();
            this.logger.log('MCP RAG Client Service initialized and connected to server');
        }
        catch (error) {
            this.logger.warn(`Failed to connect to MCP RAG server at ${this.ragServerUrl}:`, error);
            this.logger.warn('RAG functionality will be limited until server is available');
        }
    }
    /**
     * Check if the RAG server is healthy and responsive
     */
    async healthCheck() {
        try {
            const response = await this.httpClient.get('/health');
            this.isConnected = response.status === 200;
            return this.isConnected;
        }
        catch (error) {
            this.isConnected = false;
            throw new Error(`RAG server health check failed: ${error.message}`);
        }
    }
    /**
     * Crawl VS Code API documentation
     */
    async crawlVSCodeDocs(url, max_depth, max_pages) {
        const params = {
            url: url || 'https://code.visualstudio.com/api',
            include_links: true,
            max_depth: max_depth || 3,
            max_pages: max_pages || 100,
            exclude_patterns: [
                '*/images/*',
                '*/assets/*',
                '*.pdf',
                '*.zip'
            ]
        };
        return this.callTool('crawl_website', params);
    }
    /**
     * Crawl GitHub Copilot documentation
     */
    async crawlCopilotDocs(url, max_depth, max_pages) {
        const params = {
            url: url || 'https://docs.github.com/en/copilot',
            include_links: true,
            max_depth: max_depth || 2,
            max_pages: max_pages || 100,
            exclude_patterns: [
                '*/images/*',
                '*/assets/*',
                '*.pdf'
            ]
        };
        return this.callTool('crawl_website', params);
    }
    /**
     * Crawl TypeScript documentation
     */
    async crawlTypeScriptDocs(url, max_depth, max_pages) {
        const params = {
            url: url || 'https://www.typescriptlang.org/docs/',
            include_links: true,
            max_depth: max_depth || 2,
            max_pages: max_pages || 100,
            exclude_patterns: [
                '*/images/*',
                '*/assets/*',
                '*.pdf'
            ]
        };
        return this.callTool('crawl_website', params);
    }
    /**
     * Crawl NestJS documentation
     */
    async crawlNestJSDocs(url, max_depth, max_pages) {
        const params = {
            url: url || 'https://docs.nestjs.com/',
            include_links: true,
            max_depth: max_depth || 2,
            max_pages: max_pages || 100,
            exclude_patterns: [
                '*/images/*',
                '*/assets/*',
                '*.pdf'
            ]
        };
        return this.callTool('crawl_website', params);
    }
    /**
     * Crawl a single page for documentation
     */
    async crawlSinglePage(url, selector) {
        const params = {
            url,
            selector,
        };
        return this.callTool('crawl_single_page', params);
    }
    /**
     * Perform RAG query for general documentation
     */
    async performRAGQuery(query, collection_name, max_results, include_code) {
        return this.callTool('perform_rag_query', {
            query,
            collection_name,
            max_results: max_results || 10,
            include_code: include_code !== false,
        });
    }
    /**
     * Search for specific code examples
     */
    async searchCodeExamples(query, language, framework, max_results) {
        return this.callTool('search_code_examples', {
            query,
            language: language || 'typescript',
            framework,
            max_results: max_results || 5,
        });
    }
    /**
     * Search for VS Code API specific information
     */
    async searchVSCodeAPI(api_name, include_examples, max_results) {
        return this.performRAGQuery(`VS Code API: ${api_name}`, 'vscode', max_results || 8, include_examples !== false);
    }
    /**
     * Search for GitHub Copilot specific information
     */
    async searchCopilotDocs(topic, include_examples, max_results) {
        return this.performRAGQuery(`GitHub Copilot: ${topic}`, 'copilot', max_results || 8, include_examples !== false);
    }
    /**
     * Get RAG system status
     */
    async getRAGStatus() {
        try {
            const response = await this.httpClient.get('/status');
            return {
                status: 'healthy',
                connected: this.isConnected,
                server_url: this.ragServerUrl,
                ...response.data
            };
        }
        catch (error) {
            return {
                status: 'error',
                connected: false,
                server_url: this.ragServerUrl,
                error: error.message
            };
        }
    }
    /**
     * Search for TypeScript specific information
     */
    async searchTypeScriptDocs(query) {
        return this.performRAGQuery({
            query: `TypeScript: ${query}`,
            max_results: 8,
            threshold: 0.75,
        });
    }
    /**
     * Search for NestJS specific information
     */
    async searchNestJSDocs(query) {
        return this.performRAGQuery({
            query: `NestJS: ${query}`,
            max_results: 8,
            threshold: 0.75,
        });
    }
    /**
     * Generic method to call RAG server tools
     */
    async callTool(toolName, params) {
        if (!this.isConnected) {
            await this.healthCheck();
        }
        try {
            this.logger.debug(`Calling RAG tool: ${toolName}`, params);
            const response = await this.httpClient.post('/tools/call', {
                tool: toolName,
                parameters: params,
            });
            this.logger.debug(`RAG tool ${toolName} response:`, response.data);
            return response.data;
        }
        catch (error) {
            this.logger.error(`Failed to call RAG tool ${toolName}:`, error);
            if (error.response?.status === 404) {
                throw new Error(`RAG tool '${toolName}' not found on server`);
            }
            if (error.response?.status >= 500) {
                throw new Error(`RAG server internal error for tool '${toolName}': ${error.response.data?.message || error.message}`);
            }
            throw new Error(`RAG tool call failed: ${error.message}`);
        }
    }
    /**
     * Get server status and available tools
     */
    async getServerStatus() {
        try {
            const response = await this.httpClient.get('/status');
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to get RAG server status: ${error.message}`);
        }
    }
    /**
     * Get available tools from the RAG server
     */
    async getAvailableTools() {
        try {
            const response = await this.httpClient.get('/tools');
            return response.data.tools || [];
        }
        catch (error) {
            this.logger.warn('Failed to get available tools from RAG server:', error);
            return [];
        }
    }
    /**
     * Check if the service is connected to the RAG server
     */
    isServiceConnected() {
        return this.isConnected;
    }
};
MCPRAGClientService = MCPRAGClientService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], MCPRAGClientService);
export { MCPRAGClientService };
//# sourceMappingURL=mcp-rag-client.service.js.map