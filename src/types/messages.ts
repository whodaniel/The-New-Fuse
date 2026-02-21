/**
 * Message Types for The New Fuse
 * 
 * This file defines type-safe interfaces for all message types used in 
 * agent-to-agent and agent-tool communication.
 */

/**
 * Base message interface that all specific message types extend
 */
export interface BaseMessage {
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

/**
 * Agent-to-Agent Message Types
 */

/**
 * Task Request Message
 * Sent when one agent wants another agent to perform a task
 */
export interface TaskRequestMessage extends BaseMessage {
  content: {
    taskType: string;
    parameters: Record<string, any>;
    priority?: 'low' | 'medium' | 'high';
    requestedBy: {
      id: string;
      name: string;
    };
  };
  metadata: {
    type: 'TASK_REQUEST';
    conversationId: string;
    protocol: string;
  };
}

/**
 * Query Message
 * Sent when one agent wants to request information from another agent
 */
export interface QueryMessage extends BaseMessage {
  content: {
    query: string;
    parameters: Record<string, any>;
    requestedBy: {
      id: string;
      name: string;
    };
  };
  metadata: {
    type: 'QUERY';
    conversationId: string;
    protocol: string;
  };
}

/**
 * Response Message
 * Sent in response to a request or query
 */
export interface ResponseMessage extends BaseMessage {
  content: {
    originalMessageId: string;
    status: 'success' | 'error' | 'partial';
    data: any;
    respondedBy: {
      id: string;
      name: string;
    };
  };
  metadata: {
    type: 'RESPONSE';
    conversationId: string;
    protocol: string;
  };
}

/**
 * Notification Message
 * One-way message that doesn't require a response
 */
export interface NotificationMessage extends BaseMessage {
  content: {
    notificationType: string;
    message: string;
    data?: any;
    priority?: 'low' | 'medium' | 'high';
    sentBy: {
      id: string;
      name: string;
    };
  };
  metadata: {
    type: 'NOTIFICATION';
    conversationId: string;
    protocol: string;
  };
}

/**
 * Error Message
 * Sent when an error occurs during processing
 */
export interface ErrorMessage extends BaseMessage {
  content: {
    errorType: string;
    message: string;
    originalMessageId?: string;
    details?: any;
  };
  metadata: {
    type: 'ERROR';
    conversationId: string;
    protocol: string;
  };
}

/**
 * Heartbeat Message
 * Sent periodically to maintain connection
 */
export interface HeartbeatMessage extends BaseMessage {
  content: {
    status: 'active' | 'idle' | 'busy';
    metrics?: {
      uptime: number;
      memory?: number;
      processingLoad?: number;
    };
  };
  metadata: {
    type: 'HEARTBEAT';
    conversationId: string;
    protocol: string;
  };
}

/**
 * Capability Discovery Message
 * Sent to discover capabilities of other agents
 */
export interface CapabilityDiscoveryMessage extends BaseMessage {
  content: {
    requestType: 'QUERY' | 'RESPONSE';
    capabilities?: string[];
    tools?: Array<{
      name: string;
      description: string;
      parameters: Record<string, {
        type: string;
        description: string;
        required?: boolean;
      }>;
    }>;
  };
  metadata: {
    type: 'CAPABILITY_DISCOVERY';
    conversationId: string;
    protocol: string;
  };
}

/**
 * MCP-Specific Message Types
 */

/**
 * Tool Request Message
 * Sent when an agent wants to invoke a tool
 */
export interface ToolRequestMessage extends BaseMessage {
  content: {
    toolName: string;
    parameters: Record<string, any>;
  };
  metadata: {
    type: 'TOOL_REQUEST';
    conversationId: string;
    protocol: string;
  };
}

/**
 * Tool Response Message
 * Sent in response to a tool request
 */
export interface ToolResponseMessage extends BaseMessage {
  content: {
    toolName: string;
    requestId: string;
    success: boolean;
    result?: any;
    error?: string;
    timestamp: string;
  };
  metadata: {
    type: 'TOOL_RESPONSE';
    conversationId: string;
    protocol: string;
  };
}

/**
 * Type guard functions to check message types at runtime
 */

export function isTaskRequestMessage(message: BaseMessage): message is TaskRequestMessage {
  return message.metadata.type === 'TASK_REQUEST';
}

export function isQueryMessage(message: BaseMessage): message is QueryMessage {
  return message.metadata.type === 'QUERY';
}

export function isResponseMessage(message: BaseMessage): message is ResponseMessage {
  return message.metadata.type === 'RESPONSE';
}

export function isNotificationMessage(message: BaseMessage): message is NotificationMessage {
  return message.metadata.type === 'NOTIFICATION';
}

export function isErrorMessage(message: BaseMessage): message is ErrorMessage {
  return message.metadata.type === 'ERROR';
}

export function isHeartbeatMessage(message: BaseMessage): message is HeartbeatMessage {
  return message.metadata.type === 'HEARTBEAT';
}

export function isCapabilityDiscoveryMessage(message: BaseMessage): message is CapabilityDiscoveryMessage {
  return message.metadata.type === 'CAPABILITY_DISCOVERY';
}

export function isToolRequestMessage(message: BaseMessage): message is ToolRequestMessage {
  return message.metadata.type === 'TOOL_REQUEST';
}

export function isToolResponseMessage(message: BaseMessage): message is ToolResponseMessage {
  return message.metadata.type === 'TOOL_RESPONSE';
}