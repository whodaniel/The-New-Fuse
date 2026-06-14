import { Message } from "./communication.js";
import { Priority } from "./core/enums.js";
export interface AgentMessage extends Message {
    /** Agent ID that sent the message */
    agentId: string;
    /** Optional recipient agent ID */
    recipientId?: string;
    /** Message payload */
    payload: unknown;
    /** Message priority */
    priority: Priority;
}
export interface AgentResponse {
    /** Unique response ID */
    id: string;
    /** Original message ID this is responding to */
    messageId: string;
    /** Agent ID that sent the response */
    agentId: string;
    /** Response status */
    status: "success" | "error" | "pending";
    /** Response data */
    data?: unknown;
    /** Error information if status is error */
    error?: {
        code: string;
        message: string;
        details?: unknown;
    };
    /** Timestamp when response was created */
    timestamp: Date;
}
export declare class PriorityQueue<T> {
    private items;
    enqueue(item: T, priority?: number): void;
    dequeue(): T | undefined;
    peek(): T | undefined;
    isEmpty(): boolean;
    size(): number;
    clear(): void;
}
//# sourceMappingURL=agent-communication.d.ts.map