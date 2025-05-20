import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';
import { ICommunicationProtocol, Message, ProtocolOptions } from './ICommunicationProtocol.js';

/**
 * File-based communication protocol implementation
 * Uses the file system to exchange messages between agents
 */
export class FileCommunicationProtocol extends EventEmitter implements ICommunicationProtocol {
  private agentId: string;
  private communicationDir: string;
  private messageHandlers: Map<string, (message: Message) => void>;
  private watchInterval: NodeJS.Timeout | null;
  private lastCheckTime: number;
  private isListening: boolean;
  private debug: boolean;
  private retryOptions: {
    maxRetries: number;
    initialDelay: number;
    backoffMultiplier: number;
  };

  constructor(options: ProtocolOptions & { communicationDir?: string }) {
    super();
    this.agentId = options.agentId;
    this.communicationDir = options.communicationDir || path.join(process.cwd(), 'agent-communication');
    this.messageHandlers = new Map();
    this.watchInterval = null;
    this.lastCheckTime = Date.now();
    this.isListening = false;
    this.debug = options.debug || false;
    this.retryOptions = options.retryOptions || {
      maxRetries: 3,
      initialDelay: 1000,
      backoffMultiplier: 1.5,
    };
  }

  /**
   * Initialize the protocol
   */
  async initialize(): Promise<void> {
    // Ensure communication directory exists
    if (!fs.existsSync(this.communicationDir)) {
      fs.mkdirSync(this.communicationDir, { recursive: true });
    }
    
    // Register default message handler
    this.onMessageType('default', this.defaultMessageHandler.bind(this));
    
    this.log('File communication protocol initialized');
    
    return Promise.resolve();
  }

  /**
   * Start listening for messages
   */
  startListening(): void {
    if (this.isListening) {
      this.log('Already listening for messages');
      return;
    }
    
    this.log('Starting to listen for messages...');
    
    this.isListening = true;
    this.watchInterval = setInterval(() => {
      this.checkForMessages();
    }, 500);
  }

  /**
   * Stop listening for messages
   */
  stopListening(): void {
    if (!this.isListening) {
      return;
    }
    
    this.log('Stopping message listener');
    
    if (this.watchInterval) {
      clearInterval(this.watchInterval);
      this.watchInterval = null;
    }
    
    this.isListening = false;
  }

  /**
   * Send a message to another agent
   */
  async sendMessage(
    target: string, 
    content: any, 
    type: string = 'text', 
    conversationId: string | null = null
  ): Promise<Message> {
    // Create message object
    const message: Message = this.createMessage(target, content, type, conversationId);
    
    // Save message to file
    const filePath = path.join(this.communicationDir, `${message.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(message, null, 2));
    
    this.log(`Message sent to ${target}:`, content);
    
    // Emit event for internal tracking
    this.emit('messageSent', message);
    
    return message;
  }

  /**
   * Send a response to a received message
   */
  async sendResponse(originalMessage: Message, content: any): Promise<Message> {
    return this.sendMessage(
      originalMessage.source,
      content,
      'response',
      originalMessage.metadata?.conversationId
    );
  }

  /**
   * Register a handler for all messages
   */
  onMessageReceived(handler: (message: Message) => void): void {
    this.on('messageReceived', handler);
  }

  /**
   * Register a handler for a specific message type
   */
  onMessageType(type: string, handler: (message: Message) => void): void {
    this.messageHandlers.set(type, handler);
  }

  /**
   * Get transport information
   */
  getTransportInfo(): { type: string; details: any } {
    return {
      type: 'file',
      details: {
        communicationDir: this.communicationDir
      }
    };
  }

  /**
   * Create a message object
   */
  private createMessage(
    target: string, 
    content: any, 
    type: string = 'text', 
    conversationId: string | null = null
  ): Message {
    return {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      source: this.agentId,
      target,
      content,
      metadata: {
        type,
        conversationId: conversationId || `conv_${Date.now()}`,
        protocol: 'a2a-v1'
      }
    };
  }

  /**
   * Check for new messages in the communication directory
   */
  private checkForMessages(): void {
    try {
      const files = fs.readdirSync(this.communicationDir);
      const jsonFiles = files.filter(file => file.endsWith('.json') && !file.endsWith('.processed.json'));
      
      jsonFiles.forEach(file => {
        const filePath = path.join(this.communicationDir, file);
        const stats = fs.statSync(filePath);
        
        // Only process files created or modified since our last check
        if (stats.mtimeMs > this.lastCheckTime) {
          try {
            const content = fs.readFileSync(filePath, 'utf8');
            const messageData = JSON.parse(content);
            
            // Check if this message is for us
            if (messageData.target === this.agentId) {
              this.processMessage(messageData);
              
              // Mark as processed by renaming
              const processedPath = path.join(this.communicationDir, `${file}.processed`);
              fs.renameSync(filePath, processedPath);
            }
          } catch (err) {
            console.error(`Error processing message file ${file}:`, err);
          }
        }
      });
      
      this.lastCheckTime = Date.now();
    } catch (err) {
      console.error('Error checking for messages:', err);
    }
  }

  /**
   * Process a received message
   */
  private processMessage(message: Message): void {
    this.log(`Received message from ${message.source}:`, message.content);
    
    // Emit generic message event
    this.emit('messageReceived', message);
    
    // Find appropriate handler based on message type
    const type = message.metadata?.type || 'default';
    const handler = this.messageHandlers.get(type) || this.messageHandlers.get('default');
    
    if (handler) {
      try {
        handler(message);
      } catch (err) {
        console.error(`Error in message handler for type ${type}:`, err);
      }
    } else {
      this.log(`No handler found for message type: ${type}`);
    }
  }

  /**
   * Default message handler (can be overridden)
   */
  private defaultMessageHandler(message: Message): void {
    this.log('Default handler processing message:', message);
    // By default, we don't auto-respond
  }

  /**
   * Clear all message files
   */
  public clearMessageFiles(): void {
    try {
      const files = fs.readdirSync(this.communicationDir);
      files.forEach(file => {
        if (file.endsWith('.json') || file.endsWith('.processed')) {
          fs.unlinkSync(path.join(this.communicationDir, file));
        }
      });
      this.log('Cleared all message files');
    } catch (err) {
      console.error('Error clearing message files:', err);
    }
  }

  /**
   * Utility method for logging
   */
  private log(...args: any[]): void {
    if (this.debug) {
      console.log(`[${this.agentId}]`, ...args);
    }
  }
}