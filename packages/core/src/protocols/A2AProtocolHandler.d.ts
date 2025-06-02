import { EventEmitter2 } from '@nestjs/event-emitter';
import { AgentCardService } from '../services/AgentCardService.js';
export interface A2AMessageContent {
    task?: string;
    parameters?: Record<string, unknown>;
    result?: unknown;
    error?: string;
    [key: string]: unknown;
}
export interface A2AMessage {
    header: {
        id: string;
        type: string;
        version: string;
        priority: 'low' | 'medium' | 'high';
        source: string;
        target?: string;
    };
    body: {
        content: A2AMessageContent;
        metadata: {
            sent_at: number;
            timeout?: number;
            retries?: number;
            trace_id?: string;
        };
    };
}
export declare class A2AProtocolHandler {
    private eventEmitter;
    private agentCardService;
    private logger;
    private messageHandlers;
    constructor(eventEmitter: EventEmitter2, agentCardService: AgentCardService);
    handleMessage(message: A2AMessage): Promise<void>;
    registerHandler(type: string, handler: (message: A2AMessage) => Promise<void>): void;
    private validateMessage;
}
