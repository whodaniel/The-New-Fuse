/**
 * RooCodeCommunication Service
 * 
 * Implements the standard communication protocol for interacting with Roo Code
 * based on the Agent Communication Guide patterns.
 */

import { EventEmitter } from 'events';
import * as crypto from 'crypto';

// Define message types from the guide
export type MessageType = 
  | 'COLLABORATION_REQUEST'
  | 'CAPABILITY_DECLARATION'
  | 'CAPABILITY_ASSESSMENT_REQUEST'
  | 'REGISTRATION'
  | 'CERTIFICATION_REQUEST'
  | 'CERTIFICATION_RESPONSE'
  | 'MCP_TOOL_INVOCATION'
  | 'MCP_TOOL_RESPONSE'
  | 'CODE_COLLABORATION'
  | 'HEARTBEAT'
  | 'HEARTBEAT_RESPONSE';

// Define standard message structure
export interface BaseMessage {
  type: MessageType;
  source: string;
  target?: string;
  content: any;
  timestamp: string;
}

// Task types supported by Roo Code
export type TaskType = 
  | 'code_review'
  | 'refactoring'
  | 'file_consolidation'
  | 'consolidation_analysis'
  | 'code_generation'
  | 'system_design';

// Priority levels
export type Priority = 'low' | 'medium' | 'high' | 'critical';

export class RooCodeCommunication extends EventEmitter {
  private agentId: string;
  private targetAgentId: string;
  private connected: boolean;
  private redisClient: any; // Redis client to be injected
  
  // Communication channels
  private readonly GENERAL_CHANNEL = 'chat:ai';
  private readonly DIRECT_CHANNEL_PREFIX = 'agent:';
  private readonly BROADCAST_CHANNEL = 'agent:broadcast';
  
  constructor(options: {
    agentId: string;
    targetAgentId: string;
    redisClient?: any;
  }) {
    super();
    this.agentId = options.agentId;
    this.targetAgentId = options.targetAgentId;
    this.redisClient = options.redisClient;
    this.connected = false;
  }
  
  /**
   * Initialize the communication service and establish connections
   */
  async initialize(): Promise<boolean> {
    try {
      if (this.redisClient) {
        // Subscribe to relevant channels
        await this.redisClient.subscribe(this.GENERAL_CHANNEL);
        await this.redisClient.subscribe(`${this.DIRECT_CHANNEL_PREFIX}${this.agentId}:chat`);
        await this.redisClient.subscribe(this.BROADCAST_CHANNEL);
        
        // Set up message handler
        this.redisClient.on('message', (channel: string, message: string) => {
          this.handleIncomingMessage(channel, message);
        });
        
        // Send registration message
        await this.register();
        
        this.connected = true;
        this.emit('connected');
        return true;
      } else {
        console.log('Redis client not provided, operating in offline mode');
        // We still return true so the service can function in "simulation mode" for testing
        this.connected = false;
        return false;
      }
    } catch (error) {
      console.error('Failed to initialize RooCodeCommunication:', error);
      this.connected = false;
      this.emit('error', { error: 'Failed to initialize communication' });
      return false;
    }
  }
  
  /**
   * Register with the Roo Code agent
   */
  private async register(): Promise<void> {
    const registrationMessage: BaseMessage = {
      type: 'REGISTRATION',
      source: this.agentId,
      content: {
        entity_type: 'ai_agent',
        credentials: {
          username: this.agentId,
          authentication_method: 'shared_secret',
          agent_signature: this.generateSignature()
        },
        profile: {
          name: 'Refactoring Service',
          type: 'service_agent',
          origin: 'the_new_fuse',
          primary_function: 'code_refactoring',
          capabilities: [
            'code_analysis',
            'code_refactoring',
            'file_consolidation',
            'codebase_optimization'
          ]
        }
      },
      timestamp: new Date().toISOString()
    };
    
    if (this.redisClient) {
      await this.redisClient.publish(
        `${this.DIRECT_CHANNEL_PREFIX}${this.targetAgentId}:chat`,
        JSON.stringify(registrationMessage)
      );
    }
  }
  
  /**
   * Send a capability declaration
   */
  async declareCapabilities(): Promise<void> {
    const capabilityMessage: BaseMessage = {
      type: 'CAPABILITY_DECLARATION',
      source: this.agentId,
      content: {
        capabilities: [
          {
            id: 'code_refactoring',
            version: '1.0',
            description: 'Refactor and consolidate code based on best practices',
            languages: ['JavaScript', 'TypeScript', 'Python', 'HTML', 'CSS'],
            confidence: 0.9
          },
          {
            id: 'file_consolidation',
            version: '1.0',
            description: 'Merge multiple redundant files into a single optimized implementation',
            confidence: 0.85
          },
          {
            id: 'codebase_analysis',
            version: '1.0',
            description: 'Analyze codebase for duplicate functionality and refactoring opportunities',
            confidence: 0.92
          }
        ]
      },
      timestamp: new Date().toISOString()
    };
    
    if (this.redisClient) {
      await this.redisClient.publish(
        this.BROADCAST_CHANNEL,
        JSON.stringify(capabilityMessage)
      );
    }
  }
  
  /**
   * Request a collaboration with Roo Code
   */
  async requestCollaboration(
    taskType: TaskType, 
    taskDetails: any, 
    priority: Priority = 'medium'
  ): Promise<void> {
    const collaborationRequest: BaseMessage = {
      type: 'COLLABORATION_REQUEST',
      source: this.agentId,
      target: this.targetAgentId,
      content: {
        action: 'task_assistance',
        task_type: taskType,
        context: taskDetails,
        priority
      },
      timestamp: new Date().toISOString()
    };
    
    if (this.redisClient && this.connected) {
      await this.redisClient.publish(
        `${this.DIRECT_CHANNEL_PREFIX}${this.targetAgentId}:chat`,
        JSON.stringify(collaborationRequest)
      );
    } else {
      // When not connected, emit an event for simulation/testing
      this.emit('offline_message_sent', collaborationRequest);
    }
  }
  
  /**
   * Send a code collaboration message
   */
  async sendCodeCollaboration(
    files: {path: string, content: string}[], 
    focusAreas: string[],
    priority: Priority = 'medium'
  ): Promise<void> {
    const codeCollaborationMessage: BaseMessage = {
      type: 'CODE_COLLABORATION',
      source: this.agentId,
      target: this.targetAgentId,
      content: {
        action: 'code_review',
        files: files.map(file => file.path),
        focus: focusAreas,
        standards: ['Clean_Code', 'TypeScript_Best_Practices'],
        file_contents: files
      },
      timestamp: new Date().toISOString()
    };
    
    if (this.redisClient && this.connected) {
      await this.redisClient.publish(
        `${this.DIRECT_CHANNEL_PREFIX}${this.targetAgentId}:chat`,
        JSON.stringify(codeCollaborationMessage)
      );
    } else {
      this.emit('offline_message_sent', codeCollaborationMessage);
    }
  }
  
  /**
   * Handle incoming messages from the Redis channels
   */
  private handleIncomingMessage(channel: string, rawMessage: string): void {
    try {
      const message = JSON.parse(rawMessage) as BaseMessage;
      
      // Check if message is targeted for this agent
      if (message.target && message.target !== this.agentId) {
        return;
      }
      
      // Process based on message type
      switch (message.type) {
        case 'HEARTBEAT':
          // reply with HEARTBEAT_RESPONSE
          this.sendHeartbeatResponse(message.source);
          break;
        case 'HEARTBEAT_RESPONSE':
          // received pong
          this.emit('heartbeat', { from: message.source, timestamp: message.timestamp });
          break;

        case 'COLLABORATION_REQUEST':
          this.handleCollaborationRequest(message);
          break;
          
        case 'CODE_COLLABORATION':
          // If message contains refactoring results
          if (message.content.action === 'refactoring_result') {
            this.emit('refactoring', message.content);
          } else if (message.content.action === 'analysis_result') {
            this.emit('analysis', message.content);
          }
          break;
          
        case 'CERTIFICATION_RESPONSE':
          // Received certification from Roo Code
          this.emit('certification', message.content);
          break;
          
        case 'MCP_TOOL_RESPONSE':
          // Response from an MCP tool invocation
          this.emit('mcp_response', message.content);
          break;
          
        default:
          this.emit('message', { channel, message });
      }
    } catch (error) {
      console.error('Error processing incoming message:', error);
      this.emit('error', { 
        error: 'Failed to process message', 
        details: (error as Error).message 
      });
    }
  }
  
  /**
   * Handle a collaboration request
   */
  private handleCollaborationRequest(message: BaseMessage): void {
    // Currently, we only initiate requests to Roo Code, not handle incoming ones
    // This can be expanded if bidirectional collaboration is needed
    this.emit('collaboration_request', message.content);
  }
  
  /**
   * Generate a signature for authentication
   */
  private generateSignature(): string {
    // In a production system, this would use a proper cryptographic approach
    // For now, we use a simple hash of the agent ID and timestamp
    const timestamp = Date.now().toString();
    return crypto
      .createHash('sha256')
      .update(`${this.agentId}:${timestamp}`)
      .digest('hex');
  }
  
  /**
   * Disconnect from all channels
   */
  async disconnect(): Promise<void> {
    if (this.redisClient && this.connected) {
      await this.redisClient.unsubscribe(this.GENERAL_CHANNEL);
      await this.redisClient.unsubscribe(`${this.DIRECT_CHANNEL_PREFIX}${this.agentId}:chat`);
      await this.redisClient.unsubscribe(this.BROADCAST_CHANNEL);
      
      this.connected = false;
      this.emit('disconnected');
    }
  }
  
  /**
   * Verify connection status
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Send a heartbeat (ping) to the target agent
   */
  async sendHeartbeat(): Promise<void> {
    const heartbeatMsg: BaseMessage = {
      type: 'HEARTBEAT',
      source: this.agentId,
      target: this.targetAgentId,
      content: {},
      timestamp: new Date().toISOString()
    };
    if (this.redisClient && this.connected) {
      await this.redisClient.publish(
        `${this.DIRECT_CHANNEL_PREFIX}${this.targetAgentId}:chat`,
        JSON.stringify(heartbeatMsg)
      );
    } else {
      this.emit('heartbeat_offline_sent', heartbeatMsg);
    }
  }

  /**
   * Send a heartbeat response (pong) to the requesting agent
   */
  private async sendHeartbeatResponse(targetId: string): Promise<void> {
    const pong: BaseMessage = {
      type: 'HEARTBEAT_RESPONSE',
      source: this.agentId,
      target: targetId,
      content: {},
      timestamp: new Date().toISOString()
    };
    if (this.redisClient && this.connected) {
      await this.redisClient.publish(
        `${this.DIRECT_CHANNEL_PREFIX}${targetId}:chat`,
        JSON.stringify(pong)
      );
    } else {
      this.emit('heartbeat_offline_response', pong);
    }
  }
}