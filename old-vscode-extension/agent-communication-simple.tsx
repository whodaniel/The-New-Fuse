/**
 * Simplified Agent Communication Module
 * 
 * This is a basic implementation to get started quickly.
 */

import * as vscode from 'vscode';
import * as crypto from 'crypto';

export interface AgentMessage {
  id: string;
  sender: string;
  recipient: string;
  action: string;
  payload: any;
  timestamp: number;
}

export class AgentClient {
  private context: vscode.ExtensionContext;
  private agentId: string;
  private messageCallbacks: ((message: AgentMessage) => Promise<void>)[] = [];
  
  constructor(context: vscode.ExtensionContext, agentId: string) {
    this.context = context;
    this.agentId = agentId;
    
    // Set up polling for workspace state messages
    setInterval(() => this.checkForMessages(), 1000);
  }
  
  // Register this agent
  async register(name: string, capabilities: string[], version: string): Promise<boolean> {
    // Store registration in workspace state
    const registrations = this.context.workspaceState.get<any[]>('thefuse.agentRegistrations', []);
    registrations.push({
      id: this.agentId,
      name,
      capabilities,
      version,
      timestamp: Date.now()
    });
    await this.context.workspaceState.update('thefuse.agentRegistrations', registrations);
    return true;
  }
  
  // Send a message to another agent
  async sendMessage(recipient: string, action: string, payload: any): Promise<boolean> {
    const message: AgentMessage = {
      id: crypto.randomUUID(),
      sender: this.agentId,
      recipient,
      action,
      payload,
      timestamp: Date.now()
    };
    
    // Add message to workspace state
    const messages = this.context.workspaceState.get<AgentMessage[]>('thefuse.messages', []);
    messages.push(message);
    await this.context.workspaceState.update('thefuse.messages', messages);
    return true;
  }
  
  // Broadcast a message to all agents
  async broadcast(action: string, payload: any): Promise<boolean> {
    return this.sendMessage('*', action, payload);
  }
  
  // Subscribe to receive messages
  async subscribe(callback: (message: AgentMessage) => Promise<void>): Promise<boolean> {
    this.messageCallbacks.push(callback);
    return true;
  }
  
  // Check for new messages
  private async checkForMessages(): Promise<void> {
    const messages = this.context.workspaceState.get<AgentMessage[]>('thefuse.messages', []);
    if (messages.length === 0) return;
    
    // Find messages for this agent
    const myMessages = messages.filter(m => 
      m.recipient === this.agentId || 
      m.recipient === '*'
    );
    
    if (myMessages.length === 0) return;
    
    // Process messages
    for (const message of myMessages) {
      for (const callback of this.messageCallbacks) {
        await callback(message);
      }
    }
    
    // Remove processed messages
    const remainingMessages = messages.filter(m => 
      m.recipient !== this.agentId && 
      m.recipient !== '*'
    );
    await this.context.workspaceState.update('thefuse.messages', remainingMessages);
  }
}

// Export factory functions
export function initializeOrchestrator(context: vscode.ExtensionContext): any {
  // Simple placeholder for the full orchestrator
  return {
    getRegisteredAgents: () => {
      return context.workspaceState.get<any[]>('thefuse.agentRegistrations', []);
    }
  };
}

export function createAgentClient(context: vscode.ExtensionContext, agentId: string): AgentClient {
  return new AgentClient(context, agentId);
}
