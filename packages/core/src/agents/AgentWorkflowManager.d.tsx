import { AgentCommunicationBridge } from './AgentCommunicationBridge.js';
import { GDesignerService } from '../integrations/GDesignerService.js';
import { MetricsProcessor } from '../security/metricsProcessor.js';
export interface WorkflowConfig {
    maxConcurrentTasks: number;
    taskTimeout: number;
    retryStrategy: {
        maxAttempts: number;
        backoffMultiplier: number;
        initialDelay: number;
    };
}
export declare class AgentWorkflowManager {
    private config;
    private readonly communicationBridge;
    private readonly gdesignerService;
    private readonly metricsProcessor;
    private activeWorkflows;
    constructor(config: WorkflowConfig, communicationBridge: AgentCommunicationBridge, gdesignerService: GDesignerService, metricsProcessor: MetricsProcessor);
    startWorkflow(): Promise<void>;
}
