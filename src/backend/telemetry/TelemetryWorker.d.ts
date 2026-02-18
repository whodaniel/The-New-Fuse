import { EventEmitter } from 'events';
/**
 * Events that can be emitted by the TelemetryWorker
 */
export declare enum TelemetryEvent {
    RECEIVED = "telemetry:received",
    PROCESSED = "telemetry:processed",
    STORED = "telemetry:stored",
    ERROR = "telemetry:error",
    BATCH_COMPLETE = "telemetry:batch_complete"
}
/**
 * Types of telemetry data that can be processed
 */
export declare enum TelemetryType {
    TRACE = "trace",
    SPAN = "span",
    GENERATION = "generation",
    TOOL_USAGE = "tool_usage",
    AGENT_STATUS = "agent_status",
    CUSTOM = "custom"
}
/**
 * Base interface for all telemetry data
 */
export interface TelemetryData {
    id: string;
    type: TelemetryType;
    timestamp: number;
    source: string;
    sourceId: string;
    metadata?: Record<string, any>;
}
/**
 * Configuration options for the TelemetryWorker
 */
export interface TelemetryWorkerOptions {
    batchSize?: number;
    flushIntervalMs?: number;
    redisUrl?: string;
    enableLangfuse?: boolean;
    langfusePublicKey?: string;
    langfuseSecretKey?: string;
    langfuseHost?: string;
}
/**
 * TelemetryWorker handles processing and storage of monitoring data
 * from both VS Code extensions and web clients.
 */
export declare class TelemetryWorker extends EventEmitter {
    private redisClient;
    private eventQueue;
    private isProcessing;
    private flushInterval;
    private options;
    private langfuseClient;
    /**
     * Default options for the telemetry worker
     */
    private static readonly DEFAULT_OPTIONS;
    constructor(options?: TelemetryWorkerOptions);
    /**
     * Initialize Redis client
     */
    private initRedisClient;
    /**
     * Initialize Langfuse client
     */
    private initLangfuseClient;
    /**
     * Start the periodic flush interval
     */
    private startPeriodicFlush;
    /**
     * Process a single telemetry event
     */
    process(data: TelemetryData): Promise<void>;
    /**
     * Flush the current batch of events
     */
    flush(): Promise<void>;
    /**
     * Process a batch of telemetry events
     */
    private processBatch;
    /**
     * Process tool usage telemetry events
     */
    private processToolUsageEvents;
}
//# sourceMappingURL=TelemetryWorker.d.ts.map