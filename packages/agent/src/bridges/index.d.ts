/**
 * Bridges module exports
 * Provides communication bridges between different agent systems
 */
import { EventEmitter } from 'events';
export declare enum MessageType {
    COMMAND = "command",
    RESPONSE = "response",
    ERROR = "error",
    EVENT = "event",
    NOTIFICATION = "notification",
    REQUEST = "request",
    STATUS = "status",
    LOG = "log",
    METRIC = "metric",
    ALERT = "alert",
    HEARTBEAT = "heartbeat",
    INFO = "info",
    WARNING = "warning",
    TEXT = "text"
}
export declare enum Priority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare abstract class BaseBridge extends EventEmitter {
    protected name: string;
    protected isConnected: boolean;
    constructor(name: string);
    abstract connect(): Promise<void>;
    abstract disconnect(): Promise<void>;
    abstract sendMessage(message: Record<string, unknown>, messageType: MessageType, priority?: Priority): Promise<void>;
    get connected(): boolean;
    get bridgeName(): string;
}
export * from './cline_bridge';
export * from './types';
//# sourceMappingURL=index.d.ts.map