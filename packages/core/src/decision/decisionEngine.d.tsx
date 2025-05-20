export declare class DecisionEngine {
    private decisionHistory;
    private implementationQueue;
    private successMetrics;
    constructor();
    evaluateInnovation(): Promise<void>;
}
