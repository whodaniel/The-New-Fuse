declare const CONFIG: {
    TASK_POLL_INTERVAL_MS: number;
    TASK_QUEUE_COOLDOWN_MS: number;
    TASK_QUEUE_BATCH_SIZE: number;
    LEDGER_API_BASE: string;
    REDIS_KEYS: {
        TASKS: string;
        TASKS_REALTIME: string;
        TASKS_PLANNING: string;
        SUGGESTIONS: string;
        CHANGELOG: string;
        KANBAN: string;
        LOGS: string;
    };
};
export declare class TaskSchedulerService {
    private config;
    private logger;
    private redisClient;
    private emitActivityEvent;
    private taskPollingInterval;
    private recentQueuedTasks;
    private taskPollFailureCount;
    constructor(config: typeof CONFIG, logger: (level: string, category: string, message: string, data?: any) => void, redisClient: any, // RedisClientManager instance
    emitActivityEvent: (eventType: string, content: string, metadata: Record<string, unknown>) => Promise<void>);
    startTaskPolling(): void;
    stopTaskPolling(): void;
    pruneTasks(now: number, maxAgeMs: number): number;
    private taskPriorityWeight;
    private itineraryLaneWeight;
    private horizonWeight;
    private isRealtimeDispatchCandidate;
    private targetQueueForTask;
    private taskDispatchScore;
    private fetchLedgerTasks;
    private pollAndQueueTasks;
}
export {};
//# sourceMappingURL=task-scheduler.service.d.ts.map