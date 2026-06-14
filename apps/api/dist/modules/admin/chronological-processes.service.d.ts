type ProcessStatus = 'scheduled' | 'paused' | 'healthy' | 'error' | 'running' | 'manual';
export interface ProcessRunHistoryEntry {
    runId: string;
    processId: string;
    actorId: string;
    startedAt: string;
    finishedAt: string;
    durationMs: number;
    status: ProcessStatus;
    exitCode: number;
    error: string | null;
    outputPreview: string | null;
}
interface ProcessActorContext {
    actorId: string;
    actorRoles: string[];
}
export declare class ChronologicalProcessesService {
    private readonly logger;
    private readonly repoRoot;
    private readonly registryPath;
    private readonly statePath;
    private readonly catalogPath;
    private readonly dtfCache;
    listProcesses(): Promise<{
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
                status: ProcessStatus;
                lastRunAt: string | null;
                lastDurationMs: number | null;
                lastExitCode: number | null;
                lastError: string | null;
                lastOutputPreview: string | null;
                recentRuns: ProcessRunHistoryEntry[];
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
    updateProcess(processId: string, patch: {
        enabled?: boolean;
        cadence?: string;
        timezone?: string;
        notes?: string;
    }, actor: ProcessActorContext): Promise<{
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
            status: ProcessStatus;
            lastRunAt: string | null;
            lastDurationMs: number | null;
            lastExitCode: number | null;
            lastError: string | null;
            lastOutputPreview: string | null;
            recentRuns: ProcessRunHistoryEntry[];
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
    runProcessNow(processId: string, actor: ProcessActorContext): Promise<{
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
                status: ProcessStatus;
                lastRunAt: string | null;
                lastDurationMs: number | null;
                lastExitCode: number | null;
                lastError: string | null;
                lastOutputPreview: string | null;
                recentRuns: ProcessRunHistoryEntry[];
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
            status: "healthy" | "error";
            exitCode: number;
            error: string | null;
            outputPreview: string;
        };
    }>;
    getProcessHistory(processId: string, limitRaw?: number): Promise<{
        process: {
            id: string;
            title: string;
        };
        total: number;
        runs: ProcessRunHistoryEntry[];
    }>;
    auditChronologicalProcesses(actor: ProcessActorContext): Promise<{
        status: string;
        auditedAt: string;
        issuesFound: number;
        warnings: string[];
    }>;
    private getProcessById;
    private buildProcess;
    private buildExternalRuntimeSummary;
    private buildFallbackCatalog;
    private formatScheduleId;
    private isSuperAdmin;
    private isCronExpressionLikelyValid;
    private buildOutputPreview;
    private readRegistry;
    private readCatalogEntries;
    private readState;
    private writeState;
    private resolveRepoRoot;
    private createRunId;
    private getNextRunAt;
    private normalizeCronExpression;
    private getZonedDateParts;
    private safeTimezone;
    private monthNameMap;
    private weekdayNameMap;
    private matchesCronField;
    private matchesCronSegment;
    private parseCronToken;
}
export {};
//# sourceMappingURL=chronological-processes.service.d.ts.map