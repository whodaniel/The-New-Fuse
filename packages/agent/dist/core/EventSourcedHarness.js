"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventSourcedAgentHarness = exports.InMemoryEventStore = exports.AgentEventSchema = void 0;
const zod_1 = require("zod");
exports.AgentEventSchema = zod_1.z.object({
    eventId: zod_1.z.string(),
    eventType: zod_1.z.enum([
        'AGENT_INITIALIZED',
        'AGENT_ACTION_STARTED',
        'AGENT_ACTION_COMPLETED',
        'AGENT_ACTION_FAILED',
        'AGENT_STATE_CHANGED',
        'AGENT_MESSAGE_SENT',
        'AGENT_MESSAGE_RECEIVED',
        'AGENT_TOOL_INVOKED',
        'AGENT_TOOL_RESULT',
        'AGENT_HANDOFF_INITIATED',
        'AGENT_HANDOFF_COMPLETED',
        'AGENT_CONTEXT_UPDATED',
        'AGENT_SHUTDOWN',
    ]),
    agentId: zod_1.z.string(),
    timestamp: zod_1.z.number(),
    correlationId: zod_1.z.string().optional(),
    parentId: zod_1.z.string().optional(),
    payload: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
});
class InMemoryEventStore {
    constructor() {
        this.events = [];
    }
    async append(event) {
        this.events.push(event);
    }
    async query(filter) {
        return this.events.filter(e => {
            if (filter.agentId && e.agentId !== filter.agentId)
                return false;
            if (filter.eventType && e.eventType !== filter.eventType)
                return false;
            if (filter.from && e.timestamp < filter.from)
                return false;
            if (filter.to && e.timestamp > filter.to)
                return false;
            if (filter.correlationId && e.correlationId !== filter.correlationId)
                return false;
            return true;
        });
    }
    async getEvent(eventId) {
        return this.events.find(e => e.eventId === eventId) ?? null;
    }
}
exports.InMemoryEventStore = InMemoryEventStore;
class EventSourcedAgentHarness {
    constructor(store) {
        this.states = new Map();
        this.store = store;
    }
    async getState(agentId) {
        const cached = this.states.get(agentId);
        if (cached)
            return cached;
        const events = await this.store.query({ agentId });
        let state = this.initialState;
        for (const event of events) {
            state = this.reduce(state, event);
        }
        const result = {
            aggregateId: agentId,
            version: events.length,
            state,
        };
        this.states.set(agentId, result);
        return result;
    }
    async applyEvent(event) {
        await this.store.append(event);
        const current = this.states.get(event.agentId) ?? {
            aggregateId: event.agentId,
            version: 0,
            state: this.initialState,
        };
        this.states.set(event.agentId, {
            aggregateId: event.agentId,
            version: current.version + 1,
            state: this.reduce(current.state, event),
        });
    }
    async replay(agentId) {
        this.states.delete(agentId);
        const result = await this.getState(agentId);
        return result.state;
    }
    getStore() {
        return this.store;
    }
}
exports.EventSourcedAgentHarness = EventSourcedAgentHarness;
//# sourceMappingURL=EventSourcedHarness.js.map