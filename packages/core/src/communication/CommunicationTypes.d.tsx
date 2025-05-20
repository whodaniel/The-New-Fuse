import { z } from 'zod';
export declare enum MessageType {
    COMMAND = "COMMAND",
    QUERY = "QUERY",
    RESPONSE = "RESPONSE",
    EVENT = "EVENT",
    ERROR = "ERROR",
    HEARTBEAT = "HEARTBEAT"
}
export declare enum MessagePriority {
    LOW = 0,
    MEDIUM = 1,
    HIGH = 2,
    CRITICAL = 3
}
export declare enum MessageStatus {
    PENDING = "PENDING",
    SENT = "SENT",
    DELIVERED = "DELIVERED",
    READ = "READ",
    FAILED = "FAILED"
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
    type: 'DIRECT' | 'BROADCAST' | 'TOPIC'; // Corrected string literal type
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
export declare const MessageMetadataSchema: z.ZodObject<{
    timestamp: z.ZodDate;
    priority: z.ZodNativeEnum<typeof MessagePriority>;
    status: z.ZodNativeEnum<typeof MessageStatus>;
    correlationId: z.ZodOptional<z.ZodString>;
    replyTo: z.ZodOptional<z.ZodString>;
    ttl: z.ZodOptional<z.ZodNumber>;
    retryCount: z.ZodNumber;
    maxRetries: z.ZodNumber;
    tags: z.ZodArray<z.ZodString, "many">; // Corrected to ZodArray<ZodString>
    trace: z.ZodOptional<z.ZodObject<{
        spanId: z.ZodString;
        parentId: z.ZodOptional<z.ZodString>;
        startTime: z.ZodNumber;
        endTime: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, { spanId: string; startTime: number; parentId?: string | undefined; endTime?: number | undefined; }, { spanId: string; startTime: number; parentId?: string | undefined; endTime?: number | undefined; }>>;
}, "strip", z.ZodTypeAny, { timestamp: Date; priority: MessagePriority; status: MessageStatus; retryCount: number; maxRetries: number; tags: string[]; correlationId?: string | undefined; replyTo?: string | undefined; ttl?: number | undefined; trace?: { spanId: string; startTime: number; parentId?: string | undefined; endTime?: number | undefined; } | undefined; }, { timestamp: Date; priority: MessagePriority; status: MessageStatus; retryCount: number; maxRetries: number; tags: string[]; correlationId?: string | undefined; replyTo?: string | undefined; ttl?: number | undefined; trace?: { spanId: string; startTime: number; parentId?: string | undefined; endTime?: number | undefined; } | undefined; }>;

export declare const MessageSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodNativeEnum<typeof MessageType>;
    source: z.ZodString;
    target: z.ZodString;
    content: z.ZodUnknown;
    metadata: typeof MessageMetadataSchema; // Refer to the MessageMetadataSchema
    error: z.ZodOptional<z.ZodError>; // Assuming error is a ZodError, adjust if it's a different error type
}, "strip", z.ZodTypeAny, { id: string; type: MessageType; source: string; target: string; content?: unknown; metadata: { timestamp: Date; priority: MessagePriority; status: MessageStatus; retryCount: number; maxRetries: number; tags: string[]; correlationId?: string | undefined; replyTo?: string | undefined; ttl?: number | undefined; trace?: { spanId: string; startTime: number; parentId?: string | undefined; endTime?: number | undefined; } | undefined; }; error?: z.ZodError<any> | undefined; }, { id: string; type: MessageType; source: string; target: string; content?: unknown; metadata: { timestamp: Date; priority: MessagePriority; status: MessageStatus; retryCount: number; maxRetries: number; tags: string[]; correlationId?: string | undefined; replyTo?: string | undefined; ttl?: number | undefined; trace?: { spanId: string; startTime: number; parentId?: string | undefined; endTime?: number | undefined; } | undefined; }; error?: z.ZodError<any> | undefined; }>;

export declare const ChannelSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    type: z.ZodEnum<['DIRECT', 'BROADCAST', 'TOPIC']>;
    metadata: z.ZodObject<{
        created: z.ZodDate;
        lastActive: z.ZodDate;
        messageCount: z.ZodNumber;
        subscribers: z.ZodNumber;
        tags: z.ZodArray<z.ZodString, "many">; // Corrected to ZodArray<ZodString>
    }, "strip", z.ZodTypeAny, { created: Date; lastActive: Date; messageCount: number; subscribers: number; tags: string[]; }, { created: Date; lastActive: Date; messageCount: number; subscribers: number; tags: string[]; }>;
}, "strip", z.ZodTypeAny, { id: string; name: string; type: "DIRECT" | "BROADCAST" | "TOPIC"; metadata: { created: Date; lastActive: Date; messageCount: number; subscribers: number; tags: string[]; }; }, { id: string; name: string; type: "DIRECT" | "BROADCAST" | "TOPIC"; metadata: { created: Date; lastActive: Date; messageCount: number; subscribers: number; tags: string[]; }; }>;

