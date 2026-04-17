/**
 * Goose Protocol Adapter
 *
 * Bridges Goose CLI/headless interaction envelopes to TNF A2A relay messages.
 */
export class GooseAdapter {
    constructor(logger) {
        this.name = 'goose-cli';
        this.version = '1.0.0';
        this.supportedProtocols = ['goose-cli-v1.0', 'a2a-v2.0'];
        this.logger = logger;
    }
    canTranslate(from, to) {
        return this.supportedProtocols.includes(from) && this.supportedProtocols.includes(to);
    }
    async translate(message, sourceProtocol, targetProtocol) {
        if (sourceProtocol === 'goose-cli-v1.0' && targetProtocol === 'a2a-v2.0') {
            return this.gooseToA2A(message);
        }
        if (sourceProtocol === 'a2a-v2.0' && targetProtocol === 'goose-cli-v1.0') {
            return this.a2aToGoose(message);
        }
        throw new Error(`Unsupported translation: ${sourceProtocol} -> ${targetProtocol}`);
    }
    gooseToA2A(message) {
        const payload = message.payload || {};
        const event = String(payload.event || payload.type || payload.action || '').toLowerCase();
        if (event === 'tool_call' || event === 'tool') {
            return this.withMetadata(message, {
                ...message,
                type: 'FUNCTION_CALL',
                payload: {
                    function: payload.toolName || payload.name,
                    parameters: payload.arguments || payload.params || {},
                    callId: payload.callId || payload.id,
                    traceId: payload.traceId || payload.sessionId,
                },
            }, 'a2a-v2.0');
        }
        if (event === 'tool_result' || event === 'tool_response') {
            return this.withMetadata(message, {
                ...message,
                type: 'TOOL_RESPONSE',
                payload: {
                    success: payload.success !== false,
                    result: payload.result ?? payload.output ?? null,
                    error: payload.error,
                    callId: payload.callId || payload.id,
                },
            }, 'a2a-v2.0');
        }
        if (event === 'status' || event === 'agent_status') {
            return this.withMetadata(message, {
                ...message,
                type: 'AGENT_STATUS',
                payload: {
                    status: payload.status || 'running',
                    step: payload.step || payload.stage,
                    detail: payload.detail || payload.message || '',
                },
            }, 'a2a-v2.0');
        }
        return this.withMetadata(message, {
            ...message,
            type: 'ASSISTANT_MESSAGE',
            payload: {
                content: payload.content || payload.message || '',
                role: payload.role || 'assistant',
                artifacts: payload.artifacts || [],
            },
        }, 'a2a-v2.0');
    }
    a2aToGoose(message) {
        const payload = message.payload || {};
        if (message.type === 'FUNCTION_CALL') {
            return this.withMetadata(message, {
                ...message,
                payload: {
                    event: 'tool_call',
                    toolName: payload.function,
                    arguments: payload.parameters || {},
                    callId: payload.callId || payload.toolCallId,
                },
            }, 'goose-cli-v1.0');
        }
        if (message.type === 'TOOL_RESPONSE') {
            return this.withMetadata(message, {
                ...message,
                payload: {
                    event: 'tool_result',
                    success: payload.success !== false,
                    result: payload.result ?? null,
                    error: payload.error,
                    callId: payload.callId || payload.toolCallId,
                },
            }, 'goose-cli-v1.0');
        }
        if (message.type === 'AGENT_STATUS') {
            return this.withMetadata(message, {
                ...message,
                payload: {
                    event: 'status',
                    status: payload.status || 'running',
                    stage: payload.step || payload.stage,
                    detail: payload.detail || '',
                },
            }, 'goose-cli-v1.0');
        }
        if (!payload.content && !payload.message) {
            this.logger.debug('Translating generic A2A payload into Goose message envelope');
        }
        return this.withMetadata(message, {
            ...message,
            payload: {
                event: 'message',
                role: payload.role || 'assistant',
                message: payload.content || payload.message || '',
            },
        }, 'goose-cli-v1.0');
    }
    withMetadata(message, translated, protocol) {
        return {
            ...translated,
            metadata: {
                ...(message.metadata || {}),
                protocol,
                originalProtocol: message.metadata?.protocol || null,
                translatedAt: new Date().toISOString(),
            },
        };
    }
}
//# sourceMappingURL=GooseAdapter.js.map