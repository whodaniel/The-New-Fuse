/**
 * Bridges module exports
 * Provides communication bridges between different agent systems
 */

import { EventEmitter } from 'events';

export enum MessageType {
  COMMAND = 'command',
  RESPONSE = 'response',
  ERROR = 'error',
  EVENT = 'event',
  NOTIFICATION = 'notification',
  REQUEST = 'request',
  STATUS = 'status',
  LOG = 'log',
  METRIC = 'metric',
  ALERT = 'alert',
  HEARTBEAT = 'heartbeat',
  INFO = 'info',
  WARNING = 'warning',
  TEXT = 'text'
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export abstract class BaseBridge extends EventEmitter {
  protected name: string;
  protected isConnected: boolean = false;

  constructor(name: string) {
    super();
    this.name = name;
  }

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract sendMessage(message: Record<string, unknown>, messageType: MessageType, priority?: Priority): Promise<void>;
  
  get connected(): boolean {
    return this.isConnected;
  }

  get bridgeName(): string {
    return this.name;
  }
}

// Export all bridge implementations
export * from './cline_bridge';
export * from './types';