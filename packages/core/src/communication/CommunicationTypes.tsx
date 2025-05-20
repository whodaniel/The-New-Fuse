import { z } from 'zod';

export enum MessageType {
  COMMAND = 'COMMAND',
  QUERY = 'QUERY',
  RESPONSE = 'RESPONSE',
  EVENT = 'EVENT',
  ERROR = 'ERROR',
  HEARTBEAT = 'HEARTBEAT'
}

export enum MessagePriority {
  LOW = 0,
  MEDIUM = 1,
  HIGH = 2,
  CRITICAL = 3
}

export enum MessageStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED'
}

export interface MessageMetadata {
  timestamp: Date;
  priority: MessagePriority;
  status: MessageStatus;
  correlationId?: string;
  replyTo?: string;
  ttl?: number;
  retryCount: number;
  maxRetries: number;
  tags: string[];
  trace?: {
    spanId: string;
    parentId?: string;
    startTime: number;
    endTime?: number;
  };
}

export interface Message {
  id: string;
  type: MessageType;
  source: string;
  target: string;
  content: unknown;
  metadata: MessageMetadata;
  error?: Error;
}

export interface Channel {
  id: string;
  name: string;
  type: 'DIRECT' | 'BROADCAST' | 'TOPIC';
  metadata: {
    created: Date;
    lastActive: Date;
    messageCount: number;
    subscribers: number;
    tags: string[];
  };
}

export interface MessageHandler {
  (message: Message): Promise<void>;
}

export interface ChannelStats {
  messageRate: number;
  avgLatency: number;
  errorRate: number;
  activeSubscribers: number;
  queueSize: number;
  lastActive: Date;
}

export const MessageMetadataSchema = z.object({
  timestamp: z.date(), // Added timestamp
  priority: z.nativeEnum(MessagePriority), // Added priority
  status: z.nativeEnum(MessageStatus),
  correlationId: z.string().uuid().optional(),
  replyTo: z.string().optional(),
  ttl: z.number().positive().optional(),
  retryCount: z.number().min(0),
  maxRetries: z.number().min(0),
  tags: z.array(z.string()),
  trace: z.object({
    spanId: z.string(),
    parentId: z.string().optional(),
    startTime: z.number(),
    endTime: z.number().optional()
  }).optional()
});

export const MessageSchema = z.object({
  id: z.string().uuid(), // Added id
  type: z.nativeEnum(MessageType), // Added type
  source: z.string(),
  target: z.string(),
  content: z.any(), // z.unknown() might be more appropriate if content structure is truly unknown
  metadata: MessageMetadataSchema,
  error: z.instanceof(Error).optional(), // Added error
});

export const ChannelSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: z.enum(['DIRECT', 'BROADCAST', 'TOPIC']), // Corrected to z.enum for string literals
  metadata: z.object({
    created: z.date(),
    lastActive: z.date(),
    messageCount: z.number().min(0),
    subscribers: z.number().min(0),
    tags: z.array(z.string()),
  }),
});

export const ChannelStatsSchema = z.object({
  messageRate: z.number(),
  avgLatency: z.number(),
  errorRate: z.number(),
  activeSubscribers: z.number(),
  queueSize: z.number(),
  lastActive: z.date(),
});
