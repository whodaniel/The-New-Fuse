import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MCPBrokerService } from '../../../src/mcp/services/mcp-broker.service.js';

export interface McpServer {
  id: string;
  name: string;
  description?: string;
  status: 'online' | 'offline' | 'error';
  tools: McpTool[];
}

export interface McpTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

@Injectable()
export class MCPService implements OnModuleInit, OnModuleDestroy {
  private mcpBroker: MCPBrokerService;
  private servers: McpServer[] = [];

  constructor(private configService: ConfigService) {
    // The MCPBrokerService will be initialized in onModuleInit
  }

  async onModuleInit() {
    // Initialize MCP Broker Service
    try {
      // Import dynamically to avoid circular dependencies
      const { MCPBrokerService } = await import('../../../src/mcp/services/mcp-broker.service');
      this.mcpBroker = new MCPBrokerService();
      
      // Check if initialize method exists before calling it
      if (typeof this.mcpBroker.initialize === 'function') {
        await this.mcpBroker.initialize();
      }
      
      // Load initial server information
      await this.refreshServers();
      
      // Set up periodic refresh of server information
      setInterval(() => this.refreshServers(), 60000); // Refresh every minute
    } catch (error) {
      console.error('Failed to initialize MCP Service:', error);
    }
  }

  async onModuleDestroy() {
    // Clean up resources
    if (this.mcpBroker) {
      // Check if cleanup method exists before calling it
      if (typeof this.mcpBroker.cleanup === 'function') {
        await this.mcpBroker.cleanup();
      }
    }
  }

  async refreshServers() {
    try {
      if (!this.mcpBroker) {
        return;
      }
      
      const mcpServers = this.mcpBroker.getServers();
      const serverStatus = await this.mcpBroker.getServerStatus();
      
      this.servers = Object.entries(mcpServers).map(([name, serverInfo]) => {
        const status = serverStatus[name] || 'offline';
        
        // Ensure serverInfo is treated as an object with properties
        const serverInfoObj = typeof serverInfo === 'string' 
          ? { name: serverInfo } 
          : serverInfo as Record<string, any>;
        
        const tools = serverInfoObj.tools 
          ? Object.entries(serverInfoObj.tools as Record<string, any>).map(([toolName, toolInfo]) => {
              const toolInfoObj = toolInfo as Record<string, any>;
              return {
                name: toolName,
                description: toolInfoObj.description || '',
                parameters: toolInfoObj.parameters || {}
              };
            }) 
          : [];
        
        return {
          id: serverInfoObj.id || name,
          name,
          description: serverInfoObj.description || '',
          status: status as 'online' | 'offline' | 'error',
          tools
        };
      });
    } catch (error) {
      console.error('Error refreshing MCP servers:', error);
    }
  }

  getServers(): McpServer[] {
    return this.servers;
  }

  async getServerStatus(): Promise<Record<string, string>> {
    if (!this.mcpBroker) {
      return {};
    }
    
    try {
      return await this.mcpBroker.getServerStatus();
    } catch (error) {
      console.error('Error getting MCP server status:', error);
      return {};
    }
  }

  getAllCapabilities(): Record<string, Record<string, any>> {
    if (!this.mcpBroker) {
      return {};
    }
    
    try {
      // Convert array to Record type if needed
      const capabilities = this.mcpBroker.getAllCapabilities();
      if (Array.isArray(capabilities)) {
        return capabilities.reduce((acc, capability) => {
          if (typeof capability === 'string') {
            acc[capability] = {};
          }
          return acc;
        }, {} as Record<string, Record<string, any>>);
      }
      return capabilities as Record<string, Record<string, any>>;
    } catch (error) {
      console.error('Error getting MCP capabilities:', error);
      return {};
    }
  }

  getAllTools(): Record<string, Record<string, any>> {
    if (!this.mcpBroker) {
      return {};
    }
    
    try {
      // Convert array to Record type if needed
      const tools = this.mcpBroker.getAllTools();
      if (Array.isArray(tools)) {
        return tools.reduce((acc, tool) => {
          if (typeof tool === 'string') {
            acc[tool] = {};
          }
          return acc;
        }, {} as Record<string, Record<string, any>>);
      }
      return tools as Record<string, Record<string, any>>;
    } catch (error) {
      console.error('Error getting MCP tools:', error);
      return {};
    }
  }

  async executeDirective(
    serverName: string,
    action: string,
    params: Record<string, any>,
    options?: {
      sender?: string;
      recipient?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<any> {
    if (!this.mcpBroker) {
      throw new Error('MCP Service not initialized');
    }
    
    try {
      // Ensure sender is always provided
      const enhancedOptions = {
        ...options,
        sender: options?.sender || 'system'
      };
      
      return await this.mcpBroker.executeDirective(
        serverName,
        action,
        params,
        enhancedOptions
      );
    } catch (error) {
      console.error(`Error executing MCP directive ${serverName}.${action}:`, error);
      throw error;
    }
  }
}