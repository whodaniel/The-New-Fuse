import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// A2A Message Schema (v1.0)
const a2aMessageV1Schema = z.object({
  id: z.string(),
  type: z.string(),
  timestamp: z.number(),
  sender: z.string(),
  recipient: z.string().optional(),
  payload: z.any(),
  metadata: z.object({
    priority: z.enum(['low', 'medium', 'high']),
    timeout: z.number().optional(),
    retryCount: z.number().optional(),
    protocol_version: z.string()
  })
});

// A2A Message Schema (v2.0)
const a2aMessageV2Schema = z.object({
  header: z.object({
    id: z.string(),
    type: z.string(),
    version: z.string(),
    priority: z.enum(['low', 'medium', 'high']),
    source: z.string(),
    target: z.string().optional()
  }),
  body: z.object({
    content: z.any(),
    metadata: z.object({
      sent_at: z.number(),
      timeout: z.number().optional(),
      retries: z.number().optional(),
      trace_id: z.string().optional()
    })
  })
});

export type A2AMessageV1 = z.infer<typeof a2aMessageV1Schema>;
export type A2AMessageV2 = z.infer<typeof a2aMessageV2Schema>;
export type A2AMessage = A2AMessageV1 | A2AMessageV2;

/**
 * Service for A2A protocol operations
 */
export class A2AProtocolService {
  private apiBaseUrl: string;
  private defaultProtocolVersion: string;
  
  constructor(defaultProtocolVersion: string = '1.0') {
    this.apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
    this.defaultProtocolVersion = defaultProtocolVersion;
  }
  
  /**
   * Creates a new A2A message
   * @param type Message type
   * @param payload Message payload
   * @param sender Message sender
   * @param recipient Message recipient
   * @param options Additional options
   * @returns The created message
   */
  createMessage(
    type: string,
    payload: any,
    sender: string,
    recipient?: string,
    options: {
      priority?: 'low' | 'medium' | 'high';
      timeout?: number;
      retryCount?: number;
      protocolVersion?: string;
    } = {}
  ): A2AMessage {
    const protocolVersion = options.protocolVersion || this.defaultProtocolVersion;
    
    if (protocolVersion === '2.0') {
      return this.createMessageV2(type, payload, sender, recipient, options);
    }
    
    return this.createMessageV1(type, payload, sender, recipient, options);
  }
  
  /**
   * Creates a new A2A message (v1.0)
   * @param type Message type
   * @param payload Message payload
   * @param sender Message sender
   * @param recipient Message recipient
   * @param options Additional options
   * @returns The created message
   */
  private createMessageV1(
    type: string,
    payload: any,
    sender: string,
    recipient?: string,
    options: {
      priority?: 'low' | 'medium' | 'high';
      timeout?: number;
      retryCount?: number;
    } = {}
  ): A2AMessageV1 {
    return {
      id: uuidv4(),
      type,
      timestamp: Date.now(),
      sender,
      recipient,
      payload,
      metadata: {
        priority: options.priority || 'medium',
        timeout: options.timeout,
        retryCount: options.retryCount,
        protocol_version: '1.0'
      }
    };
  }
  
  /**
   * Creates a new A2A message (v2.0)
   * @param type Message type
   * @param payload Message payload
   * @param sender Message sender
   * @param recipient Message recipient
   * @param options Additional options
   * @returns The created message
   */
  private createMessageV2(
    type: string,
    payload: any,
    sender: string,
    recipient?: string,
    options: {
      priority?: 'low' | 'medium' | 'high';
      timeout?: number;
      retryCount?: number;
    } = {}
  ): A2AMessageV2 {
    return {
      header: {
        id: uuidv4(),
        type,
        version: '2.0',
        priority: options.priority || 'medium',
        source: sender,
        target: recipient
      },
      body: {
        content: payload,
        metadata: {
          sent_at: Date.now(),
          timeout: options.timeout,
          retries: options.retryCount,
          trace_id: uuidv4()
        }
      }
    };
  }
  
  /**
   * Transforms a message from one version to another
   * @param message The message to transform
   * @param targetVersion The target version
   * @returns The transformed message
   */
  transformMessage(message: A2AMessage, targetVersion: string): A2AMessage {
    // Determine current version
    const currentVersion = this.getMessageVersion(message);
    
    // If already in target version, return as is
    if (currentVersion === targetVersion) {
      return message;
    }
    
    // Transform from v1 to v2
    if (currentVersion === '1.0' && targetVersion === '2.0') {
      const v1Message = message as A2AMessageV1;
      
      return {
        header: {
          id: v1Message.id,
          type: v1Message.type,
          version: '2.0',
          priority: v1Message.metadata.priority,
          source: v1Message.sender,
          target: v1Message.recipient
        },
        body: {
          content: v1Message.payload,
          metadata: {
            sent_at: v1Message.timestamp,
            timeout: v1Message.metadata.timeout,
            retries: v1Message.metadata.retryCount,
            trace_id: uuidv4()
          }
        }
      };
    }
    
    // Transform from v2 to v1
    if (currentVersion === '2.0' && targetVersion === '1.0') {
      const v2Message = message as A2AMessageV2;
      
      return {
        id: v2Message.header.id,
        type: v2Message.header.type,
        timestamp: v2Message.body.metadata.sent_at,
        sender: v2Message.header.source,
        recipient: v2Message.header.target,
        payload: v2Message.body.content,
        metadata: {
          priority: v2Message.header.priority,
          timeout: v2Message.body.metadata.timeout,
          retryCount: v2Message.body.metadata.retries,
          protocol_version: '1.0'
        }
      };
    }
    
    throw new Error(`Unsupported version transformation: ${currentVersion} -> ${targetVersion}`);
  }
  
  /**
   * Gets the version of a message
   * @param message The message
   * @returns The message version
   */
  getMessageVersion(message: A2AMessage): string {
    if ('header' in message && message.header.version) {
      return message.header.version;
    }
    
    if ('metadata' in message && message.metadata.protocol_version) {
      return message.metadata.protocol_version;
    }
    
    return '1.0'; // Default to v1.0
  }
  
  /**
   * Validates a message
   * @param message The message to validate
   * @returns The validated message
   */
  validateMessage(message: A2AMessage): A2AMessage {
    const version = this.getMessageVersion(message);
    
    if (version === '2.0') {
      return a2aMessageV2Schema.parse(message);
    }
    
    return a2aMessageV1Schema.parse(message);
  }
  
  /**
   * Sends a message
   * @param message The message to send
   * @returns The response
   */
  async sendMessage(message: A2AMessage): Promise<any> {
    try {
      // Validate message
      this.validateMessage(message);
      
      const response = await fetch(`${this.apiBaseUrl}/a2a/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }
  
  /**
   * Broadcasts a message
   * @param message The message to broadcast
   * @returns The response
   */
  async broadcastMessage(message: A2AMessage): Promise<any> {
    try {
      // Validate message
      this.validateMessage(message);
      
      const response = await fetch(`${this.apiBaseUrl}/a2a/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to broadcast message: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error broadcasting message:', error);
      throw error;
    }
  }
  
  /**
   * Sends a request and waits for a response
   * @param message The request message
   * @param timeout Timeout in milliseconds
   * @returns The response
   */
  async sendRequestAndWaitForResponse(message: A2AMessage, timeout: number = 30000): Promise<any> {
    try {
      // Validate message
      this.validateMessage(message);
      
      const response = await fetch(`${this.apiBaseUrl}/a2a/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-Timeout': timeout.toString()
        },
        body: JSON.stringify(message)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to send request: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error sending request:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const a2aProtocolService = new A2AProtocolService();
