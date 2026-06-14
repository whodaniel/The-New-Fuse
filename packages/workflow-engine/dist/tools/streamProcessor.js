"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamProcessor = exports.StreamEventSchema = void 0;
const zod_1 = require("zod");
exports.StreamEventSchema = zod_1.z.object({
    id: zod_1.z.string(),
    type: zod_1.z.enum(['token', 'tool_call', 'tool_result', 'thinking', 'error', 'done', 'metadata']),
    content: zod_1.z.string().optional(),
    toolName: zod_1.z.string().optional(),
    toolArgs: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
    toolResult: zod_1.z.unknown().optional(),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
    timestamp: zod_1.z.number().default(() => Date.now()),
});
class StreamProcessor {
    constructor(config, onFlush) {
        this.buffer = [];
        this.config = {
            maxBufferMs: config?.maxBufferMs ?? 1000,
            maxTokensPerChunk: config?.maxTokensPerChunk ?? 100,
            flushIntervalMs: config?.flushIntervalMs ?? 500,
        };
        this.onFlush = onFlush;
    }
    push(event) {
        this.buffer.push(event);
        if (event.type === 'done' || event.type === 'error') {
            this.flush();
            return;
        }
        const tokenCount = this.buffer
            .filter(e => e.type === 'token' && e.content)
            .reduce((sum, e) => sum + (e.content?.length ?? 0), 0);
        if (tokenCount >= this.config.maxTokensPerChunk) {
            this.flush();
        }
    }
    flush() {
        if (this.buffer.length === 0)
            return [];
        const events = [...this.buffer];
        this.buffer = [];
        if (this.onFlush) {
            this.onFlush(events);
        }
        return events;
    }
    reduceToAnswer(events) {
        const text = events
            .filter(e => e.type === 'token' && e.content)
            .map(e => e.content)
            .join('');
        const toolCalls = events
            .filter(e => e.type === 'tool_call' && e.toolName)
            .map(e => ({
            name: e.toolName,
            args: e.toolArgs ?? {},
            result: events.find(r => r.type === 'tool_result' && r.toolName === e.toolName)?.toolResult,
        }));
        const errors = events
            .filter(e => e.type === 'error' && e.content)
            .map(e => e.content);
        const thinking = events
            .filter(e => e.type === 'thinking' && e.content)
            .map(e => e.content);
        return { text, toolCalls, errors, thinking };
    }
    getBufferSize() {
        return this.buffer.length;
    }
}
exports.StreamProcessor = StreamProcessor;
//# sourceMappingURL=streamProcessor.js.map