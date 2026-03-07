/**
 * WebSocket Gateway Type Definitions
 * Proper TypeScript interfaces to replace `any` types in message handling
 */

/**
 * Base WebSocket message structure
 */
export interface WebSocketMessage<T = unknown> {
  type: string;
  payload: T;
  timestamp?: Date;
}

/**
 * Agent message payload structure
 * Used for agent communication messages
 */
export interface AgentMessagePayload {
  /** Room/channel ID for message routing */
  roomId: string;
  /** Agent ID sending the message */
  agentId: string;
  /** Message content */
  content: string;
  /** Optional message metadata */
  metadata?: Record<string, unknown>;
  /** Message type for categorization */
  messageType?: 'text' | 'action' | 'result' | 'error' | 'system';
  /** Reply-to message ID if this is a response */
  replyTo?: string;
}

/**
 * User online status event payload
 */
export interface UsersOnlinePayload {
  count: number;
  users?: string[];
}

/**
 * Error event payload
 */
export interface ErrorPayload {
  message: string;
  code?: string;
  details?: unknown;
}

/**
 * WebSocket connection metadata
 */
export interface ConnectionMetadata {
  socketId: string;
  userId: string;
  connectedAt: Date;
  rooms: string[];
}

/**
 * JWT payload structure for WebSocket authentication
 */
export interface WsJwtPayload {
  sub?: string;
  userId?: string;
  id?: string;
  email?: string;
  username?: string;
  iat?: number;
  exp?: number;
}

/**
 * Message acknowledgment response
 */
export interface MessageAck {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Subscription payload for room join/leave
 */
export interface RoomSubscriptionPayload {
  roomId: string;
  action: 'join' | 'leave';
}
