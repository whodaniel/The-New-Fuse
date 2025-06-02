import { LLMRegistry } from '../llm/LLMRegistry.js';
import { MonitoringService } from '../monitoring/MonitoringService.js';
import { ErrorRecoveryService } from '../error/ErrorRecoveryService.js';
import { EventEmitter } from 'events';
export interface ProcessedMessage {
    id: string;
    content: string;
    role: system' | 'user' | 'assistant';
    timestamp: Date;
    metadata: Record<string, unknown>;
}
export declare class AgentProcessor extends EventEmitter {
    private readonly llmRegistry;
    private readonly monitoring;
    private readonly errorRecovery;
    private readonly logger;
    private readonly metrics;
    private readonly activeProcessing;
    constructor(llmRegistry: LLMRegistry, monitoring: MonitoringService, errorRecovery: ErrorRecoveryService);
}
