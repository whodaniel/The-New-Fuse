"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelemetryWorker = exports.TelemetryType = exports.TelemetryEvent = void 0;
const events_1 = require("events");
const redis_1 = require("redis");
/**
 * Events that can be emitted by the TelemetryWorker
 */
var TelemetryEvent;
(function (TelemetryEvent) {
    TelemetryEvent["RECEIVED"] = "telemetry:received";
    TelemetryEvent["PROCESSED"] = "telemetry:processed";
    TelemetryEvent["STORED"] = "telemetry:stored";
    TelemetryEvent["ERROR"] = "telemetry:error";
    TelemetryEvent["BATCH_COMPLETE"] = "telemetry:batch_complete";
})(TelemetryEvent || (exports.TelemetryEvent = TelemetryEvent = {}));
/**
 * Types of telemetry data that can be processed
 */
var TelemetryType;
(function (TelemetryType) {
    TelemetryType["TRACE"] = "trace";
    TelemetryType["SPAN"] = "span";
    TelemetryType["GENERATION"] = "generation";
    TelemetryType["TOOL_USAGE"] = "tool_usage";
    TelemetryType["AGENT_STATUS"] = "agent_status";
    TelemetryType["CUSTOM"] = "custom";
})(TelemetryType || (exports.TelemetryType = TelemetryType = {}));
/**
 * TelemetryWorker handles processing and storage of monitoring data
 * from both VS Code extensions and web clients.
 */
class TelemetryWorker extends events_1.EventEmitter {
    redisClient = null;
    eventQueue = [];
    isProcessing = false;
    flushInterval = null;
    options;
    langfuseClient = null;
    /**
     * Default options for the telemetry worker
     */
    static DEFAULT_OPTIONS = {
        batchSize: 100,
        flushIntervalMs: 5000,
        redisUrl: 'redis://localhost:6379',
        enableLangfuse: false,
        langfusePublicKey: '',
        langfuseSecretKey: '',
        langfuseHost: 'https://langfuse.com'
    };
    constructor(options = {}) {
        super();
        this.options = { ...TelemetryWorker.DEFAULT_OPTIONS, ...options };
        // Initialize Redis client
        this.initRedisClient();
        // Initialize Langfuse if enabled
        if (this.options.enableLangfuse) {
            this.initLangfuseClient();
        }
        // Start periodic flush
        this.startPeriodicFlush();
    }
    /**
     * Initialize Redis client
     */
    async initRedisClient() {
        try {
            this.redisClient = (0, redis_1.createClient)({ url: this.options.redisUrl });
            this.redisClient.on('error', (err) => {
                console.error('[TelemetryWorker] Redis error:', err);
                this.emit(TelemetryEvent.ERROR, { source: 'redis', error: err });
            });
            await this.redisClient.connect();
            console.log('[TelemetryWorker] Connected to Redis');
        }
        catch (error) {
            console.error('[TelemetryWorker] Failed to connect to Redis:', error);
            this.emit(TelemetryEvent.ERROR, { source: 'redis_connection', error });
        }
    }
    /**
     * Initialize Langfuse client
     */
    async initLangfuseClient() {
        try {
            // Dynamically import Langfuse
            const { Langfuse } = await import('langfuse');
            this.langfuseClient = new Langfuse({
                publicKey: this.options.langfusePublicKey,
                secretKey: this.options.langfuseSecretKey,
                host: this.options.langfuseHost,
                flushAt: this.options.batchSize,
                flushInterval: this.options.flushIntervalMs
            });
            console.log('[TelemetryWorker] Langfuse integration initialized');
        }
        catch (error) {
            console.error('[TelemetryWorker] Failed to initialize Langfuse:', error);
            this.emit(TelemetryEvent.ERROR, { source: 'langfuse_init', error });
        }
    }
    /**
     * Start the periodic flush interval
     */
    startPeriodicFlush() {
        this.flushInterval = setInterval(() => {
            this.flush();
        }, this.options.flushIntervalMs);
    }
    /**
     * Process a single telemetry event
     */
    async process(data) {
        // Add to in-memory queue
        this.eventQueue.push(data);
        this.emit(TelemetryEvent.RECEIVED, { data });
        // Also queue in Redis for persistence
        if (this.redisClient) {
            try {
                const key = `telemetry:${data.type}:${data.id}`;
                await this.redisClient.set(key, JSON.stringify(data));
                await this.redisClient.lPush('telemetry:queue', key);
            }
            catch (error) {
                console.error('[TelemetryWorker] Redis error while queuing event:', error);
                this.emit(TelemetryEvent.ERROR, { source: 'redis_queue', error, data });
            }
        }
        // If we've reached batch size, flush
        if (this.eventQueue.length >= this.options.batchSize) {
            await this.flush();
        }
    }
    /**
     * Flush the current batch of events
     */
    async flush() {
        if (this.isProcessing || this.eventQueue.length === 0) {
            return;
        }
        this.isProcessing = true;
        try {
            const batch = [...this.eventQueue];
            this.eventQueue = [];
            // Process the batch
            await this.processBatch(batch);
            // Forward to Langfuse if enabled
            if (this.langfuseClient && this.options.enableLangfuse) {
                await this.sendToLangfuse(batch);
            }
            this.emit(TelemetryEvent.BATCH_COMPLETE, { count: batch.length });
        }
        catch (error) {
            console.error('[TelemetryWorker] Error processing batch:', error);
            this.emit(TelemetryEvent.ERROR, { source: 'batch_processing', error });
        }
        finally {
            this.isProcessing = false;
        }
    }
    /**
     * Process a batch of telemetry events
     */
    async processBatch(batch) {
        // Group by type for efficient processing
        const grouped = batch.reduce((acc, event) => {
            acc[event.type] = acc[event.type] || [];
            acc[event.type].push(event);
            return acc;
        }, {});
        // Process each type of event
        for (const [type, events] of Object.entries(grouped)) {
            switch (type) {
                case TelemetryType.TOOL_USAGE:
                    await this.processToolUsageEvents(events);
                    break;
                case TelemetryType.AGENT_STATUS:
                    await this.processAgentStatusEvents(events);
                    break;
                case TelemetryType.TRACE:
                case TelemetryType.SPAN:
                case TelemetryType.GENERATION:
                    await this.processTraceEvents(events, type);
                    break;
                default:
                    await this.processGenericEvents(events);
            }
        }
    }
    /**
     * Process tool usage telemetry events
     */
    async processToolUsageEvents(events) {
        // Store in database, update aggregates, etc.
        console.log(`[TelemetryWorker] Processing ${events.length} tool usage events`);
        // Example: update tool usage metrics in Redis
        if (this.redisClient) {
            for (const event of events) {
                try {
                    const toolId = event.metadata?.toolId;
                    const agentId = event.sourceId;
                    if (toolId) {
                        // Increment tool usage count
                        await this.redisClient.incr(`metrics:tool:${toolId}:count`);
                        // Increment agent-specific tool usage
                        await this.redisClient.incr(`metrics:agent:${agentId}:tool:${toolId}:count`);
                        // Add to recent tools used
                        await this.redisClient.lPush(`metrics:recent_tools`, JSON.stringify({
                            toolId,
                            agentId,
                            timestamp: event.timestamp
                        }));
                        // Trim the recent tools list
                        await this.redisClient.lTrim(`metrics:recent_tools`, 0, 999);
                    }
                }
                catch (error) {
                    console.error('[TelemetryWorker] Error updating tool metrics:', error);
                }
            }
        }
        this.emit(TelemetryEvent.PROCESSED, { type: TelemetryType.TOOL_USAGE, count: events.length });
    }
    /**
     * Process agent status telemetry events
     */
    async processAgentStatusEvents(events) {
        console.log(`[TelemetryWorker] Processing ${events.length} agent status events`);
        // Process agent status updates (active, idle, error)
        if (this.redisClient) {
            for (const event of events) {
                try {
                    const agentId = event.sourceId;
                    const status = event.metadata?.status;
                    if (status) {
                        // Update agent status
                        await this.redisClient.hSet(`agents:status`, agentId, status);
                        // Add to status history
                        await this.redisClient.lPush(`agents:${agentId}:status_history`, JSON.stringify({
                            status,
                            timestamp: event.timestamp
                        }));
                        // Trim history
                        await this.redisClient.lTrim(`agents:${agentId}:status_history`, 0, 99);
                    }
                }
                catch (error) {
                    console.error('[TelemetryWorker] Error updating agent status:', error);
                }
            }
        }
        this.emit(TelemetryEvent.PROCESSED, { type: TelemetryType.AGENT_STATUS, count: events.length });
    }
    /**
     * Process trace-related telemetry events
     */
    async processTraceEvents(events, type) {
        console.log(`[TelemetryWorker] Processing ${events.length} ${type} events`);
        // Store trace data (traces, spans, generations)
        if (this.redisClient) {
            for (const event of events) {
                try {
                    // Store the full event
                    const key = `${type}:${event.id}`;
                    await this.redisClient.set(key, JSON.stringify(event));
                    // Update indexes
                    await this.redisClient.zAdd(`index:${type}:by_time`, {
                        score: event.timestamp,
                        value: event.id
                    });
                    // Update source index
                    await this.redisClient.zAdd(`index:${type}:by_source:${event.source}`, {
                        score: event.timestamp,
                        value: event.id
                    });
                }
                catch (error) {
                    console.error(`[TelemetryWorker] Error storing ${type} event:`, error);
                }
            }
        }
        this.emit(TelemetryEvent.PROCESSED, { type, count: events.length });
    }
    /**
     * Process generic telemetry events
     */
    async processGenericEvents(events) {
        // Basic processing for unknown event types
        console.log(`[TelemetryWorker] Processing ${events.length} generic events`);
        this.emit(TelemetryEvent.PROCESSED, { type: 'generic', count: events.length });
    }
    /**
     * Send batch to Langfuse
     */
    async sendToLangfuse(batch) {
        if (!this.langfuseClient)
            return;
        try {
            for (const event of batch) {
                switch (event.type) {
                    case TelemetryType.TRACE:
                        this.langfuseClient.trace({
                            id: event.id,
                            name: event.metadata?.name || 'Unnamed Trace',
                            metadata: event.metadata
                        });
                        break;
                    case TelemetryType.SPAN:
                        if (event.metadata?.traceId) {
                            this.langfuseClient.getTrace(event.metadata.traceId).span({
                                id: event.id,
                                name: event.metadata?.name || 'Unnamed Span',
                                metadata: event.metadata
                            });
                        }
                        break;
                    case TelemetryType.GENERATION:
                        if (event.metadata?.traceId) {
                            this.langfuseClient.getTrace(event.metadata.traceId).generation({
                                id: event.id,
                                name: event.metadata?.name || `${event.metadata?.provider || 'Unknown'} Generation`,
                                startTime: new Date(event.timestamp),
                                endTime: new Date(event.metadata?.endTimestamp || event.timestamp),
                                model: event.metadata?.model,
                                modelParameters: event.metadata?.parameters,
                                prompt: event.metadata?.prompt,
                                completion: event.metadata?.completion,
                                usage: event.metadata?.usage,
                                metadata: event.metadata
                            });
                        }
                        break;
                    case TelemetryType.TOOL_USAGE:
                        if (event.metadata?.traceId) {
                            this.langfuseClient.getTrace(event.metadata.traceId).span({
                                id: event.id,
                                name: `Tool: ${event.metadata?.toolId || 'Unknown Tool'}`,
                                metadata: {
                                    toolId: event.metadata?.toolId,
                                    agentId: event.sourceId,
                                    executionTime: event.metadata?.executionTime,
                                    success: event.metadata?.success,
                                    ...event.metadata
                                }
                            });
                        }
                        break;
                }
            }
            // Force flush to Langfuse
            await this.langfuseClient.flush();
        }
        catch (error) {
            console.error('[TelemetryWorker] Error sending to Langfuse:', error);
            this.emit(TelemetryEvent.ERROR, { source: 'langfuse', error });
        }
    }
    /**
     * Shutdown the worker
     */
    async shutdown() {
        // Clear interval
        if (this.flushInterval) {
            clearInterval(this.flushInterval);
        }
        // Flush any remaining events
        await this.flush();
        // Disconnect Redis
        if (this.redisClient) {
            await this.redisClient.disconnect();
        }
        // Flush langfuse
        if (this.langfuseClient) {
            await this.langfuseClient.flush();
        }
        console.log('[TelemetryWorker] Shutdown complete');
    }
}
exports.TelemetryWorker = TelemetryWorker;
//# sourceMappingURL=TelemetryWorker.js.map