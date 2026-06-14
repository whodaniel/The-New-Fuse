export declare enum SystemQueueName {
    EMAIL = "email",
    AGENT_EXECUTION = "agent-execution",
    REPORT_GENERATION = "report-generation",
    DATA_SYNC = "data-sync",
    CLEANUP = "cleanup"
}
export declare class SystemQueueService {
    private queues;
    private redisUrl;
    constructor(redisUrl?: string);
    private initializeQueues;
    /**
     * Dispatches a system task to the backend via Redis/Bull
     */
    dispatchTask(queueName: SystemQueueName, type: string, payload: any): Promise<string>;
    /**
     * Helper for Agent Execution
     */
    scheduleAgentExecution(agentId: string, task: string, context: any): Promise<string>;
    close(): Promise<void>;
}
//# sourceMappingURL=system-queue.service.d.ts.map