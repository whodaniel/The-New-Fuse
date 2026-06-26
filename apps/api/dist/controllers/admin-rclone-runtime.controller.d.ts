import { RcloneRuntimeService } from '../services/rclone-runtime.service';
export declare class AdminRcloneRuntimeController {
    private readonly rcloneRuntimeService;
    constructor(rcloneRuntimeService: RcloneRuntimeService);
    private toBoolean;
    private toInteger;
    private getActorId;
    doctor(remote?: string, probe?: string, strict?: string): Promise<{
        ok: boolean;
        strict: boolean;
        remote: string;
        checks: {
            name: string;
            ok: boolean;
            detail: string;
        }[];
    }>;
    providers(): Promise<{
        ok: boolean;
        providers: {
            id: "pcloud" | "degoo" | "ardrive";
            label: string;
            supportMode: "native_rclone" | "bridge_workflow" | "custom_connector";
            status: "ready" | "prototype" | "planned";
            backendHint: string;
            notes: string;
            docs: string[];
        }[];
    }>;
    providerBlueprint(providerId: string): Promise<{
        ok: boolean;
        provider: {
            id: "pcloud" | "degoo" | "ardrive";
            label: string;
            supportMode: "native_rclone" | "bridge_workflow" | "custom_connector";
            status: "ready" | "prototype" | "planned";
            backendHint: string;
            notes: string;
            docs: string[];
        } | undefined;
        blueprint: {
            id: "pcloud" | "degoo" | "ardrive";
            summary: string;
            techStack: string[];
            integrationApproach: string[];
            compliance: {
                automationPolicy: "native_allowed" | "bridge_only" | "custom_connector_only";
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
    }>;
    preflightArdriveTurbo(user: any, body?: {
        fileName?: string;
        fileSizeBytes?: number | string;
        localPath?: string;
        contentType?: string;
        targetDriveId?: string;
        targetFolderId?: string;
        checksumSha256?: string;
    }): Promise<{
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
            quoteSource: "live" | "estimated";
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
    enqueueArdriveTurbo(user: any, body?: {
        preflightId?: string;
        localPath?: string;
        targetDriveId?: string;
        targetFolderId?: string;
        checksumSha256?: string;
    }): Promise<{
        ok: boolean;
        connector: string;
        item: {
            queueId: string;
            preflightId: string;
            actorId: string;
            status: "queued" | "processing" | "submitted" | "failed" | "completed";
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
            quoteSource: "live" | "estimated";
            quoteAt: string | null;
            quoteEndpoint: string | null;
            pricingApi: string | null;
            requiresWalletSignature: boolean;
            notes: string[];
        };
        nextActions: string[];
    }>;
    listArdriveTurboQueue(limit?: string, status?: string): Promise<{
        ok: boolean;
        connector: string;
        total: number;
        limit: number;
        items: {
            queueId: string;
            preflightId: string;
            actorId: string;
            status: "queued" | "processing" | "submitted" | "failed" | "completed";
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
            quoteSource: "live" | "estimated";
            quoteAt: string | null;
            quoteEndpoint: string | null;
            pricingApi: string | null;
            requiresWalletSignature: boolean;
            notes: string[];
        }[];
    }>;
    transitionArdriveTurboQueueItem(user: any, queueId: string, body?: {
        status?: 'queued' | 'processing' | 'submitted' | 'failed' | 'completed';
        note?: string;
    }): Promise<{
        ok: boolean;
        connector: string;
        item: {
            queueId: string;
            preflightId: string;
            actorId: string;
            status: "queued" | "processing" | "submitted" | "failed" | "completed";
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
            quoteSource: "live" | "estimated";
            quoteAt: string | null;
            quoteEndpoint: string | null;
            pricingApi: string | null;
            requiresWalletSignature: boolean;
            notes: string[];
        };
    }>;
    ardriveTurboWorkerStatus(): Promise<{
        ok: boolean;
        connector: string;
        worker: {
            enabled: boolean;
            running: boolean;
            intervalMs: number;
            batchSize: number;
            lastTickAt: string | null;
            lastSummary: {
                startedAt: string;
                finishedAt: string;
                trigger: "manual" | "interval";
                processed: number;
                transitioned: number;
                failed: number;
                errors: string[];
            } | null;
        };
        queue: {
            total: number;
            queued: number;
            processing: number;
            submitted: number;
            failed: number;
            completed: number;
        };
    }>;
    ardriveTurboWorkerTick(user: any, body?: {
        maxItems?: number | string;
    }): Promise<{
        ok: boolean;
        connector: string;
        busy: boolean;
        summary: {
            startedAt: string;
            finishedAt: string;
            trigger: "manual" | "interval";
            processed: number;
            transitioned: number;
            failed: number;
            errors: string[];
        } | null;
    }>;
    ardriveTurboWorkerProcessOne(user: any, body?: {
        queueId?: string;
    }): Promise<{
        ok: boolean;
        connector: string;
        busy: boolean;
        summary: {
            startedAt: string;
            finishedAt: string;
            trigger: "manual" | "interval";
            processed: number;
            transitioned: number;
            failed: number;
            errors: string[];
        } | null;
    }>;
    gui(addr?: string, baseurl?: string, tls?: string): Promise<{
        ok: boolean;
        url: string;
        addr: string;
        baseurl: string;
        tls: boolean;
        normalized: {
            addrAdjusted: boolean;
            originalAddr: string;
        };
        policy: {
            enforceLoopbackAddr: boolean;
            allowedHosts: string[];
            allowIframe: boolean;
            allowTlsToggle: boolean;
            allowCustomBaseurl: boolean;
            blockedFlags: string[];
        };
        presets: {
            id: "sync" | "backup" | "mirror" | "migrate" | "offload";
            label: string;
            description: string;
            commandTemplate: string;
            risk: "low" | "medium" | "high";
            tags: string[];
        }[];
        command: {
            binary: string;
            args: string[];
            display: string;
        };
    }>;
    runWorkflow(user: any, body?: {
        presetId?: 'sync' | 'backup' | 'mirror' | 'migrate' | 'offload';
        source?: string;
        destination?: string;
        dryRun?: boolean | string;
        checksum?: boolean | string;
        bwlimit?: string;
        transfers?: number | string;
        timeoutMs?: number | string;
        extraArgs?: string[];
    }): Promise<{
        id: string;
        actorId: string;
        ok: boolean;
        status: "success" | "paused" | "running" | "failed" | "stopping" | "stopped" | "timeout";
        presetId: "sync" | "backup" | "mirror" | "migrate" | "offload";
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
    }>;
    pauseWorkflow(user: any, runId: string): Promise<{
        id: string;
        actorId: string;
        ok: boolean;
        status: "success" | "paused" | "running" | "failed" | "stopping" | "stopped" | "timeout";
        presetId: "sync" | "backup" | "mirror" | "migrate" | "offload";
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
    }>;
    resumeWorkflow(user: any, runId: string): Promise<{
        id: string;
        actorId: string;
        ok: boolean;
        status: "success" | "paused" | "running" | "failed" | "stopping" | "stopped" | "timeout";
        presetId: "sync" | "backup" | "mirror" | "migrate" | "offload";
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
    }>;
    stopWorkflow(user: any, runId: string): Promise<{
        id: string;
        actorId: string;
        ok: boolean;
        status: "success" | "paused" | "running" | "failed" | "stopping" | "stopped" | "timeout";
        presetId: "sync" | "backup" | "mirror" | "migrate" | "offload";
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
    }>;
    getWorkflowLogs(limit?: string, includePersistent?: string): Promise<{
        ok: boolean;
        total: number;
        limit: number;
        logs: {
            id: string;
            actorId: string;
            ok: boolean;
            status: "success" | "paused" | "running" | "failed" | "stopping" | "stopped" | "timeout";
            presetId: "sync" | "backup" | "mirror" | "migrate" | "offload";
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
        }[];
    }>;
}
//# sourceMappingURL=admin-rclone-runtime.controller.d.ts.map