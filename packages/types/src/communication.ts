import { Priority } from './core/enums.js';

export enum MessageType {
  COMMAND = 'COMMAND',
  RESPONSE = 'RESPONSE',
  ERROR = 'ERROR',
  EVENT = 'EVENT',
  NOTIFICATION = 'NOTIFICATION',
  REQUEST = 'REQUEST',
  STATUS = 'STATUS',
  LOG = 'LOG',
  METRIC = 'METRIC',
  ALERT = 'ALERT',
  HEARTBEAT = 'HEARTBEAT'
}

export interface Message {
  /** Unique identifier for the message */
  id: string;
  /** Type of message */
  type: MessageType;
  /** Message content */
  content: unknown;
  /** Message priority */
  priority?: Priority;
  /** Timestamp when message was created */
  timestamp: Date;
  /** Source of the message */
  source: string;
  /** Target destination for the message */
  target?: string;
  /** Message correlation ID for tracking related messages */
  correlationId?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

export interface ChannelOptions {
  /** Whether the channel should persist messages */
  persistent?: boolean;
  /** Time to live in seconds for messages(0: number: number = no expiry);
  /** Whether to compress message content */
  compress?: boolean;
  /** Additional channel options */
  [key: string]: unknown;
}

export interface Channel {
  /** Unique identifier for the channel */
  id: string;
  /** Channel name */
  name: string;
  /** Channel type */
  type: string;
  /** Channel status */
  status: string;
  /** Channel options */
  options?: ChannelOptions;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

export interface CommunicationProtocol {
  /** Protocol name */
  name: string;
  /** Protocol version */
  version: string;
  /** Protocol handler */
  handler: (message: Message) => Promise<void>;
  /** Protocol options */
  options?: Record<string, unknown>;
}

export class WebSocketError extends Error {
  code: string;
  timestamp: Date;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'WebSocketError';
    this.code = code;
    this.timestamp = new Date();
  }
}
