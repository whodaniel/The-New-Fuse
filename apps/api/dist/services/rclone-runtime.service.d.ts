import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { UnifiedLedgerService } from '../modules/unified-ledger/unified-ledger.service';
import { AuditService } from './audit.service';
type RcloneDoctorCheck = {
    name: string;
    ok: boolean;
    detail: string;
};
type RcloneDoctorResponse = {
    ok: boolean;
    strict: boolean;
    remote: string;
    checks: RcloneDoctorCheck[];
};
type RcloneWorkflowPreset = {
    id: 'sync' | 'backup' | 'mirror' | 'migrate' | 'offload';
    label: string;
    description: string;
    commandTemplate: string;
    risk: 'low' | 'medium' | 'high';
    tags: string[];
};
type RcloneGuiPolicy = {
    enforceLoopbackAddr: boolean;
    allowedHosts: string[];
    allowIframe: boolean;
    allowTlsToggle: boolean;
    allowCustomBaseurl: boolean;
    blockedFlags: string[];
};
type RcloneProviderProfile = {
    id: 'pcloud' | 'degoo' | 'ardrive';
    label: string;
    supportMode: 'native_rclone' | 'bridge_workflow' | 'custom_connector';
    status: 'ready' | 'prototype' | 'planned';
    backendHint: string;
    notes: string;
    docs: string[];
};
type ProviderAutomationPolicy = 'native_allowed' | 'bridge_only' | 'custom_connector_only';
type RcloneProviderBlueprint = {
    id: RcloneProviderProfile['id'];
    summary: string;
    techStack: string[];
    integrationApproach: string[];
    compliance: {
        automationPolicy: ProviderAutomationPolicy;
        tosGuardrails: string[];
        disallowedPatterns: string[];
    };
    pricing?: {
        notes: string[];
        pricingApi?: string;
        subsidizedThresholdBytes?: number;
    };
    docs: string[];
};
type RcloneGuiDescriptor = {
    ok: boolean;
    url: string;
    addr: string;
    baseurl: string;
    tls: boolean;
    normalized: {
        addrAdjusted: boolean;
        originalAddr: string;
    };
    policy: RcloneGuiPolicy;
    presets: RcloneWorkflowPreset[];
    command: {
        binary: string;
        args: string[];
        display: string;
    };
};
type RcloneWorkflowRunRequest = {
    actorId: string;
    presetId: RcloneWorkflowPreset['id'];
    source: string;
    destination: string;
    dryRun?: boolean;
    checksum?: boolean;
    bwlimit?: string;
    transfers?: number;
    extraArgs?: string[];
    timeoutMs?: number;
};
type RcloneWorkflowRunStatus = 'running' | 'paused' | 'stopping' | 'stopped' | 'success' | 'failed' | 'timeout';
type ArdriveTurboQueueStatus = 'queued' | 'processing' | 'submitted' | 'failed' | 'completed';
type ArdriveTurboTransitionRequest = {
    actorId: string;
    queueId: string;
    status: ArdriveTurboQueueStatus;
    note?: string;
};
type ArdriveTurboQuoteSource = 'live' | 'estimated';
type ArdriveTurboWorkerTrigger = 'manual' | 'interval';
type ArdriveTurboWorkerTickSummary = {
    startedAt: string;
    finishedAt: string;
    trigger: ArdriveTurboWorkerTrigger;
    processed: number;
    transitioned: number;
    failed: number;
    errors: string[];
};
type ArdriveTurboPreflightRequest = {
    actorId: string;
    fileName: string;
    fileSizeBytes: number;
    localPath?: string;
    contentType?: string;
    targetDriveId?: string;
    targetFolderId?: string;
    checksumSha256?: string;
};
type ArdriveTurboQueueItem = {
    queueId: string;
    preflightId: string;
    actorId: string;
    status: ArdriveTurboQueueStatus;
    createdAt: string;
    updatedAt: string;
    expiresAt: string;
    attempts: number;
    fileName: string;
    fileSizeBytes: number;
    localPath: string | null;
    contentType: string | null;
    targetDriveId: string | null;
    targetFolderId: string | null;
    checksumSha256: string | null;
    subsidyEligible: boolean;
    quoteId: string | null;
    quotedWinc: string | null;
    quoteSource: ArdriveTurboQuoteSource;
    quoteAt: string | null;
    quoteEndpoint: string | null;
    pricingApi: string | null;
    requiresWalletSignature: boolean;
    notes: string[];
};
type RcloneWorkflowRunLogEntry = {
    id: string;
    actorId: string;
    ok: boolean;
    status: RcloneWorkflowRunStatus;
    presetId: RcloneWorkflowPreset['id'];
    presetLabel: string;
    source: string;
    destination: string;
    startedAt: string;
    updatedAt: string;
    finishedAt: string | null;
    durationMs: number | null;
    exitCode: number | null;
    command: {
        binary: string;
        args: string[];
        display: string;
    };
    stdoutPreview: string;
    stderrPreview: string;
    persistent: boolean;
};
export declare class RcloneRuntimeService implements OnModuleInit, OnModuleDestroy {
    private readonly auditService;
    private readonly unifiedLedgerService;
    private readonly logger;
    private readonly repoRoot;
    private readonly doctorScriptPath;
    private readonly workflowRunHistoryLimit;
    private readonly maxOutputPreviewChars;
    private readonly defaultWorkflowTimeoutMs;
    private readonly workflowSnapshotAction;
    private readonly ardriveConnectorEventAction;
    private readonly ardriveQueueMaxItems;
    private readonly ardrivePreflightTtlMs;
    private readonly ardriveQuoteTtlMs;
    private readonly ardrivePaymentApiBase;
    private readonly ardrivePaymentTimeoutMs;
    private readonly ardriveWorkerEnabled;
    private readonly ardriveWorkerIntervalMs;
    private readonly ardriveWorkerBatchSize;
    private readonly ardriveQueue;
    private readonly ardrivePreflights;
    private ardriveWorkerTimer?;
    private ardriveWorkerRunning;
    private ardriveWorkerLastTickAt;
    private ardriveWorkerLastSummary;
    private readonly workflowRunHistory;
    private readonly activeRuns;
    private readonly guiPolicy;
    private readonly workflowPresets;
    private readonly providerProfiles;
    private readonly providerBlueprints;
    private readonly allowedSingleExtraFlags;
    private readonly allowedValuedExtraFlags;
    constructor(auditService: AuditService, unifiedLedgerService: UnifiedLedgerService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    getArdriveTurboWorkerStatus(): {
        ok: boolean;
        connector: string;
        worker: {
            enabled: boolean;
            running: boolean;
            intervalMs: number;
            batchSize: number;
            lastTickAt: string | null;
            lastSummary: ArdriveTurboWorkerTickSummary | null;
        };
        queue: {
            total: number;
            queued: number;
            processing: number;
            submitted: number;
            failed: number;
            completed: number;
        };
    };
    runArdriveTurboWorkerTick(options?: {
        actorId?: string;
        trigger?: ArdriveTurboWorkerTrigger;
        maxItems?: number;
    }): Promise<{
        ok: boolean;
        connector: string;
        busy: boolean;
        summary: ArdriveTurboWorkerTickSummary | null;
    }>;
    runArdriveTurboWorkerProcessOne(options?: {
        actorId?: string;
        trigger?: ArdriveTurboWorkerTrigger;
        queueId?: string;
    }): Promise<{
        ok: boolean;
        connector: string;
        busy: boolean;
        summary: ArdriveTurboWorkerTickSummary | null;
    }>;
    doctor(options?: {
        remote?: string;
        probe?: boolean;
        strict?: boolean;
    }): Promise<RcloneDoctorResponse>;
    getProviderProfiles(): {
        ok: boolean;
        providers: RcloneProviderProfile[];
    };
    getProviderBlueprint(providerId: string): {
        ok: boolean;
        provider: RcloneProviderProfile | undefined;
        blueprint: RcloneProviderBlueprint;
    };
    preflightArdriveTurboUpload(input: ArdriveTurboPreflightRequest): Promise<{
        ok: boolean;
        connector: string;
        providerId: "ardrive";
        preflightId: string;
        createdAt: string;
        expiresAt: string;
        file: {
            fileName: string;
            fileSizeBytes: number;
            contentType: string | null;
        };
        pricing: {
            pricingApi: string | null;
            subsidizedEligible: boolean;
            subsidizedThresholdBytes: number;
            estimatedCredits: number;
            quotedWinc: string | null;
            quoteId: string | null;
            quoteSource: ArdriveTurboQuoteSource;
            quoteAt: string | null;
            quoteEndpoint: string | null;
            mode: "live_quote" | "estimated_fallback";
        };
        queuePolicy: {
            maxPending: number;
            preflightTtlSeconds: number;
            quoteTtlSeconds: number;
            requiresWalletSignature: boolean;
            requiresLiveQuoteBeforeSubmitted: boolean;
        };
        warnings: string[];
        nextActions: string[];
    }>;
    enqueueArdriveTurboUpload(input: {
        actorId: string;
        preflightId: string;
        localPath?: string;
        targetDriveId?: string;
        targetFolderId?: string;
        checksumSha256?: string;
    }): {
        ok: boolean;
        connector: string;
        item: ArdriveTurboQueueItem;
        nextActions: string[];
    };
    getArdriveTurboQueue(options?: {
        limit?: number;
        status?: string;
    }): {
        ok: boolean;
        connector: string;
        total: number;
        limit: number;
        items: ArdriveTurboQueueItem[];
    };
    transitionArdriveTurboQueueItem(input: ArdriveTurboTransitionRequest): Promise<{
        ok: boolean;
        connector: string;
        item: ArdriveTurboQueueItem;
    }>;
    getGuiDescriptor(options?: {
        addr?: string;
        baseurl?: string;
        tls?: boolean;
    }): RcloneGuiDescriptor;
    getWorkflowRunLogs(options?: {
        limit?: number;
        includePersistent?: boolean;
    }): Promise<{
        ok: boolean;
        total: number;
        limit: number;
        logs: RcloneWorkflowRunLogEntry[];
    }>;
    runWorkflow(input: RcloneWorkflowRunRequest): Promise<RcloneWorkflowRunLogEntry>;
    pauseWorkflow(runId: string, actorId: string): Promise<RcloneWorkflowRunLogEntry>;
    resumeWorkflow(runId: string, actorId: string): Promise<RcloneWorkflowRunLogEntry>;
    stopWorkflow(runId: string, actorId: string): Promise<RcloneWorkflowRunLogEntry>;
    private getActiveRunOrThrow;
    private scheduleForceKill;
    private cleanupActiveRunTimers;
    private resolveTerminalStatus;
    private resolveTerminalExitCode;
    private signalToExitCode;
    private finalizeRun;
    private updateRunStatus;
    private appendRunStdout;
    private appendRunStderr;
    private addOrUpdateInHistory;
    private persistRunSnapshot;
    private asPersistedSnapshot;
    private getPersistentWorkflowRunLogs;
    private parsePersistentRows;
    private normalizePersistedRun;
    private normalizeRunStatus;
    private normalizePresetId;
    private mergeLogs;
    private runDoctorScript;
    private normalizeBaseurl;
    private normalizeAddr;
    private buildWorkflowCommandArgs;
    private baseWorkflowCommandArgs;
    private validateExtraArgs;
    private normalizeProviderId;
    private isArdriveWorkerProcessable;
    private processArdriveWorkerCandidate;
    private startArdriveWorkerLoop;
    private stopArdriveWorkerLoop;
    private ensureLiveQuoteForArdriveQueueItem;
    private isArdriveQuoteExpired;
    private fetchArdriveTurboQuote;
    private normalizeArdriveQueueStatus;
    private canTransitionArdriveQueue;
    private estimateTurboCredits;
    private pruneArdrivePreflights;
    private persistArdriveConnectorEvent;
    private enforceProviderGuardrails;
    private extractRemoteAlias;
    private previewOutput;
    private requirePath;
    private clamp;
    private toBooleanEnv;
    private toIsoTimestamp;
    private toEpochMs;
    private resolveRepoRoot;
}
export {};
//# sourceMappingURL=rclone-runtime.service.d.ts.map