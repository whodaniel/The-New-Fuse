import { GlassCard } from '@/components/ui/premium/GlassCard';
import { PremiumButton } from '@/components/ui/premium/PremiumButton';
import {
  AlertTriangle,
  ArrowRightLeft,
  Cloud,
  Copy,
  ExternalLink,
  HardDrive,
  ListRestart,
  Pause,
  Play,
  RefreshCw,
  ShieldCheck,
  Square,
  TerminalSquare,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

type DoctorCheck = {
  name: string;
  ok: boolean;
  detail: string;
};

type DoctorResponse = {
  ok: boolean;
  strict: boolean;
  remote: string;
  checks: DoctorCheck[];
};

type WorkflowPreset = {
  id: 'sync' | 'backup' | 'mirror' | 'migrate' | 'offload';
  label: string;
  description: string;
  commandTemplate: string;
  risk: 'low' | 'medium' | 'high';
  tags: string[];
};

type GuiPolicy = {
  enforceLoopbackAddr: boolean;
  allowedHosts: string[];
  allowIframe: boolean;
  allowTlsToggle: boolean;
  allowCustomBaseurl: boolean;
  blockedFlags: string[];
};

type ProviderProfile = {
  id: 'pcloud' | 'degoo' | 'ardrive';
  label: string;
  supportMode: 'native_rclone' | 'bridge_workflow' | 'custom_connector';
  status: 'ready' | 'prototype' | 'planned';
  backendHint: string;
  notes: string;
  docs: string[];
};

type ProvidersResponse = {
  ok: boolean;
  providers: ProviderProfile[];
};

type ProviderBlueprint = {
  id: ProviderProfile['id'];
  summary: string;
  techStack: string[];
  integrationApproach: string[];
  compliance: {
    automationPolicy: 'native_allowed' | 'bridge_only' | 'custom_connector_only';
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

type ProviderBlueprintResponse = {
  ok: boolean;
  provider?: ProviderProfile;
  blueprint: ProviderBlueprint;
};

type ArdrivePreflightResponse = {
  ok: boolean;
  connector: 'ardrive_turbo_connector';
  providerId: 'ardrive';
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
    estimatedCredits: number | null;
    quotedWinc: string | null;
    quoteId: string | null;
    quoteSource: 'live' | 'estimated';
    quoteAt: string | null;
    quoteEndpoint: string | null;
    mode: 'live_quote' | 'estimated_fallback';
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
};

type ArdriveQueueItem = {
  queueId: string;
  preflightId: string;
  actorId: string;
  status: 'queued' | 'processing' | 'submitted' | 'failed' | 'completed';
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
  quoteSource: 'live' | 'estimated';
  quoteAt: string | null;
  quoteEndpoint: string | null;
  pricingApi: string | null;
  requiresWalletSignature: boolean;
  notes: string[];
};

type ArdriveQueueResponse = {
  ok: boolean;
  connector: 'ardrive_turbo_connector';
  total: number;
  limit: number;
  items: ArdriveQueueItem[];
};

type ArdriveWorkerStatusResponse = {
  ok: boolean;
  connector: 'ardrive_turbo_connector';
  worker: {
    enabled: boolean;
    running: boolean;
    intervalMs: number;
    batchSize: number;
    lastTickAt: string | null;
    lastSummary: {
      startedAt: string;
      finishedAt: string;
      trigger: 'manual' | 'interval';
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
};

type GuiDescriptor = {
  ok: boolean;
  url: string;
  addr: string;
  baseurl: string;
  tls: boolean;
  normalized: {
    addrAdjusted: boolean;
    originalAddr: string;
  };
  policy: GuiPolicy;
  presets: WorkflowPreset[];
  command: {
    binary: string;
    args: string[];
    display: string;
  };
};

type WorkflowRunStatus =
  | 'running'
  | 'paused'
  | 'stopping'
  | 'stopped'
  | 'success'
  | 'failed'
  | 'timeout';

type WorkflowRunResult = {
  id: string;
  actorId: string;
  ok: boolean;
  status: WorkflowRunStatus;
  presetId: WorkflowPreset['id'];
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

type WorkflowLogsResponse = {
  ok: boolean;
  total: number;
  limit: number;
  logs: WorkflowRunResult[];
};

const fallbackPresets: WorkflowPreset[] = [
  {
    id: 'sync',
    label: 'Sync',
    description: 'Incremental sync from source to destination.',
    commandTemplate: 'rclone sync {source} {destination} --progress --create-empty-src-dirs',
    risk: 'medium',
    tags: ['incremental', 'operational'],
  },
  {
    id: 'backup',
    label: 'Backup',
    description: 'Checksum-focused backup copy.',
    commandTemplate: 'rclone copy {source} {destination} --checksum --progress',
    risk: 'low',
    tags: ['checksum', 'resilient'],
  },
  {
    id: 'mirror',
    label: 'Mirror',
    description: 'Exact mirror with destination deletion.',
    commandTemplate: 'rclone sync {source} {destination} --delete-during --progress',
    risk: 'high',
    tags: ['destructive', 'exact-state'],
  },
  {
    id: 'migrate',
    label: 'Migrate',
    description: 'Move payloads and remove source after transfer.',
    commandTemplate: 'rclone move {source} {destination} --progress --transfers 4',
    risk: 'high',
    tags: ['migration', 'remote-to-remote'],
  },
  {
    id: 'offload',
    label: 'Offload',
    description: 'Free local disk by moving older files out.',
    commandTemplate: 'rclone move {source} {destination} --progress --min-age 10m',
    risk: 'medium',
    tags: ['storage', 'archive'],
  },
];

function shellEscape(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "''";
  if (/^[a-zA-Z0-9_./:@+=,-]+$/.test(trimmed)) return trimmed;
  return `'${trimmed.replace(/'/g, `'\\''`)}'`;
}

function tokenizeInput(input: string): string[] {
  const raw = String(input || '').trim();
  if (!raw) return [];
  const tokens = raw.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
  return tokens
    .map((token) => token.replace(/^"|"$/g, '').replace(/^'|'$/g, '').trim())
    .filter(Boolean);
}

function riskClasses(risk: WorkflowPreset['risk']): string {
  if (risk === 'high') return 'border-rose-500/30 bg-rose-500/10 text-rose-200';
  if (risk === 'medium') return 'border-amber-500/30 bg-amber-500/10 text-amber-200';
  return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200';
}

function statusClasses(status: WorkflowRunStatus): string {
  if (status === 'success') return 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200';
  if (status === 'running') return 'border-cyan-500/25 bg-cyan-500/10 text-cyan-200';
  if (status === 'paused') return 'border-indigo-500/25 bg-indigo-500/10 text-indigo-200';
  if (status === 'stopping' || status === 'timeout')
    return 'border-amber-500/25 bg-amber-500/10 text-amber-200';
  if (status === 'stopped') return 'border-slate-400/25 bg-slate-500/10 text-slate-200';
  return 'border-rose-500/25 bg-rose-500/10 text-rose-200';
}

function extractRemoteAlias(value: string): string | null {
  const text = String(value || '').trim();
  if (!text) return null;
  if (/^[a-zA-Z]:[\\/]/.test(text)) return null;
  const match = text.match(/^([a-zA-Z0-9._-]+):/);
  if (!match) return null;
  return String(match[1] || '').toLowerCase();
}

export function RcloneMobilityControl() {
  const [remote, setRemote] = useState('pcloud:');
  const [probe, setProbe] = useState(false);
  const [doctorLoading, setDoctorLoading] = useState(false);
  const [doctorData, setDoctorData] = useState<DoctorResponse | null>(null);

  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState<ProviderProfile['id']>('pcloud');
  const [providerBlueprint, setProviderBlueprint] = useState<ProviderBlueprint | null>(null);
  const [providerBlueprintLoading, setProviderBlueprintLoading] = useState(false);
  const [ardriveFileName, setArdriveFileName] = useState('asset.bin');
  const [ardriveFileSizeKiB, setArdriveFileSizeKiB] = useState('96');
  const [ardriveLocalPath, setArdriveLocalPath] = useState('/tmp/asset.bin');
  const [ardriveContentType, setArdriveContentType] = useState('application/octet-stream');
  const [ardriveTargetDriveId, setArdriveTargetDriveId] = useState('');
  const [ardriveTargetFolderId, setArdriveTargetFolderId] = useState('');
  const [ardrivePreflightLoading, setArdrivePreflightLoading] = useState(false);
  const [ardriveEnqueueLoading, setArdriveEnqueueLoading] = useState(false);
  const [ardriveQueueLoading, setArdriveQueueLoading] = useState(false);
  const [ardriveTransitionLoading, setArdriveTransitionLoading] = useState<string | null>(null);
  const [ardriveWorkerLoading, setArdriveWorkerLoading] = useState(false);
  const [ardriveWorkerTicking, setArdriveWorkerTicking] = useState(false);
  const [ardriveWorkerProcessOneLoading, setArdriveWorkerProcessOneLoading] = useState<
    string | null
  >(null);
  const [ardrivePreflight, setArdrivePreflight] = useState<ArdrivePreflightResponse | null>(null);
  const [ardriveQueue, setArdriveQueue] = useState<ArdriveQueueItem[]>([]);
  const [ardriveWorkerStatus, setArdriveWorkerStatus] =
    useState<ArdriveWorkerStatusResponse | null>(null);

  const [addr, setAddr] = useState('127.0.0.1:5572');
  const [baseurl, setBaseurl] = useState('');
  const [tls, setTls] = useState(false);
  const [guiLoading, setGuiLoading] = useState(false);
  const [guiData, setGuiData] = useState<GuiDescriptor | null>(null);
  const [embedEnabled, setEmbedEnabled] = useState(false);

  const [selectedPresetId, setSelectedPresetId] = useState<WorkflowPreset['id']>('sync');
  const [sourcePath, setSourcePath] = useState('~/Desktop');
  const [destinationPath, setDestinationPath] = useState('pcloud:/TNF-Offload');
  const [dryRun, setDryRun] = useState(true);
  const [checksum, setChecksum] = useState(false);
  const [bwlimit, setBwlimit] = useState('');
  const [transfers, setTransfers] = useState('');
  const [extraFlags, setExtraFlags] = useState('');

  const [workflowRunning, setWorkflowRunning] = useState(false);
  const [runControlLoading, setRunControlLoading] = useState<string | null>(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const [autoRefreshLogs, setAutoRefreshLogs] = useState(true);
  const [runResult, setRunResult] = useState<WorkflowRunResult | null>(null);
  const [runLogs, setRunLogs] = useState<WorkflowRunResult[]>([]);

  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const authHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }, []);

  const loadDoctor = useCallback(async () => {
    setDoctorLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (remote.trim()) params.set('remote', remote.trim());
      if (probe) params.set('probe', 'true');
      const res = await fetch(`/api/admin/rclone/runtime/doctor?${params.toString()}`, {
        headers: authHeaders(),
      });
      const payload = await res.json();
      if (!res.ok)
        throw new Error(payload?.message || payload?.error || 'Failed to load rclone doctor');
      setDoctorData(payload as DoctorResponse);
    } catch (e) {
      setError((e as Error).message || 'Failed to load rclone doctor');
    } finally {
      setDoctorLoading(false);
    }
  }, [authHeaders, probe, remote]);

  const loadProviders = useCallback(async () => {
    setProvidersLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/rclone/runtime/providers', {
        headers: authHeaders(),
      });
      const payload = (await res.json()) as ProvidersResponse;
      if (!res.ok)
        throw new Error((payload as { message?: string }).message || 'Failed to load providers');
      setProviders(Array.isArray(payload.providers) ? payload.providers : []);
    } catch (e) {
      setError((e as Error).message || 'Failed to load provider profiles');
    } finally {
      setProvidersLoading(false);
    }
  }, [authHeaders]);

  const loadGuiDescriptor = useCallback(async () => {
    setGuiLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (addr.trim()) params.set('addr', addr.trim());
      if (baseurl.trim()) params.set('baseurl', baseurl.trim());
      if (tls) params.set('tls', 'true');
      const res = await fetch(`/api/admin/rclone/runtime/gui?${params.toString()}`, {
        headers: authHeaders(),
      });
      const payload = await res.json();
      if (!res.ok)
        throw new Error(payload?.message || payload?.error || 'Failed to load rclone GUI');
      setGuiData(payload as GuiDescriptor);
    } catch (e) {
      setError((e as Error).message || 'Failed to load rclone GUI descriptor');
    } finally {
      setGuiLoading(false);
    }
  }, [addr, authHeaders, baseurl, tls]);

  const loadProviderBlueprint = useCallback(
    async (providerId: ProviderProfile['id']) => {
      setProviderBlueprintLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/rclone/runtime/providers/${providerId}/blueprint`, {
          headers: authHeaders(),
        });
        const payload = (await res.json()) as ProviderBlueprintResponse | { message?: string };
        if (!res.ok)
          throw new Error(
            (payload as { message?: string }).message || 'Failed to load provider blueprint'
          );
        setProviderBlueprint((payload as ProviderBlueprintResponse).blueprint);
      } catch (e) {
        setError((e as Error).message || 'Failed to load provider blueprint');
      } finally {
        setProviderBlueprintLoading(false);
      }
    },
    [authHeaders]
  );

  const loadArdriveQueue = useCallback(async () => {
    setArdriveQueueLoading(true);
    try {
      const res = await fetch('/api/admin/rclone/runtime/providers/ardrive/turbo/queue?limit=12', {
        headers: authHeaders(),
      });
      const payload = (await res.json()) as ArdriveQueueResponse | { message?: string };
      if (!res.ok)
        throw new Error(
          (payload as { message?: string }).message || 'Failed to load ArDrive queue'
        );
      setArdriveQueue((payload as ArdriveQueueResponse).items || []);
    } catch (e) {
      setError((e as Error).message || 'Failed to load ArDrive queue');
    } finally {
      setArdriveQueueLoading(false);
    }
  }, [authHeaders]);

  const loadArdriveWorkerStatus = useCallback(async () => {
    setArdriveWorkerLoading(true);
    try {
      const res = await fetch('/api/admin/rclone/runtime/providers/ardrive/turbo/worker', {
        headers: authHeaders(),
      });
      const payload = (await res.json()) as ArdriveWorkerStatusResponse | { message?: string };
      if (!res.ok)
        throw new Error(
          (payload as { message?: string }).message || 'Failed to load ArDrive worker'
        );
      setArdriveWorkerStatus(payload as ArdriveWorkerStatusResponse);
    } catch (e) {
      setError((e as Error).message || 'Failed to load ArDrive worker');
    } finally {
      setArdriveWorkerLoading(false);
    }
  }, [authHeaders]);

  const runArdriveWorkerTick = useCallback(async () => {
    setArdriveWorkerTicking(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/rclone/runtime/providers/ardrive/turbo/worker/tick', {
        method: 'POST',
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ maxItems: 5 }),
      });
      const payload = (await res.json()) as
        | {
            ok?: boolean;
            summary?: ArdriveWorkerStatusResponse['worker']['lastSummary'];
            message?: string;
          }
        | { message?: string };
      if (!res.ok)
        throw new Error((payload as { message?: string }).message || 'Worker tick failed');
      setNotice('ArDrive worker tick executed');
      setTimeout(() => setNotice(null), 1800);
      void loadArdriveQueue();
      void loadArdriveWorkerStatus();
    } catch (e) {
      setError((e as Error).message || 'Worker tick failed');
    } finally {
      setArdriveWorkerTicking(false);
    }
  }, [authHeaders, loadArdriveQueue, loadArdriveWorkerStatus]);

  const runArdriveWorkerProcessOne = useCallback(
    async (queueId?: string) => {
      const key = queueId || '__next__';
      setArdriveWorkerProcessOneLoading(key);
      setError(null);
      try {
        const res = await fetch(
          '/api/admin/rclone/runtime/providers/ardrive/turbo/worker/process-one',
          {
            method: 'POST',
            headers: {
              ...authHeaders(),
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              queueId: queueId || undefined,
            }),
          }
        );
        const payload = (await res.json()) as { ok?: boolean; message?: string };
        if (!res.ok) throw new Error(payload.message || 'Worker process-one failed');
        setNotice(queueId ? `Processed queue item: ${queueId}` : 'Processed next queue item');
        setTimeout(() => setNotice(null), 1800);
        void loadArdriveQueue();
        void loadArdriveWorkerStatus();
      } catch (e) {
        setError((e as Error).message || 'Worker process-one failed');
      } finally {
        setArdriveWorkerProcessOneLoading(null);
      }
    },
    [authHeaders, loadArdriveQueue, loadArdriveWorkerStatus]
  );

  const runArdrivePreflight = useCallback(async () => {
    setArdrivePreflightLoading(true);
    setError(null);
    try {
      const fileSizeBytes = Math.max(1, Math.floor(Number(ardriveFileSizeKiB || '0') * 1024));
      const res = await fetch('/api/admin/rclone/runtime/providers/ardrive/turbo/preflight', {
        method: 'POST',
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: ardriveFileName,
          fileSizeBytes,
          localPath: ardriveLocalPath || undefined,
          contentType: ardriveContentType || undefined,
          targetDriveId: ardriveTargetDriveId || undefined,
          targetFolderId: ardriveTargetFolderId || undefined,
        }),
      });
      const payload = (await res.json()) as ArdrivePreflightResponse | { message?: string };
      if (!res.ok) throw new Error((payload as { message?: string }).message || 'Preflight failed');
      const result = payload as ArdrivePreflightResponse;
      setArdrivePreflight(result);
      setNotice(`ArDrive preflight ready: ${result.preflightId}`);
      setTimeout(() => setNotice(null), 2500);
    } catch (e) {
      setError((e as Error).message || 'ArDrive preflight failed');
    } finally {
      setArdrivePreflightLoading(false);
    }
  }, [
    ardriveContentType,
    ardriveFileName,
    ardriveFileSizeKiB,
    ardriveLocalPath,
    ardriveTargetDriveId,
    ardriveTargetFolderId,
    authHeaders,
  ]);

  const enqueueArdriveUpload = useCallback(async () => {
    if (!ardrivePreflight?.preflightId) return;
    setArdriveEnqueueLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/rclone/runtime/providers/ardrive/turbo/queue', {
        method: 'POST',
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preflightId: ardrivePreflight.preflightId,
          localPath: ardriveLocalPath || undefined,
          targetDriveId: ardriveTargetDriveId || undefined,
          targetFolderId: ardriveTargetFolderId || undefined,
        }),
      });
      const payload = (await res.json()) as {
        ok?: boolean;
        item?: ArdriveQueueItem;
        message?: string;
      };
      if (!res.ok) throw new Error(payload.message || 'Queue enqueue failed');
      setNotice(`ArDrive queue item created: ${payload.item?.queueId || 'queued'}`);
      setTimeout(() => setNotice(null), 2500);
      void loadArdriveQueue();
      void loadArdriveWorkerStatus();
    } catch (e) {
      setError((e as Error).message || 'Queue enqueue failed');
    } finally {
      setArdriveEnqueueLoading(false);
    }
  }, [
    ardriveLocalPath,
    ardrivePreflight?.preflightId,
    ardriveTargetDriveId,
    ardriveTargetFolderId,
    authHeaders,
    loadArdriveQueue,
    loadArdriveWorkerStatus,
  ]);

  const transitionArdriveQueueItem = useCallback(
    async (
      queueId: string,
      status: 'queued' | 'processing' | 'submitted' | 'failed' | 'completed',
      note?: string
    ) => {
      setArdriveTransitionLoading(`${queueId}:${status}`);
      setError(null);
      try {
        const res = await fetch(
          `/api/admin/rclone/runtime/providers/ardrive/turbo/queue/${queueId}/transition`,
          {
            method: 'POST',
            headers: {
              ...authHeaders(),
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              status,
              note: note || undefined,
            }),
          }
        );
        const payload = (await res.json()) as {
          ok?: boolean;
          item?: ArdriveQueueItem;
          message?: string;
        };
        if (!res.ok) throw new Error(payload.message || 'Queue transition failed');
        setNotice(`ArDrive queue item updated: ${payload.item?.status || status}`);
        setTimeout(() => setNotice(null), 2200);
        void loadArdriveQueue();
        void loadArdriveWorkerStatus();
      } catch (e) {
        setError((e as Error).message || 'Queue transition failed');
      } finally {
        setArdriveTransitionLoading(null);
      }
    },
    [authHeaders, loadArdriveQueue, loadArdriveWorkerStatus]
  );

  const loadWorkflowLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const res = await fetch(
        '/api/admin/rclone/runtime/workflows/logs?limit=20&includePersistent=true',
        {
          headers: authHeaders(),
        }
      );
      const payload = (await res.json()) as WorkflowLogsResponse;
      if (!res.ok)
        throw new Error(
          (payload as { message?: string })?.message || 'Failed to load workflow logs'
        );
      setRunLogs(Array.isArray(payload.logs) ? payload.logs : []);
    } catch (e) {
      setError((e as Error).message || 'Failed to load workflow logs');
    } finally {
      setLogsLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    void loadDoctor();
    void loadProviders();
    void loadGuiDescriptor();
    void loadWorkflowLogs();
  }, [loadDoctor, loadProviders, loadGuiDescriptor, loadWorkflowLogs]);

  useEffect(() => {
    void loadProviderBlueprint(selectedProviderId);
  }, [loadProviderBlueprint, selectedProviderId]);

  useEffect(() => {
    if (selectedProviderId !== 'ardrive') return;
    void loadArdriveQueue();
    void loadArdriveWorkerStatus();
  }, [loadArdriveQueue, loadArdriveWorkerStatus, selectedProviderId]);

  useEffect(() => {
    if (!autoRefreshLogs) return undefined;
    const timer = window.setInterval(() => {
      void loadWorkflowLogs();
    }, 8000);
    return () => window.clearInterval(timer);
  }, [autoRefreshLogs, loadWorkflowLogs]);

  const presets = useMemo(() => guiData?.presets || fallbackPresets, [guiData?.presets]);
  const selectedPreset = useMemo(
    () => presets.find((preset) => preset.id === selectedPresetId) || presets[0],
    [presets, selectedPresetId]
  );

  const workflowCommand = useMemo(() => {
    if (!selectedPreset) return '';
    const source = shellEscape(sourcePath);
    const destination = shellEscape(destinationPath);

    let command = selectedPreset.commandTemplate
      .replace('{source}', source)
      .replace('{destination}', destination);

    if (dryRun && !command.includes('--dry-run')) command = `${command} --dry-run`;
    if (checksum && !command.includes('--checksum')) command = `${command} --checksum`;

    const numericTransfers = Number(transfers);
    if (
      Number.isFinite(numericTransfers) &&
      numericTransfers > 0 &&
      !command.includes('--transfers')
    ) {
      command = `${command} --transfers ${Math.floor(numericTransfers)}`;
    }

    if (bwlimit.trim()) command = `${command} --bwlimit ${shellEscape(bwlimit)}`;
    if (extraFlags.trim()) command = `${command} ${extraFlags.trim()}`;

    return command;
  }, [
    bwlimit,
    checksum,
    destinationPath,
    dryRun,
    extraFlags,
    selectedPreset,
    sourcePath,
    transfers,
  ]);

  const guiUrl = useMemo(() => guiData?.url || '', [guiData]);
  const workflowPolicyWarning = useMemo(() => {
    const aliases = [extractRemoteAlias(sourcePath), extractRemoteAlias(destinationPath)].filter(
      (value): value is string => Boolean(value)
    );
    if (aliases.includes('degoo')) {
      return 'Degoo direct remote runs are blocked. Use an official bridge workflow.';
    }
    if (aliases.some((alias) => alias === 'ardrive' || alias === 'turbo' || alias === 'arweave')) {
      return 'ArDrive/Turbo requires the custom connector workflow, not direct rclone runs.';
    }
    return null;
  }, [destinationPath, sourcePath]);

  const copyText = useCallback(async (value: string, okMessage: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setNotice(okMessage);
      setTimeout(() => setNotice(null), 2200);
    } catch {
      setNotice('Copy failed. Copy manually from the command block.');
      setTimeout(() => setNotice(null), 2600);
    }
  }, []);

  const runWorkflowNow = useCallback(async () => {
    if (!selectedPreset) return;
    setWorkflowRunning(true);
    setError(null);

    try {
      const numericTransfers = Number(transfers);
      const transferValue =
        Number.isFinite(numericTransfers) && numericTransfers > 0
          ? Math.floor(numericTransfers)
          : undefined;

      const res = await fetch('/api/admin/rclone/runtime/workflows/run', {
        method: 'POST',
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          presetId: selectedPreset.id,
          source: sourcePath,
          destination: destinationPath,
          dryRun,
          checksum,
          bwlimit: bwlimit.trim() || undefined,
          transfers: transferValue,
          extraArgs: tokenizeInput(extraFlags),
        }),
      });

      const payload = (await res.json()) as
        | WorkflowRunResult
        | { message?: string; error?: string };
      if (!res.ok) {
        throw new Error(
          (payload as { message?: string; error?: string }).message ||
            (payload as { error?: string }).error ||
            'Workflow run failed'
        );
      }

      const result = payload as WorkflowRunResult;
      setRunResult(result);
      setNotice(`Workflow started: ${result.presetLabel}`);
      setTimeout(() => setNotice(null), 2800);
      void loadWorkflowLogs();
    } catch (e) {
      setError((e as Error).message || 'Workflow run failed');
    } finally {
      setWorkflowRunning(false);
    }
  }, [
    authHeaders,
    bwlimit,
    checksum,
    destinationPath,
    dryRun,
    extraFlags,
    loadWorkflowLogs,
    selectedPreset,
    sourcePath,
    transfers,
  ]);

  const controlRun = useCallback(
    async (runId: string, action: 'pause' | 'resume' | 'stop') => {
      setRunControlLoading(`${runId}:${action}`);
      setError(null);
      try {
        const res = await fetch(`/api/admin/rclone/runtime/workflows/${runId}/${action}`, {
          method: 'POST',
          headers: authHeaders(),
        });
        const payload = (await res.json()) as
          | WorkflowRunResult
          | { message?: string; error?: string };
        if (!res.ok) {
          throw new Error(
            (payload as { message?: string; error?: string }).message ||
              (payload as { error?: string }).error ||
              `Failed to ${action} run`
          );
        }

        setRunResult(payload as WorkflowRunResult);
        setNotice(`Run ${action} request accepted.`);
        setTimeout(() => setNotice(null), 2000);
        void loadWorkflowLogs();
      } catch (e) {
        setError((e as Error).message || `Failed to ${action} run`);
      } finally {
        setRunControlLoading(null);
      }
    },
    [authHeaders, loadWorkflowLogs]
  );

  const doctorPass = doctorData?.ok === true;
  const allowIframe = guiData?.policy?.allowIframe !== false;

  return (
    <GlassCard className="p-5 space-y-4">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <h3 className="text-sm uppercase tracking-widest font-bold text-slate-200 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-cyan-300" />
            Rclone Mobility Console
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Modified admin wrapper for controlled sync, backup, mirror, migration, and offload
            flows.
          </p>
        </div>
        <div
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] uppercase tracking-wider ${
            doctorPass
              ? 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10'
              : 'border-amber-500/30 text-amber-300 bg-amber-500/10'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          {doctorPass ? 'Doctor Pass' : 'Doctor Attention'}
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">
          {notice}
        </div>
      )}

      <div className="rounded-md border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-xs text-indigo-100 flex flex-wrap items-center gap-2">
        <span className="uppercase tracking-wide text-indigo-200/90">Control Policy</span>
        <span className="rounded border border-indigo-300/30 px-2 py-0.5">Loopback Enforced</span>
        <span className="rounded border border-indigo-300/30 px-2 py-0.5">
          Blocked: {(guiData?.policy?.blockedFlags || ['--rc-no-auth']).join(', ')}
        </span>
      </div>

      <div className="rounded-md border border-white/10 bg-black/20 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-wide text-slate-400 flex items-center gap-2">
            <Cloud className="w-4 h-4 text-cyan-300" />
            Provider Coverage
          </div>
          <PremiumButton
            variant="secondary"
            size="sm"
            onClick={loadProviders}
            disabled={providersLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${providersLoading ? 'animate-spin' : ''}`} />
            Refresh Providers
          </PremiumButton>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {providers.map((provider) => (
            <div
              key={provider.id}
              className={`rounded border p-2 text-xs ${
                selectedProviderId === provider.id
                  ? 'border-cyan-400/40 bg-cyan-500/10'
                  : 'border-white/10 bg-slate-950/50'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold text-slate-200">{provider.label}</div>
                <PremiumButton
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedProviderId(provider.id)}
                >
                  Select
                </PremiumButton>
              </div>
              <div className="text-slate-400 mt-0.5">{provider.supportMode}</div>
              <div className="text-slate-500 mt-0.5">Status: {provider.status}</div>
              <div className="text-slate-500 mt-0.5">Backend: {provider.backendHint}</div>
              <div className="text-slate-400 mt-1">{provider.notes}</div>
              {!!provider.docs?.length && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {provider.docs.map((docUrl) => (
                    <a
                      key={docUrl}
                      href={docUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded border border-cyan-500/30 px-1.5 py-0.5 text-[10px] text-cyan-200 hover:bg-cyan-500/10"
                    >
                      docs
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
          {!providers.length && <div className="text-xs text-slate-500">No providers loaded.</div>}
        </div>
        <div className="rounded border border-white/10 bg-black/30 p-2 text-xs">
          <div className="flex items-center justify-between gap-2">
            <div className="font-semibold text-slate-200">
              {selectedProviderId.toUpperCase()} Blueprint
            </div>
            {providerBlueprintLoading && <div className="text-slate-500">Loading...</div>}
          </div>
          {providerBlueprint ? (
            <div className="mt-1 space-y-1 text-slate-300">
              <div>{providerBlueprint.summary}</div>
              <div className="text-slate-400">
                Automation: {providerBlueprint.compliance.automationPolicy}
              </div>
              {!!providerBlueprint.pricing?.subsidizedThresholdBytes && (
                <div className="text-slate-400">
                  Subsidy threshold:{' '}
                  {(providerBlueprint.pricing.subsidizedThresholdBytes / 1024).toFixed(0)} KiB
                </div>
              )}
            </div>
          ) : (
            <div className="mt-1 text-slate-500">No blueprint loaded.</div>
          )}
        </div>
        {selectedProviderId === 'ardrive' && (
          <div className="rounded border border-cyan-500/20 bg-cyan-500/5 p-2 text-xs space-y-2">
            <div className="font-semibold text-cyan-100">ArDrive Turbo Connector (Scaffold)</div>
            <div className="text-slate-300">
              Use preflight + queue contract here. Submission worker remains separate and must do
              final Turbo quote + wallet signing.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <label className="block text-slate-300">
                File name
                <input
                  className="mt-1 w-full rounded border border-white/20 bg-slate-900/60 px-2 py-1.5 text-xs text-slate-100"
                  value={ardriveFileName}
                  onChange={(e) => setArdriveFileName(e.target.value)}
                  placeholder="asset.bin"
                />
              </label>
              <label className="block text-slate-300">
                File size (KiB)
                <input
                  className="mt-1 w-full rounded border border-white/20 bg-slate-900/60 px-2 py-1.5 text-xs text-slate-100"
                  value={ardriveFileSizeKiB}
                  onChange={(e) => setArdriveFileSizeKiB(e.target.value)}
                  placeholder="96"
                />
              </label>
              <label className="block text-slate-300">
                Local path (optional)
                <input
                  className="mt-1 w-full rounded border border-white/20 bg-slate-900/60 px-2 py-1.5 text-xs text-slate-100"
                  value={ardriveLocalPath}
                  onChange={(e) => setArdriveLocalPath(e.target.value)}
                  placeholder="/tmp/asset.bin"
                />
              </label>
              <label className="block text-slate-300">
                Content type (optional)
                <input
                  className="mt-1 w-full rounded border border-white/20 bg-slate-900/60 px-2 py-1.5 text-xs text-slate-100"
                  value={ardriveContentType}
                  onChange={(e) => setArdriveContentType(e.target.value)}
                  placeholder="application/octet-stream"
                />
              </label>
              <label className="block text-slate-300">
                Target drive ID (optional)
                <input
                  className="mt-1 w-full rounded border border-white/20 bg-slate-900/60 px-2 py-1.5 text-xs text-slate-100"
                  value={ardriveTargetDriveId}
                  onChange={(e) => setArdriveTargetDriveId(e.target.value)}
                  placeholder="drive-id"
                />
              </label>
              <label className="block text-slate-300">
                Target folder ID (optional)
                <input
                  className="mt-1 w-full rounded border border-white/20 bg-slate-900/60 px-2 py-1.5 text-xs text-slate-100"
                  value={ardriveTargetFolderId}
                  onChange={(e) => setArdriveTargetFolderId(e.target.value)}
                  placeholder="folder-id"
                />
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <PremiumButton
                variant="secondary"
                size="sm"
                onClick={runArdrivePreflight}
                disabled={ardrivePreflightLoading}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-1.5 ${ardrivePreflightLoading ? 'animate-spin' : ''}`}
                />
                Preflight
              </PremiumButton>
              <PremiumButton
                variant="secondary"
                size="sm"
                onClick={enqueueArdriveUpload}
                disabled={ardriveEnqueueLoading || !ardrivePreflight?.preflightId}
              >
                <Play className="w-4 h-4 mr-1.5" />
                Enqueue
              </PremiumButton>
              <PremiumButton
                variant="secondary"
                size="sm"
                onClick={loadArdriveQueue}
                disabled={ardriveQueueLoading}
              >
                <ListRestart
                  className={`w-4 h-4 mr-1.5 ${ardriveQueueLoading ? 'animate-spin' : ''}`}
                />
                Refresh Queue
              </PremiumButton>
            </div>
            <div className="rounded border border-white/15 bg-black/30 p-2 text-[11px] space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-slate-300">
                  Worker · enabled {ardriveWorkerStatus?.worker.enabled ? 'yes' : 'no'} · interval{' '}
                  {ardriveWorkerStatus?.worker.intervalMs ?? 'n/a'}ms
                </div>
                <div className="flex items-center gap-2">
                  <PremiumButton
                    variant="secondary"
                    size="sm"
                    onClick={loadArdriveWorkerStatus}
                    disabled={ardriveWorkerLoading}
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 mr-1 ${ardriveWorkerLoading ? 'animate-spin' : ''}`}
                    />
                    Worker Status
                  </PremiumButton>
                  <PremiumButton
                    variant="secondary"
                    size="sm"
                    onClick={runArdriveWorkerTick}
                    disabled={ardriveWorkerTicking}
                  >
                    <Play className="w-3.5 h-3.5 mr-1" />
                    Tick
                  </PremiumButton>
                  <PremiumButton
                    variant="secondary"
                    size="sm"
                    onClick={() => void runArdriveWorkerProcessOne()}
                    disabled={ardriveWorkerProcessOneLoading === '__next__'}
                  >
                    <Play className="w-3.5 h-3.5 mr-1" />
                    Process One
                  </PremiumButton>
                </div>
              </div>
              {ardriveWorkerStatus?.worker.lastSummary ? (
                <div className="text-slate-400">
                  Last tick: {ardriveWorkerStatus.worker.lastSummary.trigger} · processed{' '}
                  {ardriveWorkerStatus.worker.lastSummary.processed} · transitioned{' '}
                  {ardriveWorkerStatus.worker.lastSummary.transitioned} · failed{' '}
                  {ardriveWorkerStatus.worker.lastSummary.failed}
                </div>
              ) : (
                <div className="text-slate-500">No worker tick summary yet.</div>
              )}
            </div>
            {ardrivePreflight && (
              <div className="rounded border border-white/15 bg-black/30 p-2 text-[11px] text-slate-200">
                <div>Preflight: {ardrivePreflight.preflightId}</div>
                <div>
                  Subsidized: {ardrivePreflight.pricing.subsidizedEligible ? 'yes' : 'no'} ·
                  Estimated credits: {ardrivePreflight.pricing.estimatedCredits ?? 'n/a'}
                </div>
                <div>
                  Quote source: {ardrivePreflight.pricing.quoteSource} · Quote ID:{' '}
                  {ardrivePreflight.pricing.quoteId || 'n/a'}
                </div>
                <div>Quoted winc: {ardrivePreflight.pricing.quotedWinc || 'n/a'}</div>
                <div>Expires: {new Date(ardrivePreflight.expiresAt).toLocaleString()}</div>
              </div>
            )}
            <div className="rounded border border-white/15 bg-black/30 p-2 text-[11px] space-y-1">
              <div className="text-slate-300">Queue ({ardriveQueue.length})</div>
              {ardriveQueue.slice(0, 4).map((item) => (
                <div
                  key={item.queueId}
                  className="rounded border border-white/10 bg-black/30 p-2 space-y-1"
                >
                  <div className="text-slate-300">
                    {item.queueId} · {item.status.toUpperCase()}
                  </div>
                  <div className="text-slate-400">
                    {item.fileName} ({Math.ceil(item.fileSizeBytes / 1024)} KiB) · attempts{' '}
                    {item.attempts}
                  </div>
                  <div className="text-slate-500">
                    Quote: {item.quoteSource} · {item.quoteId || 'n/a'} · winc{' '}
                    {item.quotedWinc || 'n/a'}
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    <PremiumButton
                      variant="secondary"
                      size="sm"
                      onClick={() => void runArdriveWorkerProcessOne(item.queueId)}
                      disabled={ardriveWorkerProcessOneLoading === item.queueId}
                    >
                      <Play className="w-3.5 h-3.5 mr-1" />
                      Process One
                    </PremiumButton>
                    {item.status === 'queued' && (
                      <>
                        <PremiumButton
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            void transitionArdriveQueueItem(
                              item.queueId,
                              'processing',
                              'Worker picked queue item'
                            )
                          }
                          disabled={ardriveTransitionLoading === `${item.queueId}:processing`}
                        >
                          <Play className="w-3.5 h-3.5 mr-1" />
                          Start
                        </PremiumButton>
                        <PremiumButton
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            void transitionArdriveQueueItem(
                              item.queueId,
                              'failed',
                              'Queue item rejected before start'
                            )
                          }
                          disabled={ardriveTransitionLoading === `${item.queueId}:failed`}
                        >
                          <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                          Fail
                        </PremiumButton>
                      </>
                    )}
                    {item.status === 'processing' && (
                      <>
                        <PremiumButton
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            void transitionArdriveQueueItem(
                              item.queueId,
                              'submitted',
                              'Upload submitted to Turbo'
                            )
                          }
                          disabled={ardriveTransitionLoading === `${item.queueId}:submitted`}
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5 mr-1" />
                          Submitted
                        </PremiumButton>
                        <PremiumButton
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            void transitionArdriveQueueItem(
                              item.queueId,
                              'failed',
                              'Processing error while preparing upload'
                            )
                          }
                          disabled={ardriveTransitionLoading === `${item.queueId}:failed`}
                        >
                          <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                          Fail
                        </PremiumButton>
                      </>
                    )}
                    {item.status === 'submitted' && (
                      <>
                        <PremiumButton
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            void transitionArdriveQueueItem(
                              item.queueId,
                              'completed',
                              'Upload confirmed complete'
                            )
                          }
                          disabled={ardriveTransitionLoading === `${item.queueId}:completed`}
                        >
                          <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                          Complete
                        </PremiumButton>
                        <PremiumButton
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            void transitionArdriveQueueItem(
                              item.queueId,
                              'failed',
                              'Submission failed downstream'
                            )
                          }
                          disabled={ardriveTransitionLoading === `${item.queueId}:failed`}
                        >
                          <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                          Fail
                        </PremiumButton>
                      </>
                    )}
                    {item.status === 'failed' && (
                      <PremiumButton
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          void transitionArdriveQueueItem(
                            item.queueId,
                            'processing',
                            'Retry requested by operator'
                          )
                        }
                        disabled={ardriveTransitionLoading === `${item.queueId}:processing`}
                      >
                        <RefreshCw className="w-3.5 h-3.5 mr-1" />
                        Retry
                      </PremiumButton>
                    )}
                    {item.status === 'completed' && (
                      <div className="text-emerald-300">Completed</div>
                    )}
                  </div>
                </div>
              ))}
              {!ardriveQueue.length && <div className="text-slate-500">No queue items yet.</div>}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-md border border-white/10 bg-black/20 p-3 space-y-3">
          <div className="text-xs uppercase tracking-wide text-slate-400">Doctor</div>
          <label className="block text-xs text-slate-300">
            Target Remote
            <input
              className="mt-1 w-full rounded border border-white/20 bg-slate-900/60 px-2 py-1.5 text-xs text-slate-100"
              value={remote}
              onChange={(e) => setRemote(e.target.value)}
              placeholder="pcloud:"
            />
          </label>
          <label className="inline-flex items-center gap-2 text-xs text-slate-300">
            <input type="checkbox" checked={probe} onChange={(e) => setProbe(e.target.checked)} />
            Probe remote connectivity (lsf)
          </label>
          <PremiumButton
            variant="secondary"
            size="sm"
            onClick={loadDoctor}
            disabled={doctorLoading}
            className="w-full"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${doctorLoading ? 'animate-spin' : ''}`} />
            Refresh Doctor
          </PremiumButton>
        </div>

        <div className="rounded-md border border-white/10 bg-black/20 p-3 space-y-3">
          <div className="text-xs uppercase tracking-wide text-slate-400">GUI Descriptor</div>
          <label className="block text-xs text-slate-300">
            RC Address
            <input
              className="mt-1 w-full rounded border border-white/20 bg-slate-900/60 px-2 py-1.5 text-xs text-slate-100"
              value={addr}
              onChange={(e) => setAddr(e.target.value)}
              placeholder="127.0.0.1:5572"
            />
          </label>
          <label className="block text-xs text-slate-300">
            Base URL (optional)
            <input
              className="mt-1 w-full rounded border border-white/20 bg-slate-900/60 px-2 py-1.5 text-xs text-slate-100"
              value={baseurl}
              onChange={(e) => setBaseurl(e.target.value)}
              placeholder="/rclone"
              disabled={guiData?.policy && !guiData.policy.allowCustomBaseurl}
            />
          </label>
          <label className="inline-flex items-center gap-2 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={tls}
              onChange={(e) => setTls(e.target.checked)}
              disabled={guiData?.policy && !guiData.policy.allowTlsToggle}
            />
            Use HTTPS URL
          </label>
          <PremiumButton
            variant="secondary"
            size="sm"
            onClick={loadGuiDescriptor}
            disabled={guiLoading}
            className="w-full"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${guiLoading ? 'animate-spin' : ''}`} />
            Refresh GUI URL
          </PremiumButton>
        </div>
      </div>

      <div className="rounded-md border border-white/10 bg-slate-950/70 p-3 space-y-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="text-xs text-slate-300 break-all">
            <span className="text-slate-500">GUI URL:</span> {guiUrl || 'Unavailable'}
          </div>
          <div className="flex items-center gap-2">
            <PremiumButton
              variant="secondary"
              size="sm"
              onClick={() =>
                void copyText(guiData?.command?.display || '', 'Launch command copied.')
              }
              disabled={!guiData?.command?.display}
            >
              <Copy className="w-4 h-4 mr-1.5" />
              Copy Launch
            </PremiumButton>
            <a
              href={guiUrl || '#'}
              target="_blank"
              rel="noreferrer"
              className={!guiUrl ? 'pointer-events-none opacity-50' : ''}
            >
              <PremiumButton variant="primary" size="sm" disabled={!guiUrl}>
                <ExternalLink className="w-4 h-4 mr-1.5" />
                Open GUI
              </PremiumButton>
            </a>
          </div>
        </div>

        {guiData?.normalized?.addrAdjusted && (
          <div className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 text-xs text-amber-200 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            Requested addr <code>{guiData.normalized.originalAddr}</code> normalized to{' '}
            <code>{guiData.addr}</code> by policy.
          </div>
        )}

        <div className="text-[11px] text-slate-400">Launch command</div>
        <pre className="text-[11px] text-cyan-200 rounded border border-cyan-500/20 bg-black/40 p-2 overflow-x-auto">
          {guiData?.command?.display ||
            'rclone rcd --rc-web-gui --rc-web-gui-no-open-browser --rc-addr 127.0.0.1:5572'}
        </pre>
      </div>

      <div className="rounded-md border border-white/10 bg-black/20 p-3 space-y-3">
        <div className="text-xs uppercase tracking-wide text-slate-400 flex items-center gap-2">
          <ArrowRightLeft className="w-4 h-4 text-fuchsia-300" />
          Mobility Workflows
        </div>

        <div className="text-[11px] text-slate-500">
          Pause uses process suspension to keep the run state live; resume continues the same
          process.
        </div>
        {workflowPolicyWarning && (
          <div className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 text-[11px] text-amber-200">
            {workflowPolicyWarning}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {presets.map((preset) => {
            const selected = selectedPreset?.id === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setSelectedPresetId(preset.id)}
                className={`rounded border px-2 py-2 text-[11px] text-left ${
                  selected
                    ? 'border-cyan-400/40 bg-cyan-500/15 text-cyan-100'
                    : 'border-white/10 bg-black/20 text-slate-300 hover:border-white/30'
                }`}
              >
                <div className="font-semibold uppercase tracking-wide">{preset.label}</div>
                <div className="text-[10px] opacity-80 mt-0.5">{preset.risk} risk</div>
              </button>
            );
          })}
        </div>

        {selectedPreset && (
          <div className="rounded border border-white/10 bg-slate-950/50 p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <span
                className={`rounded border px-2 py-0.5 uppercase tracking-wide ${riskClasses(selectedPreset.risk)}`}
              >
                {selectedPreset.risk}
              </span>
              <span className="text-slate-300">{selectedPreset.description}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {selectedPreset.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded border border-white/15 px-2 py-0.5 text-[10px] text-slate-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="block text-xs text-slate-300">
            Source
            <input
              className="mt-1 w-full rounded border border-white/20 bg-slate-900/60 px-2 py-1.5 text-xs text-slate-100"
              value={sourcePath}
              onChange={(e) => setSourcePath(e.target.value)}
              placeholder="~/Desktop"
            />
          </label>
          <label className="block text-xs text-slate-300">
            Destination
            <input
              className="mt-1 w-full rounded border border-white/20 bg-slate-900/60 px-2 py-1.5 text-xs text-slate-100"
              value={destinationPath}
              onChange={(e) => setDestinationPath(e.target.value)}
              placeholder="pcloud:/TNF-Offload"
            />
          </label>
          <label className="block text-xs text-slate-300">
            Bandwidth Limit (optional)
            <input
              className="mt-1 w-full rounded border border-white/20 bg-slate-900/60 px-2 py-1.5 text-xs text-slate-100"
              value={bwlimit}
              onChange={(e) => setBwlimit(e.target.value)}
              placeholder="8M"
            />
          </label>
          <label className="block text-xs text-slate-300">
            Transfers (optional)
            <input
              className="mt-1 w-full rounded border border-white/20 bg-slate-900/60 px-2 py-1.5 text-xs text-slate-100"
              value={transfers}
              onChange={(e) => setTransfers(e.target.value)}
              placeholder="4"
            />
          </label>
          <label className="block text-xs text-slate-300 md:col-span-2">
            Extra Flags (optional)
            <input
              className="mt-1 w-full rounded border border-white/20 bg-slate-900/60 px-2 py-1.5 text-xs text-slate-100"
              value={extraFlags}
              onChange={(e) => setExtraFlags(e.target.value)}
              placeholder="--exclude '*.tmp' --log-level INFO"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <label className="inline-flex items-center gap-2 text-xs text-slate-300">
            <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} />
            Dry run
          </label>
          <label className="inline-flex items-center gap-2 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={checksum}
              onChange={(e) => setChecksum(e.target.checked)}
            />
            Checksum verify
          </label>
          <PremiumButton
            variant="secondary"
            size="sm"
            onClick={() => void copyText(workflowCommand, 'Workflow command copied.')}
            disabled={!workflowCommand}
          >
            <Copy className="w-4 h-4 mr-1.5" />
            Copy Workflow
          </PremiumButton>
          <PremiumButton
            variant="primary"
            size="sm"
            onClick={runWorkflowNow}
            disabled={workflowRunning || !selectedPreset || Boolean(workflowPolicyWarning)}
          >
            {workflowRunning ? (
              <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-1.5" />
            )}
            Run Now
          </PremiumButton>
        </div>

        <pre className="text-[11px] text-fuchsia-100 rounded border border-fuchsia-500/20 bg-black/40 p-2 overflow-x-auto">
          {workflowCommand || 'Workflow command preview unavailable'}
        </pre>

        {runResult && (
          <div className={`rounded border px-3 py-2 text-xs ${statusClasses(runResult.status)}`}>
            <div className="font-semibold">
              Last Run: {runResult.presetLabel} · {runResult.status.toUpperCase()} · exit{' '}
              {runResult.exitCode ?? 'n/a'}
            </div>
            <div className="opacity-90">Duration: {runResult.durationMs ?? 0}ms</div>
            <pre className="mt-2 text-[11px] rounded border border-white/10 bg-black/30 p-2 overflow-x-auto text-slate-100">
              {runResult.command.display}
            </pre>
            {!!runResult.stderrPreview && (
              <pre className="mt-2 text-[11px] rounded border border-rose-400/20 bg-black/30 p-2 overflow-x-auto text-rose-100">
                {runResult.stderrPreview}
              </pre>
            )}
          </div>
        )}

        <div className="rounded border border-white/10 bg-slate-950/50 p-3 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs uppercase tracking-wide text-slate-400 flex items-center gap-2">
              <ListRestart className="w-4 h-4 text-cyan-300" />
              Recent Workflow Runs
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={autoRefreshLogs}
                  onChange={(e) => setAutoRefreshLogs(e.target.checked)}
                />
                Auto refresh
              </label>
              <PremiumButton
                variant="secondary"
                size="sm"
                onClick={loadWorkflowLogs}
                disabled={logsLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-1.5 ${logsLoading ? 'animate-spin' : ''}`} />
                Refresh Logs
              </PremiumButton>
            </div>
          </div>

          {runLogs.length > 0 ? (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {runLogs.map((log) => {
                const isRunning = log.status === 'running';
                const isPaused = log.status === 'paused';
                const isStopping = log.status === 'stopping';
                return (
                  <div
                    key={log.id}
                    className={`rounded border px-2 py-2 text-xs ${statusClasses(log.status)}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-semibold">
                        {log.presetLabel} · {log.status.toUpperCase()} · exit{' '}
                        {log.exitCode ?? 'n/a'}
                      </div>
                      <div className="opacity-90">{new Date(log.startedAt).toLocaleString()}</div>
                    </div>
                    <div className="opacity-90">
                      {log.source} {'->'} {log.destination}
                    </div>
                    <div className="opacity-90">
                      Duration: {log.durationMs ?? 0}ms ·{' '}
                      {log.persistent ? 'persistent' : 'runtime'}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {isRunning && (
                        <>
                          <PremiumButton
                            variant="secondary"
                            size="sm"
                            onClick={() => void controlRun(log.id, 'pause')}
                            disabled={runControlLoading === `${log.id}:pause`}
                          >
                            <Pause className="w-4 h-4 mr-1.5" />
                            Pause
                          </PremiumButton>
                          <PremiumButton
                            variant="secondary"
                            size="sm"
                            onClick={() => void controlRun(log.id, 'stop')}
                            disabled={runControlLoading === `${log.id}:stop`}
                          >
                            <Square className="w-4 h-4 mr-1.5" />
                            Stop
                          </PremiumButton>
                        </>
                      )}
                      {isPaused && (
                        <>
                          <PremiumButton
                            variant="secondary"
                            size="sm"
                            onClick={() => void controlRun(log.id, 'resume')}
                            disabled={runControlLoading === `${log.id}:resume`}
                          >
                            <Play className="w-4 h-4 mr-1.5" />
                            Resume
                          </PremiumButton>
                          <PremiumButton
                            variant="secondary"
                            size="sm"
                            onClick={() => void controlRun(log.id, 'stop')}
                            disabled={runControlLoading === `${log.id}:stop`}
                          >
                            <Square className="w-4 h-4 mr-1.5" />
                            Stop
                          </PremiumButton>
                        </>
                      )}
                      {isStopping && (
                        <span className="text-[11px] uppercase tracking-wide">Stopping...</span>
                      )}
                    </div>
                    <pre className="mt-1 text-[11px] rounded border border-white/10 bg-black/30 p-2 overflow-x-auto text-slate-100">
                      {log.command.display}
                    </pre>
                    {!!log.stderrPreview && (
                      <pre className="mt-1 text-[11px] rounded border border-rose-400/20 bg-black/30 p-2 overflow-x-auto text-rose-100">
                        {log.stderrPreview}
                      </pre>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-xs text-slate-500">No workflow runs recorded yet.</div>
          )}
        </div>
      </div>

      <div className="rounded-md border border-white/10 bg-black/20 p-3">
        <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">Doctor Checks</div>
        <div className="space-y-2">
          {(doctorData?.checks || []).map((check) => (
            <div
              key={check.name}
              className={`rounded border px-2 py-1.5 text-xs ${
                check.ok
                  ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-200'
                  : 'border-amber-500/20 bg-amber-500/5 text-amber-200'
              }`}
            >
              <div className="font-medium">{check.name}</div>
              <div className="opacity-90">{check.detail}</div>
            </div>
          ))}
          {!doctorData && <div className="text-xs text-slate-500">No doctor data loaded yet.</div>}
        </div>
      </div>

      <div className="rounded-md border border-white/10 bg-black/20 p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs uppercase tracking-wide text-slate-400 flex items-center gap-2">
            <TerminalSquare className="w-4 h-4 text-indigo-300" />
            Embedded GUI
          </div>
          <label className="inline-flex items-center gap-2 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={embedEnabled}
              onChange={(e) => setEmbedEnabled(e.target.checked)}
              disabled={!allowIframe}
            />
            Enable iframe
          </label>
        </div>

        {!allowIframe && (
          <div className="text-xs text-amber-300 mb-2">
            Embedding is disabled by control policy.
          </div>
        )}

        {allowIframe && embedEnabled && guiUrl ? (
          <iframe
            title="rclone-web-gui"
            src={guiUrl}
            className="w-full h-[460px] rounded border border-white/20 bg-black"
          />
        ) : (
          <div className="text-xs text-slate-500">
            Enable iframe to attempt inline GUI rendering. If blocked by browser or server headers,
            use Open GUI instead.
          </div>
        )}
      </div>
    </GlassCard>
  );
}
