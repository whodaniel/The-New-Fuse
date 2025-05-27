/**
 * Agent Adapter Module
 * 
 * This module provides adapters for integrating with specific VS Code AI extensions,
 * allowing them to participate in The New Fuse's inter-extension communication system.
 */

import * as vscode from 'vscode';
import { AgentClient, AgentMessage } from './agent-communication.js';

// Interface for extension-specific adapters
export interface ExtensionAdapter {
  id: string;
  name: string;
  extensionId: string;
  capabilities: string[];
  isActive: boolean;
  sendMessage(action: string, payload: any): Promise<any>;
  isAvailable?(): Promise<boolean>; // Optional: Check if the extension is ready
  initialize?(): Promise<boolean>; // Optional: Initialize the adapter
  dispose?(): void; // Optional: Clean up resources
}

/**
 * Adapter for GitHub Copilot
 */
export class CopilotAdapter implements ExtensionAdapter {
  id = 'github.copilot';
  name = 'GitHub Copilot';
  extensionId = 'GitHub.copilot';
  capabilities = ['code-completion', 'code-generation'];
  isActive = true;
  private context: vscode.ExtensionContext;
  private agentClient: AgentClient;
  private initialized = false;
  private commandMap = {
    'generateCode': 'github.copilot.generate',
    'explainCode': 'github.copilot.explain',
    'completions': 'github.copilot.provideInlineCompletions'
  };
  
  constructor(context: vscode.ExtensionContext, agentClient: AgentClient) {
    this.context = context;
    this.agentClient = agentClient;
  }
  
  async sendMessage(action: string, payload: any): Promise<any> {
    // This is a simplified sendMessage for direct command execution.
    // For full agent communication, this would involve the AgentClient.
    return this.executeCommand(action, payload);
  }

  async isAvailable(): Promise<boolean> {
    const commands = await vscode.commands.getCommands(true);
    return commands.includes(this.commandMap.generateCode);
  }
  
  async initialize(): Promise<boolean> {
    if (this.initialized) return true;
    
    try {
      // Register this adapter as an agent
      const registered = await this.agentClient.register(
        this.name,
        ['code-generation', 'code-explanation', 'code-completion'],
        '1.0.0'
      );
      
      if (registered) {
        // Subscribe to receive messages
        await this.agentClient.subscribe(this.handleAgentMessage.bind(this));
        this.initialized = true;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`Failed to initialize ${this.name} adapter:`, error);
      return false;
    }
  }
  
  async executeCommand(action: string, input: any): Promise<any> {
    const commandId = this.commandMap[action];
    if (!commandId) {
      throw new Error(`Unsupported action: ${action}`);
    }
    
    // Adapt input to the format expected by Copilot
    const adaptedInput = this.adaptInput(action, input);
    
    // Execute the command
    return vscode.commands.executeCommand(commandId, adaptedInput);
  }
  
  private adaptInput(action: string, input: any): any {
    switch (action) {
      case 'generateCode':
        return {
          prompt: input.prompt,
          context: input.context,
          language: input.language
        };
        
      case 'explainCode':
        return {
          code: input.code,
          language: input.language
        };
        
      case 'completions':
        return input; // Pass through as is
        
      default:
        return input;
    }
  }
  
  private async handleAgentMessage(message: AgentMessage): Promise<void> {
    if (message.recipient !== this.id) return;
    
    try {
      let response;
      
      switch (message.action) {
        case 'generateCode':
        case 'explainCode':
        case 'completions':
          response = await this.executeCommand(message.action, message.payload);
          break;
          
        default:
          throw new Error(`Unsupported action: ${message.action}`);
      }
      
      // Send response back to sender
      await this.agentClient.sendMessage({
        recipient: message.source, // Changed from message.sender
        source: this.id, // Changed from sender
        type: 'response',
        action: `${message.action}Response`,
        payload: { // Changed from content
          requestId: message.id,
          result: response,
          success: true
        }
      });
    } catch (error) {
      // Send error response
      await this.agentClient.sendMessage({
        recipient: message.source, // Changed from message.sender
        source: this.id, // Changed from sender
        type: 'response',
        action: `${message.action}Response`,
        payload: { // Changed from content
          requestId: message.id,
          error: error.message,
          success: false
        }
      });
    }
  }
  
  dispose(): void {
    // Nothing to dispose
  }
}

/**
 * Adapter for Claude extension
 */
export class ClaudeAdapter implements ExtensionAdapter {
  id = 'anthropic.claude';
  name = 'Claude';
  extensionId = 'anthropic.claude';
  capabilities = ['text-generation', 'code-explanation'];
  isActive = true;
  private context: vscode.ExtensionContext;
  private agentClient: AgentClient;
  private initialized = false;
  private commandMap = {
    'generateText': 'anthropic.claude.generate',
    'completions': 'anthropic.claude.completions'
  };
  
  constructor(context: vscode.ExtensionContext, agentClient: AgentClient) {
    this.context = context;
    this.agentClient = agentClient;
  }

  async sendMessage(action: string, payload: any): Promise<any> {
    // This is a simplified sendMessage for direct command execution.
    // For full agent communication, this would involve the AgentClient.
    return this.executeCommand(action, payload);
  }
  
  async isAvailable(): Promise<boolean> {
    const commands = await vscode.commands.getCommands(true);
    return commands.includes(this.commandMap.generateText);
  }
  
  async initialize(): Promise<boolean> {
    if (this.initialized) return true;
    
    try {
      // Register this adapter as an agent
      const registered = await this.agentClient.register(
        this.name,
        ['text-generation', 'code-generation', 'code-explanation'],
        '1.0.0'
      );
      
      if (registered) {
        // Subscribe to receive messages
        await this.agentClient.subscribe(this.handleAgentMessage.bind(this));
        this.initialized = true;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`Failed to initialize ${this.name} adapter:`, error);
      return false;
    }
  }
  
  async executeCommand(action: string, input: any): Promise<any> {
    const commandId = this.commandMap[action];
    if (!commandId) {
      throw new Error(`Unsupported action: ${action}`);
    }
    
    // Adapt input to the format expected by Claude
    const adaptedInput = this.adaptInput(action, input);
    
    // Execute the command
    return vscode.commands.executeCommand(commandId, adaptedInput);
  }
  
  private adaptInput(action: string, input: any): any {
    switch (action) {
      case 'generateText':
        return {
          prompt: input.prompt,
          system: input.systemPrompt,
          maxTokens: input.maxTokens,
          temperature: input.temperature,
          model: input.model || 'claude-2.0'
        };
        
      case 'completions':
        return input; // Pass through as is
        
      default:
        return input;
    }
  }
  
  private async handleAgentMessage(message: AgentMessage): Promise<void> {
    if (message.recipient !== this.id) return;
    
    try {
      let response;
      
      switch (message.action) {
        case 'generateText':
        case 'completions':
          response = await this.executeCommand(message.action, message.payload);
          break;
          
        default:
          throw new Error(`Unsupported action: ${message.action}`);
      }
      
      // Send response back to sender
      await this.agentClient.sendMessage({
        recipient: message.source, // Changed from message.sender
        source: this.id, // Changed from sender
        type: 'response',
        action: `${message.action}Response`,
        payload: { // Changed from content
          requestId: message.id,
          result: response,
          success: true
        }
      });
    } catch (error) {
      // Send error response
      await this.agentClient.sendMessage({
        recipient: message.source, // Changed from message.sender
        source: this.id, // Changed from sender
        type: 'response',
        action: `${message.action}Response`,
        payload: { // Changed from content
          requestId: message.id,
          error: error.message,
          success: false
        }
      });
    }
  }
  
  dispose(): void {
    // Nothing to dispose
  }
}

/**
 * AgentAdapterManager manages all the extension adapters
 */
export class AgentAdapterManager {
  private context: vscode.ExtensionContext;
  private agentClient: AgentClient;
  private adapters: Map<string, ExtensionAdapter> = new Map();
  private outputChannel: vscode.OutputChannel;
  
  constructor(context: vscode.ExtensionContext, agentClient: AgentClient, outputChannel: vscode.OutputChannel) {
    this.context = context;
    this.agentClient = agentClient;
    this.outputChannel = outputChannel;
  }
  
  /**
   * Initialize the adapter manager and discover extensions
   */
  async initialize(): Promise<void> {
    // Set up listeners for extension changes
    vscode.extensions.onDidChange(() => this.detectExtensions());
    
    // Discover extensions
    await this.detectExtensions();
    
    // Listen for adapter messages
    this.agentClient.subscribe(this.handleAdapterMessage.bind(this));
    
    this.log('Agent Adapter Manager initialized');
  }
  
  /**
   * Get available adapters
   */
  getAvailableAdapters(): ExtensionAdapter[] {
    return Array.from(this.adapters.values());
  }
  
  /**
   * Get adapter by ID
   */
  getAdapter(id: string): ExtensionAdapter | undefined {
    return this.adapters.get(id);
  }
  
  /**
   * Handle messages directed to adapters
   */
  private async handleAdapterMessage(message: any): Promise<void> {
    // Check if this is a message for an adapter
    if (message.action === 'adapter.register') {
      await this.registerAdapter(message.payload);
    } else if (message.action === 'adapter.message') {
      await this.routeMessageToAdapter(message.payload);
    }
  }
  
  /**
   * Register an adapter from a registration message
   */
  private async registerAdapter(registration: any): Promise<void> {
    try {
      if (!registration.id || !registration.name || !registration.extensionId) {
        this.log(`Invalid adapter registration: missing required fields`);
        return;
      }
      
      const adapter: ExtensionAdapter = {
        id: registration.id,
        name: registration.name,
        extensionId: registration.extensionId,
        capabilities: registration.capabilities || [],
        isActive: true,
        
        // Method to send messages to this adapter
        sendMessage: async (action: string, payload: any): Promise<any> => {
          return this.agentClient.sendMessage({
            recipient: registration.id,
            source: 'agent-adapter-manager', // Changed from sender, ID for the manager itself
            type: 'request',
            action: action,
            payload: payload // Changed from content
          });
        }
      };
      
      this.adapters.set(registration.id, adapter);
      this.log(`Registered adapter: ${registration.name} (${registration.id})`);
      
      // Send acknowledgement
      await this.agentClient.sendMessage({
        recipient: registration.id,
        source: 'agent-adapter-manager', // Changed from sender, ID for the manager itself
        type: 'response',
        action: 'adapter.registered',
        payload: { // Changed from content
          success: true
        }
      });
    } catch (error) {
      this.log(`Error registering adapter: ${error.message}`);
    }
  }
  
  /**
   * Route a message to an adapter
   */
  private async routeMessageToAdapter(message: any): Promise<void> {
    try {
      const { targetId, action, payload } = message;
      
      if (!targetId || !action) {
        this.log(`Invalid adapter message: missing required fields`);
        return;
      }
      
      const adapter = this.adapters.get(targetId);
      if (!adapter) {
        this.log(`Adapter not found: ${targetId}`);
        return;
      }
      
      // Send the message to the adapter
      await adapter.sendMessage(action, payload);
      this.log(`Routed message to adapter ${targetId}: ${action}`);
    } catch (error) {
      this.log(`Error routing adapter message: ${error.message}`);
    }
  }
  
  /**
   * Detect installed AI extensions and create adapters
   */
  private async detectExtensions(): Promise<void> {
    try {
      // List of known AI extensions with their adapter configurations
      const knownExtensions = [
        {
          extensionId: 'GitHub.copilot',
          adapterId: 'github.copilot',
          name: 'GitHub Copilot',
          capabilities: ['code-completion', 'code-generation']
        },
        {
          extensionId: 'anthropic.claude',
          adapterId: 'anthropic.claude',
          name: 'Claude',
          capabilities: ['text-generation', 'code-explanation']
        },
        {
          extensionId: 'openai.gpt',
          adapterId: 'openai.gpt',
          name: 'OpenAI GPT',
          capabilities: ['text-generation', 'image-generation']
        }
      ];
      
      // Create adapters for installed extensions
      let detectedCount = 0;
      
      for (const extConfig of knownExtensions) {
        const extension = vscode.extensions.getExtension(extConfig.extensionId);
        
        if (extension) {
          // Create adapter if it doesn't exist yet
          if (!this.adapters.has(extConfig.adapterId)) {
            const adapter: ExtensionAdapter = {
              id: extConfig.adapterId,
              name: extConfig.name,
              extensionId: extConfig.extensionId,
              capabilities: extConfig.capabilities,
              isActive: extension.isActive,
              
              sendMessage: async (action: string, payload: any): Promise<any> => {
                // Use the extension's exports if available
                if (extension.isActive && extension.exports && typeof extension.exports.receiveMessage === 'function') {
                  return extension.exports.receiveMessage(action, payload);
                }
                
                // Otherwise use commands if available
                try {
                  return await vscode.commands.executeCommand(`${extConfig.adapterId}.receiveMessage`, action, payload);
                } catch (error) {
                  this.log(`Error sending message to ${extConfig.name}: ${error.message}`);
                  return null;
                }
              }
            };
            
            this.adapters.set(extConfig.adapterId, adapter);
            detectedCount++;
            
            this.log(`Detected AI extension: ${extConfig.name}`);
          } else {
            // Update active status for existing adapter
            const adapter = this.adapters.get(extConfig.adapterId);
            if (adapter) {
              adapter.isActive = extension.isActive;
            }
          }
        }
      }
      
      if (detectedCount > 0) {
        this.log(`Detected ${detectedCount} AI extensions`);
      }
    } catch (error) {
      this.log(`Error detecting extensions: ${error.message}`);
    }
  }
  
  /**
   * Log a message to the output channel
   */
  private log(message: string): void {
    this.outputChannel.appendLine(`[Agent Adapter] ${message}`);
  }
  
  /**
   * Dispose of resources
   */
  dispose(): void {
    // Nothing to dispose for now
  }
}

/**
 * Factory function to create an agent adapter manager
 */
export function createAgentAdapterManager(
  context: vscode.ExtensionContext,
  agentClient: AgentClient,
  outputChannel: vscode.OutputChannel
): AgentAdapterManager {
  return new AgentAdapterManager(context, agentClient, outputChannel);
}
