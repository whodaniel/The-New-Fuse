/**
 * Message Control Protocol (MCP) Implementation
 * 
 * This module implements a simplified MCP protocol for AI agent communication,
 * enabling autonomous discovery and interaction between AI extensions.
 */

import * as vscode from 'vscode';
import { AgentClient } from './agent-communication.js';
import { getErrorMessage } from './utilities.js';

// MCP Message interface
export interface MCPMessage {
  namespace: string;
  command: string;
  parameters: Record<string, any>;
  requestId?: string;
}

// MCP Response interface
export interface MCPResponse {
  success: boolean;
  result?: any;
  error?: string;
}

// Registered handler function type
type MCPHandler = (parameters: Record<string, any>) => Promise<any>;

/**
 * MCP Protocol Manager
 */
export class MCPProtocolManager {
  private context: vscode.ExtensionContext;
  private agentClient: AgentClient;
  private handlers: Map<string, MCPHandler> = new Map();
  private outputChannel: vscode.OutputChannel;
  
  constructor(context: vscode.ExtensionContext, agentClient: AgentClient) {
    this.context = context;
    this.agentClient = agentClient;
    this.outputChannel = vscode.window.createOutputChannel('MCP Protocol');
    
    // Register this as an agent
    this.agentClient.register('MCP Protocol Manager', ['mcp', 'agent-discovery'], '1.0.0')
      .then(() => {
        this.log('MCP Protocol Manager registered');
        // Subscribe to receive messages
        this.agentClient.subscribe(this.handleAgentMessage.bind(this));
      });
    
    // Register the basic MCP handlers
    this.registerBuiltinHandlers();
    
    // Register commands
    this.registerCommands();
  }
  
  /**
   * Register built-in MCP handlers
   */
  private registerBuiltinHandlers() {
    // Register the discovery handler
    this.registerHandler('mcp.core.discover', async () => {
      // Return list of registered agents
      return vscode.commands.executeCommand('llm-orchestrator.getRegisteredAgents');
    });
    
    // Register the capabilities handler
    this.registerHandler('mcp.core.getCapabilities', async (params) => {
      if (!params.agentId) {
        throw new Error('agentId parameter is required');
      }
      
      // Get agent capabilities
      return vscode.commands.executeCommand('llm-orchestrator.getAgentCapabilities', params.agentId);
    });
    
    // Register ping/echo handler
    this.registerHandler('mcp.core.echo', async (params) => {
      return {
        message: params.message || 'Hello from MCP Protocol Manager',
        timestamp: Date.now(),
        echo: true
      };
    });
  }
  
  /**
   * Register VS Code commands
   */
  private registerCommands() {
    // Register a command to register an MCP handler
    this.context.subscriptions.push(
      vscode.commands.registerCommand('thefuse.mcp.registerHandler', 
        async (namespace: string, handlerFn: string | Function) => {
          await this.registerHandlerFromString(namespace, handlerFn);
          return true;
        }
      )
    );
    
    // Register a command to send an MCP message
    this.context.subscriptions.push(
      vscode.commands.registerCommand('thefuse.mcp.sendMessage',
        async (recipient: string, namespace: string, command: string, parameters: Record<string, any>) => {
          return this.sendMCPMessage(recipient, namespace, command, parameters);
        }
      )
    );
    
    // Register a command to trigger auto-discovery
    this.context.subscriptions.push(
      vscode.commands.registerCommand('thefuse.mcp.startAutoDiscovery',
        async () => {
          return this.startAutoDiscovery();
        }
      )
    );
  }
  
  /**
   * Register an MCP handler
   */
  public registerHandler(fullCommand: string, handler: MCPHandler): void {
    this.handlers.set(fullCommand, handler);
    this.log(`Registered handler for ${fullCommand}`);
  }
  
  /**
   * Register an MCP handler from a string or function
   */
  public async registerHandlerFromString(fullCommand: string, handlerFn: string | Function): Promise<boolean> {
    try {
      let handler: MCPHandler;
      
      if (typeof handlerFn === 'function') {
        handler = handlerFn as MCPHandler;
      } else if (typeof handlerFn === 'string') {
        // Convert string to function
        // eslint-disable-next-line no-new-func
        handler = new Function('parameters', `return (async () => { ${handlerFn} })()`) as MCPHandler;
      } else {
        throw new Error('Invalid handler: must be a function or string');
      }
      
      this.registerHandler(fullCommand, handler);
      return true;
    } catch (error) {
      this.log(`Error registering handler for ${fullCommand}: ${getErrorMessage(error)}`);
      return false;
    }
  }
  
  /**
   * Send an MCP message to another agent
   */
  public async sendMCPMessage(
    recipient: string,
    namespace: string,
    command: string,
    parameters: Record<string, any>
  ): Promise<MCPResponse> {
    try {
      const fullCommand = `${namespace}.${command}`;
      this.log(`Sending MCP message: ${fullCommand} to ${recipient}`);
      
      const result = await this.agentClient.sendMessage(recipient, 'mcp.execute', {
        namespace,
        command,
        parameters,
        requestId: `mcp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      });
      
      return { success: true, result };
    } catch (error) {
      this.log(`Error sending MCP message: ${getErrorMessage(error)}`);
      return { success: false, error: getErrorMessage(error) };
    }
  }
  
  /**
   * Start auto-discovery of AI agents
   */
  public async startAutoDiscovery(): Promise<boolean> {
    try {
      this.log('Starting auto-discovery of AI agents');
      
      // Broadcast discovery message
      await this.agentClient.broadcast('mcp.execute', {
        namespace: 'mcp.core',
        command: 'discover',
        parameters: {},
        requestId: `mcp-discovery-${Date.now()}`
      });
      
      return true;
    } catch (error) {
      this.log(`Error in auto-discovery: ${getErrorMessage(error)}`);
      return false;
    }
  }
  
  /**
   * Handle incoming agent messages
   */
  private async handleAgentMessage(message: any): Promise<void> {
    if (message.action === 'mcp.execute') {
      const mcpMessage = message.payload as MCPMessage;
      const fullCommand = `${mcpMessage.namespace}.${mcpMessage.command}`;
      
      this.log(`Received MCP execute: ${fullCommand}`);
      
      // Find the handler
      const handler = this.handlers.get(fullCommand);
      if (!handler) {
        // Send error response
        await this.agentClient.sendMessage(message.sender, 'mcp.response', {
          requestId: mcpMessage.requestId,
          success: false,
          error: `No handler registered for ${fullCommand}`
        });
        return;
      }
      
      try {
        // Execute the handler
        const result = await handler(mcpMessage.parameters);
        
        // Send response
        await this.agentClient.sendMessage(message.sender, 'mcp.response', {
          requestId: mcpMessage.requestId,
          success: true,
          result
        });
      } catch (error) {
        // Send error response
        await this.agentClient.sendMessage(message.sender, 'mcp.response', {
          requestId: mcpMessage.requestId,
          success: false,
          error: error.message
        });
      }
    } else if (message.action === 'mcp.response') {
      // Handle response to a previous MCP execute
      this.log(`Received MCP response for request ${message.payload.requestId}`);
      
      // In a real implementation, this would resolve a promise for the original request
    }
  }
  
  /**
   * Log a message to the output channel
   */
  private log(message: string): void {
    const timestamp = new Date().toISOString();
    this.outputChannel.appendLine(`[${timestamp}] ${message}`);
  }
  
  /**
   * Dispose of resources
   */
  public dispose(): void {
    this.outputChannel.dispose();
  }
}

// Export factory function
export function createMCPProtocolManager(context: vscode.ExtensionContext, agentClient: AgentClient): MCPProtocolManager {
  return new MCPProtocolManager(context, agentClient);
}
