interface AgentMessage {
    id: string;
    from: string;
    to: string;
    type: string;
    content: Record<string, unknown>;
    timestamp: Date;
    priority: number;
}
interface PriorityQueue<T> {
    enqueue(item: T, priority: number): void;
    dequeue(): T | undefined;
    size(): number;
}
interface CollaborationContext {
    sharedState: {
        currentPhase: 'analysis' | 'enhancement' | 'implementation' | 'testing';
        activeTask: string;
        augment: string[];
        trae: string[];
    };
    messageQueue: PriorityQueue<AgentMessage>;
    lastSyncTime: Date;
}
export declare class CollaborationContextManager {
    private context;
    constructor();
    getContext(): CollaborationContext;
    updatePhase(phase: 'analysis' | 'enhancement' | 'implementation' | 'testing'): void;
    setActiveTask(task: string): void;
    addAgentTask(agent: 'augment' | 'trae', task: string): void;
    sendMessage(message: AgentMessage): void;
    receiveMessage(): AgentMessage | undefined;
    getQueueSize(): number;
}
export { AgentMessage, PriorityQueue, CollaborationContext };
//# sourceMappingURL=collaboration-context.d.ts.map