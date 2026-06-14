import { z } from 'zod';
export declare const AgentEventSchema: z.ZodObject<{
    eventId: z.ZodString;
    eventType: z.ZodEnum<{
        AGENT_INITIALIZED: "AGENT_INITIALIZED";
        AGENT_ACTION_STARTED: "AGENT_ACTION_STARTED";
        AGENT_ACTION_COMPLETED: "AGENT_ACTION_COMPLETED";
        AGENT_ACTION_FAILED: "AGENT_ACTION_FAILED";
        AGENT_STATE_CHANGED: "AGENT_STATE_CHANGED";
        AGENT_MESSAGE_SENT: "AGENT_MESSAGE_SENT";
        AGENT_MESSAGE_RECEIVED: "AGENT_MESSAGE_RECEIVED";
        AGENT_TOOL_INVOKED: "AGENT_TOOL_INVOKED";
        AGENT_TOOL_RESULT: "AGENT_TOOL_RESULT";
        AGENT_HANDOFF_INITIATED: "AGENT_HANDOFF_INITIATED";
        AGENT_HANDOFF_COMPLETED: "AGENT_HANDOFF_COMPLETED";
        AGENT_CONTEXT_UPDATED: "AGENT_CONTEXT_UPDATED";
        AGENT_SHUTDOWN: "AGENT_SHUTDOWN";
    }>;
    agentId: z.ZodString;
    timestamp: z.ZodNumber;
    correlationId: z.ZodOptional<z.ZodString>;
    parentId: z.ZodOptional<z.ZodString>;
    payload: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
export type AgentEvent = z.infer<typeof AgentEventSchema>;
export interface EventStore {
    append(event: AgentEvent): Promise<void>;
    query(filter: {
        agentId?: string;
        eventType?: string;
        from?: number;
        to?: number;
        correlationId?: string;
    }): Promise<AgentEvent[]>;
    getEvent(eventId: string): Promise<AgentEvent | null>;
}
export declare class InMemoryEventStore implements EventStore {
    private events;
    append(event: AgentEvent): Promise<void>;
    query(filter: {
        agentId?: string;
        eventType?: string;
        from?: number;
        to?: number;
        correlationId?: string;
    }): Promise<AgentEvent[]>;
    getEvent(eventId: string): Promise<AgentEvent | null>;
}
export interface EventSourcedState<T> {
    aggregateId: string;
    version: number;
    state: T;
}
export declare abstract class EventSourcedAgentHarness<T> {
    protected abstract initialState: T;
    protected abstract reduce(state: T, event: AgentEvent): T;
    private store;
    private states;
    constructor(store: EventStore);
    getState(agentId: string): Promise<EventSourcedState<T>>;
    applyEvent(event: AgentEvent): Promise<void>;
    replay(agentId: string): Promise<T>;
    getStore(): EventStore;
}
//# sourceMappingURL=EventSourcedHarness.d.ts.map