import * as vscode from 'vscode';
import { AgentClient } from './agent-communication.js';

/**
 * Interface for a message transport protocol
 */
export interface MessageTransport {
  id: string;
  name: string;
  description: string;
  sendMessage(recipient: string, action: string, payload: any): Promise<boolean>;
  initialize(): Promise<boolean>;
  dispose(): void;
}

/**
 * Manages communication protocols for inter-extension messaging
 */
export class ProtocolRegistry {
  private context: vscode.ExtensionContext;
  private transports: Map<string, MessageTransport> = new Map();
  private selectedTransportId: string | null = null;
  private outputChannel: vscode.OutputChannel;
  
  constructor(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel) {
    this.context = context;
    this.outputChannel = outputChannel;
    
    // Load previously selected transport
    this.selectedTransportId = context.globalState.get<string>('thefuse.selectedTransport') || null;
  }
  
  /**
   * Register a message transport
   */
  registerTransport(transport: MessageTransport): void {
    if (this.transports.has(transport.id)) {
      this.log(`Transport ${transport.id} already registered`);
      return;
    }
    
    this.transports.set(transport.id, transport);
    this.log(`Registered transport: ${transport.name} (${transport.id})`);
    
    // If this is the first transport or matches our saved preference, select it
    if (!this.selectedTransportId || this.selectedTransportId === transport.id) {
      this.selectTransport(transport.id);
    }
  }
  
  /**
   * Select a transport as the active one
   */
  async selectTransport(transportId: string): Promise<boolean> {
    if (!this.transports.has(transportId)) {
      this.log(`Transport ${transportId} not found`);
      return false;
    }
    
    const transport = this.transports.get(transportId)!;
    
    // Initialize the transport
    const success = await transport.initialize();
    if (!success) {
      this.log(`Failed to initialize transport ${transportId}`);
      return false;
    }
    
    // Set as selected
    this.selectedTransportId = transportId;
    this.context.globalState.update('thefuse.selectedTransport', transportId);
    
    this.log(`Selected transport: ${transport.name} (${transport.id})`);
    return true;
  }
  
  /**
   * Get the currently selected transport
   */
  getSelectedTransport(): MessageTransport | null {
    if (!this.selectedTransportId) return null;
    return this.transports.get(this.selectedTransportId) || null;
  }
  
  /**
   * Get all registered transports
   */
  getAllTransports(): MessageTransport[] {
    return Array.from(this.transports.values());
  }
  
  /**
   * Send a message using the selected transport
   */
  async sendMessage(recipient: string, action: string, payload: any): Promise<boolean> {
    const transport = this.getSelectedTransport();
    
    if (!transport) {
      this.log('No transport selected');
      return false;
    }
    
    try {
      return await transport.sendMessage(recipient, action, payload);
    } catch (error) {
      this.log(`Error sending message via ${transport.id}: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Dispose of all transports
   */
  dispose(): void {
    for (const transport of this.transports.values()) {
      transport.dispose();
    }
  }
  
  /**
   * Log a message to the output channel
   */
  private log(message: string): void {
    this.outputChannel.appendLine(`[Protocol Registry] ${message}`);
  }
}

/**
 * Create a workspace state transport
 */
export function createWorkspaceStateTransport(context: vscode.ExtensionContext, agentClient: AgentClient): MessageTransport {
  return {
    id: 'workspaceState',
    name: 'Workspace State Protocol',
    description: 'Uses VS Code workspace state for message exchange',
    
    async initialize(): Promise<boolean> {
      return true; // Nothing to initialize
    },
    
    async sendMessage(recipient: string, action: string, payload: any): Promise<boolean> {
      return agentClient.sendMessage(recipient, action, payload);
    },
    
    dispose(): void {
      // Nothing to dispose
    }
  };
}

/**
 * Create a protocol registry
 */
export function createProtocolRegistry(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel): ProtocolRegistry {
  return new ProtocolRegistry(context, outputChannel);
}
