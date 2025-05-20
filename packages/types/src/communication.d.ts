import { Priority } from './core/enums.js';
export declare enum MessageType {
    COMMAND = "COMMAND",
    RESPONSE = "RESPONSE",
    ERROR = "ERROR",
    EVENT = "EVENT",
    NOTIFICATION = "NOTIFICATION",
    REQUEST = "REQUEST",
    STATUS = "STATUS",
    LOG = "LOG",
    METRIC = "METRIC",
    ALERT = "ALERT",
    HEARTBEAT = "HEARTBEAT"
}
export interface Message {
    id: string;
    type: MessageType;
    content: unknown;
    priority?: Priority;
    timestamp: Date;
    source: string;
    target?: string;
    correlationId?: string;
    metadata?: Record<string, unknown>;
}
export interface ChannelOptions {
    persistent?: boolean;
    compress?: boolean;
    [key: string]: unknown;
}
export interface Channel {
    id: string;
    name: string;
    type: string;
    status: string;
    options?: ChannelOptions;
    metadata?: Record<string, unknown>;
}
export interface CommunicationProtocol {
    name: string;
    version: string;
    handler: (message: Message) => Promise<void>;
    options?: Record<string, unknown>;
}
export declare class WebSocketError extends Error {
    code: string;
    timestamp: Date;
    constructor(message: string, code: string);
}
//# sourceMappingURL=communication.d.ts.map