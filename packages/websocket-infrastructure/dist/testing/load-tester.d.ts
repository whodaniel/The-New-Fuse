export interface LoadTestConfig {
    url: string;
    numClients: number;
    messageInterval: number;
    duration: number;
    messageSize?: number;
    auth?: {
        token: string;
    };
}
export interface LoadTestResults {
    totalConnections: number;
    successfulConnections: number;
    failedConnections: number;
    totalMessagesSent: number;
    totalMessagesReceived: number;
    averageLatency: number;
    minLatency: number;
    maxLatency: number;
    errors: number;
    duration: number;
    messagesPerSecond: number;
}
export declare class WebSocketLoadTester {
    private readonly config;
    private readonly logger;
    private clients;
    private results;
    private latencies;
    constructor(config: LoadTestConfig);
    run(): Promise<LoadTestResults>;
    private createClients;
    private setupClientHandlers;
    private sendMessages;
    private generateMessage;
    private wait;
    private calculateResults;
    private cleanup;
}
//# sourceMappingURL=load-tester.d.ts.map