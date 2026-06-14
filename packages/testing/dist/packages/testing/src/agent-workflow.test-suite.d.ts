import { INestApplication } from '@nestjs/common';
interface OptimizedQueueService {
    addJob(type: string, payload: any): Promise<any>;
    getQueueMetrics(): Promise<any>;
}
interface RedisCacheService {
    getAgent(id: string): Promise<any>;
    getStats(): Promise<any>;
}
interface OptimizedWebSocketService {
}
interface OptimizedA2AService {
    registerAgent(agent: any): Promise<boolean>;
    unregisterAgent(id: string): Promise<void>;
    getMetrics(): Promise<any>;
    sendMessage(message: any): Promise<any>;
    broadcastMessage(message: any): Promise<any>;
}
export declare class AgentWorkflowTestSuite {
    private app;
    private queueService;
    private cacheService;
    private websocketService;
    private a2aService;
    private redis;
    private testAgents;
    private testWorkflows;
    private testTasks;
    private testResults;
    private readonly testConfig;
    constructor(app: INestApplication, queueService: OptimizedQueueService, cacheService: RedisCacheService, websocketService: OptimizedWebSocketService, a2aService: OptimizedA2AService);
    runAllTests(): Promise<{
        passed: number;
        failed: number;
        results: any[];
    }>;
    private getTestScenarios;
    private createTestAgent;
    private createTestWorkflow;
    private createTestTask;
    private registerTestAgent;
    private waitForWorkflowCompletion;
    private waitForTaskCompletion;
    private executeLoadTestWorkflow;
    private mapPriorityToNumber;
    private setupTestEnvironment;
    private cleanupTestData;
    private cleanupTestEnvironment;
    runSingleTest(testName: string): Promise<any>;
}
export {};
//# sourceMappingURL=agent-workflow.test-suite.d.ts.map