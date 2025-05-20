import { MCPClient, AgentTool } from './mcp_client.js';
import path from 'path';

/**
 * Integrates MCP tools with the MyAgent system
 */
export class AgentMCPIntegration {
    private mcpClient: MCPClient;
    private tools: AgentTool[] = [];
    private initialized: boolean = false;
    
    constructor() {
        this.mcpClient = new MCPClient();
    }
    
    /**
     * Initialize the MCP integration
     * @param configPath Optional custom path to MCP config file
     */
    async initialize(configPath?: string): Promise<boolean> {
        try {
            const mcpConfigPath = configPath || path.resolve(__dirname, '../mcp_config.json');

            // Load server configurations
            await this.mcpClient.loadServers(mcpConfigPath);
            
            // Start MCP servers and discover tools
            this.tools = await this.mcpClient.start();

            this.initialized = true;
            
            return true;
        } catch (error) {
            console.error('[AgentMCPIntegration] Failed to initialize:', error);
            this.initialized = false;
            return false;
        }
    }
    
    /**
     * Get all available MCP tools
     */
    getTools(): AgentTool[] {
        if (!this.initialized) {
            console.warn('[AgentMCPIntegration] Attempting to get tools before initialization');
        }
        return this.tools;
    }
    
    /**
     * Execute a tool by name
     * @param toolName Name of the tool to execute
     * @param args Arguments to pass to the tool
     */
    async executeTool(toolName: string, args: Record<string, any>): Promise<any> {
        if (!this.initialized) {
            throw new Error('MCP integration not initialized');
        }
        
        const tool = this.tools.find(t => t.name === toolName);
        if (!tool) {
            throw new Error(`Tool '${toolName}' not found`);
        }
        
        return await tool.execute(args);
    }
    
    /**
     * Clean up resources
     */
    async cleanup(): Promise<void> {
        if (this.initialized) {
            await this.mcpClient.cleanup();
            this.initialized = false;
        }
    }
}
