/**
 * Agent Communication Module
 * 
 * This module provides the core functionality for inter-extension communication
 * between AI agents in The New Fuse platform.
 */

import * as vscode from 'vscode';
import * as crypto from 'crypto';

// Message types for type safety
export interface AgentMessage {
  id: string;
  sender: string;
  recipient: string;
  action: string;
  payload: any;
  timestamp: number;
  signature?: string;
}

export interface AgentRegistration {
  id: string;
  name: string;
  capabilities: string[];
  version: string;
  apiVersion: string;
}

// Security utilities
export class SecurityManager {
  private secretKey: string;
  
  constructor(context: vscode.ExtensionContext) {
    // Get or generate a secret key for message signing
    let key = context.globalState.get<string>('thefuse.secretKey');
    if (!key) {
      key = crypto.randomBytes(32).toString('hex');
      context.globalState.update('thefuse.secretKey', key);
    }
    this.secretKey = key;
  }
  
  // Sign a message to verify its authenticity
  signMessage(message: Omit<AgentMessage, 'signature'>): string {
    const hmac = crypto.createHmac('sha256', this.secretKey);
    hmac.update(JSON.stringify({
      id: message.id,
      sender: message.sender,
      recipient: message.recipient,
      action: message.action,
      payload: message.payload,
      timestamp: message.timestamp
    }));
    return hmac.digest('hex');
  }
  
  // Verify a message's signature
  verifyMessage(message: AgentMessage): boolean {
    if (!message.signature) return false;
    
    const expectedSignature = this.signMessage({
      id: message.id,
      sender: message.sender,
      recipient: message.recipient,
      action: message.action,
      payload: message.payload,
      timestamp: message.timestamp
    });
    
    return crypto.timingSafeEqual(
      Buffer.from(message.signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }
}

// Central orchestrator for agent communication
export class AgentOrchestrator {
  private registeredAgents: Map<string, AgentRegistration> = new Map();
  private messageCallbacks: Map<string, ((message: AgentMessage) => Promise<void>)[]> = new Map();
  private securityManager: SecurityManager;
  private context: vscode.ExtensionContext;
  private disposed = false;
  
  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.securityManager = new SecurityManager(context);
    
    // Restore registered agents from persistent storage
    const savedAgents = context.globalState.get<AgentRegistration[]>('thefuse.registeredAgents', []);
    savedAgents.forEach(agent => {
      this.registeredAgents.set(agent.id, agent);
    });
    
    // Set up command-based communication channel
    const registerCommand = vscode.commands.registerCommand(
      'thefuse.orchestrator.register',
      (agentInfo: AgentRegistration) => this.registerAgent(agentInfo)
    );
    
    const sendMessageCommand = vscode.commands.registerCommand(
      'thefuse.orchestrator.sendMessage',
      (message: Omit<AgentMessage, 'id' | 'timestamp' | 'signature'>) => 
        this.sendMessage(message)
    );
    
    const subscribeCommand = vscode.commands.registerCommand(
      'thefuse.orchestrator.subscribe',
      (agentId: string, callback: (message: AgentMessage) => Promise<void>) => 
        this.subscribe(agentId, callback)
    );
    
    const unsubscribeCommand = vscode.commands.registerCommand(
      'thefuse.orchestrator.unsubscribe',
      (agentId: string) => this.unsubscribe(agentId)
    );
    
    // Set up workspace state monitoring for indirect communication
    const stateMonitor = setInterval(() => {
      if (this.disposed) return;
      
      const messageQueue = this.context.workspaceState.get<AgentMessage[]>(
        'thefuse.messageQueue', 
        []
      );
      
      if (messageQueue.length > 0) {
        // Process pending messages
        const processedIds: string[] = [];
        
        messageQueue.forEach(message => {
          if (this.securityManager.verifyMessage(message)) {
            this.routeMessage(message);
            processedIds.push(message.id);
          } else {
            console.warn(`Invalid message signature: ${message.id}`);
            processedIds.push(message.id);
          }
        });
        
        // Remove processed messages
        const updatedQueue = messageQueue.filter(msg => !processedIds.includes(msg.id));
        this.context.workspaceState.update('thefuse.messageQueue', updatedQueue);
      }
    }, 1000);
    
    // Register disposables
    context.subscriptions.push(
      registerCommand,
      sendMessageCommand,
      subscribeCommand,
      unsubscribeCommand,
      { dispose: () => {
          clearInterval(stateMonitor);
          this.disposed = true;
        }
      }
    );
  }
  
  // Register an AI agent with the orchestrator
  async registerAgent(agentInfo: AgentRegistration): Promise<boolean> {
    // Validate the registration
    if (!agentInfo.id || !agentInfo.name || !agentInfo.capabilities) {
      return false;
    }
    
    // Store the registration
    this.registeredAgents.set(agentInfo.id, agentInfo);
    
    // Persist registrations
    await this.context.globalState.update(
      'thefuse.registeredAgents', 
      Array.from(this.registeredAgents.values())
    );
    
    // Initialize message callback array if needed
    if (!this.messageCallbacks.has(agentInfo.id)) {
      this.messageCallbacks.set(agentInfo.id, []);
    }
    
    return true;
  }
  
  // Send a message between AI agents
  async sendMessage(messageData: Omit<AgentMessage, 'id' | 'timestamp' | 'signature'>): Promise<{ success: boolean, messageId?: string }> {
    // Validate sender is registered
    if (!this.registeredAgents.has(messageData.sender)) {
      return { success: false };
    }
    
    // Create the full message
    const message: Omit<AgentMessage, 'signature'> = {
      id: crypto.randomUUID(),
      ...messageData,
      timestamp: Date.now()
    };
    
    // Sign the message
    const signature = this.securityManager.signMessage(message);
    const signedMessage: AgentMessage = { ...message, signature };
    
    // Try direct routing first
    const directSuccess = await this.routeMessage(signedMessage);
    
    if (!directSuccess) {
      // Fall back to workspace state for asynchronous delivery
      const messageQueue = this.context.workspaceState.get<AgentMessage[]>(
        'thefuse.messageQueue', 
        []
      );
      
      messageQueue.push(signedMessage);
      await this.context.workspaceState.update('thefuse.messageQueue', messageQueue);
    }
    
    return { success: true, messageId: message.id };
  }
  
  // Route a message to its recipient
  private async routeMessage(message: AgentMessage): Promise<boolean> {
    // Handle broadcast messages
    if (message.recipient === '*') {
      let success = false;
      
      for (const [agentId, callbacks] of this.messageCallbacks.entries()) {
        if (agentId !== message.sender) { // Don't send to self
          for (const callback of callbacks) {
            try {
              await callback(message);
              success = true;
            } catch (error) {
              console.error(`Error delivering message to ${agentId}:`, error);
            }
          }
        }
      }
      
      return success;
    }
    
    // Handle direct messages
    const callbacks = this.messageCallbacks.get(message.recipient);
    if (!callbacks || callbacks.length === 0) {
      return false;
    }
    
    let success = false;
    for (const callback of callbacks) {
      try {
        await callback(message);
        success = true;
      } catch (error) {
        console.error(`Error delivering message to ${message.recipient}:`, error);
      }
    }
    
    return success;
  }
  
  // Subscribe to receive messages
  subscribe(agentId: string, callback: (message: AgentMessage) => Promise<void>): boolean {
    if (!this.registeredAgents.has(agentId)) {
      return false;
    }
    
    if (!this.messageCallbacks.has(agentId)) {
      this.messageCallbacks.set(agentId, []);
    }
    
    this.messageCallbacks.get(agentId).push(callback);
    return true;
  }
  
  // Unsubscribe from messages
  unsubscribe(agentId: string): boolean {
    if (!this.messageCallbacks.has(agentId)) {
      return false;
    }
    
    this.messageCallbacks.delete(agentId);
    return true;
  }
  
  // Get information about registered agents
  getRegisteredAgents(): AgentRegistration[] {
    return Array.from(this.registeredAgents.values());
  }
}

// Client for AI agents to use
export class AgentClient {
  private context: vscode.ExtensionContext;
  private agentId: string;
  private registered = false;
  private messageCallbacks: ((message: AgentMessage) => Promise<void>)[] = [];
  private pendingResponses: Map<string, { resolve: Function, reject: Function, timeout: NodeJS.Timeout }> = new Map();
  private outputChannel: vscode.OutputChannel;
  
  constructor(context: vscode.ExtensionContext, agentId: string, outputChannel: vscode.OutputChannel) {
    this.context = context;
    this.agentId = agentId;
    this.outputChannel = outputChannel;
    
    // Set up polling for workspace state messages
    setInterval(() => this.checkForMessages(), 1000);
  }
  
  // Register this agent with the orchestrator
  async register(name: string, capabilities: string[], version: string): Promise<boolean> {
    try {
      const registration: AgentRegistration = {
        id: this.agentId,
        name,
        capabilities,
        version,
        apiVersion: '1.0'
      };
      
      this.registered = await vscode.commands.executeCommand(
        'thefuse.orchestrator.register',
        registration
      );
      
      return this.registered;
    } catch (error) {
      console.error('Failed to register agent:', error);
      return false;
    }
  }
  
  // Send a message to another agent
  async sendMessage(recipient: string, action: string, payload: any): Promise<boolean> {
    if (!this.registered) {
      throw new Error('Agent not registered');
    }
    
    try {
      const result = await vscode.commands.executeCommand(
        'thefuse.orchestrator.sendMessage',
        {
          sender: this.agentId,
          recipient,
          action,
          payload
        }
      );
      
      return result?.success || false;
    } catch (error) {
      console.error('Failed to send message:', error);
      return false;
    }
  }
  
  // Broadcast a message to all agents
  async broadcast(action: string, payload: any): Promise<boolean> {
    return this.sendMessage('*', action, payload);
  }
  
  // Subscribe to receive messages
  async subscribe(callback: (message: AgentMessage) => Promise<void>): Promise<boolean> {
    if (!this.registered) {
      throw new Error('Agent not registered');
    }
    
    try {
      return await vscode.commands.executeCommand(
        'thefuse.orchestrator.subscribe',
        this.agentId,
        callback
      );
    } catch (error) {
      console.error('Failed to subscribe:', error);
      return false;
    }
  }
  
  // Unsubscribe from messages
  async unsubscribe(): Promise<boolean> {
    if (!this.registered) {
      return true; // Already not receiving messages
    }
    
    try {
      return await vscode.commands.executeCommand(
        'thefuse.orchestrator.unsubscribe',
        this.agentId
      );
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      return false;
    }
  }

  // Send a message and wait for a response
  async sendRequestAndWaitForResponse(recipient: string, action: string, payload: any, timeoutMs = 5000): Promise<any> {
    try {
      const requestId = crypto.randomUUID();
      const responseAction = `${action}Response`;
      
      // Create a message with requestId in the payload
      const message: AgentMessage = {
        id: requestId,
        sender: this.agentId,
        recipient,
        action,
        payload: { ...payload, requestId },
        timestamp: Date.now()
      };
      
      // Add message to workspace state
      const messages = this.context.workspaceState.get<AgentMessage[]>('thefuse.messages', []);
      messages.push(message);
      await this.context.workspaceState.update('thefuse.messages', messages);
      
      this.log(`Sent request to ${recipient}: ${action} (ID: ${requestId})`);
      
      // Create a promise that will resolve when the response arrives
      return new Promise((resolve, reject) => {
        // Set up a timeout to reject the promise if no response arrives
        const timeout = setTimeout(() => {
          this.pendingResponses.delete(requestId);
          reject(new Error(`Request timed out after ${timeoutMs}ms`));
        }, timeoutMs);
        
        // Store the pending response handlers
        this.pendingResponses.set(requestId, { resolve, reject, timeout });
      });
    } catch (error) {
      this.log(`Error sending request: ${error.message}`);
      throw error;
    }
  }

  // Check for new messages in the workspace state
  private async checkForMessages(): Promise<void> {
    try {
      const messages = this.context.workspaceState.get<AgentMessage[]>('thefuse.messages', []);
      if (messages.length === 0) return;
      
      // Find messages for this agent
      const myMessages = messages.filter(m => 
        m.recipient === this.agentId || 
        m.recipient === '*'
      );
      
      if (myMessages.length === 0) return;
      
      // Find remaining messages (those we're not processing)
      const remainingMessages = messages.filter(m => 
        !myMessages.some(mm => mm.id === m.id)
      );
      
      // Update the workspace state with remaining messages
      await this.context.workspaceState.update('thefuse.messages', remainingMessages);
      
      // Process messages
      for (const message of myMessages) {
        this.log(`Received message from ${message.sender}: ${message.action}`);
        
        // Check if this is a response to a pending request
        if (message.action.endsWith('Response') && message.payload && message.payload.requestId) {
          const requestId = message.payload.requestId;
          const pendingResponse = this.pendingResponses.get(requestId);
          
          if (pendingResponse) {
            // Clear the timeout and delete from pending responses
            clearTimeout(pendingResponse.timeout);
            this.pendingResponses.delete(requestId);
            
            // Resolve the promise with the response payload
            pendingResponse.resolve(message.payload);
            continue; // Skip the normal message processing
          }
        }
        
        // Process message with all registered callbacks
        for (const callback of this.messageCallbacks) {
          await callback(message);
        }
      }
    } catch (error) {
      this.log(`Error checking messages: ${error.message}`);
    }
  }

  // Get registered agents
  async getRegisteredAgents(): Promise<any[]> {
    return this.context.workspaceState.get<any[]>('thefuse.agentRegistrations', []);
  }
  
  // Log a message to the output channel
  private log(message: string): void {
    this.outputChannel.appendLine(`[Agent ${this.agentId}] ${message}`);
  }
}

// Export a function to initialize the orchestrator
export function initializeOrchestrator(context: vscode.ExtensionContext): any {
  return {
    getRegisteredAgents: () => {
      return context.workspaceState.get<any[]>('thefuse.agentRegistrations', []);
    },
    
    getAgentCapabilities: (agentId: string) => {
      const registrations = context.workspaceState.get<any[]>('thefuse.agentRegistrations', []);
      const agent = registrations.find(reg => reg.id === agentId);
      return agent ? agent.capabilities : [];
    }
  };
}

// Export a function to create an agent client
export function createAgentClient(
  context: vscode.ExtensionContext,
  agentId: string,
  outputChannel: vscode.OutputChannel
): AgentClient {
  return new AgentClient(context, agentId, outputChannel);
}
