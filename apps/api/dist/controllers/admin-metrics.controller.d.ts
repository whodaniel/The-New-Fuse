import { CacheService } from '../cache/cache.service';
import { ChronologicalProcessesService } from '../modules/admin/chronological-processes.service';
import { UnifiedLedgerService } from '../modules/unified-ledger/unified-ledger.service';
import { MetricsService } from '../services/metrics.service';
type AdminRequest = {
    user?: {
        id?: string;
        userId?: string;
        roles?: string[];
        role?: string;
    };
};
/**
 * Admin Metrics Controller
 *
 * Provides comprehensive system metrics and monitoring data for admin dashboard.
 * All endpoints require SUPER_ADMIN or admin role access.
 */
export declare class AdminMetricsController {
    private readonly metricsService;
    private readonly unifiedLedgerService;
    private readonly cacheService;
    private readonly chronologicalProcessesService;
    private readonly userRepository;
    private readonly agentRepository;
    private readonly workflowRepository;
    private readonly auditLogsRepository;
    constructor(metricsService: MetricsService, unifiedLedgerService: UnifiedLedgerService, cacheService: CacheService, chronologicalProcessesService: ChronologicalProcessesService);
    /**
     * Get comprehensive system metrics
     */
    getSystemMetrics(): Promise<{
        totalUsers: number;
        activeUsers: number;
        totalAgents: number;
        activeAgents: number;
        totalWorkflows: number;
        systemHealth: "healthy" | "degraded" | "critical";
        uptime: number;
        memory: {
            used: number;
            total: number;
            free: number;
            percentage: number;
        };
        cpu: {
            usage: number;
            loadAverage: {
                '1min': number;
                '5min': number;
                '15min': number;
            };
            cores: number;
        };
        platform: {
            type: NodeJS.Platform;
            release: string;
            arch: NodeJS.Architecture;
            hostname: string;
        };
        timestamp: Date;
    }>;
    /**
     * Get dashboard overview metrics
     */
    getDashboardMetrics(): Promise<{
        users: {
            total: number;
            active: number;
            inactive: number;
        };
        agents: {
            total: number;
            active: number;
            inactive: number;
        };
        workflows: {
            total: number;
        };
        system: {
            health: "healthy" | "degraded" | "critical";
            uptime: number;
            memory: {
                heapUsed: number;
                heapTotal: number;
                rss: number;
                external: number;
                percentage: number;
            };
            cpu: {
                usage: number;
                loadAverage: number[];
            };
        };
        auditLogs: {
            total: number;
        };
        timestamp: Date;
    }>;
    /**
     * Get API analytics
     */
    getApiAnalytics(startDate?: string, endDate?: string): Promise<{
        period: {
            start: Date;
            end: Date;
        };
        totalRequests: number;
        byAction: Record<string, number>;
        byStatus: Record<string, number>;
        successRate: number;
    }>;
    /**
     * Get user activity metrics
     */
    getUserActivity(days?: string): Promise<{
        period: {
            days: number;
            startDate: Date;
        };
        totalActions: number;
        activeUsers: number;
        activityByUser: Record<string, number>;
    }>;
    getFederationGateMetrics(hoursRaw?: string, limitRaw?: string): Promise<{
        window: {
            hours: number;
            dateFrom: string;
            dateTo: string;
            limit: number;
        };
        apiHandoff: {
            total: number;
            byOutcome: Record<string, number>;
            byCategory: Record<string, number>;
            byMode: Record<string, number>;
            topReasons: {
                reason: string;
                count: number;
            }[];
            recent: {
                id: string;
                timestamp: string;
                actor: string;
                payload: Record<string, unknown>;
            }[];
        };
        broker: {
            available: boolean;
            metricsKey: string;
            counters: Record<string, number>;
        };
        timestamp: string;
    }>;
    getChronologicalProcesses(): Promise<{
        generatedAt: string;
        summary: {
            total: number;
            enabled: number;
            disabled: number;
            locked: number;
            healthy: number;
            errored: number;
            externalRuntimes: {
                openclaw: {
                    updatedAt: string | null;
                    syncedBy: string | null;
                    installationCount: number;
                    instanceCount: number;
                    totalJobs: number;
                    trackedSchedules: number;
                    duplicatedSchedules: number;
                    failingSchedules: number;
                };
            } | null;
        };
        processes: {
            id: string;
            title: string;
            description: string;
            canonical: {
                layer: string;
                scope: string;
                category: string;
                categoryDescription: string | null;
                ownerAgentId: string | null;
                ownerUserId: string | null;
                locked: boolean;
                requiresApproval: boolean;
            };
            procedural: {
                layer: string;
                enabled: boolean;
                cadence: string;
                timezone: string;
                nextRunAt: string | null;
                nextRunHint: string;
                runNowCommand: {
                    command: string;
                    args: string[];
                    timeoutMs: number;
                } | null;
            };
            runtime: {
                status: "error" | "healthy" | "manual" | "scheduled" | "paused" | "running";
                lastRunAt: string | null;
                lastDurationMs: number | null;
                lastExitCode: number | null;
                lastError: string | null;
                lastOutputPreview: string | null;
                recentRuns: import("../modules/admin/chronological-processes.service").ProcessRunHistoryEntry[];
            };
            controls: {
                canEdit: boolean;
                canRunNow: boolean;
                editDeniedReason: string | null;
                runDeniedReason: string | null;
            };
            docs: {
                protocol: string | null;
                runbook: string | null;
            };
            integrations: {
                openclaw: {
                    scheduleId: string;
                    installationCount: number;
                    instanceCount?: number;
                    jobCount: number;
                    duplicateCount: number;
                    enabledJobs: number;
                    disabledJobs: number;
                    anyEnabled: boolean;
                    worstStatus: string | null;
                    maxConsecutiveErrors: number;
                    nextRunAtMs: number | null;
                    liveJobs: Array<Record<string, unknown>>;
                    instances?: Array<Record<string, unknown>>;
                    updatedAt: string | null;
                    syncedBy: string | null;
                    totalInstanceCount: number;
                } | null;
            };
            updatedAt: string;
            updatedBy: string;
        }[];
    }>;
    updateChronologicalProcess(processId: string, body: {
        enabled?: boolean;
        cadence?: string;
        timezone?: string;
        notes?: string;
    }, req: AdminRequest): Promise<{
        id: string;
        title: string;
        description: string;
        canonical: {
            layer: string;
            scope: string;
            category: string;
            categoryDescription: string | null;
            ownerAgentId: string | null;
            ownerUserId: string | null;
            locked: boolean;
            requiresApproval: boolean;
        };
        procedural: {
            layer: string;
            enabled: boolean;
            cadence: string;
            timezone: string;
            nextRunAt: string | null;
            nextRunHint: string;
            runNowCommand: {
                command: string;
                args: string[];
                timeoutMs: number;
            } | null;
        };
        runtime: {
            status: "error" | "healthy" | "manual" | "scheduled" | "paused" | "running";
            lastRunAt: string | null;
            lastDurationMs: number | null;
            lastExitCode: number | null;
            lastError: string | null;
            lastOutputPreview: string | null;
            recentRuns: import("../modules/admin/chronological-processes.service").ProcessRunHistoryEntry[];
        };
        controls: {
            canEdit: boolean;
            canRunNow: boolean;
            editDeniedReason: string | null;
            runDeniedReason: string | null;
        };
        docs: {
            protocol: string | null;
            runbook: string | null;
        };
        integrations: {
            openclaw: {
                scheduleId: string;
                installationCount: number;
                instanceCount?: number;
                jobCount: number;
                duplicateCount: number;
                enabledJobs: number;
                disabledJobs: number;
                anyEnabled: boolean;
                worstStatus: string | null;
                maxConsecutiveErrors: number;
                nextRunAtMs: number | null;
                liveJobs: Array<Record<string, unknown>>;
                instances?: Array<Record<string, unknown>>;
                updatedAt: string | null;
                syncedBy: string | null;
                totalInstanceCount: number;
            } | null;
        };
        updatedAt: string;
        updatedBy: string;
    }>;
    runChronologicalProcess(processId: string, req: AdminRequest): Promise<{
        process: {
            id: string;
            title: string;
            description: string;
            canonical: {
                layer: string;
                scope: string;
                category: string;
                categoryDescription: string | null;
                ownerAgentId: string | null;
                ownerUserId: string | null;
                locked: boolean;
                requiresApproval: boolean;
            };
            procedural: {
                layer: string;
                enabled: boolean;
                cadence: string;
                timezone: string;
                nextRunAt: string | null;
                nextRunHint: string;
                runNowCommand: {
                    command: string;
                    args: string[];
                    timeoutMs: number;
                } | null;
            };
            runtime: {
                status: "error" | "healthy" | "manual" | "scheduled" | "paused" | "running";
                lastRunAt: string | null;
                lastDurationMs: number | null;
                lastExitCode: number | null;
                lastError: string | null;
                lastOutputPreview: string | null;
                recentRuns: import("../modules/admin/chronological-processes.service").ProcessRunHistoryEntry[];
            };
            controls: {
                canEdit: boolean;
                canRunNow: boolean;
                editDeniedReason: string | null;
                runDeniedReason: string | null;
            };
            docs: {
                protocol: string | null;
                runbook: string | null;
            };
            integrations: {
                openclaw: {
                    scheduleId: string;
                    installationCount: number;
                    instanceCount?: number;
                    jobCount: number;
                    duplicateCount: number;
                    enabledJobs: number;
                    disabledJobs: number;
                    anyEnabled: boolean;
                    worstStatus: string | null;
                    maxConsecutiveErrors: number;
                    nextRunAtMs: number | null;
                    liveJobs: Array<Record<string, unknown>>;
                    instances?: Array<Record<string, unknown>>;
                    updatedAt: string | null;
                    syncedBy: string | null;
                    totalInstanceCount: number;
                } | null;
            };
            updatedAt: string;
            updatedBy: string;
        };
        run: {
            startedAt: string;
            finishedAt: string;
            durationMs: number;
            status: "error" | "healthy";
            exitCode: number;
            error: string | null;
            outputPreview: string;
        };
    }>;
    getChronologicalProcessHistory(processId: string, limitRaw?: string): Promise<{
        process: {
            id: string;
            title: string;
        };
        total: number;
        runs: import("../modules/admin/chronological-processes.service").ProcessRunHistoryEntry[];
    }>;
    /**
     * Determine system health status based on metrics
     */
    private getHealthStatus;
}
export {};
//# sourceMappingURL=admin-metrics.controller.d.ts.map