export interface AgentMessage {
    id: string;
    type: string;
    content: string;
    sender: string;
    recipient?: string;
    timestamp: Date;
    priority?: 'low' | 'medium' | 'high';
    metadata?: Record<string, any>;
}
export interface AgentResponse {
    id: string;
    messageId: string;
    content: string;
    sender: string;
    timestamp: Date;
    success: boolean;
    error?: string;
    metadata?: Record<string, any>;
}
export declare class PriorityQueue<T> {
    private items;
    enqueue(item: T, priority?: number): void;
    dequeue(): T | undefined;
    isEmpty(): boolean;
    size(): number;
}
//# sourceMappingURL=messaging.d.ts.map