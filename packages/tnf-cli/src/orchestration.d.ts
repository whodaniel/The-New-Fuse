import { RedisAgentClient } from './RedisAgentClient.js';
export declare class Orchestrator {
    private client;
    constructor(client: RedisAgentClient);
    executeWorkflow(workflowName: string, params?: any): Promise<boolean>;
    private runHealthCheck;
    private runCodeReview;
    private runSelfImprovement;
}
//# sourceMappingURL=orchestration.d.ts.map