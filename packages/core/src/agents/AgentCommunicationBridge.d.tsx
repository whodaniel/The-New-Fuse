import { MetricsProcessor } from '../security/metricsProcessor.js';
export interface AgentMessage {
    id: string;
    type: task_request' | 'task_response' | 'status_update' | 'error';
    timestamp: number;
    sender: string;
    recipient: string;
    payload: unknown;
    metadata: {
        priority: low' | 'medium' | 'high';
        timeout?: number;
        retryCount?: number;
    };
}
export declare class AgentCommunicationBridge {
    private readonly circuitBreaker;
    private readonly metricsProcessor;
    private readonly messageHandlers;
    constructor(metricsProcessor: MetricsProcessor);
    sendMessage(): Promise<void>;
}
