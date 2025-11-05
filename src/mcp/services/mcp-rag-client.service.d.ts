import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
/**
 * Interface for MCP RAG Server Response
 */
interface MCPRAGResponse {
    content: any[];
    tool_result?: {
        content: string;
        isError?: boolean;
    };
}
/**
 * MCP RAG Client Service
 *
 * This service acts as a TypeScript client to communicate with the mcp-crawl4ai-rag
 * Python server, providing web crawling and RAG capabilities to The New Fuse agents.
 */
export declare class MCPRAGClientService implements OnModuleInit {
    private readonly configService;
    private readonly logger;
    private httpClient;
    private ragServerUrl;
    private isConnected;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    /**
     * Initialize the RAG client service
     */
    private initialize;
    /**
     * Check if the RAG server is healthy and responsive
     */
    healthCheck(): Promise<boolean>;
    /**
     * Crawl VS Code API documentation
     */
    crawlVSCodeDocs(url?: string, max_depth?: number, max_pages?: number): Promise<MCPRAGResponse>;
    /**
     * Crawl GitHub Copilot documentation
     */
    crawlCopilotDocs(url?: string, max_depth?: number, max_pages?: number): Promise<MCPRAGResponse>;
    /**
     * Crawl TypeScript documentation
     */
    crawlTypeScriptDocs(url?: string, max_depth?: number, max_pages?: number): Promise<MCPRAGResponse>;
    /**
     * Crawl NestJS documentation
     */
    crawlNestJSDocs(url?: string, max_depth?: number, max_pages?: number): Promise<MCPRAGResponse>;
    /**
     * Crawl a single page for documentation
     */
    crawlSinglePage(url: string, selector?: string): Promise<MCPRAGResponse>;
    /**
     * Perform RAG query for general documentation
     */
    performRAGQuery(query: string, collection_name?: string, max_results?: number, include_code?: boolean): Promise<MCPRAGResponse>;
    /**
     * Search for specific code examples
     */
    searchCodeExamples(query: string, language?: string, framework?: string, max_results?: number): Promise<MCPRAGResponse>;
    /**
     * Search for VS Code API specific information
     */
    searchVSCodeAPI(api_name: string, include_examples?: boolean, max_results?: number): Promise<MCPRAGResponse>;
    /**
     * Search for GitHub Copilot specific information
     */
    searchCopilotDocs(topic: string, include_examples?: boolean, max_results?: number): Promise<MCPRAGResponse>;
    /**
     * Get RAG system status
     */
    getRAGStatus(): Promise<any>;
    /**
     * Search for TypeScript specific information
     */
    searchTypeScriptDocs(query: string): Promise<MCPRAGResponse>;
    /**
     * Search for NestJS specific information
     */
    searchNestJSDocs(query: string): Promise<MCPRAGResponse>;
    /**
     * Generic method to call RAG server tools
     */
    callTool(toolName: string, params: any): Promise<MCPRAGResponse>;
    /**
     * Get server status and available tools
     */
    getServerStatus(): Promise<any>;
    /**
     * Get available tools from the RAG server
     */
    getAvailableTools(): Promise<string[]>;
    /**
     * Check if the service is connected to the RAG server
     */
    isServiceConnected(): boolean;
}
export {};
//# sourceMappingURL=mcp-rag-client.service.d.ts.map