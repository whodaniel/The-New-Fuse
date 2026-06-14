import { RedisClientManager } from './redis-client-manager.service';
import { SelfPromptService } from './self-prompt.service';
interface ScheduledProcess {
    processId: string;
    name: string;
    kind: string;
    owner: string;
    status: string;
    registeredAt: number;
    lastHeartbeat: number;
    lastRunAt?: number;
    lastResult?: string;
    intendedIntervalMs?: number;
    intervalSource?: 'producer' | 'metadata' | 'inferred';
    intervalExact?: boolean;
    nextExpectedAt?: number;
    metadata: Record<string, any>;
    stale: boolean;
    heartbeatCount: number;
}
interface Config {
    SUPER_CYCLE_STALE_THRESHOLD: number;
    CHRONOLOGICAL_POLL_INTERVAL_MS: number;
    REDIS_KEYS: {
        STATE: string;
        SUPER_CYCLE: string;
        LOGS: string;
    };
    CHANNELS: string[];
    LOG_DIR: string;
}
type LogFunction = (level: string, category: string, message: string, data?: any) => void;
type GetEnvelopeIdentity = () => {
    agentId: string;
    canonicalEntityId?: string;
    operationalHandle: string;
    runtimeSessionId?: string;
    aliases: string[];
    role: 'orchestrator' | 'worker';
    platform: string;
};
type EmitActivityEvent = (eventType: string, content: string, metadata: Record<string, unknown>) => Promise<void>;
export declare class SuperCycleSchedulerService {
    private config;
    private log;
    private redisClient;
    private selfPromptService;
    private emitActivityEvent;
    private getOrchestratorEnvelopeIdentity;
    scheduledProcesses: Map<string, ScheduledProcess>;
    chronologicalPollingInterval: NodeJS.Timeout | null;
    private repoRoot;
    private dtfCache;
    constructor(config: Config, log: LogFunction, redisClient: RedisClientManager, selfPromptService: SelfPromptService, emitActivityEvent: EmitActivityEvent, getOrchestratorEnvelopeIdentity: GetEnvelopeIdentity);
    startChronologicalPolling(): void;
    pollAndRunChronologicalProcesses(): Promise<void>;
    private loadChronologicalProcessSnapshots;
    private shouldRunChronologicalProcess;
    private executeChronologicalProcess;
    private parseJsonOutput;
    private deriveCadenceIntervalMs;
    private getScheduleSlot;
    private getNextRunAt;
    private normalizeCronExpression;
    private getZonedDateParts;
    private safeTimezone;
    private monthNameMap;
    private weekdayNameMap;
    private matchesCronField;
    private matchesCronSegment;
    private parseCronToken;
    private resolveRepoRoot;
    checkForStaleScheduledProcesses(): void;
    getSuperCycleStats(): {
        total: number;
        healthy: number;
        stale: number;
    };
    persistSuperCycleState(now: number): Promise<void>;
    handleSuperCycleRegistration(msg: any): void;
    handleSuperCycleHeartbeat(msg: any): void;
    handleSuperCycleUnregister(msg: any): void;
    shutdown(): Promise<void>;
    private parseTimestampMs;
    private readCadenceMs;
    private resolveScheduledProcessInterval;
    private resolveNextExpectedAt;
}
export {};
//# sourceMappingURL=super-cycle-scheduler.service.d.ts.map