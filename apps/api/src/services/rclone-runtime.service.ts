import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { AuditLogEntry } from '@the-new-fuse/database';
import { ChildProcessWithoutNullStreams, execFile, spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { promisify } from 'node:util';
import { UnifiedLedgerService } from '../modules/unified-ledger/unified-ledger.service';
import { AuditService } from './audit.service';

const execFileAsync = promisify(execFile);

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

type RcloneWorkflowRunStatus =
  | 'running'
  | 'paused'
  | 'stopping'
  | 'stopped'
  | 'success'
  | 'failed'
  | 'timeout';

type ArdriveTurboQueueStatus = 'queued' | 'processing' | 'submitted' | 'failed' | 'completed';

type ArdriveTurboTransitionRequest = {
  actorId: string;
  queueId: string;
  status: ArdriveTurboQueueStatus;
  note?: string;
};

type ArdriveTurboQuoteSource = 'live' | 'estimated';

type ArdriveTurboQuoteRecord = {
  quoteId: string | null;
  quotedWinc: string | null;
  quoteSource: ArdriveTurboQuoteSource;
  quoteAt: string | null;
  quoteEndpoint: string | null;
  warnings: string[];
};

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

type ArdriveTurboPreflightRecord = {
  preflightId: string;
  actorId: string;
  createdAt: string;
  expiresAt: string;
  fileName: string;
  fileSizeBytes: number;
  localPath: string | null;
  contentType: string | null;
  targetDriveId: string | null;
  targetFolderId: string | null;
  checksumSha256: string | null;
  subsidizedEligible: boolean;
  subsidizedThresholdBytes: number;
  estimatedCredits: number | null;
  quotedWinc: string | null;
  quoteId: string | null;
  quoteSource: ArdriveTurboQuoteSource;
  quoteAt: string | null;
  quoteEndpoint: string | null;
  pricingApi: string | null;
  warnings: string[];
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

type ActiveRunState = {
  child: ChildProcessWithoutNullStreams;
  entry: RcloneWorkflowRunLogEntry;
  timeoutHandle?: NodeJS.Timeout;
  stopEscalationHandle?: NodeJS.Timeout;
  timeoutTriggered: boolean;
  stopRequested: boolean;
  paused: boolean;
};

@Injectable()
export class RcloneRuntimeService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RcloneRuntimeService.name);
  private readonly repoRoot = this.resolveRepoRoot();
  private readonly doctorScriptPath = path.join(this.repoRoot, 'scripts', 'tnf-rclone-doctor.cjs');
  private readonly workflowRunHistoryLimit = 120;
  private readonly maxOutputPreviewChars = 6000;
  private readonly defaultWorkflowTimeoutMs = 180000;
  private readonly workflowSnapshotAction = 'rclone.runtime.workflow.snapshot';
  private readonly ardriveConnectorEventAction = 'rclone.runtime.ardrive.connector.event';
  private readonly ardriveQueueMaxItems = 200;
  private readonly ardrivePreflightTtlMs = 30 * 60 * 1000;
  private readonly ardriveQuoteTtlMs = 15 * 60 * 1000;
  private readonly ardrivePaymentApiBase =
    String(process.env.TNF_ARDRIVE_TURBO_PAYMENT_API || 'https://payment.ardrive.io/v1').trim() ||
    'https://payment.ardrive.io/v1';
  private readonly ardrivePaymentTimeoutMs = this.clamp(
    Number(process.env.TNF_ARDRIVE_TURBO_PAYMENT_TIMEOUT_MS || 8000),
    1000,
    30000
  );
  private readonly ardriveWorkerEnabled = this.toBooleanEnv(
    process.env.TNF_ARDRIVE_CONNECTOR_WORKER_ENABLED,
    false
  );
  private readonly ardriveWorkerIntervalMs = this.clamp(
    Number(process.env.TNF_ARDRIVE_CONNECTOR_WORKER_INTERVAL_MS || 10000),
    1000,
    300000
  );
  private readonly ardriveWorkerBatchSize = this.clamp(
    Number(process.env.TNF_ARDRIVE_CONNECTOR_WORKER_BATCH_SIZE || 5),
    1,
    50
  );
  private readonly ardriveQueue: ArdriveTurboQueueItem[] = [];
  private readonly ardrivePreflights = new Map<string, ArdriveTurboPreflightRecord>();
  private ardriveWorkerTimer?: NodeJS.Timeout;
  private ardriveWorkerRunning = false;
  private ardriveWorkerLastTickAt: string | null = null;
  private ardriveWorkerLastSummary: ArdriveTurboWorkerTickSummary | null = null;
  private readonly workflowRunHistory: RcloneWorkflowRunLogEntry[] = [];
  private readonly activeRuns = new Map<string, ActiveRunState>();
  private readonly guiPolicy: RcloneGuiPolicy = {
    enforceLoopbackAddr: true,
    allowedHosts: ['127.0.0.1', 'localhost', '::1'],
    allowIframe: true,
    allowTlsToggle: true,
    allowCustomBaseurl: true,
    blockedFlags: ['--rc-no-auth', '--rc-serve'],
  };
  private readonly workflowPresets: RcloneWorkflowPreset[] = [
    {
      id: 'sync',
      label: 'Sync',
      description: 'Incremental sync from local source to remote destination.',
      commandTemplate: 'rclone sync {source} {destination} --progress --create-empty-src-dirs',
      risk: 'medium',
      tags: ['incremental', 'two-way-safe', 'operational'],
    },
    {
      id: 'backup',
      label: 'Backup',
      description: 'Copy local data to remote with checksum verification.',
      commandTemplate: 'rclone copy {source} {destination} --checksum --progress',
      risk: 'low',
      tags: ['backup', 'checksum', 'resilient'],
    },
    {
      id: 'mirror',
      label: 'Mirror',
      description: 'Exact mirror with destination pruning (use carefully).',
      commandTemplate: 'rclone sync {source} {destination} --delete-during --progress',
      risk: 'high',
      tags: ['destructive', 'exact-state', 'ops'],
    },
    {
      id: 'migrate',
      label: 'Migrate',
      description: 'Move payloads between remotes and remove source after transfer.',
      commandTemplate: 'rclone move {source} {destination} --progress --transfers 4',
      risk: 'high',
      tags: ['migration', 'remote-to-remote', 'cleanup'],
    },
    {
      id: 'offload',
      label: 'Offload',
      description: 'Archive local files to remote and clean local source safely.',
      commandTemplate: 'rclone move {source} {destination} --progress --min-age 10m',
      risk: 'medium',
      tags: ['storage-recovery', 'archive', 'local-cleanup'],
    },
  ];
  private readonly providerProfiles: RcloneProviderProfile[] = [
    {
      id: 'pcloud',
      label: 'pCloud',
      supportMode: 'native_rclone',
      status: 'ready',
      backendHint: 'pcloud backend',
      notes: 'First-class target in this mobility console.',
      docs: ['https://rclone.org/pcloud/', 'https://docs.pcloud.com/'],
    },
    {
      id: 'degoo',
      label: 'Degoo Cloud',
      supportMode: 'bridge_workflow',
      status: 'prototype',
      backendHint: 'bridge via mounted sync/WebDAV/S3-compatible layer',
      notes:
        'No guaranteed native rclone backend path in this TNF runtime; recommended approach is a bridge connector.',
      docs: ['https://github.com/rclone/rclone/issues/4424', 'https://rclone.org/overview/'],
    },
    {
      id: 'ardrive',
      label: 'ArDrive',
      supportMode: 'custom_connector',
      status: 'planned',
      backendHint: 'custom connector + Arweave transaction workflow',
      notes:
        'Blockchain storage requires content-addressed and transaction-aware flows beyond standard sync semantics.',
      docs: ['https://docs.ardrive.io/docs/arfs', 'https://upload.ardrive.io/api-docs'],
    },
  ];
  private readonly providerBlueprints: Record<
    RcloneProviderProfile['id'],
    RcloneProviderBlueprint
  > = {
    pcloud: {
      id: 'pcloud',
      summary:
        'Native rclone backend. Recommended default for TNF managed storage offload and migration workflows.',
      techStack: [
        'rclone pcloud backend',
        'OAuth token flow via rclone config',
        'TNF managed workflow runner (spawned rclone process)',
      ],
      integrationApproach: [
        'Use native `pcloud:` remote for sync/copy/move workflows.',
        'Use doctor checks before execution (`remote`, `config`, optional `probe`).',
        'Keep high-risk presets behind dry-run by default.',
      ],
      compliance: {
        automationPolicy: 'native_allowed',
        tosGuardrails: [
          'Use authenticated account ownership only.',
          'Avoid exposing tokens in logs or copied command output.',
        ],
        disallowedPatterns: ['credential sharing between unrelated operators'],
      },
      docs: ['https://rclone.org/pcloud/', 'https://docs.pcloud.com/'],
    },
    degoo: {
      id: 'degoo',
      summary:
        'No first-class rclone backend path. Use a compliance-safe bridge workflow instead of direct protocol emulation.',
      techStack: [
        'Official Degoo web app ingestion/export path',
        'User-managed local staging directory',
        'Optional officially supported bridge endpoint (if made available by Degoo)',
      ],
      integrationApproach: [
        'Do not treat Degoo as a native rclone remote in TNF managed workflows.',
        'Use manual export/sync bridge into a local staging path, then run rclone from staging to approved remotes.',
        'Keep Degoo automation to officially documented interfaces only.',
      ],
      compliance: {
        automationPolicy: 'bridge_only',
        tosGuardrails: [
          'Degoo ToS disallows reverse engineering and attempts to work around technical limitations.',
          'Only use documented product surfaces and legitimate account access.',
        ],
        disallowedPatterns: [
          'private API scraping',
          'credential replay or browser-session hijacking',
          'bypassing upload/session limits',
        ],
      },
      docs: [
        'https://degoo.com/terms',
        'https://help.degoo.com/support/solutions/articles/77000531240-account-limits',
        'https://help.degoo.com/support/solutions/folders/77000012730',
      ],
    },
    ardrive: {
      id: 'ardrive',
      summary:
        'ArDrive requires transaction-aware Arweave upload flows. Integrate via Turbo APIs/SDK, not vanilla rclone sync semantics.',
      techStack: [
        'Turbo Upload API (`upload.ardrive.io`)',
        'Turbo Payment API (`payment.ardrive.io`)',
        'ArDrive CLI/SDK for wallet-aware upload automation',
      ],
      integrationApproach: [
        'Implement custom connector with upload queue and transaction/finality tracking.',
        'Query Turbo pricing API per payload size before enqueueing uploads.',
        'For small media/assets, evaluate subsidy path first, then fallback to paid credits.',
      ],
      compliance: {
        automationPolicy: 'custom_connector_only',
        tosGuardrails: [
          'Respect wallet-signing ownership and immutable storage semantics.',
          'Track credit usage and non-refundable Turbo credit constraints.',
        ],
        disallowedPatterns: [
          'assuming mutable overwrite semantics',
          'submitting uploads without preflight pricing checks',
        ],
      },
      pricing: {
        notes: [
          'Turbo credits are upload payment units and can be non-refundable.',
          'Turbo documentation notes subsidy behavior for files under 100 KiB.',
        ],
        pricingApi: 'https://payment.ardrive.io/v1',
        subsidizedThresholdBytes: 102400,
      },
      docs: [
        'https://docs.ardrive.io/docs/turbo/credits/',
        'https://docs.ardrive.io/docs/turbo/api/upload.html',
        'https://docs.ardrive.io/docs/turbo/api/payment.html',
      ],
    },
  };
  private readonly allowedSingleExtraFlags = new Set([
    '--fast-list',
    '--check-first',
    '--size-only',
    '--update',
    '--ignore-existing',
    '--immutable',
    '--ignore-times',
  ]);
  private readonly allowedValuedExtraFlags = new Set([
    '--exclude',
    '--include',
    '--max-age',
    '--min-age',
    '--log-level',
    '--bwlimit',
    '--retries',
    '--low-level-retries',
    '--checkers',
    '--max-depth',
  ]);

  constructor(
    private readonly auditService: AuditService,
    private readonly unifiedLedgerService: UnifiedLedgerService
  ) {}

  onModuleInit(): void {
    if (!this.ardriveWorkerEnabled) return;
    this.startArdriveWorkerLoop();
  }

  onModuleDestroy(): void {
    this.stopArdriveWorkerLoop();
  }

  getArdriveTurboWorkerStatus() {
    return {
      ok: true,
      connector: 'ardrive_turbo_connector',
      worker: {
        enabled: this.ardriveWorkerEnabled,
        running: this.ardriveWorkerRunning,
        intervalMs: this.ardriveWorkerIntervalMs,
        batchSize: this.ardriveWorkerBatchSize,
        lastTickAt: this.ardriveWorkerLastTickAt,
        lastSummary: this.ardriveWorkerLastSummary,
      },
      queue: {
        total: this.ardriveQueue.length,
        queued: this.ardriveQueue.filter((item) => item.status === 'queued').length,
        processing: this.ardriveQueue.filter((item) => item.status === 'processing').length,
        submitted: this.ardriveQueue.filter((item) => item.status === 'submitted').length,
        failed: this.ardriveQueue.filter((item) => item.status === 'failed').length,
        completed: this.ardriveQueue.filter((item) => item.status === 'completed').length,
      },
    };
  }

  async runArdriveTurboWorkerTick(
    options: {
      actorId?: string;
      trigger?: ArdriveTurboWorkerTrigger;
      maxItems?: number;
    } = {}
  ) {
    if (this.ardriveWorkerRunning) {
      return {
        ok: true,
        connector: 'ardrive_turbo_connector',
        busy: true,
        summary: this.ardriveWorkerLastSummary,
      };
    }

    const actorId = String(options.actorId || 'ardrive-worker').trim() || 'ardrive-worker';
    const trigger = options.trigger || 'manual';
    const maxItems = this.clamp(Number(options.maxItems ?? this.ardriveWorkerBatchSize), 1, 100);
    const startedAt = new Date().toISOString();
    let processedCount = 0;
    let transitionedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    this.ardriveWorkerRunning = true;
    try {
      const candidates = this.ardriveQueue
        .filter((item) => this.isArdriveWorkerProcessable(item.status))
        .sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime())
        .slice(0, maxItems);

      for (const item of candidates) {
        const outcome = await this.processArdriveWorkerCandidate(item, actorId, trigger);
        processedCount += outcome.processed;
        transitionedCount += outcome.transitioned;
        failedCount += outcome.failed;
        if (outcome.error) errors.push(outcome.error);
      }
    } finally {
      this.ardriveWorkerRunning = false;
    }

    const summary: ArdriveTurboWorkerTickSummary = {
      startedAt,
      finishedAt: new Date().toISOString(),
      trigger,
      processed: processedCount,
      transitioned: transitionedCount,
      failed: failedCount,
      errors,
    };
    this.ardriveWorkerLastTickAt = summary.finishedAt;
    this.ardriveWorkerLastSummary = summary;

    void this.persistArdriveConnectorEvent('worker_tick_completed', actorId, {
      trigger,
      processed: processedCount,
      transitioned: transitionedCount,
      failed: failedCount,
      errors,
    });

    return {
      ok: true,
      connector: 'ardrive_turbo_connector',
      busy: false,
      summary,
    };
  }

  async runArdriveTurboWorkerProcessOne(
    options: {
      actorId?: string;
      trigger?: ArdriveTurboWorkerTrigger;
      queueId?: string;
    } = {}
  ) {
    if (this.ardriveWorkerRunning) {
      return {
        ok: true,
        connector: 'ardrive_turbo_connector',
        busy: true,
        summary: this.ardriveWorkerLastSummary,
      };
    }

    const actorId = String(options.actorId || 'ardrive-worker').trim() || 'ardrive-worker';
    const trigger = options.trigger || 'manual';
    const requestedQueueId = options.queueId ? String(options.queueId).trim() : '';
    const startedAt = new Date().toISOString();
    let processedCount = 0;
    let transitionedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    this.ardriveWorkerRunning = true;
    try {
      const candidate = requestedQueueId
        ? this.ardriveQueue.find((item) => item.queueId === requestedQueueId)
        : this.ardriveQueue
            .filter((item) => this.isArdriveWorkerProcessable(item.status))
            .sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime())[0];

      if (!candidate) {
        if (requestedQueueId) {
          throw new Error(`Unknown queue item: ${requestedQueueId}`);
        }
      } else {
        const outcome = await this.processArdriveWorkerCandidate(candidate, actorId, trigger);
        processedCount += outcome.processed;
        transitionedCount += outcome.transitioned;
        failedCount += outcome.failed;
        if (outcome.error) errors.push(outcome.error);
      }
    } finally {
      this.ardriveWorkerRunning = false;
    }

    const summary: ArdriveTurboWorkerTickSummary = {
      startedAt,
      finishedAt: new Date().toISOString(),
      trigger,
      processed: processedCount,
      transitioned: transitionedCount,
      failed: failedCount,
      errors,
    };
    this.ardriveWorkerLastTickAt = summary.finishedAt;
    this.ardriveWorkerLastSummary = summary;

    void this.persistArdriveConnectorEvent('worker_process_one_completed', actorId, {
      trigger,
      queueId: requestedQueueId || null,
      processed: processedCount,
      transitioned: transitionedCount,
      failed: failedCount,
      errors,
    });

    return {
      ok: true,
      connector: 'ardrive_turbo_connector',
      busy: false,
      summary,
    };
  }

  async doctor(
    options: {
      remote?: string;
      probe?: boolean;
      strict?: boolean;
    } = {}
  ): Promise<RcloneDoctorResponse> {
    const args = [this.doctorScriptPath, '--json'];
    if (options.remote) {
      args.push('--remote', options.remote);
    }
    if (options.probe) {
      args.push('--probe');
    }
    if (options.strict) {
      args.push('--strict');
    }
    return this.runDoctorScript(args);
  }

  getProviderProfiles() {
    return {
      ok: true,
      providers: this.providerProfiles,
    };
  }

  getProviderBlueprint(providerId: string) {
    const normalized = this.normalizeProviderId(providerId);
    if (!normalized) {
      throw new Error(`Unknown provider: ${String(providerId || '').trim() || 'unknown'}`);
    }

    return {
      ok: true,
      provider: this.providerProfiles.find((provider) => provider.id === normalized),
      blueprint: this.providerBlueprints[normalized],
    };
  }

  async preflightArdriveTurboUpload(input: ArdriveTurboPreflightRequest) {
    const actorId = String(input.actorId || 'admin').trim() || 'admin';
    const fileName = String(input.fileName || '').trim();
    if (!fileName) throw new Error('fileName is required');

    const fileSizeBytes = Number(input.fileSizeBytes);
    if (!Number.isFinite(fileSizeBytes) || fileSizeBytes <= 0) {
      throw new Error('fileSizeBytes must be a positive number');
    }

    this.pruneArdrivePreflights();

    const blueprint = this.providerBlueprints.ardrive;
    const subsidizedThresholdBytes = blueprint.pricing?.subsidizedThresholdBytes || 102400;
    const subsidizedEligible = fileSizeBytes <= subsidizedThresholdBytes;
    const estimatedCredits = subsidizedEligible ? 0 : this.estimateTurboCredits(fileSizeBytes);
    const pricingApi = blueprint.pricing?.pricingApi || null;
    const quote = await this.fetchArdriveTurboQuote(Math.floor(fileSizeBytes));
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.ardrivePreflightTtlMs);
    const preflightId = `ardrive_pf_${now.getTime().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;

    const warnings = [
      'Scaffold mode: final pricing must be resolved against Turbo payment API before submission.',
      'Do not submit to ArDrive without wallet signature ownership checks.',
    ];

    const record: ArdriveTurboPreflightRecord = {
      preflightId,
      actorId,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      fileName,
      fileSizeBytes: Math.floor(fileSizeBytes),
      localPath: input.localPath ? String(input.localPath).trim() || null : null,
      contentType: input.contentType ? String(input.contentType).trim() || null : null,
      targetDriveId: input.targetDriveId ? String(input.targetDriveId).trim() || null : null,
      targetFolderId: input.targetFolderId ? String(input.targetFolderId).trim() || null : null,
      checksumSha256: input.checksumSha256 ? String(input.checksumSha256).trim() || null : null,
      subsidizedEligible,
      subsidizedThresholdBytes,
      estimatedCredits,
      quotedWinc: quote.quotedWinc,
      quoteId: quote.quoteId,
      quoteSource: quote.quoteSource,
      quoteAt: quote.quoteAt,
      quoteEndpoint: quote.quoteEndpoint,
      pricingApi,
      warnings: [...warnings, ...quote.warnings],
    };

    this.ardrivePreflights.set(preflightId, record);
    void this.persistArdriveConnectorEvent('preflight_created', actorId, {
      preflightId,
      fileName: record.fileName,
      fileSizeBytes: record.fileSizeBytes,
      subsidizedEligible,
      estimatedCredits,
      quoteId: record.quoteId,
      quoteSource: record.quoteSource,
      quotedWinc: record.quotedWinc,
      quoteEndpoint: record.quoteEndpoint,
      pricingApi,
    });

    return {
      ok: true,
      connector: 'ardrive_turbo_connector',
      providerId: 'ardrive' as const,
      preflightId,
      createdAt: record.createdAt,
      expiresAt: record.expiresAt,
      file: {
        fileName: record.fileName,
        fileSizeBytes: record.fileSizeBytes,
        contentType: record.contentType,
      },
      pricing: {
        pricingApi,
        subsidizedEligible,
        subsidizedThresholdBytes,
        estimatedCredits,
        quotedWinc: record.quotedWinc,
        quoteId: record.quoteId,
        quoteSource: record.quoteSource,
        quoteAt: record.quoteAt,
        quoteEndpoint: record.quoteEndpoint,
        mode: (record.quoteSource === 'live' ? 'live_quote' : 'estimated_fallback') as
          | 'live_quote'
          | 'estimated_fallback',
      },
      queuePolicy: {
        maxPending: this.ardriveQueueMaxItems,
        preflightTtlSeconds: Math.floor(this.ardrivePreflightTtlMs / 1000),
        quoteTtlSeconds: Math.floor(this.ardriveQuoteTtlMs / 1000),
        requiresWalletSignature: true,
        requiresLiveQuoteBeforeSubmitted: true,
      },
      warnings: record.warnings,
      nextActions: [
        'Call enqueue with this preflightId to create a connector queue item.',
        'Connector worker must resolve/refresh a live Turbo payment quote before upload submit transition.',
      ],
    };
  }

  enqueueArdriveTurboUpload(input: {
    actorId: string;
    preflightId: string;
    localPath?: string;
    targetDriveId?: string;
    targetFolderId?: string;
    checksumSha256?: string;
  }) {
    const actorId = String(input.actorId || 'admin').trim() || 'admin';
    const preflightId = String(input.preflightId || '').trim();
    if (!preflightId) throw new Error('preflightId is required');

    this.pruneArdrivePreflights();
    const preflight = this.ardrivePreflights.get(preflightId);
    if (!preflight) {
      throw new Error('preflightId is unknown or expired; run preflight again');
    }

    if (this.ardriveQueue.length >= this.ardriveQueueMaxItems) {
      throw new Error('ArDrive queue is at capacity; retry after items are processed');
    }

    const now = new Date();
    const queueId = `ardrive_q_${now.getTime().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
    const item: ArdriveTurboQueueItem = {
      queueId,
      preflightId,
      actorId,
      status: 'queued',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      expiresAt: preflight.expiresAt,
      attempts: 0,
      fileName: preflight.fileName,
      fileSizeBytes: preflight.fileSizeBytes,
      localPath: input.localPath ? String(input.localPath).trim() || null : preflight.localPath,
      contentType: preflight.contentType,
      targetDriveId: input.targetDriveId
        ? String(input.targetDriveId).trim() || null
        : preflight.targetDriveId,
      targetFolderId: input.targetFolderId
        ? String(input.targetFolderId).trim() || null
        : preflight.targetFolderId,
      checksumSha256: input.checksumSha256
        ? String(input.checksumSha256).trim() || null
        : preflight.checksumSha256,
      subsidyEligible: preflight.subsidizedEligible,
      quoteId: preflight.quoteId,
      quotedWinc: preflight.quotedWinc,
      quoteSource: preflight.quoteSource,
      quoteAt: preflight.quoteAt,
      quoteEndpoint: preflight.quoteEndpoint,
      pricingApi: preflight.pricingApi,
      requiresWalletSignature: true,
      notes: [
        'Queue item created in scaffold mode.',
        'Submission worker must perform final Turbo pricing and wallet-signature checks.',
      ],
    };

    this.ardriveQueue.unshift(item);
    if (this.ardriveQueue.length > this.ardriveQueueMaxItems) {
      this.ardriveQueue.length = this.ardriveQueueMaxItems;
    }

    void this.persistArdriveConnectorEvent('upload_enqueued', actorId, {
      queueId,
      preflightId,
      fileName: item.fileName,
      fileSizeBytes: item.fileSizeBytes,
      subsidyEligible: item.subsidyEligible,
      quoteId: item.quoteId,
      quoteSource: item.quoteSource,
      quotedWinc: item.quotedWinc,
      targetDriveId: item.targetDriveId,
      targetFolderId: item.targetFolderId,
    });

    return {
      ok: true,
      connector: 'ardrive_turbo_connector',
      item,
      nextActions: [
        'Connector worker can poll queue and transition status to processing/submitted.',
        'Do not bypass final Turbo quote + wallet signature checks.',
      ],
    };
  }

  getArdriveTurboQueue(options: { limit?: number; status?: string } = {}) {
    this.pruneArdrivePreflights();
    const limit = this.clamp(Number(options.limit ?? 20), 1, this.ardriveQueueMaxItems);
    const status = String(options.status || '')
      .trim()
      .toLowerCase();

    const filtered = status
      ? this.ardriveQueue.filter((item) => item.status === status)
      : this.ardriveQueue;

    return {
      ok: true,
      connector: 'ardrive_turbo_connector',
      total: filtered.length,
      limit,
      items: filtered.slice(0, limit),
    };
  }

  async transitionArdriveTurboQueueItem(input: ArdriveTurboTransitionRequest) {
    const actorId = String(input.actorId || 'admin').trim() || 'admin';
    const queueId = String(input.queueId || '').trim();
    if (!queueId) throw new Error('queueId is required');

    const requestedStatus = this.normalizeArdriveQueueStatus(input.status);
    if (!requestedStatus) {
      throw new Error('status must be one of queued|processing|submitted|failed|completed');
    }

    const item = this.ardriveQueue.find((candidate) => candidate.queueId === queueId);
    if (!item) throw new Error(`Unknown queue item: ${queueId}`);

    if (!this.canTransitionArdriveQueue(item.status, requestedStatus)) {
      throw new Error(`Invalid queue transition: ${item.status} -> ${requestedStatus}`);
    }

    if (requestedStatus === 'submitted') {
      await this.ensureLiveQuoteForArdriveQueueItem(item, actorId);
    }

    const previousStatus = item.status;
    item.status = requestedStatus;
    item.updatedAt = new Date().toISOString();
    if (requestedStatus === 'processing') {
      item.attempts += 1;
    }

    const note = input.note ? String(input.note).trim() : '';
    if (note) {
      item.notes.unshift(`[${item.updatedAt}] ${note}`);
      item.notes = item.notes.slice(0, 20);
    }

    void this.persistArdriveConnectorEvent('queue_status_changed', actorId, {
      queueId: item.queueId,
      preflightId: item.preflightId,
      fromStatus: previousStatus,
      toStatus: requestedStatus,
      attempts: item.attempts,
      note: note || null,
      quoteId: item.quoteId,
      quoteSource: item.quoteSource,
      quotedWinc: item.quotedWinc,
    });

    return {
      ok: true,
      connector: 'ardrive_turbo_connector',
      item,
    };
  }

  getGuiDescriptor(
    options: {
      addr?: string;
      baseurl?: string;
      tls?: boolean;
    } = {}
  ): RcloneGuiDescriptor {
    const defaultAddr = process.env.TNF_RCLONE_RC_ADDR || '127.0.0.1:5572';
    const originalAddr = String(options.addr || defaultAddr).trim() || defaultAddr;
    const normalizedAddr = this.normalizeAddr(originalAddr, defaultAddr);
    const baseurl = this.normalizeBaseurl(options.baseurl);
    const tls = Boolean(options.tls);
    const protocol = tls ? 'https' : 'http';
    const url = `${protocol}://${normalizedAddr.value}${baseurl || '/'}`;

    const commandArgs = [
      'rcd',
      '--rc-web-gui',
      '--rc-web-gui-no-open-browser',
      '--rc-addr',
      normalizedAddr.value,
    ];
    if (baseurl) {
      commandArgs.push('--rc-baseurl', baseurl);
    }

    return {
      ok: true,
      url,
      addr: normalizedAddr.value,
      baseurl,
      tls,
      normalized: {
        addrAdjusted: normalizedAddr.adjusted,
        originalAddr,
      },
      policy: this.guiPolicy,
      presets: this.workflowPresets,
      command: {
        binary: 'rclone',
        args: commandArgs,
        display: `rclone ${commandArgs.join(' ')}`,
      },
    };
  }

  async getWorkflowRunLogs(options: { limit?: number; includePersistent?: boolean } = {}) {
    const limit = this.clamp(Number(options.limit ?? 15), 1, this.workflowRunHistoryLimit);
    const runtimeLogs = this.workflowRunHistory.slice(0, limit * 3);
    const includePersistent = options.includePersistent !== false;

    if (!includePersistent) {
      return {
        ok: true,
        total: runtimeLogs.length,
        limit,
        logs: runtimeLogs.slice(0, limit),
      };
    }

    const persistentLogs = await this.getPersistentWorkflowRunLogs(limit * 6);
    const merged = this.mergeLogs(runtimeLogs, persistentLogs).slice(0, limit);

    return {
      ok: true,
      total: merged.length,
      limit,
      logs: merged,
    };
  }

  async runWorkflow(input: RcloneWorkflowRunRequest): Promise<RcloneWorkflowRunLogEntry> {
    const preset = this.workflowPresets.find((item) => item.id === input.presetId);
    if (!preset) {
      throw new Error(`Unknown workflow preset: ${String(input.presetId || '')}`);
    }

    const actorId = String(input.actorId || 'admin').trim() || 'admin';
    const source = this.requirePath(input.source, 'source');
    const destination = this.requirePath(input.destination, 'destination');
    this.enforceProviderGuardrails(source, destination);
    const args = this.buildWorkflowCommandArgs(preset.id, source, destination, input);

    const timeoutMs = this.clamp(
      Number(input.timeoutMs ?? this.defaultWorkflowTimeoutMs),
      30000,
      1200000
    );
    const startedAtDate = new Date();
    const startedAt = startedAtDate.toISOString();
    const id = `rclone_${startedAtDate.getTime().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

    const entry: RcloneWorkflowRunLogEntry = {
      id,
      actorId,
      ok: false,
      status: 'running',
      presetId: preset.id,
      presetLabel: preset.label,
      source,
      destination,
      startedAt,
      updatedAt: startedAt,
      finishedAt: null,
      durationMs: null,
      exitCode: null,
      command: {
        binary: 'rclone',
        args,
        display: `rclone ${args.join(' ')}`,
      },
      stdoutPreview: '',
      stderrPreview: '',
      persistent: false,
    };

    this.addOrUpdateInHistory(entry);

    const child = spawn('rclone', args, {
      cwd: this.repoRoot,
      env: process.env,
    });

    const activeRun: ActiveRunState = {
      child,
      entry,
      timeoutTriggered: false,
      stopRequested: false,
      paused: false,
    };

    this.activeRuns.set(entry.id, activeRun);

    activeRun.timeoutHandle = setTimeout(() => {
      const current = this.activeRuns.get(entry.id);
      if (!current) return;
      current.timeoutTriggered = true;
      current.stopRequested = true;
      this.updateRunStatus(current.entry, 'stopping');
      this.appendRunStderr(current.entry, 'Timeout exceeded. Sending SIGTERM.');
      current.child.kill('SIGTERM');
      this.scheduleForceKill(entry.id, 5000);
      void this.persistRunSnapshot(current.entry, 'timeout_term_sent');
    }, timeoutMs);
    activeRun.timeoutHandle.unref?.();

    child.stdout.on('data', (chunk: Buffer | string) => {
      const current = this.activeRuns.get(entry.id);
      if (!current) return;
      this.appendRunStdout(current.entry, String(chunk || ''));
    });

    child.stderr.on('data', (chunk: Buffer | string) => {
      const current = this.activeRuns.get(entry.id);
      if (!current) return;
      this.appendRunStderr(current.entry, String(chunk || ''));
    });

    child.on('error', (error) => {
      const current = this.activeRuns.get(entry.id);
      if (!current) return;
      this.cleanupActiveRunTimers(current);
      this.activeRuns.delete(entry.id);

      this.appendRunStderr(current.entry, error.message || 'rclone process error');
      this.finalizeRun(current.entry, 'failed', 1);
      void this.persistRunSnapshot(current.entry, 'error');
    });

    child.on('close', (code: number | null, signal: NodeJS.Signals | null) => {
      const current = this.activeRuns.get(entry.id);
      if (!current) return;
      this.cleanupActiveRunTimers(current);
      this.activeRuns.delete(entry.id);

      const status = this.resolveTerminalStatus(current, code, signal);
      const exitCode = this.resolveTerminalExitCode(current, code, signal);
      this.finalizeRun(current.entry, status, exitCode);
      void this.persistRunSnapshot(current.entry, 'finished');
    });

    void this.persistRunSnapshot(entry, 'started');
    return entry;
  }

  async pauseWorkflow(runId: string, actorId: string): Promise<RcloneWorkflowRunLogEntry> {
    const active = this.getActiveRunOrThrow(runId);
    if (active.paused || active.entry.status === 'paused') return active.entry;
    if (active.entry.status === 'stopping') {
      throw new Error('Run is stopping and cannot be paused');
    }

    active.child.kill('SIGSTOP');
    active.paused = true;
    this.updateRunStatus(active.entry, 'paused');
    await this.persistRunSnapshot(active.entry, 'paused', actorId);
    return active.entry;
  }

  async resumeWorkflow(runId: string, actorId: string): Promise<RcloneWorkflowRunLogEntry> {
    const active = this.getActiveRunOrThrow(runId);
    if (!active.paused && active.entry.status !== 'paused') return active.entry;
    if (active.entry.status === 'stopping') {
      throw new Error('Run is stopping and cannot be resumed');
    }

    active.child.kill('SIGCONT');
    active.paused = false;
    this.updateRunStatus(active.entry, 'running');
    await this.persistRunSnapshot(active.entry, 'resumed', actorId);
    return active.entry;
  }

  async stopWorkflow(runId: string, actorId: string): Promise<RcloneWorkflowRunLogEntry> {
    const active = this.getActiveRunOrThrow(runId);
    if (active.stopRequested || active.entry.status === 'stopping') return active.entry;

    active.stopRequested = true;
    if (active.paused) {
      active.child.kill('SIGCONT');
      active.paused = false;
    }

    this.updateRunStatus(active.entry, 'stopping');
    active.child.kill('SIGTERM');
    this.scheduleForceKill(runId, 8000);
    await this.persistRunSnapshot(active.entry, 'stop_requested', actorId);
    return active.entry;
  }

  private getActiveRunOrThrow(runId: string): ActiveRunState {
    const id = String(runId || '').trim();
    if (!id) throw new Error('runId is required');
    const active = this.activeRuns.get(id);
    if (!active) throw new Error(`Run is not active: ${id}`);
    return active;
  }

  private scheduleForceKill(runId: string, delayMs: number): void {
    const active = this.activeRuns.get(runId);
    if (!active) return;
    if (active.stopEscalationHandle) {
      clearTimeout(active.stopEscalationHandle);
    }

    active.stopEscalationHandle = setTimeout(() => {
      const current = this.activeRuns.get(runId);
      if (!current) return;
      current.child.kill('SIGKILL');
    }, delayMs);
    active.stopEscalationHandle.unref?.();
  }

  private cleanupActiveRunTimers(active: ActiveRunState): void {
    if (active.timeoutHandle) clearTimeout(active.timeoutHandle);
    if (active.stopEscalationHandle) clearTimeout(active.stopEscalationHandle);
  }

  private resolveTerminalStatus(
    active: ActiveRunState,
    code: number | null,
    signal: NodeJS.Signals | null
  ): RcloneWorkflowRunStatus {
    if (active.timeoutTriggered) return 'timeout';
    if (active.stopRequested) return 'stopped';
    if (code === 0 && !signal) return 'success';
    return 'failed';
  }

  private resolveTerminalExitCode(
    active: ActiveRunState,
    code: number | null,
    signal: NodeJS.Signals | null
  ): number {
    if (typeof code === 'number') return code;
    if (signal) return this.signalToExitCode(signal);
    if (active.timeoutTriggered) return 124;
    return 1;
  }

  private signalToExitCode(signal: NodeJS.Signals): number {
    const signalCodes: Partial<Record<NodeJS.Signals, number>> = {
      SIGHUP: 1,
      SIGINT: 2,
      SIGQUIT: 3,
      SIGILL: 4,
      SIGABRT: 6,
      SIGFPE: 8,
      SIGKILL: 9,
      SIGSEGV: 11,
      SIGPIPE: 13,
      SIGALRM: 14,
      SIGTERM: 15,
    };
    const signalCode = signalCodes[signal];
    if (!signalCode) return 1;
    return 128 + signalCode;
  }

  private finalizeRun(
    entry: RcloneWorkflowRunLogEntry,
    status: RcloneWorkflowRunStatus,
    exitCode: number
  ): void {
    const finishedAtDate = new Date();
    const finishedAt = finishedAtDate.toISOString();
    const startedAtMs = new Date(entry.startedAt).getTime();
    const durationMs = Number.isFinite(startedAtMs)
      ? Math.max(0, finishedAtDate.getTime() - startedAtMs)
      : 0;

    entry.status = status;
    entry.exitCode = exitCode;
    entry.durationMs = durationMs;
    entry.finishedAt = finishedAt;
    entry.updatedAt = finishedAt;
    entry.ok = status === 'success';

    this.addOrUpdateInHistory(entry);
  }

  private updateRunStatus(entry: RcloneWorkflowRunLogEntry, status: RcloneWorkflowRunStatus): void {
    const now = new Date().toISOString();
    entry.status = status;
    entry.updatedAt = now;
    if (status === 'running' || status === 'paused' || status === 'stopping') {
      entry.ok = false;
    }
    this.addOrUpdateInHistory(entry);
  }

  private appendRunStdout(entry: RcloneWorkflowRunLogEntry, chunk: string): void {
    if (!chunk) return;
    const next = `${entry.stdoutPreview}${chunk}`;
    entry.stdoutPreview = this.previewOutput(next);
    entry.updatedAt = new Date().toISOString();
  }

  private appendRunStderr(entry: RcloneWorkflowRunLogEntry, chunk: string): void {
    if (!chunk) return;
    const next = `${entry.stderrPreview}${chunk}`;
    entry.stderrPreview = this.previewOutput(next);
    entry.updatedAt = new Date().toISOString();
  }

  private addOrUpdateInHistory(entry: RcloneWorkflowRunLogEntry): void {
    const idx = this.workflowRunHistory.findIndex((row) => row.id === entry.id);
    if (idx >= 0) {
      this.workflowRunHistory[idx] = { ...entry };
    } else {
      this.workflowRunHistory.unshift({ ...entry });
      if (this.workflowRunHistory.length > this.workflowRunHistoryLimit) {
        this.workflowRunHistory.length = this.workflowRunHistoryLimit;
      }
    }
  }

  private async persistRunSnapshot(
    entry: RcloneWorkflowRunLogEntry,
    event: string,
    actorOverride?: string
  ): Promise<void> {
    const actorId = String(actorOverride || entry.actorId || 'system');
    const snapshot = this.asPersistedSnapshot(entry);

    try {
      await this.auditService.log(this.workflowSnapshotAction, {
        userId: actorId,
        resourceType: 'rclone_runtime_workflow',
        resourceId: entry.id,
        status: entry.status,
        details: {
          event,
          run: snapshot,
        },
      });
    } catch (error) {
      this.logger.warn(`Failed to write rclone audit snapshot: ${(error as Error).message}`);
    }

    try {
      await this.unifiedLedgerService.createTimelineEvent({
        userId: actorId,
        eventType: 'historical_event',
        actor: actorId,
        payload: {
          category: 'rclone_workflow_log',
          event,
          runId: entry.id,
          presetId: entry.presetId,
          presetLabel: entry.presetLabel,
          status: entry.status,
          ok: entry.ok,
          source: entry.source,
          destination: entry.destination,
          exitCode: entry.exitCode,
          durationMs: entry.durationMs,
          command: entry.command.display,
          stderrPreview: this.previewOutput(entry.stderrPreview).slice(0, 1200),
          stdoutPreview: this.previewOutput(entry.stdoutPreview).slice(0, 1200),
        },
      });
    } catch (error) {
      this.logger.warn(`Failed to write rclone timeline snapshot: ${(error as Error).message}`);
    }

    entry.persistent = true;
    this.addOrUpdateInHistory(entry);
  }

  private asPersistedSnapshot(entry: RcloneWorkflowRunLogEntry): RcloneWorkflowRunLogEntry {
    return {
      ...entry,
      command: {
        ...entry.command,
        args: [...entry.command.args],
      },
      stdoutPreview: this.previewOutput(entry.stdoutPreview),
      stderrPreview: this.previewOutput(entry.stderrPreview),
      persistent: true,
    };
  }

  private async getPersistentWorkflowRunLogs(limit: number): Promise<RcloneWorkflowRunLogEntry[]> {
    try {
      const rows = await this.auditService.getLogs({
        action: this.workflowSnapshotAction,
        resourceType: 'rclone_runtime_workflow',
        limit,
      });
      return this.parsePersistentRows(rows);
    } catch (error) {
      this.logger.warn(`Failed to read persistent rclone logs: ${(error as Error).message}`);
      return [];
    }
  }

  private parsePersistentRows(rows: AuditLogEntry[]): RcloneWorkflowRunLogEntry[] {
    const byRunId = new Map<string, RcloneWorkflowRunLogEntry>();

    for (const row of rows) {
      const details = (row.details || {}) as Record<string, unknown>;
      const run = details.run as Record<string, unknown> | undefined;
      if (!run) continue;

      const normalized = this.normalizePersistedRun(run, row);
      if (!normalized) continue;

      const existing = byRunId.get(normalized.id);
      if (!existing) {
        byRunId.set(normalized.id, normalized);
        continue;
      }

      if (this.toEpochMs(normalized.updatedAt) > this.toEpochMs(existing.updatedAt)) {
        byRunId.set(normalized.id, normalized);
      }
    }

    return Array.from(byRunId.values()).sort(
      (a, b) => this.toEpochMs(b.updatedAt) - this.toEpochMs(a.updatedAt)
    );
  }

  private normalizePersistedRun(
    run: Record<string, unknown>,
    row: AuditLogEntry
  ): RcloneWorkflowRunLogEntry | null {
    const id = String(run.id || row.resourceId || '').trim();
    if (!id) return null;

    const status = this.normalizeRunStatus(String(run.status || row.status || 'failed'));

    const fallbackCreatedAt = this.toIsoTimestamp(row.createdAt);
    return {
      id,
      actorId: String(run.actorId || row.userId || 'system'),
      ok: Boolean(run.ok),
      status,
      presetId: this.normalizePresetId(String(run.presetId || 'sync')),
      presetLabel: String(run.presetLabel || 'Workflow'),
      source: String(run.source || ''),
      destination: String(run.destination || ''),
      startedAt: this.toIsoTimestamp(run.startedAt, fallbackCreatedAt),
      updatedAt: this.toIsoTimestamp(run.updatedAt, fallbackCreatedAt),
      finishedAt:
        run.finishedAt == null ? null : this.toIsoTimestamp(run.finishedAt, fallbackCreatedAt),
      durationMs: run.durationMs == null ? null : Number(run.durationMs),
      exitCode: run.exitCode == null ? null : Number(run.exitCode),
      command: {
        binary: 'rclone',
        args: Array.isArray((run.command as Record<string, unknown>)?.args)
          ? ((run.command as Record<string, unknown>).args as unknown[]).map((value) =>
              String(value || '')
            )
          : [],
        display: String((run.command as Record<string, unknown>)?.display || 'rclone'),
      },
      stdoutPreview: String(run.stdoutPreview || ''),
      stderrPreview: String(run.stderrPreview || ''),
      persistent: true,
    };
  }

  private normalizeRunStatus(value: string): RcloneWorkflowRunStatus {
    const normalized = value.toLowerCase();
    const allowed: RcloneWorkflowRunStatus[] = [
      'running',
      'paused',
      'stopping',
      'stopped',
      'success',
      'failed',
      'timeout',
    ];
    if (allowed.includes(normalized as RcloneWorkflowRunStatus)) {
      return normalized as RcloneWorkflowRunStatus;
    }
    return 'failed';
  }

  private normalizePresetId(value: string): RcloneWorkflowPreset['id'] {
    const normalized = value.toLowerCase();
    if (normalized === 'backup') return 'backup';
    if (normalized === 'mirror') return 'mirror';
    if (normalized === 'migrate') return 'migrate';
    if (normalized === 'offload') return 'offload';
    return 'sync';
  }

  private mergeLogs(
    runtimeLogs: RcloneWorkflowRunLogEntry[],
    persistentLogs: RcloneWorkflowRunLogEntry[]
  ): RcloneWorkflowRunLogEntry[] {
    const map = new Map<string, RcloneWorkflowRunLogEntry>();

    for (const row of persistentLogs) {
      map.set(row.id, { ...row, command: { ...row.command, args: [...row.command.args] } });
    }
    for (const row of runtimeLogs) {
      const existing = map.get(row.id);
      if (!existing) {
        map.set(row.id, { ...row, command: { ...row.command, args: [...row.command.args] } });
        continue;
      }

      const runtimeUpdated = this.toEpochMs(row.updatedAt);
      const existingUpdated = this.toEpochMs(existing.updatedAt);
      if (runtimeUpdated >= existingUpdated) {
        map.set(row.id, { ...row, command: { ...row.command, args: [...row.command.args] } });
      }
    }

    return Array.from(map.values()).sort(
      (a, b) => this.toEpochMs(b.updatedAt) - this.toEpochMs(a.updatedAt)
    );
  }

  private async runDoctorScript(args: string[]): Promise<RcloneDoctorResponse> {
    try {
      const { stdout } = await execFileAsync('node', args, {
        cwd: this.repoRoot,
        timeout: 120000,
        maxBuffer: 1024 * 1024 * 8,
      });
      return JSON.parse(String(stdout || '{}')) as RcloneDoctorResponse;
    } catch (error) {
      const execError = error as Error & { stdout?: string; stderr?: string; message?: string };
      const stdout = String(execError.stdout || '').trim();
      if (stdout) {
        try {
          return JSON.parse(stdout) as RcloneDoctorResponse;
        } catch {
          // Ignore parse failure and throw below.
        }
      }
      const stderr = String(execError.stderr || '').trim();
      throw new Error(stderr || execError.message || 'Failed to run rclone doctor');
    }
  }

  private normalizeBaseurl(value?: string): string {
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (raw === '/') return '';
    return raw.startsWith('/') ? raw : `/${raw}`;
  }

  private normalizeAddr(input: string, fallback: string): { value: string; adjusted: boolean } {
    const raw = String(input || '').trim();
    const defaultAddr = String(fallback || '127.0.0.1:5572').trim() || '127.0.0.1:5572';
    if (!raw) return { value: defaultAddr, adjusted: false };

    const bracketMatch = raw.match(/^\[([^\]]+)\](?::(\d+))?$/);
    let host = '127.0.0.1';
    let port = '5572';

    if (bracketMatch) {
      host = bracketMatch[1] || host;
      port = bracketMatch[2] || port;
    } else {
      const separator = raw.lastIndexOf(':');
      if (separator > -1 && separator < raw.length - 1) {
        host = raw.slice(0, separator) || host;
        port = raw.slice(separator + 1) || port;
      } else if (raw.length > 0) {
        host = raw;
      }
    }

    if (!this.guiPolicy.enforceLoopbackAddr) {
      return { value: `${host}:${port}`, adjusted: false };
    }

    const hostAllowed = this.guiPolicy.allowedHosts.includes(host);
    if (hostAllowed) {
      return { value: `${host}:${port}`, adjusted: false };
    }

    return {
      value: `127.0.0.1:${port}`,
      adjusted: true,
    };
  }

  private buildWorkflowCommandArgs(
    presetId: RcloneWorkflowPreset['id'],
    source: string,
    destination: string,
    input: RcloneWorkflowRunRequest
  ): string[] {
    const args = this.baseWorkflowCommandArgs(presetId, source, destination);

    if (input.dryRun) args.push('--dry-run');
    if (input.checksum && !args.includes('--checksum')) args.push('--checksum');

    if (input.bwlimit && String(input.bwlimit).trim()) {
      args.push('--bwlimit', String(input.bwlimit).trim());
    }

    if (input.transfers != null && Number.isFinite(Number(input.transfers))) {
      const transferValue = this.clamp(Number(input.transfers), 1, 64);
      const existingIndex = args.indexOf('--transfers');
      if (existingIndex > -1) {
        args[existingIndex + 1] = String(transferValue);
      } else {
        args.push('--transfers', String(transferValue));
      }
    }

    const extraArgs = this.validateExtraArgs(input.extraArgs || []);
    if (extraArgs.length > 0) args.push(...extraArgs);

    return args;
  }

  private baseWorkflowCommandArgs(
    presetId: RcloneWorkflowPreset['id'],
    source: string,
    destination: string
  ): string[] {
    if (presetId === 'sync') {
      return ['sync', source, destination, '--progress', '--create-empty-src-dirs'];
    }
    if (presetId === 'backup') {
      return ['copy', source, destination, '--checksum', '--progress'];
    }
    if (presetId === 'mirror') {
      return ['sync', source, destination, '--delete-during', '--progress'];
    }
    if (presetId === 'migrate') {
      return ['move', source, destination, '--progress', '--transfers', '4'];
    }
    return ['move', source, destination, '--progress', '--min-age', '10m'];
  }

  private validateExtraArgs(input: string[]): string[] {
    const tokens = (Array.isArray(input) ? input : [])
      .map((token) => String(token || '').trim())
      .filter(Boolean);
    if (tokens.length === 0) return [];

    const blockedFlags = new Set(this.guiPolicy.blockedFlags.map((flag) => flag.toLowerCase()));
    const safeArgs: string[] = [];

    for (let i = 0; i < tokens.length; i += 1) {
      const flag = tokens[i];
      const normalizedFlag = flag.toLowerCase();

      if (!flag.startsWith('-')) {
        throw new Error(`Invalid extra argument token: ${flag}`);
      }
      if (blockedFlags.has(normalizedFlag)) {
        throw new Error(`Blocked flag not allowed: ${flag}`);
      }

      if (this.allowedSingleExtraFlags.has(flag)) {
        safeArgs.push(flag);
        continue;
      }

      if (this.allowedValuedExtraFlags.has(flag)) {
        const value = tokens[i + 1];
        if (!value || value.startsWith('-')) {
          throw new Error(`Flag requires a value: ${flag}`);
        }
        safeArgs.push(flag, value);
        i += 1;
        continue;
      }

      throw new Error(`Unsupported extra flag: ${flag}`);
    }

    return safeArgs;
  }

  private normalizeProviderId(value: string): RcloneProviderProfile['id'] | null {
    const normalized = String(value || '')
      .trim()
      .toLowerCase();
    if (normalized === 'pcloud') return 'pcloud';
    if (normalized === 'degoo') return 'degoo';
    if (normalized === 'ardrive') return 'ardrive';
    return null;
  }

  private isArdriveWorkerProcessable(status: ArdriveTurboQueueStatus): boolean {
    return status === 'queued' || status === 'processing' || status === 'submitted';
  }

  private async processArdriveWorkerCandidate(
    item: ArdriveTurboQueueItem,
    actorId: string,
    trigger: ArdriveTurboWorkerTrigger
  ): Promise<{ processed: number; transitioned: number; failed: number; error?: string }> {
    try {
      if (item.status === 'queued') {
        await this.transitionArdriveTurboQueueItem({
          actorId,
          queueId: item.queueId,
          status: 'processing',
          note: `Worker tick (${trigger}) started processing`,
        });
        return { processed: 1, transitioned: 1, failed: 0 };
      }

      if (item.status === 'processing') {
        await this.transitionArdriveTurboQueueItem({
          actorId,
          queueId: item.queueId,
          status: 'submitted',
          note: `Worker tick (${trigger}) submitted upload`,
        });
        return { processed: 1, transitioned: 1, failed: 0 };
      }

      if (item.status === 'submitted') {
        await this.transitionArdriveTurboQueueItem({
          actorId,
          queueId: item.queueId,
          status: 'completed',
          note: `Worker tick (${trigger}) marked upload complete`,
        });
        return { processed: 1, transitioned: 1, failed: 0 };
      }

      return { processed: 0, transitioned: 0, failed: 0 };
    } catch (error) {
      const message = (error as Error).message || 'unknown worker error';
      let transitioned = 0;

      if (this.isArdriveWorkerProcessable(item.status)) {
        try {
          await this.transitionArdriveTurboQueueItem({
            actorId,
            queueId: item.queueId,
            status: 'failed',
            note: `Worker tick auto-failed item: ${message}`,
          });
          transitioned += 1;
        } catch (markError) {
          return {
            processed: 1,
            transitioned,
            failed: 1,
            error: `${item.queueId}: ${message} | mark-failed error: ${(markError as Error).message || 'unknown'}`,
          };
        }
      }

      return {
        processed: 1,
        transitioned,
        failed: 1,
        error: `${item.queueId}: ${message}`,
      };
    }
  }

  private startArdriveWorkerLoop(): void {
    if (this.ardriveWorkerTimer) return;
    this.ardriveWorkerTimer = setInterval(() => {
      void this.runArdriveTurboWorkerTick({
        actorId: 'ardrive-worker',
        trigger: 'interval',
      });
    }, this.ardriveWorkerIntervalMs);
    this.ardriveWorkerTimer.unref?.();
    this.logger.log(
      `ArDrive connector worker started (interval=${this.ardriveWorkerIntervalMs}ms, batch=${this.ardriveWorkerBatchSize})`
    );
  }

  private stopArdriveWorkerLoop(): void {
    if (!this.ardriveWorkerTimer) return;
    clearInterval(this.ardriveWorkerTimer);
    this.ardriveWorkerTimer = undefined;
    this.logger.log('ArDrive connector worker stopped');
  }

  private async ensureLiveQuoteForArdriveQueueItem(
    item: ArdriveTurboQueueItem,
    actorId: string
  ): Promise<void> {
    const quoteStillFresh = !this.isArdriveQuoteExpired(item.quoteAt);
    if (item.quoteSource === 'live' && item.quoteId && item.quotedWinc && quoteStillFresh) {
      return;
    }

    const quote = await this.fetchArdriveTurboQuote(item.fileSizeBytes);
    item.quoteId = quote.quoteId;
    item.quotedWinc = quote.quotedWinc;
    item.quoteSource = quote.quoteSource;
    item.quoteAt = quote.quoteAt;
    item.quoteEndpoint = quote.quoteEndpoint;
    item.updatedAt = new Date().toISOString();

    void this.persistArdriveConnectorEvent('queue_quote_refreshed', actorId, {
      queueId: item.queueId,
      preflightId: item.preflightId,
      quoteId: item.quoteId,
      quoteSource: item.quoteSource,
      quotedWinc: item.quotedWinc,
      quoteEndpoint: item.quoteEndpoint,
    });

    if (item.quoteSource !== 'live' || !item.quoteId || !item.quotedWinc) {
      throw new Error(
        'Cannot transition to submitted without a live Turbo payment quote. Retry when payment API is reachable.'
      );
    }
  }

  private isArdriveQuoteExpired(quoteAt: string | null): boolean {
    if (!quoteAt) return true;
    const epoch = new Date(quoteAt).getTime();
    if (!Number.isFinite(epoch)) return true;
    return Date.now() - epoch > this.ardriveQuoteTtlMs;
  }

  private async fetchArdriveTurboQuote(fileSizeBytes: number): Promise<ArdriveTurboQuoteRecord> {
    const normalizedSize = Math.max(1, Math.floor(Number(fileSizeBytes || 0)));
    const endpoint = `${this.ardrivePaymentApiBase.replace(/\/+$/, '')}/price/bytes/${normalizedSize}`;
    const quoteAt = new Date().toISOString();
    const quoteId = `turbo_quote_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.ardrivePaymentTimeoutMs);
    timer.unref?.();

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`Turbo payment quote request failed (${response.status})`);
      }

      const payload = (await response.json()) as { winc?: unknown };
      const wincRaw = String(payload?.winc || '').trim();
      if (!/^\d+$/.test(wincRaw)) {
        throw new Error('Turbo payment quote response missing numeric winc');
      }

      return {
        quoteId,
        quotedWinc: wincRaw,
        quoteSource: 'live',
        quoteAt,
        quoteEndpoint: endpoint,
        warnings: [],
      };
    } catch (error) {
      return {
        quoteId: null,
        quotedWinc: null,
        quoteSource: 'estimated',
        quoteAt,
        quoteEndpoint: endpoint,
        warnings: [
          `Live Turbo quote unavailable: ${(error as Error).message || 'unknown error'}`,
          'Submitted transition will remain blocked until a live quote is available.',
        ],
      };
    } finally {
      clearTimeout(timer);
    }
  }

  private normalizeArdriveQueueStatus(value: string): ArdriveTurboQueueStatus | null {
    const normalized = String(value || '')
      .trim()
      .toLowerCase();
    if (normalized === 'queued') return 'queued';
    if (normalized === 'processing') return 'processing';
    if (normalized === 'submitted') return 'submitted';
    if (normalized === 'failed') return 'failed';
    if (normalized === 'completed') return 'completed';
    return null;
  }

  private canTransitionArdriveQueue(
    current: ArdriveTurboQueueStatus,
    next: ArdriveTurboQueueStatus
  ): boolean {
    if (current === next) return true;
    if (current === 'queued') return next === 'processing' || next === 'failed';
    if (current === 'processing') return next === 'submitted' || next === 'failed';
    if (current === 'submitted') return next === 'completed' || next === 'failed';
    if (current === 'failed') return next === 'processing';
    return false;
  }

  private estimateTurboCredits(fileSizeBytes: number): number {
    const mb = fileSizeBytes / (1024 * 1024);
    return Math.max(1, Math.ceil(mb));
  }

  private pruneArdrivePreflights(): void {
    const now = Date.now();
    for (const [id, record] of this.ardrivePreflights.entries()) {
      const expiresMs = new Date(record.expiresAt).getTime();
      if (!Number.isFinite(expiresMs) || expiresMs <= now) {
        this.ardrivePreflights.delete(id);
      }
    }
  }

  private async persistArdriveConnectorEvent(
    event: string,
    actorId: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    try {
      await this.auditService.log(this.ardriveConnectorEventAction, {
        userId: actorId,
        resourceType: 'ardrive_turbo_connector',
        resourceId: String(payload.queueId || payload.preflightId || event),
        status: event,
        details: {
          event,
          payload,
        },
      });
    } catch (error) {
      this.logger.warn(
        `Failed to write ArDrive connector audit snapshot: ${(error as Error).message}`
      );
    }

    try {
      await this.unifiedLedgerService.createTimelineEvent({
        userId: actorId,
        eventType: 'historical_event',
        actor: actorId,
        payload: {
          category: 'ardrive_connector_event',
          event,
          ...payload,
        },
      });
    } catch (error) {
      this.logger.warn(
        `Failed to write ArDrive connector timeline snapshot: ${(error as Error).message}`
      );
    }
  }

  private enforceProviderGuardrails(source: string, destination: string): void {
    const aliases = [this.extractRemoteAlias(source), this.extractRemoteAlias(destination)].filter(
      (value): value is string => Boolean(value)
    );

    for (const alias of aliases) {
      if (alias === 'degoo') {
        throw new Error(
          'Degoo direct remote execution is disabled in TNF managed runtime. Use an official bridge workflow only.'
        );
      }

      if (alias === 'ardrive' || alias === 'turbo' || alias === 'arweave') {
        throw new Error(
          'ArDrive requires the custom Turbo connector path. Use provider blueprint and connector flow, not direct rclone execution.'
        );
      }
    }
  }

  private extractRemoteAlias(value: string): string | null {
    const text = String(value || '').trim();
    if (!text) return null;
    if (/^[a-zA-Z]:[\\/]/.test(text)) return null;

    const match = text.match(/^([a-zA-Z0-9._-]+):/);
    if (!match) return null;
    return String(match[1] || '').toLowerCase();
  }

  private previewOutput(value: string | Buffer | undefined): string {
    const text = String(value || '').trim();
    if (!text) return '';
    if (text.length <= this.maxOutputPreviewChars) return text;
    return `${text.slice(0, this.maxOutputPreviewChars)}\n...[truncated]`;
  }

  private requirePath(value: string, fieldName: 'source' | 'destination'): string {
    const normalized = String(value || '').trim();
    if (!normalized) throw new Error(`${fieldName} is required`);
    if (normalized.length > 1024) throw new Error(`${fieldName} is too long`);
    return normalized;
  }

  private clamp(value: number, min: number, max: number): number {
    if (!Number.isFinite(value)) return min;
    return Math.max(min, Math.min(max, Math.floor(value)));
  }

  private toBooleanEnv(value: string | undefined, fallback: boolean): boolean {
    if (typeof value !== 'string') return fallback;
    const normalized = value.trim().toLowerCase();
    if (!normalized) return fallback;
    if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
    return fallback;
  }

  private toIsoTimestamp(value: unknown, fallback?: string): string {
    const fallbackIso = fallback && fallback.trim() ? fallback : new Date().toISOString();
    if (value instanceof Date) {
      const epoch = value.getTime();
      return Number.isFinite(epoch) ? new Date(epoch).toISOString() : fallbackIso;
    }
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 0) {
      return new Date(numeric).toISOString();
    }
    const text = String(value || '').trim();
    if (!text) return fallbackIso;
    const parsed = new Date(text).getTime();
    return Number.isFinite(parsed) ? new Date(parsed).toISOString() : fallbackIso;
  }

  private toEpochMs(value: string): number {
    const parsed = new Date(String(value || '')).getTime();
    if (Number.isFinite(parsed)) return parsed;
    return 0;
  }

  private resolveRepoRoot(): string {
    const marker = path.join('scripts', 'tnf-rclone-doctor.cjs');
    let current = process.cwd();

    for (let i = 0; i < 8; i += 1) {
      if (fs.existsSync(path.join(current, marker))) return current;
      const next = path.dirname(current);
      if (next === current) break;
      current = next;
    }

    return process.cwd();
  }
}
