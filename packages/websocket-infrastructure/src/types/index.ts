import { Socket } from 'socket.io';

export interface WebSocketConfig {
  port?: number;
  cors?: {
    origin: string | string[];
    credentials?: boolean;
  };
  redis?: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  heartbeat?: {
    interval: number;
    timeout: number;
  };
  compression?: {
    enabled: boolean;
    threshold?: number;
  };
  messageQueue?: {
    enabled: boolean;
    maxSize?: number;
    ttl?: number;
  };
  connectionPool?: {
    maxConnections: number;
    idleTimeout: number;
  };
  monitoring?: {
    enabled: boolean;
    metricsPort?: number;
  };
}

export interface ConnectionMetadata {
  id: string;
  userId?: string;
  connectedAt: Date;
  lastActivity: Date;
  rooms: Set<string>;
  metadata: Record<string, any>;
}

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  metadata?: ConnectionMetadata;
}

export interface MessageQueueItem {
  id: string;
  channel: string;
  data: any;
  timestamp: Date;
  retries: number;
  maxRetries: number;
  priority: number;
}

export interface ReconnectionStrategy {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export interface WebSocketMetrics {
  totalConnections: number;
  activeConnections: number;
  totalMessages: number;
  messagesPerSecond: number;
  averageLatency: number;
  errors: number;
  reconnections: number;
}

export interface HealthStatus {
  healthy: boolean;
  timestamp: Date;
  connections: number;
  redis: boolean;
  messageQueue: number;
  errors: string[];
}

export enum MessageType {
  TEXT = 'text',
  BINARY = 'binary',
  JSON = 'json',
  COMPRESSED = 'compressed',
}

export enum CompressionAlgorithm {
  GZIP = 'gzip',
  DEFLATE = 'deflate',
  BROTLI = 'brotli',
}

export interface Message {
  id: string;
  type: MessageType;
  channel: string;
  data: any;
  timestamp: Date;
  compressed?: boolean;
  compressionAlgorithm?: CompressionAlgorithm;
}

export interface ConnectionPoolStats {
  total: number;
  active: number;
  idle: number;
  waiting: number;
}

export type EventHandler = (socket: AuthenticatedSocket, data: any) => void | Promise<void>;

export interface WebSocketAdapter {
  initialize(): Promise<void>;
  broadcast(channel: string, data: any): void;
  sendToUser(userId: string, data: any): void;
  disconnect(socketId: string, reason?: string): void;
  getMetrics(): WebSocketMetrics;
}
