import * as vscode from 'vscode';
import { Agent, Message, AgentCapability, MessageValidationResult } from './types.js';

/**
 * Orchestrator for managing communication between AI agent extensions
 */
export class Orchestrator {
  private agents: Map<string, Agent> = new Map();
  private messageQueue: Message[] = [];
  private messageHistory: Message[] = [];
  private rateLimits: Map<string, number> = new Map();
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.setupCommandHandlers();
    this.setupMessageProcessing();
  }

  /**
   * Register command handlers for agent operations
   */
  private setupCommandHandlers() {
    // Register an agent with the orchestrator
    const registerCmd = vscode.commands.registerCommand(
      'thefuse.orchestrator.register',
      (agentId: string, capabilities: AgentCapability[], metadata?: any): boolean => {
        this.registerAgent(agentId, capabilities, metadata);
        return true;
      }
    );

    // Send a message between agents
    const sendMsgCmd = vscode.commands.registerCommand(
      'thefuse.orchestrator.sendMessage',
      async (sender: string, recipient: string, action: string, payload: any): Promise<any> => {
        const validationResult = this.validateMessage(sender, recipient, action, payload);
        
        if (!validationResult.valid) {
          return { success: false, error: validationResult.error };
        }

        return this.routeMessage({
          id: this.generateMessageId(),
          sender,
          recipient,
          action,
          payload,
          timestamp: Date.now(),
          status: 'pending'
        });
      }
    );

    // Get list of available agents and their capabilities
    const getAgentsCmd = vscode.commands.registerCommand(
      'thefuse.orchestrator.getAgents',
      (): { id: string, capabilities: AgentCapability[] }[] => {
        return Array.from(this.agents.entries()).map(([id, agent]) => ({
          id,
          capabilities: agent.capabilities
        }));
      }
    );

    this.context.subscriptions.push(registerCmd, sendMsgCmd, getAgentsCmd);
  }

  /**
   * Setup message queue processing
   */
  private setupMessageProcessing() {
    // Process messages in the queue every 100ms
    const interval = setInterval(() => {
      if (this.messageQueue.length > 0) {
        const message = this.messageQueue.shift();
        if (message) {
          this.processMessage(message);
        }
      }
    }, 100);

    // Make sure to clear the interval when the extension is deactivated
    this.context.subscriptions.push({ dispose: () => clearInterval(interval) });
  }

  /**
   * Register a new agent with the orchestrator
   */
  private registerAgent(agentId: string, capabilities: AgentCapability[], metadata?: any): void {
    if (this.agents.has(agentId)) {
      // Update existing agent registration
      const agent = this.agents.get(agentId)!;
      agent.capabilities = capabilities;
      agent.metadata = metadata || agent.metadata;
      agent.lastSeen = Date.now();
    } else {
      // Register new agent
      this.agents.set(agentId, {
        id: agentId,
        capabilities,
        metadata: metadata || {},
        registered: Date.now(),
        lastSeen: Date.now()
      });

      // Notify other agents of new registration
      this.broadcastSystemMessage('agent.registered', {
        agentId,
        capabilities
      });
    }
  }

  /**
   * Validate a message before processing
   */
  private validateMessage(
    sender: string, 
    recipient: string, 
    action: string, 
    payload: any
  ): MessageValidationResult {
    // Check if sender is registered
    if (!this.agents.has(sender)) {
      return { valid: false, error: 'Sender is not registered' };
    }

    // Check rate limits
    const senderKey = `${sender}:messages`;
    const currentCount = this.rateLimits.get(senderKey) || 0;
    if (currentCount > 100) { // 100 messages per minute limit
      return { valid: false, error: 'Rate limit exceeded' };
    }
    this.rateLimits.set(senderKey, currentCount + 1);

    // Reset rate limits every minute
    if (!this.rateLimits.has(`${sender}:timer`)) {
      const timerId = setTimeout(() => {
        this.rateLimits.set(senderKey, 0);
        this.rateLimits.delete(`${sender}:timer`);
      }, 60000);
      this.rateLimits.set(`${sender}:timer`, timerId as unknown as number);
    }

    // Check if recipient exists or is broadcast
    if (recipient !== '*' && !this.agents.has(recipient)) {
      return { valid: false, error: 'Recipient is not registered' };
    }

    return { valid: true };
  }

  /**
   * Route a message to its recipient
   */
  private routeMessage(message: Message): Promise<any> {
    // Add to message history
    this.messageHistory.push(message);
    
    // If message is broadcast, send to all agents
    if (message.recipient === '*') {
      return this.broadcastMessage(message);
    }

    // Otherwise add to queue for processing
    this.messageQueue.push(message);
    return Promise.resolve({ success: true, messageId: message.id });
  }

  /**
   * Process a message in the queue
   */
  private async processMessage(message: Message): Promise<void> {
    try {
      // Update the agents' last seen timestamp
      if (this.agents.has(message.sender)) {
        this.agents.get(message.sender)!.lastSeen = Date.now();
      }

      // Call the recipient's handler command
      const result = await vscode.commands.executeCommand(
        `thefuse.agent.${message.recipient}.handleMessage`,
        message
      );

      // Update message status
      message.status = 'delivered';
      message.response = result;

      // Save in workspace state periodically to maintain history
      this.saveMessageHistory();
    } catch (error) {
      console.error(`Error processing message ${message.id}:`, error);
      message.status = 'failed';
      message.error = `${error}`;
    }
  }

  /**
   * Broadcast a message to all registered agents
   */
  private broadcastMessage(message: Message): Promise<any> {
    const promises: Promise<any>[] = [];
    const recipients: string[] = [];
    
    for (const [agentId, _] of this.agents.entries()) {
      // Don't send to the sender
      if (agentId !== message.sender) {
        recipients.push(agentId);
        const broadcastMessage: Message = {
          ...message,
          recipient: agentId,
          id: this.generateMessageId()
        };
        this.messageQueue.push(broadcastMessage);
        promises.push(Promise.resolve({ success: true, messageId: broadcastMessage.id }));
      }
    }

    return Promise.all(promises).then(() => {
      return { 
        success: true, 
        recipients, 
        messageId: message.id 
      };
    });
  }

  /**
   * Broadcast a system message to all agents
   */
  private broadcastSystemMessage(action: string, payload: any): void {
    const message: Message = {
      id: this.generateMessageId(),
      sender: 'system',
      recipient: '*',
      action,
      payload,
      timestamp: Date.now(),
      status: 'pending'
    };
    
    this.broadcastMessage(message);
  }

  /**
   * Generate a unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Save message history to workspace state
   */
  private saveMessageHistory(): void {
    // Only save the last 1000 messages to avoid performance issues
    const recentHistory = this.messageHistory.slice(-1000);
    this.context.workspaceState.update('thefuse.messageHistory', recentHistory);
  }
}