import {
  Activity,
  ArrowLeft,
  Clock3,
  Cpu,
  Gauge,
  Orbit,
  Play,
  ToggleLeft,
  ToggleRight,
  Zap,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

type ChronJob = {
  id: string;
  label: string;
  role: string;
  cadenceSeconds: number;
  teeth: number;
  size: number;
  x: number;
  y: number;
  color: string;
  accent: string;
  direction: 1 | -1;
};

type TelemetryProcess = {
  processId: string;
  name: string;
  kind: string;
  owner: string;
  status: string;
  stale: boolean;
  heartbeatCount: number;
  expectedIntervalMs: number;
  cadenceSource: 'metadata' | 'inferred';
  lastHeartbeat: string | null;
  heartbeatAgeMs: number | null;
  lastRunAt: string | null;
  lastRunAgeMs: number | null;
  lastResult: string | null;
  metadata?: Record<string, unknown>;
};

type MasterClockTelemetry = {
  status: 'ok' | 'degraded';
  timestamp: string;
  source: string;
  orchestrator: {
    sessionId: string | null;
    isActive: boolean;
    lastHeartbeat: string | null;
    ageMs: number | null;
    heartbeatIntervalMs: number;
    stallThresholdMs: number;
    stats: {
      total: number;
      active: number;
      stalled: number;
      offline: number;
    };
    superCycleSummary: {
      total: number;
      healthy: number;
      stale: number;
    };
  } | null;
  superCycle: {
    lastUpdated: string | null;
    staleThresholdMs: number;
    stats: {
      total: number;
      healthy: number;
      stale: number;
    };
    processes: TelemetryProcess[];
  };
  recentActivity: Array<{
    timestamp: string | null;
    eventType: string;
    content: string;
    metadata: Record<string, unknown>;
  }>;
};

type DisplayChronJob = ChronJob & {
  live: boolean;
  processId?: string;
  status?: string;
  owner?: string;
  heartbeatAgeMs?: number | null;
  lastRunAgeMs?: number | null;
  cadenceSource?: 'metadata' | 'inferred';
  lastResult?: string | null;
  metadata?: Record<string, unknown>;
};

const CONCEPT_MASTER_CADENCE_SECONDS = 60;
const MASTER_GEAR_SIZE = 210;

const CONCEPT_CHRON_JOBS: DisplayChronJob[] = [
  {
    id: 'heartbeat',
    label: 'Heartbeat Pulse',
    role: 'Keeps the relay mesh warm and observable',
    cadenceSeconds: 5,
    teeth: 16,
    size: 120,
    x: 76,
    y: 16,
    color: '#fb7185',
    accent: 'rgba(251, 113, 133, 0.28)',
    direction: -1,
    live: false,
  },
  {
    id: 'broker',
    label: 'Broker Sweep',
    role: 'Checks relay queues and rebalances stalled channels',
    cadenceSeconds: 15,
    teeth: 20,
    size: 144,
    x: 10,
    y: 41,
    color: '#38bdf8',
    accent: 'rgba(56, 189, 248, 0.22)',
    direction: 1,
    live: false,
  },
  {
    id: 'director',
    label: 'Director Cycle',
    role: 'Escalates orchestration branches and dispatch priorities',
    cadenceSeconds: 30,
    teeth: 24,
    size: 156,
    x: 74,
    y: 60,
    color: '#f59e0b',
    accent: 'rgba(245, 158, 11, 0.2)',
    direction: -1,
    live: false,
  },
  {
    id: 'audit',
    label: 'Audit Trail Sync',
    role: 'Mirrors execution logs into the canonical timeline',
    cadenceSeconds: 45,
    teeth: 18,
    size: 132,
    x: 51,
    y: 9,
    color: '#a78bfa',
    accent: 'rgba(167, 139, 250, 0.2)',
    direction: 1,
    live: false,
  },
  {
    id: 'graph',
    label: 'Graph Refresh',
    role: 'Rebuilds temporal relationships for visualization surfaces',
    cadenceSeconds: 90,
    teeth: 28,
    size: 172,
    x: 26,
    y: 72,
    color: '#34d399',
    accent: 'rgba(52, 211, 153, 0.2)',
    direction: -1,
    live: false,
  },
];

const INITIAL_LOCKED_IDS = ['heartbeat', 'broker', 'director'];
const TIME_SCALES = [0.5, 1, 2, 4];

function describeCadence(cadenceSeconds: number) {
  if (cadenceSeconds < 60) {
    return `Every ${cadenceSeconds}s`;
  }

  const minutes = cadenceSeconds / 60;
  return minutes === 1 ? 'Every minute' : `Every ${minutes.toFixed(1)}m`;
}

function formatAge(ageMs?: number | null) {
  if (ageMs === null || ageMs === undefined || !Number.isFinite(ageMs)) {
    return 'No heartbeat yet';
  }

  const seconds = Math.max(0, Math.round(ageMs / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function inferLiveRole(process: TelemetryProcess) {
  const component = String(process.metadata?.component || '').trim();
  const channel = String(process.metadata?.channel || '').trim();
  const mode = String(process.metadata?.mode || '').trim();
  const segments = [
    process.kind && process.kind !== 'scheduled-job' ? process.kind : null,
    component || null,
    channel ? `channel ${channel}` : null,
    mode ? `mode ${mode}` : null,
  ].filter(Boolean);

  return segments.length > 0
    ? segments.join(' • ')
    : `Owned by ${process.owner} and reporting into the live super-cycle`;
}

function mapTelemetryToJobs(processes: TelemetryProcess[]): DisplayChronJob[] {
  return processes.slice(0, CONCEPT_CHRON_JOBS.length).map((process, index) => {
    const socket = CONCEPT_CHRON_JOBS[index % CONCEPT_CHRON_JOBS.length];
    return {
      ...socket,
      id: process.processId,
      label: process.name,
      role: inferLiveRole(process),
      cadenceSeconds: Math.max(1, Math.round(process.expectedIntervalMs / 1000)),
      live: true,
      processId: process.processId,
      status: process.status,
      owner: process.owner,
      heartbeatAgeMs: process.heartbeatAgeMs,
      lastRunAgeMs: process.lastRunAgeMs,
      cadenceSource: process.cadenceSource,
      lastResult: process.lastResult,
      metadata: process.metadata,
    };
  });
}

function buildGearPath(teeth: number, innerRadius: number, outerRadius: number) {
  const step = (Math.PI * 2) / teeth;
  const points: string[] = [];

  for (let tooth = 0; tooth < teeth; tooth += 1) {
    const start = tooth * step;
    const rise = start + step * 0.18;
    const peak = start + step * 0.5;
    const fall = start + step * 0.82;
    const nextRoot = start + step;

    const rootOne = polar(innerRadius, start);
    const outerOne = polar(outerRadius, rise);
    const outerTwo = polar(outerRadius, peak);
    const rootTwo = polar(innerRadius, fall);
    const rootThree = polar(innerRadius, nextRoot);

    if (tooth === 0) {
      points.push(`M ${rootOne.x} ${rootOne.y}`);
    }

    points.push(`L ${outerOne.x} ${outerOne.y}`);
    points.push(`L ${outerTwo.x} ${outerTwo.y}`);
    points.push(`L ${rootTwo.x} ${rootTwo.y}`);
    points.push(`L ${rootThree.x} ${rootThree.y}`);
  }

  return `${points.join(' ')} Z`;
}

function polar(radius: number, angle: number) {
  return {
    x: 50 + Math.cos(angle - Math.PI / 2) * radius,
    y: 50 + Math.sin(angle - Math.PI / 2) * radius,
  };
}

function GearGlyph({ teeth, color, accent }: { teeth: number; color: string; accent: string }) {
  const gearPath = buildGearPath(teeth, 29, 40);

  return (
    <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible" aria-hidden="true">
      <defs>
        <radialGradient id={`gear-glow-${teeth}-${color.replace('#', '')}`}>
          <stop offset="0%" stopColor="white" stopOpacity="0.95" />
          <stop offset="35%" stopColor={color} stopOpacity="0.55" />
          <stop offset="100%" stopColor={color} stopOpacity="0.1" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="49" fill={accent} />
      <path
        d={gearPath}
        fill={`url(#gear-glow-${teeth}-${color.replace('#', '')})`}
        stroke={color}
        strokeWidth="2.25"
        strokeLinejoin="round"
      />
      <circle cx="50" cy="50" r="22" fill="rgba(9, 14, 30, 0.92)" stroke={color} strokeWidth="2" />
      <circle cx="50" cy="50" r="8" fill={color} fillOpacity="0.82" />
      <path
        d="M50 28 L54 46 L72 50 L54 54 L50 72 L46 54 L28 50 L46 46 Z"
        fill={color}
        fillOpacity="0.72"
      />
    </svg>
  );
}

const Visualizations: React.FC = () => {
  const [telemetry, setTelemetry] = useState<MasterClockTelemetry | null>(null);
  const [telemetryError, setTelemetryError] = useState<string | null>(null);
  const [liveMode, setLiveMode] = useState<boolean>(false);
  const [lockedJobs, setLockedJobs] = useState<Set<string>>(() => new Set(INITIAL_LOCKED_IDS));
  const [selectedJobId, setSelectedJobId] = useState<string>('heartbeat');
  const [hasBootstrappedLocks, setHasBootstrappedLocks] = useState<boolean>(false);
  const [timeScale, setTimeScale] = useState<number>(1);
  const [tick, setTick] = useState<number>(0);
  const [heartbeatFlash, setHeartbeatFlash] = useState<boolean>(false);

  const displayJobs =
    telemetry?.superCycle?.processes?.length && telemetry.status === 'ok'
      ? mapTelemetryToJobs(telemetry.superCycle.processes)
      : CONCEPT_CHRON_JOBS;
  const masterCadenceSeconds = Math.max(
    1,
    Math.round(
      (telemetry?.orchestrator?.heartbeatIntervalMs || CONCEPT_MASTER_CADENCE_SECONDS * 1000) / 1000
    )
  );

  useEffect(() => {
    const animationTimer = window.setInterval(() => {
      setTick((current) => current + 1);
    }, 80);

    return () => window.clearInterval(animationTimer);
  }, []);

  useEffect(() => {
    let isActive = true;
    let inFlight = false;

    const loadTelemetry = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const response = await fetch('/api/system/master-clock', {
          headers: { Accept: 'application/json' },
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const payload = (await response.json()) as MasterClockTelemetry;
        if (!isActive) return;

        const hasProcesses =
          Array.isArray(payload?.superCycle?.processes) && payload.superCycle.processes.length > 0;
        setTelemetry(hasProcesses || payload?.orchestrator ? payload : null);
        setLiveMode(Boolean(payload?.status === 'ok' && (hasProcesses || payload?.orchestrator)));
        setTelemetryError(
          hasProcesses || payload?.orchestrator ? null : 'No live Master Clock state was returned'
        );
      } catch (error) {
        if (!isActive) return;
        setTelemetry(null);
        setLiveMode(false);
        setTelemetryError((error as Error).message || 'Failed to load live Master Clock telemetry');
      } finally {
        inFlight = false;
      }
    };

    void loadTelemetry();
    const refreshTimer = window.setInterval(() => {
      void loadTelemetry();
    }, 15000);

    return () => {
      isActive = false;
      window.clearInterval(refreshTimer);
    };
  }, []);

  useEffect(() => {
    const pulseFrequencyMs = Math.max(350, (masterCadenceSeconds * 1000) / timeScale);
    let pulseTimeout: number | undefined;
    const pulseTimer = window.setInterval(() => {
      setHeartbeatFlash(true);
      pulseTimeout = window.setTimeout(() => setHeartbeatFlash(false), 220);
    }, pulseFrequencyMs);

    return () => {
      window.clearInterval(pulseTimer);
      if (pulseTimeout) {
        window.clearTimeout(pulseTimeout);
      }
    };
  }, [masterCadenceSeconds, timeScale]);

  useEffect(() => {
    setLockedJobs((current) => {
      const next = new Set<string>();
      for (const job of displayJobs) {
        const shouldLockByDefault = job.live
          ? job.status !== 'stalled' && job.status !== 'offline'
          : INITIAL_LOCKED_IDS.includes(job.id);

        if (current.has(job.id) || (!hasBootstrappedLocks && shouldLockByDefault)) {
          next.add(job.id);
        }
      }
      return next;
    });

    if (!hasBootstrappedLocks && displayJobs.length > 0) {
      setHasBootstrappedLocks(true);
    }

    setSelectedJobId((current) =>
      displayJobs.some((job) => job.id === current) ? current : displayJobs[0]?.id || 'heartbeat'
    );
  }, [displayJobs, hasBootstrappedLocks]);

  const selectedJob = displayJobs.find((job) => job.id === selectedJobId) ?? displayJobs[0];
  const lockedCount = displayJobs.filter((job) => lockedJobs.has(job.id)).length;

  const toggleJob = (jobId: string) => {
    setLockedJobs((current) => {
      const next = new Set(current);
      if (next.has(jobId)) {
        next.delete(jobId);
      } else {
        next.add(jobId);
      }
      return next;
    });

    setSelectedJobId(jobId);
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_32%),linear-gradient(145deg,_#030712_0%,_#091120_38%,_#111827_100%)] text-slate-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <Link
              to="/"
              className="mb-5 inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-slate-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to TNF home
            </Link>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-[0.28em] text-cyan-200">
              <Clock3 className="h-3.5 w-3.5" />
              Master Clock Visualization Concept
            </div>
            <h1 className="mt-4 max-w-4xl font-serif text-4xl leading-tight text-white sm:text-5xl lg:text-6xl">
              Turn TNF chron jobs into a living watch movement.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              The central heartbeat drives each sub-routine as a meshed gear. Pull jobs in, lock
              them onto the train, and read their relative cadence at a glance instead of scanning
              flat cron tables.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Locked Jobs</div>
              <div className="mt-2 text-2xl font-semibold text-white">{lockedCount}/5</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Pulse</div>
              <div className="mt-2 text-2xl font-semibold text-rose-300">
                {describeCadence(masterCadenceSeconds)}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Time Scale</div>
              <div className="mt-2 text-2xl font-semibold text-cyan-200">{timeScale}x</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Surface</div>
              <div className="mt-2 text-2xl font-semibold text-emerald-300">Watchboard</div>
            </div>
          </div>
        </div>

        <div
          className={`flex flex-col gap-3 rounded-[1.4rem] border px-5 py-4 text-sm backdrop-blur md:flex-row md:items-center md:justify-between ${
            liveMode
              ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-50'
              : 'border-amber-300/20 bg-amber-400/10 text-amber-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex h-2.5 w-2.5 rounded-full ${liveMode ? 'bg-emerald-300' : 'bg-amber-300'}`}
            />
            <span>
              {liveMode
                ? `Live Railway/Redis Master Clock state • heartbeat ${describeCadence(masterCadenceSeconds)}`
                : 'Fallback concept mode • production telemetry unavailable on this client right now'}
            </span>
          </div>
          <div className="text-xs uppercase tracking-[0.22em] text-white/70">
            {liveMode
              ? `Last update ${telemetry?.timestamp ? new Date(telemetry.timestamp).toLocaleTimeString() : 'now'}`
              : telemetryError || 'Using concept layout until live state arrives'}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
          <section className="rounded-[2rem] border border-white/10 bg-slate-950/55 p-4 shadow-[0_30px_120px_rgba(2,6,23,0.45)] backdrop-blur md:p-6">
            <div className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm uppercase tracking-[0.24em] text-slate-400">
                  <Gauge className="h-4 w-4" />
                  Relative Frequency Train
                </div>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                  Meshed gears rotate by cadence ratio from the live Master Clock heartbeat. Faster
                  jobs spin harder, slower jobs absorb torque. Unlocked jobs stay visible but
                  decouple from the train.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {TIME_SCALES.map((scale) => (
                  <button
                    key={scale}
                    type="button"
                    onClick={() => setTimeScale(scale)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition ${
                      timeScale === scale
                        ? 'border-cyan-300 bg-cyan-300/20 text-cyan-100'
                        : 'border-white/10 bg-white/5 text-slate-300 hover:border-cyan-400/40 hover:text-white'
                    }`}
                  >
                    {scale}x
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
              <div className="relative min-h-[560px] overflow-hidden rounded-[1.6rem] border border-white/10 bg-[radial-gradient(circle_at_center,_rgba(34,211,238,0.1),_transparent_46%),linear-gradient(180deg,_rgba(15,23,42,0.78),_rgba(2,6,23,0.92))]">
                <div className="absolute inset-0 opacity-50">
                  <div className="absolute inset-[8%] rounded-full border border-dashed border-cyan-400/15" />
                  <div className="absolute inset-[20%] rounded-full border border-dashed border-slate-500/20" />
                  <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-cyan-300/15 to-transparent" />
                  <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-gradient-to-r from-transparent via-cyan-300/15 to-transparent" />
                </div>

                <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center">
                  <div
                    className={`mb-4 rounded-full border px-4 py-1 text-xs uppercase tracking-[0.28em] transition ${
                      heartbeatFlash
                        ? 'border-rose-300/80 bg-rose-300/20 text-rose-100 shadow-[0_0_32px_rgba(251,113,133,0.45)]'
                        : 'border-cyan-300/20 bg-slate-950/40 text-slate-300'
                    }`}
                  >
                    Master heartbeat
                  </div>
                  <div className="text-xs uppercase tracking-[0.26em] text-slate-500">1 turn</div>
                  <div className="mt-1 text-3xl font-semibold text-white">
                    {masterCadenceSeconds}s
                  </div>
                </div>

                <div
                  className={`absolute left-1/2 top-1/2 rounded-full bg-rose-400/12 transition-all duration-300 ${
                    heartbeatFlash
                      ? 'h-[21rem] w-[21rem] opacity-100'
                      : 'h-[17rem] w-[17rem] opacity-40'
                  }`}
                  style={{ transform: 'translate(-50%, -50%)' }}
                />

                <div
                  className="absolute left-1/2 top-1/2 z-20"
                  style={{
                    width: `${MASTER_GEAR_SIZE}px`,
                    height: `${MASTER_GEAR_SIZE}px`,
                    transform: `translate(-50%, -50%) rotate(${tick * timeScale * 0.75}deg)`,
                    transition: 'transform 80ms linear',
                  }}
                >
                  <GearGlyph teeth={36} color="#e2e8f0" accent="rgba(148, 163, 184, 0.18)" />
                </div>

                {displayJobs.map((job) => {
                  const locked = lockedJobs.has(job.id);
                  const relativeRate = masterCadenceSeconds / job.cadenceSeconds;
                  const rotationFactor = Math.max(0.18, relativeRate);
                  const rotation = locked
                    ? tick * timeScale * rotationFactor * 0.75 * job.direction
                    : job.direction * 14;

                  return (
                    <button
                      key={job.id}
                      type="button"
                      onClick={() => setSelectedJobId(job.id)}
                      className={`absolute z-30 rounded-full transition ${
                        selectedJobId === job.id
                          ? 'ring-4 ring-white/20'
                          : 'ring-1 ring-transparent hover:ring-white/10'
                      } ${locked ? 'opacity-100' : 'opacity-40 saturate-50'}`}
                      style={{
                        left: `${job.x}%`,
                        top: `${job.y}%`,
                        width: `${job.size}px`,
                        height: `${job.size}px`,
                        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                        transition: 'transform 80ms linear, opacity 200ms ease, filter 200ms ease',
                      }}
                      aria-label={`Select ${job.label}`}
                    >
                      <div
                        className="absolute inset-0 rounded-full blur-2xl"
                        style={{ backgroundColor: job.accent }}
                      />
                      <GearGlyph teeth={job.teeth} color={job.color} accent={job.accent} />
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className="rounded-full border border-black/30 bg-slate-950/85 px-3 py-1 text-center shadow-lg">
                          <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
                            {job.cadenceSeconds}s
                          </div>
                          <div className="mt-1 text-xs font-semibold text-white">{job.label}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-3">
                {displayJobs.map((job) => {
                  const locked = lockedJobs.has(job.id);
                  const relativeRate = masterCadenceSeconds / job.cadenceSeconds;

                  return (
                    <button
                      key={job.id}
                      type="button"
                      onClick={() => toggleJob(job.id)}
                      aria-label={`Toggle ${job.label}`}
                      className={`w-full rounded-[1.35rem] border p-4 text-left transition ${
                        selectedJobId === job.id
                          ? 'border-white/25 bg-white/10'
                          : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-flex h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: job.color }}
                            />
                            <h2 className="text-sm font-semibold text-white">{job.label}</h2>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-slate-400">{job.role}</p>
                        </div>
                        {locked ? (
                          <ToggleRight className="h-5 w-5 text-emerald-300" />
                        ) : (
                          <ToggleLeft className="h-5 w-5 text-slate-500" />
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-between text-xs uppercase tracking-[0.22em] text-slate-500">
                        <span>{describeCadence(job.cadenceSeconds)}</span>
                        <span>{relativeRate.toFixed(2)}x rate</span>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-900/80">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, relativeRate * 24)}%`,
                            background: `linear-gradient(90deg, ${job.color}, rgba(255,255,255,0.9))`,
                          }}
                        />
                      </div>
                      <div className="mt-3 text-sm font-medium text-slate-200">
                        {locked ? 'Locked into gear train' : 'Pulled off the train'}
                      </div>
                      {job.live ? (
                        <div className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                          {job.status || 'running'} • last heartbeat {formatAge(job.heartbeatAgeMs)}
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-400">
                <Cpu className="h-4 w-4" />
                Selected Routine
              </div>
              <h2 className="mt-3 text-2xl font-semibold text-white">{selectedJob?.label}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">{selectedJob?.role}</p>

              <div className="mt-6 space-y-3">
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Cadence</div>
                  <div className="mt-2 text-lg font-semibold text-white">
                    {selectedJob ? describeCadence(selectedJob.cadenceSeconds) : 'Unavailable'}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-500">
                    Relative Rotation
                  </div>
                  <div className="mt-2 text-lg font-semibold text-white">
                    {selectedJob
                      ? `${(masterCadenceSeconds / selectedJob.cadenceSeconds).toFixed(2)}x of the master clock`
                      : 'Unavailable'}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Coupling</div>
                  <div className="mt-2 text-lg font-semibold text-white">
                    {selectedJob && lockedJobs.has(selectedJob.id)
                      ? 'Locked and turning'
                      : 'Detached for tuning'}
                  </div>
                </div>
                {selectedJob?.live ? (
                  <>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                      <div className="text-xs uppercase tracking-[0.24em] text-slate-500">
                        Live Status
                      </div>
                      <div className="mt-2 text-lg font-semibold text-white">
                        {selectedJob.status || 'running'} • heartbeat{' '}
                        {formatAge(selectedJob.heartbeatAgeMs)}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                      <div className="text-xs uppercase tracking-[0.24em] text-slate-500">
                        Cadence Source
                      </div>
                      <div className="mt-2 text-lg font-semibold text-white">
                        {selectedJob.cadenceSource === 'metadata'
                          ? 'Reported by process metadata'
                          : 'Inferred from TNF process type'}
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-400">
                <Activity className="h-4 w-4" />
                Chronological Sub-routine Lane
              </div>
              <div className="mt-5 space-y-4">
                {displayJobs
                  .slice()
                  .sort((left, right) => left.cadenceSeconds - right.cadenceSeconds)
                  .map((job) => {
                    const locked = lockedJobs.has(job.id);

                    return (
                      <div key={job.id} className="flex items-start gap-3">
                        <div className="mt-1 flex flex-col items-center">
                          <div
                            className={`h-3 w-3 rounded-full ${locked ? 'shadow-[0_0_16px_rgba(255,255,255,0.35)]' : ''}`}
                            style={{ backgroundColor: job.color }}
                          />
                          <div className="mt-1 h-12 w-px bg-gradient-to-b from-white/15 to-transparent" />
                        </div>
                        <div className="flex-1 rounded-2xl border border-white/10 bg-slate-950/35 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-medium text-white">{job.label}</div>
                            <div className="text-xs uppercase tracking-[0.22em] text-slate-500">
                              {describeCadence(job.cadenceSeconds)}
                            </div>
                          </div>
                          <div className="mt-2 text-sm text-slate-400">
                            {job.live
                              ? `${locked ? 'Coupled to the live watchboard.' : 'Visible but detached.'} Last heartbeat ${formatAge(job.heartbeatAgeMs)}.`
                              : locked
                                ? 'Coupled to the watchboard and actively transmitting torque.'
                                : 'Visible on the board but paused for manual staging.'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </section>

            {liveMode && telemetry?.recentActivity?.length ? (
              <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-400">
                  <Activity className="h-4 w-4" />
                  Recent Master Clock Activity
                </div>
                <div className="mt-5 space-y-3">
                  {telemetry.recentActivity.slice(0, 5).map((entry, index) => (
                    <div
                      key={`${entry.timestamp || 'log'}-${index}`}
                      className="rounded-2xl border border-white/10 bg-slate-950/35 p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-medium text-white">{entry.eventType}</div>
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          {entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString() : 'now'}
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-slate-400">{entry.content}</div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="rounded-[2rem] border border-cyan-300/20 bg-cyan-400/10 p-6">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-cyan-100">
                <Orbit className="h-4 w-4" />
                Where this can go
              </div>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-cyan-50/90">
                <li className="flex gap-3">
                  <Play className="mt-1 h-4 w-4 shrink-0 text-cyan-200" />
                  Expand process metadata so every super-cycle producer reports its exact intended
                  interval, not just inferred cadence.
                </li>
                <li className="flex gap-3">
                  <Zap className="mt-1 h-4 w-4 shrink-0 text-cyan-200" />
                  Add drag-to-mesh placement so new chron jobs can be snapped into open sockets like
                  a toy gear wall.
                </li>
                <li className="flex gap-3">
                  <Gauge className="mt-1 h-4 w-4 shrink-0 text-cyan-200" />
                  Blend this with audit and timeline telemetry so each gear emits last-run and
                  next-fire overlays.
                </li>
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Visualizations;
