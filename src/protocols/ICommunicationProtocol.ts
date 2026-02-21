/**
 * Unified Communication Protocol Interface
 * This interface defines the common API for all agent communication protocols
 * in The New Fuse platform, regardless of transport mechanism.
 */

export interface Message {
  id: string;
  timestamp: string;
  source: string;
  target: string;
  content: any;
  metadata: {
    type: string;
    conversationId: string;
    protocol: string;
    [key: string]: any;
  };
}

export interface ProtocolOptions {
  agentId: string;
  debug?: boolean;
  retryOptions?: {
    maxRetries: number;
    initialDelay: number;
    backoffMultiplier: number;
  };
  timeoutMs?: number;
  securityLevel?: 'basic' | 'enhanced' | 'strict';
  [key: string]: any;
}

export interface ICommunicationProtocol {
  /**
   * Initialize the protocol with necessary setup
   */
  initialize(): Promise<void>;
  
  /**
   * Send a message to another agent
   */
  sendMessage(target: string, content: any, type?: string, conversationId?: string): Promise<Message>;
  
  /**
   * Send a response to a received message
   */
  sendResponse(originalMessage: Message, content: any): Promise<Message>;
  
  /**
   * Register a generic message handler
   */
  onMessageReceived(handler: (message: Message) => void): void;
  
  /**
   * Register a handler for a specific message type
   */
  onMessageType(type: string, handler: (message: Message) => void): void;
  
  /**
   * Start listening for messages
   */
  startListening(): void;
  
  /**
   * Stop listening for messages
   */
  stopListening(): void;
  
  /**
   * Get the underlying transport mechanism details
   */
  getTransportInfo(): { type: string; details: any };
}