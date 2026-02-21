import * as vscode from 'vscode';
import { Message } from './types.js';

/**
 * Workspace state message manager
 */
export class WorkspaceStateMessageManager {
  private context: vscode.ExtensionContext;
  private messageQueueKey = 'thefuse.messageQueue';
  private messageHistoryKey = 'thefuse.messageHistory';
  private pollingInterval: NodeJS.Timeout | null = null;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  /**
   * Start monitoring workspace state for messages
   */
  startMonitoring(agentId: string, messageHandler: (message: Message) => Promise<void>): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    
    this.pollingInterval = setInterval(() => {
      const messageQueue = this.context.workspaceState.get<Message[]>(this.messageQueueKey, []);
      const myMessages = messageQueue.filter(msg => msg.recipient === agentId);
      
      if (myMessages.length > 0) {
        // Process each message
        myMessages.forEach(async (message) => {
          try {
            await messageHandler(message);
          } catch (error) {
            console.error(`Error handling message in workspace state:`, error);
          }
        });
        
        // Remove processed messages
        const updatedQueue = messageQueue.filter(msg => msg.recipient !== agentId);
        this.context.workspaceState.update(this.messageQueueKey, updatedQueue);
      }
    }, 500); // Check every 500ms
    
    // Make sure to clean up when the extension is deactivated
    this.context.subscriptions.push({ dispose: () => {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
      }
    }});
  }

  /**
   * Send a message through workspace state
   */
  sendMessage(message: Message): void {
    const messageQueue = this.context.workspaceState.get<Message[]>(this.messageQueueKey, []);
    messageQueue.push(message);
    this.context.workspaceState.update(this.messageQueueKey, messageQueue);
    
    // Also add to history
    const messageHistory = this.context.workspaceState.get<Message[]>(this.messageHistoryKey, []);
    messageHistory.push(message);
    
    // Keep only the last 1000 messages
    if (messageHistory.length > 1000) {
      messageHistory.splice(0, messageHistory.length - 1000);
    }
    
    this.context.workspaceState.update(this.messageHistoryKey, messageHistory);
  }

  /**
   * Stop monitoring for messages
   */
  stopMonitoring(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }
}