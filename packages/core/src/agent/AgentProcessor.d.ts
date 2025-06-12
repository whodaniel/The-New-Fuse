import { LLMRegistry } from '../llm/LLMRegistry.tsx';
import { MonitoringService } from '../monitoring/MonitoringService.tsx';
import { ErrorRecoveryService } from '../error/ErrorRecoveryService.tsx';
import { EventEmitter } from 'events';
export interface ProcessedMessage {
    id: string;
    content: string;
    role: system' | user' | assistant';
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
