import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

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
 * Interface for Crawling Parameters
 */
interface CrawlParams {
  url: string;
  include_links?: boolean;
  max_depth?: number;
  max_pages?: number;
  selector?: string;
  exclude_patterns?: string[];
}

/**
 * MCP RAG Client Service
 * 
 * This service acts as a TypeScript client to communicate with the mcp-crawl4ai-rag
 * Python server, providing web crawling and RAG capabilities to The New Fuse agents.
 */
@Injectable()
export class MCPRAGClientService implements OnModuleInit {
  private readonly logger = new Logger(MCPRAGClientService.name);
  private httpClient: AxiosInstance;
  private ragServerUrl: string;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {
    this.ragServerUrl = this.configService.get<string>('MCP_RAG_SERVER_URL', 'http://localhost:3001');
    
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
  private async initialize(): Promise<void> {
    try {
      await this.healthCheck();
      this.logger.log('MCP RAG Client Service initialized and connected to server');
    } catch (error) {
      this.logger.warn(`Failed to connect to MCP RAG server at ${this.ragServerUrl}:`, error);
      this.logger.warn('RAG functionality will be limited until server is available');
    }
  }

  /**
   * Check if the RAG server is healthy and responsive
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.httpClient.get('/health');
      this.isConnected = response.status === 200;
      return this.isConnected;
    } catch (error) {
      this.isConnected = false;
      throw new Error(`RAG server health check failed: ${error.message}`);
    }
  }

  /**
   * Crawl VS Code API documentation
   */
  async crawlVSCodeDocs(url?: string, max_depth?: number, max_pages?: number): Promise<MCPRAGResponse> {
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
  async crawlCopilotDocs(url?: string, max_depth?: number, max_pages?: number): Promise<MCPRAGResponse> {
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
  async crawlTypeScriptDocs(url?: string, max_depth?: number, max_pages?: number): Promise<MCPRAGResponse> {
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
  async crawlNestJSDocs(url?: string, max_depth?: number, max_pages?: number): Promise<MCPRAGResponse> {
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
  async crawlSinglePage(url: string, selector?: string): Promise<MCPRAGResponse> {
    const params: CrawlParams = {
      url,
      selector,
    };

    return this.callTool('crawl_single_page', params);
  }

  /**
   * Perform RAG query for general documentation
   */
  async performRAGQuery(query: string, collection_name?: string, max_results?: number, include_code?: boolean): Promise<MCPRAGResponse> {
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
  async searchCodeExamples(query: string, language?: string, framework?: string, max_results?: number): Promise<MCPRAGResponse> {
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
  async searchVSCodeAPI(api_name: string, include_examples?: boolean, max_results?: number): Promise<MCPRAGResponse> {
    return this.performRAGQuery(
      `VS Code API: ${api_name}`,
      'vscode',
      max_results || 8,
      include_examples !== false
    );
  }

  /**
   * Search for GitHub Copilot specific information
   */
  async searchCopilotDocs(topic: string, include_examples?: boolean, max_results?: number): Promise<MCPRAGResponse> {
    return this.performRAGQuery(
      `GitHub Copilot: ${topic}`,
      'copilot',
      max_results || 8,
      include_examples !== false
    );
  }

  /**
   * Get RAG system status
   */
  async getRAGStatus(): Promise<any> {
    try {
      const response = await this.httpClient.get('/status');
      return {
        status: 'healthy',
        connected: this.isConnected,
        server_url: this.ragServerUrl,
        ...response.data
      };
    } catch (error) {
      return {
        status: 'error',
        connected: false,
        server_url: this.ragServerUrl,
        error: (error as Error).message
      };
    }
  }

  /**
   * Search for TypeScript specific information
   */
  async searchTypeScriptDocs(query: string): Promise<MCPRAGResponse> {
    return this.performRAGQuery({
      query: `TypeScript: ${query}`,
      max_results: 8,
      threshold: 0.75,
    });
  }

  /**
   * Search for NestJS specific information
   */
  async searchNestJSDocs(query: string): Promise<MCPRAGResponse> {
    return this.performRAGQuery({
      query: `NestJS: ${query}`,
      max_results: 8,
      threshold: 0.75,
    });
  }

  /**
   * Generic method to call RAG server tools
   */
  async callTool(toolName: string, params: any): Promise<MCPRAGResponse> {
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
    } catch (error) {
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
  async getServerStatus(): Promise<any> {
    try {
      const response = await this.httpClient.get('/status');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get RAG server status: ${error.message}`);
    }
  }

  /**
   * Get available tools from the RAG server
   */
  async getAvailableTools(): Promise<string[]> {
    try {
      const response = await this.httpClient.get('/tools');
      return response.data.tools || [];
    } catch (error) {
      this.logger.warn('Failed to get available tools from RAG server:', error);
      return [];
    }
  }

  /**
   * Check if the service is connected to the RAG server
   */
  isServiceConnected(): boolean {
    return this.isConnected;
  }
}
