import { AgentCommunicationBridge } from '../agents/AgentCommunicationBridge.js';
import { MetricsProcessor } from '../security/metricsProcessor.js';
export interface GDesignerConfig {
    baseUrl: string;
    apiKey: string;
    maxRetries: number;
    timeout: number;
    experimentalFeatures: boolean;
}
export declare class GDesignerService {
    private config;
    private readonly communicationBridge;
    private readonly metricsProcessor;
    constructor(config: GDesignerConfig, communicationBridge: AgentCommunicationBridge, metricsProcessor: MetricsProcessor);
    initializeIntegration(): Promise<void>;
}
