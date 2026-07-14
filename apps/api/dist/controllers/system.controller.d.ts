import { DatabaseService } from '@the-new-fuse/database';
import { CacheService } from '../cache/cache.service';
import { A2AMessageBrokerService } from '../modules/agency-hub/services/a2a-message-broker.service';
import { AgentSwarmOrchestrationService } from '../modules/agency-hub/services/agent-swarm-orchestration.service';
import { PromptTemplatesService } from '../services/prompt-templates.service';
export declare class SystemController {
    private readonly swarmService;
    private readonly brokerService;
    private readonly promptService;
    private readonly cacheService;
    private readonly db;
    /** Logger instance for system controller operations */
    private logger;
    private readonly masterClockStateKey;
    private readonly projectedSuperCycleContract;
    constructor(swarmService: AgentSwarmOrchestrationService, brokerService: A2AMessageBrokerService, promptService: PromptTemplatesService, cacheService: CacheService, db: DatabaseService);
    getMasterClockTelemetry(): Promise<{
        status: string;
        timestamp: string;
        source: string;
        orchestrator: {
            sessionId: any;
            isActive: boolean;
            lastHeartbeat: any;
            ageMs: number | null;
            heartbeatIntervalMs: number;
            stallThresholdMs: number;
            stats: any;
            superCycleSummary: {
                total: number;
                healthy: number;
                stale: number;
            };
        };
        superCycle: {
            lastUpdated: string | null;
            staleThresholdMs: any;
            stats: {
                total: number;
                healthy: number;
                stale: number;
            };
            projectionMode: string;
            processes: {
                processId: string;
                name: string;
                kind: string;
                owner: string;
                status: string;
                stale: boolean;
                heartbeatCount: number;
                intendedIntervalMs: number | null;
                intervalSource: "metadata" | "producer" | "inferred";
                intervalExact: boolean;
                expectedIntervalMs: number;
                cadenceSource: "metadata" | "producer" | "inferred";
                lastHeartbeat: string | null;
                heartbeatAgeMs: number | null;
                lastRunAt: string | null;
                lastRunAgeMs: number | null;
                nextExpectedAt: string | null;
                nextFireInMs: number | null;
                lastResult: any;
                metadata: any;
            }[] | {
                processId: "tnf-heartbeat-pulse" | "tnf-broker-sweep" | "tnf-director-cycle" | "tnf-audit-trail-sync" | "tnf-graph-refresh";
                name: "Heartbeat Pulse" | "Broker Sweep" | "Director Cycle" | "Audit Trail Sync" | "Graph Refresh";
                kind: "scheduled-job" | "continuous-loop";
                owner: "orchestrator" | "broker" | "director" | "audit" | "graph";
                status: string;
                stale: boolean;
                heartbeatCount: number;
                intendedIntervalMs: number;
                intervalSource: "contract";
                intervalExact: boolean;
                expectedIntervalMs: number;
                cadenceSource: "metadata";
                lastHeartbeat: string;
                heartbeatAgeMs: number;
                lastRunAt: string;
                lastRunAgeMs: number;
                nextExpectedAt: string;
                nextFireInMs: number;
                lastResult: string;
                metadata: {
                    cadenceSeconds: 3 | 90 | 30 | 15 | 45;
                    projectionMode: string;
                    projected: boolean;
                    rationale: string;
                    component: "heartbeat";
                    channel: "core";
                    mode: "clock";
                } | {
                    cadenceSeconds: 3 | 90 | 30 | 15 | 45;
                    projectionMode: string;
                    projected: boolean;
                    rationale: string;
                    component: "broker";
                    channel: "coordination";
                    mode: "sweep";
                } | {
                    cadenceSeconds: 3 | 90 | 30 | 15 | 45;
                    projectionMode: string;
                    projected: boolean;
                    rationale: string;
                    component: "director";
                    channel: "routing";
                    mode: "cycle";
                } | {
                    cadenceSeconds: 3 | 90 | 30 | 15 | 45;
                    projectionMode: string;
                    projected: boolean;
                    rationale: string;
                    component: "audit";
                    channel: "timeline";
                    mode: "mirror";
                } | {
                    cadenceSeconds: 3 | 90 | 30 | 15 | 45;
                    projectionMode: string;
                    projected: boolean;
                    rationale: string;
                    component: "graph";
                    channel: "visualization";
                    mode: "refresh";
                };
            }[];
        };
        recentActivity: {
            timestamp: any;
            eventType: any;
            content: any;
            metadata: any;
        }[];
        error?: undefined;
    } | {
        status: string;
        timestamp: string;
        source: string;
        error: string;
        orchestrator: null;
        superCycle: {
            lastUpdated: null;
            staleThresholdMs: number;
            stats: {
                total: number;
                healthy: number;
                stale: number;
            };
            processes: never[];
            projectionMode?: undefined;
        };
        recentActivity: never[];
    }>;
    /**
     * Verify Self-Improvement Loop
     * Triggers a stimulated self-improvement cycle:
     * 1. Initializes Swarm
     * 2. Registers Agent
     * 3. Creates Prompt
     * 4. Updates Prompt
     */
    verifySelfImprovement(body: any): Promise<{
        success: boolean;
        logs: string[];
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        logs: string[];
    }>;
    /**
     * Verify Three Pillars of TNF Agent System
     *
     * Demonstrates the complete integration of:
     * 1. Orchestrator - Task management and swarm coordination
     * 2. Heartbeat - Chronological health monitoring (built into Orchestrator)
     * 3. Message Broker - Inter-agent communication
     */
    verifyThreePillars(body: any): Promise<{
        success: boolean;
        pillars: {
            orchestrator: {
                status: string;
                swarmStatus: import("../modules/agency-hub/services/agent-swarm-orchestration.service").SwarmStatus;
            };
            heartbeat: {
                status: string;
                interval: string;
                timeout: string;
            };
            messageBroker: {
                status: string;
                metrics: {
                    onlineAgents: number;
                    pendingMessages: number;
                    queueBackend: string;
                    channels: string[];
                    messagesSent: number;
                    messagesDelivered: number;
                    messagesFailed: number;
                    activeChannels: number;
                    activeSubscriptions: number;
                };
            };
        };
        logs: string[];
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        logs: string[];
        pillars?: undefined;
    }>;
    /**
     * Get comprehensive system health status
     *
     * Performs health checks on all critical system components and services.
     * This endpoint is optimized for fast response times and is commonly used
     * by load balancers, monitoring systems, and health check probes.
     *
     * @param req - Express request object
     * @param res - Express response object
     * @returns Promise that resolves when response is sent
     *
     * @throws Will return 500 status if health check fails completely
     *
     * @api
     * GET /api/system/health
     *
     * @example
     * // Successful health check response
     * {
     *   "status": "healthy",
     *   "timestamp": "2025-11-05T02:17:55.000Z",
     *   "uptime": 86400,
     *   "version": "v18.17.0",
     *   "environment": "production",
     *   "services": {
     *     "api": "online",
     *     "database": "online",
     *     "filesystem": "online",
     *     "memory": "normal"
     *   }
     * }
     *
     * @example
     * // Unhealthy system response
     * {
     *   "status": "unhealthy",
     *   "error": "Health check failed"
     * }
     */
    getHealth(): Promise<{
        status: string;
        timestamp: string;
        uptime: number;
        version: string;
        environment: string;
        services: {
            api: string;
            database: string;
            filesystem: string;
            memory: string;
        };
        error?: string;
    }>;
    private safeParse;
    private parsePositiveInt;
    private buildProcessStats;
    private resolveStats;
    private buildProjectedSuperCycleProcesses;
    private normalizeScheduledProcess;
    private resolveIntendedInterval;
    private resolveNextExpectedAtMs;
    private resolveCadenceSource;
    private inferProcessCadenceMs;
    private readCadenceMsFromMetadata;
    private toTimestampMs;
    /**
     * Get detailed system metrics
     *
     * Collects comprehensive system performance and resource usage metrics
     * including CPU, memory, disk, and process information. This data is
     * essential for performance monitoring, capacity planning, and system
     * optimization.
     *
     * @param req - Express request object
     * @param res - Express response object
     * @returns Promise that resolves when response is sent
     *
     * @throws Will return 500 status if metrics collection fails
     *
     * @api
     * GET /api/system/metrics
     *
     * @example
     * // Comprehensive metrics response
     * {
     *   "timestamp": "2025-11-05T02:17:55.000Z",
     *   "system": {
     *     "platform": "linux",
     *     "arch": "x64",
     *     "hostname": "api-server-01",
     *     "uptime": 86400,
     *     "loadavg": [0.5, 0.3, 0.2]
     *   },
     *   "process": {
     *     "pid": 1234,
     *     "uptime": 86400,
     *     "version": "v18.17.0",
     *     "memoryUsage": {
     *       "rss": 52428800,
     *       "heapTotal": 31457280,
     *       "heapUsed": 20971520,
     *       "external": 1048576
     *     },
     *     "cpuUsage": {
     *       "user": 1000000,
     *       "system": 500000
     *     }
     *   },
     *   "memory": {
     *     "total": 8589934592,
     *     "free": 4294967296,
     *     "used": 4294967296,
     *     "usage": 50
     *   },
     *   "cpu": {
     *     "count": 8,
     *     "model": "Intel(R) Core(TM) i7-9700K CPU @ 3.60GHz",
     *     "usage": 25
     *   },
     *   "disk": {
     *     "path": "/app",
     *     "available": "unknown",
     *     "used": "unknown",
     *     "total": "unknown"
     *   }
     * }
     */
    getMetrics(): Promise<any>;
    /**
     * Get overall system status
     *
     * Returns the operational status of all major system components and
     * services. This is a high-level overview useful for dashboards and
     * status pages that need to show overall system health at a glance.
     *
     * @param req - Express request object
     * @param res - Express response object
     * @returns Promise that resolves when response is sent
     *
     * @throws Will return 500 status if status check fails
     *
     * @api
     * GET /api/system/status
     *
     * @example
     * // System status response
     * {
     *   "api": "online",
     *   "database": "online",
     *   "websocket": "online",
     *   "workflows": "online",
     *   "agents": "online",
     *   "mcp": "partial",
     *   "timestamp": "2025-11-05T02:17:55.000Z"
     * }
     */
    getStatus(): Promise<any>;
    /**
     * Restart the system
     *
     * Initiates a graceful system restart. This operation is typically used
     * for system maintenance, updates, or recovery from critical issues.
     * The response is sent before the actual restart occurs.
     *
     * @warning This operation will restart the entire application process.
     * All active connections will be terminated.
     *
     * @param req - Express request object
     * @param res - Express response object
     * @returns Promise that resolves when response is sent
     *
     * @throws Will return 500 status if restart initiation fails
     *
     * @api
     * POST /api/system/restart
     *
     * @example
     * // Restart initiated response
     * {
     *   "message": "System restart initiated",
     *   "timestamp": "2025-11-05T02:17:55.000Z"
     * }
     */
    restart(): Promise<{
        message: string;
        timestamp: string;
    }>;
    /**
     * Get system logs
     *
     * Retrieves system log entries with filtering options by reading local log
     * files from known runtime paths. Supports filtering by log level and
     * limiting the number of entries returned.
     *
     * @param req - Express request object containing query parameters
     * @param req.query.lines - Maximum number of log entries to return (default: 100)
     * @param req.query.level - Log level filter ('all', 'error', 'warn', 'info', 'debug')
     * @param res - Express response object
     * @returns Promise that resolves when response is sent
     *
     * @throws Will return 500 status if log retrieval fails
     *
     * @api
     * GET /api/system/logs?lines=50&level=error
     *
     * @example
     * // Log entries response
     * {
     *   "timestamp": "2025-11-05T02:17:55.000Z",
     *   "level": "info",
     *   "lines": 100,
     *   "entries": [
     *     {
     *       "timestamp": "2025-11-05T02:17:55.000Z",
     *       "level": "info",
     *       "message": "System health check completed",
     *       "service": "system"
     *     }
     *   ]
     * }
     */
    getLogs(linesParam?: string, levelParam?: string): Promise<{
        timestamp: string;
        level: string;
        lines: number;
        entries: Array<{
            timestamp: string;
            level: string;
            message: string;
            service: string;
        }>;
    }>;
    private readSystemLogEntries;
    private getCandidateLogFiles;
    private parseLogLine;
    /**
     * Get current memory usage status
     */
    private getMemoryStatus;
    /**
     * Get current CPU usage percentage
     */
    private getCPUUsage;
    /**
     * Get disk usage information
     */
    private getDiskUsage;
    /**
     * Check database connectivity and health
     */
    private checkDatabaseHealth;
    /**
     * Check filesystem health and write permissions
     */
    private checkFilesystemHealth;
    /**
     * Check workflow engine health
     */
    private checkWorkflowEngineHealth;
    /**
     * Check agent system health
     */
    private checkAgentSystemHealth;
    /**
     * Check MCP (Model Context Protocol) health
     */
    private checkMCPHealth;
}
//# sourceMappingURL=system.controller.d.ts.map