"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelMemoryIsolationService = exports.ChannelMemorySchema = void 0;
const zod_1 = require("zod");
exports.ChannelMemorySchema = zod_1.z.object({
    channelId: zod_1.z.string(),
    agentId: zod_1.z.string(),
    context: zod_1.z.string(),
    facts: zod_1.z.array(zod_1.z.object({
        content: zod_1.z.string(),
        timestamp: zod_1.z.number(),
        source: zod_1.z.string().optional(),
    })).default([]),
    preferences: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).default({}),
    lastUpdated: zod_1.z.number(),
});
class ChannelMemoryIsolationService {
    constructor() {
        this.memories = new Map();
    }
    key(channelId, agentId) {
        return `${channelId}::${agentId}`;
    }
    getMemory(channelId, agentId) {
        const k = this.key(channelId, agentId);
        let mem = this.memories.get(k);
        if (!mem) {
            mem = {
                channelId,
                agentId,
                context: '',
                facts: [],
                preferences: {},
                lastUpdated: Date.now(),
            };
            this.memories.set(k, mem);
        }
        return mem;
    }
    addFact(channelId, agentId, content, source) {
        const mem = this.getMemory(channelId, agentId);
        mem.facts.push({ content, timestamp: Date.now(), source });
        mem.lastUpdated = Date.now();
    }
    setPreference(channelId, agentId, key, value) {
        const mem = this.getMemory(channelId, agentId);
        mem.preferences[key] = value;
        mem.lastUpdated = Date.now();
    }
    setContext(channelId, agentId, context) {
        const mem = this.getMemory(channelId, agentId);
        mem.context = context;
        mem.lastUpdated = Date.now();
    }
    getIsolatedContext(channelId, agentId) {
        const mem = this.getMemory(channelId, agentId);
        const facts = mem.facts.map(f => `- ${f.content}`).join('\n');
        const prefs = Object.entries(mem.preferences)
            .map(([k, v]) => `- ${k}: ${JSON.stringify(v)}`)
            .join('\n');
        return `Channel: #${channelId}\nContext: ${mem.context}\nFacts:\n${facts}\nPreferences:\n${prefs}`;
    }
    clearChannelMemory(channelId, agentId) {
        let cleared = 0;
        for (const [key, mem] of this.memories.entries()) {
            if (mem.channelId === channelId && (!agentId || mem.agentId === agentId)) {
                this.memories.delete(key);
                cleared++;
            }
        }
        return cleared;
    }
    listChannelsForAgent(agentId) {
        return Array.from(this.memories.values())
            .filter(m => m.agentId === agentId)
            .map(m => m.channelId);
    }
}
exports.ChannelMemoryIsolationService = ChannelMemoryIsolationService;
//# sourceMappingURL=channelMemoryIsolation.js.map