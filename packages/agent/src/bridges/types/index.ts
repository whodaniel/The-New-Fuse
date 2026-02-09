/**
 * Type definitions for bridge communications
 */

export interface BridgeMessage {
  id: string;
  type: string;
  payload: unknown;
  timestamp: number;
  source: string;
  target?: string;
}

export interface BridgeConfig {
  name: string;
  endpoint?: string;
  timeout?: number;
  retryAttempts?: number;
  authentication?: BridgeAuthentication;
}

export interface BridgeAuthentication {
  type: 'none' | 'token' | 'oauth' | 'basic';
  credentials?: Record<string, string>;
}

export interface BridgeStatus {
  connected: boolean;
  lastPing?: number;
  errors: string[];
  messagesSent: number;
  messagesReceived: number;
}

export interface BridgeEventHandlers {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onMessage?: (message: BridgeMessage) => void;
  onError?: (error: Error) => void;
}

export enum BridgeEvent {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  MESSAGE = 'message',
  ERROR = 'error',
  RECONNECT = 'reconnect'
}

export interface BridgeMetrics {
  uptime: number;
  totalMessages: number;
  errorCount: number;
  averageResponseTime: number;
}