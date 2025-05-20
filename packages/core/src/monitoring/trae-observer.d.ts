export declare class TraeObserver {
    private intelligence;
    private logger;
    private llmInteractions;
    private apiMetrics;
    constructor();
    private initializeLLMMonitoring;
    private handleLLMRequest;
    private handleLLMResponse;
    private handleLLMError;
    getLLMMetrics(): unknown;
}
