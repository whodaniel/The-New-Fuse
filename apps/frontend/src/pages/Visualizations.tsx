import {
  Activity,
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Brain,
  CheckCircle,
  Clock3,
  Cpu,
  ExternalLink,
  Gauge,
  Grip,
  LayoutGrid,
  Network,
  Orbit,
  RefreshCw,
  TerminalSquare,
  ToggleLeft,
  ToggleRight,
  Wrench,
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  intendedIntervalMs?: number | null;
  intervalSource?: 'producer' | 'metadata' | 'inferred' | 'contract';
  intervalExact?: boolean;
  expectedIntervalMs: number;
  cadenceSource: 'producer' | 'metadata' | 'inferred';
  lastHeartbeat: string | null;
  heartbeatAgeMs: number | null;
  lastRunAt: string | null;
  lastRunAgeMs: number | null;
  nextExpectedAt?: string | null;
  nextFireInMs?: number | null;
  lastResult: string | null;
  metadata?: Record<string, unknown>;
};

type TelemetryLog = {
  timestamp: string | null;
  eventType: string;
  content: string;
  metadata: Record<string, unknown>;
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
    projectionMode?: 'live' | 'contract-fallback';
    stats: {
      total: number;
      healthy: number;
      stale: number;
    };
    processes: TelemetryProcess[];
  };
  recentActivity: TelemetryLog[];
};

type DisplayChronJob = ChronJob & {
  live: boolean;
  processId?: string;
  status?: string;
  owner?: string;
  heartbeatAgeMs?: number | null;
  lastRunAgeMs?: number | null;
  cadenceSource?: 'producer' | 'metadata' | 'inferred';
  intervalSource?: 'producer' | 'metadata' | 'inferred' | 'contract';
  intendedIntervalMs?: number | null;
  intervalExact?: boolean;
  nextExpectedAt?: string | null;
  nextFireInMs?: number | null;
  lastResult?: string | null;
  metadata?: Record<string, unknown>;
  lastActivityEvent?: string | null;
  lastActivityAt?: string | null;
  lastActivityContent?: string | null;
};

type MeshSocket = {
  id: string;
  index: number;
  x: number;
  y: number;
};

type DragState = {
  jobId: string;
  pointerId: number;
};

type VisualizationSurfaceStatus = 'stable' | 'needs-work';
type VisualizationSurfaceIntegration = 'native-route' | 'static-html';

type VisualizationSurface = {
  title: string;
  description: string;
  href: string;
  tags: string[];
  status: VisualizationSurfaceStatus;
  integration: VisualizationSurfaceIntegration;
};

type VisualizationSection = {
  id: string;
  label: string;
  summary: string;
  items: VisualizationSurface[];
};

type VisualizationSurfaceHealthState = 'idle' | 'checking' | 'reachable' | 'failing';

type VisualizationSurfaceHealth = {
  state: VisualizationSurfaceHealthState;
  statusCode?: number;
  checkedAt?: string;
  error?: string;
};

type VisualizationSurfaceEntry = VisualizationSurface & {
  sectionId: string;
  sectionLabel: string;
};

const CONCEPT_MASTER_CADENCE_SECONDS = 60;
const MASTER_GEAR_SIZE = 210;
const SNAP_DISTANCE_PERCENT = 15;

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

const LIVE_GEAR_STYLE = [
  { color: '#fb7185', accent: 'rgba(251, 113, 133, 0.28)' },
  { color: '#38bdf8', accent: 'rgba(56, 189, 248, 0.22)' },
  { color: '#f59e0b', accent: 'rgba(245, 158, 11, 0.2)' },
  { color: '#34d399', accent: 'rgba(52, 211, 153, 0.2)' },
  { color: '#a78bfa', accent: 'rgba(167, 139, 250, 0.2)' },
  { color: '#f97316', accent: 'rgba(249, 115, 22, 0.2)' },
  { color: '#22d3ee', accent: 'rgba(34, 211, 238, 0.22)' },
  { color: '#eab308', accent: 'rgba(234, 179, 8, 0.22)' },
];

const INITIAL_LOCKED_IDS = ['heartbeat', 'broker', 'director'];
const TIME_SCALES = [0.5, 1, 2, 4];

const VISUALIZATION_SECTIONS: VisualizationSection[] = [
  {
    id: 'agent-graphs',
    label: 'Agent Relationship Graphs',
    summary: 'Domain-level subgraphs generated from the relationship graph artifact pipeline.',
    items: [
      {
        title: 'Content Domain Subgraph',
        description: 'Content systems, editorial orchestration, and SEO-linked workflows.',
        href: '/visualizations/graphs/agent-relationship-graph/subgraphs/agent-relationship-content-subgraph.html',
        tags: ['Graph', 'Domain'],
        status: 'stable',
        integration: 'static-html',
      },
      {
        title: 'SEO Domain Subgraph',
        description: 'Keyword planning, technical SEO, and search performance dependencies.',
        href: '/visualizations/graphs/agent-relationship-graph/subgraphs/agent-relationship-seo-subgraph.html',
        tags: ['Graph', 'Search'],
        status: 'stable',
        integration: 'static-html',
      },
      {
        title: 'Social Domain Subgraph',
        description: 'Social publishing, distribution loops, and engagement pathways.',
        href: '/visualizations/graphs/agent-relationship-graph/subgraphs/agent-relationship-social-subgraph.html',
        tags: ['Graph', 'Social'],
        status: 'stable',
        integration: 'static-html',
      },
      {
        title: 'Brand Domain Subgraph',
        description: 'Brand integrity, voice controls, legal/compliance adjacencies.',
        href: '/visualizations/graphs/agent-relationship-graph/subgraphs/agent-relationship-brand-subgraph.html',
        tags: ['Graph', 'Brand'],
        status: 'stable',
        integration: 'static-html',
      },
      {
        title: 'Podcast Domain Subgraph',
        description: 'Recording, editing, distribution, and analytics role topology.',
        href: '/visualizations/graphs/agent-relationship-graph/subgraphs/agent-relationship-podcast-subgraph.html',
        tags: ['Graph', 'Podcast'],
        status: 'stable',
        integration: 'static-html',
      },
      {
        title: 'Funnel Domain Subgraph',
        description: 'Acquisition and conversion pathways across funnel orchestration agents.',
        href: '/visualizations/graphs/agent-relationship-graph/subgraphs/agent-relationship-funnel-subgraph.html',
        tags: ['Graph', 'Funnel'],
        status: 'stable',
        integration: 'static-html',
      },
      {
        title: 'Operations Domain Subgraph',
        description: 'Core operational agents, orchestration controls, and execution routing.',
        href: '/visualizations/graphs/agent-relationship-graph/subgraphs/agent-relationship-ops-subgraph.html',
        tags: ['Graph', 'Ops'],
        status: 'stable',
        integration: 'static-html',
      },
    ],
  },
  {
    id: 'system-views',
    label: 'System Views',
    summary:
      'Runtime, architecture, and telemetry surfaces used for operational and workflow debugging.',
    items: [
      {
        title: 'Terminal Graph View',
        description: 'Route-integrated terminal board for macro state and execution context.',
        href: '/visualizations/terminals',
        tags: ['Route', 'Terminal'],
        status: 'stable',
        integration: 'native-route',
      },
      {
        title: 'Agent Communication Flow',
        description: 'Message routing and protocol exchange map across services and workflows.',
        href: '/visualizations/agent-communication-flow.html',
        tags: ['Flow', 'Interactive'],
        status: 'needs-work',
        integration: 'static-html',
      },
      {
        title: 'Service Architecture Map',
        description: 'Service topology and interface boundaries for system-level tracing.',
        href: '/visualizations/service-architecture-map.html',
        tags: ['Architecture', 'Topology'],
        status: 'needs-work',
        integration: 'static-html',
      },
      {
        title: 'Monitoring Dashboard',
        description: 'Legacy operations dashboard for high-level runtime telemetry.',
        href: '/visualizations/monitoring-dashboard.html',
        tags: ['Monitoring', 'Legacy'],
        status: 'needs-work',
        integration: 'static-html',
      },
      {
        title: 'Bundle Size Analyzer',
        description: 'Bundle composition and package weight analysis for frontend payload tuning.',
        href: '/visualizations/bundle-size-analyzer.html',
        tags: ['Bundle', 'Performance'],
        status: 'needs-work',
        integration: 'static-html',
      },
      {
        title: 'Workflow Dependencies',
        description: 'DAG-style graph of workflow dependencies and task execution order.',
        href: '/visualizations/workflow-dependencies.html',
        tags: ['Workflow', 'Dependencies'],
        status: 'needs-work',
        integration: 'static-html',
      },
      {
        title: 'Workflow Preview',
        description: 'Legacy preview surface for validating workflow graph structures.',
        href: '/visualizations/workflow-preview.html',
        tags: ['Workflow', 'Preview'],
        status: 'needs-work',
        integration: 'static-html',
      },
      {
        title: 'TNF Intelligence Dashboard',
        description: 'Large-format intelligence board with expanded analysis context.',
        href: '/visualizations/TNF_INTELLIGENCE_DASHBOARD.html',
        tags: ['Intelligence', 'Legacy'],
        status: 'needs-work',
        integration: 'static-html',
      },
      {
        title: 'TNF Concordance Visualizer',
        description: 'Concordance explorer for indexed codebase term frequency and relationships.',
        href: '/visualizations/TNF_CONCORDANCE_VISUALIZER.html',
        tags: ['Concordance', 'Search'],
        status: 'needs-work',
        integration: 'static-html',
      },
    ],
  },
  {
    id: 'docs-and-briefs',
    label: 'Docs And Briefs',
    summary: 'Supporting documentation linked to visualization systems and integration patterns.',
    items: [
      {
        title: 'AG-UI Integration Analysis',
        description: 'Architecture and implementation analysis for AG-UI integration.',
        href: '/visualizations/AG-UI-INTEGRATION-ANALYSIS.html',
        tags: ['Docs', 'AG-UI'],
        status: 'needs-work',
        integration: 'static-html',
      },
      {
        title: 'AG-UI Integration Guide',
        description: 'Step-by-step implementation guidance for AG-UI integration.',
        href: '/visualizations/AG-UI-INTEGRATION-GUIDE.html',
        tags: ['Docs', 'Guide'],
        status: 'needs-work',
        integration: 'static-html',
      },
      {
        title: 'Capability Packaging Brief',
        description: 'Packaging and distribution documentation for capability bundles.',
        href: '/visualizations/CAPABILITY-PACKAGING-COMPLETE.html',
        tags: ['Docs', 'Packaging'],
        status: 'needs-work',
        integration: 'static-html',
      },
      {
        title: 'Claude Code At Scale',
        description: 'Scale patterns and architecture notes for Claude-based development.',
        href: '/visualizations/CLAUDE-CODE-AT-SCALE.html',
        tags: ['Docs', 'Scale'],
        status: 'needs-work',
        integration: 'static-html',
      },
      {
        title: 'Gemini Code Assist Integration',
        description: 'Integration notes and architecture pointers for Gemini assistance.',
        href: '/visualizations/GEMINI-CODE-ASSIST-INTEGRATION.html',
        tags: ['Docs', 'Gemini'],
        status: 'needs-work',
        integration: 'static-html',
      },
      {
        title: 'Project Summary',
        description: 'High-level summary of visualization deliverables and architecture direction.',
        href: '/visualizations/PROJECT-SUMMARY.html',
        tags: ['Docs', 'Summary'],
        status: 'needs-work',
        integration: 'static-html',
      },
    ],
  },
];

const VISUALIZATION_SURFACE_ENTRIES: VisualizationSurfaceEntry[] = VISUALIZATION_SECTIONS.flatMap(
  (section) =>
    section.items.map((item) => ({
      ...item,
      sectionId: section.id,
      sectionLabel: section.label,
    }))
);

const VISUALIZATION_SURFACE_TOTAL = VISUALIZATION_SECTIONS.reduce(
  (total, section) => total + section.items.length,
  0
);
const VISUALIZATION_NEEDS_WORK_TOTAL = VISUALIZATION_SECTIONS.reduce(
  (total, section) => total + section.items.filter((item) => item.status === 'needs-work').length,
  0
);
const VISUALIZATION_NATIVE_ROUTE_TOTAL = VISUALIZATION_SECTIONS.reduce(
  (total, section) =>
    total + section.items.filter((item) => item.integration === 'native-route').length,
  0
);
const SURFACE_HEALTH_PROBE_TIMEOUT_MS = 7000;

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

function formatCountdown(ageMs?: number | null) {
  if (ageMs === null || ageMs === undefined || !Number.isFinite(ageMs)) {
    return 'n/a';
  }
  const seconds = Math.round(ageMs / 1000);
  if (seconds >= 0) {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  }
  const lagSeconds = Math.abs(seconds);
  if (lagSeconds < 60) return `${lagSeconds}s late`;
  const lagMinutes = Math.floor(lagSeconds / 60);
  return `${lagMinutes}m late`;
}

function surfaceHealthPriority(state: VisualizationSurfaceHealthState) {
  switch (state) {
    case 'failing':
      return 0;
    case 'checking':
      return 1;
    case 'idle':
      return 2;
    case 'reachable':
    default:
      return 3;
  }
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('timeout')), timeoutMs);
  });

  try {
    return (await Promise.race([fetch(input, init), timeoutPromise])) as Response;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
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

function parseProcessIdFromLog(log: TelemetryLog): string | null {
  const candidate =
    String(log.metadata?.processId || '').trim() ||
    String(log.metadata?.targetProcessId || '').trim() ||
    String(log.metadata?.process || '').trim();
  return candidate || null;
}

function mapRecentActivityByProcess(logs: TelemetryLog[]) {
  const byProcess = new Map<string, TelemetryLog>();
  for (const log of logs) {
    const processId = parseProcessIdFromLog(log);
    if (!processId || byProcess.has(processId)) continue;
    byProcess.set(processId, log);
  }
  return byProcess;
}

function buildLiveSocket(index: number, total: number): DisplayChronJob {
  if (total <= CONCEPT_CHRON_JOBS.length) {
    return CONCEPT_CHRON_JOBS[index % CONCEPT_CHRON_JOBS.length];
  }

  let ring = 0;
  let slot = index;
  let ringCapacity = 8;

  while (slot >= ringCapacity) {
    slot -= ringCapacity;
    ring += 1;
    ringCapacity = 8 + ring * 6;
  }

  const radius = Math.min(45, 23 + ring * 8);
  const angle = (Math.PI * 2 * slot) / ringCapacity + (ring % 2 ? Math.PI / ringCapacity : 0);
  const size = Math.max(88, 144 - ring * 12);
  const style = LIVE_GEAR_STYLE[index % LIVE_GEAR_STYLE.length];

  return {
    id: `live-socket-${index}`,
    label: `Live Job ${index + 1}`,
    role: 'Live scheduled process',
    cadenceSeconds: 60,
    teeth: 16 + ((index + ring) % 8) * 2,
    size,
    x: 50 + Math.cos(angle) * radius,
    y: 50 + Math.sin(angle) * radius,
    color: style.color,
    accent: style.accent,
    direction: index % 2 === 0 ? 1 : -1,
    live: false,
  };
}

function buildMeshSockets(jobCount: number): MeshSocket[] {
  const targetSocketCount = Math.max(12, jobCount + 4);
  return Array.from({ length: targetSocketCount }, (_, index) => {
    const template = buildLiveSocket(index, targetSocketCount);
    return {
      id: `mesh-socket-${index}`,
      index,
      x: template.x,
      y: template.y,
    };
  });
}

function mapTelemetryToJobs(
  processes: TelemetryProcess[],
  activityLogs: TelemetryLog[]
): DisplayChronJob[] {
  const activityByProcess = mapRecentActivityByProcess(activityLogs);
  return processes.map((process, index) => {
    const socket = buildLiveSocket(index, processes.length);
    const cadenceMs = process.intendedIntervalMs || process.expectedIntervalMs;
    const cadenceSeconds = Math.max(1, Math.round(cadenceMs / 1000));
    const processLog = activityByProcess.get(process.processId);
    return {
      ...socket,
      id: process.processId,
      label: process.name,
      role: inferLiveRole(process),
      cadenceSeconds,
      live: true,
      processId: process.processId,
      status: process.status,
      owner: process.owner,
      heartbeatAgeMs: process.heartbeatAgeMs,
      lastRunAgeMs: process.lastRunAgeMs,
      cadenceSource: process.cadenceSource,
      intervalSource: process.intervalSource,
      intendedIntervalMs: process.intendedIntervalMs || null,
      intervalExact: process.intervalExact,
      nextExpectedAt: process.nextExpectedAt || null,
      nextFireInMs: process.nextFireInMs ?? null,
      lastResult: process.lastResult,
      metadata: process.metadata,
      lastActivityEvent: processLog?.eventType || null,
      lastActivityAt: processLog?.timestamp || null,
      lastActivityContent: processLog?.content || null,
    };
  });
}

function resolveCadenceSourceLabel(source?: 'producer' | 'metadata' | 'inferred') {
  if (source === 'producer') return 'Producer contract';
  if (source === 'metadata') return 'Metadata contract';
  return 'Inferred cadence';
}

function resolveIntervalSourceLabel(
  source?: 'producer' | 'metadata' | 'inferred' | 'contract',
  exact?: boolean
) {
  if (source === 'producer') return exact ? 'Producer contract (exact)' : 'Producer contract';
  if (source === 'metadata') return exact ? 'Metadata contract (exact)' : 'Metadata contract';
  if (source === 'contract') return 'Fallback contract';
  return 'Inferred interval';
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
  const [socketAssignments, setSocketAssignments] = useState<Record<string, number>>({});
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dragPosition, setDragPosition] = useState<{ jobId: string; x: number; y: number } | null>(
    null
  );
  const [surfaceHealth, setSurfaceHealth] = useState<Record<string, VisualizationSurfaceHealth>>(
    {}
  );
  const [surfaceProbeRun, setSurfaceProbeRun] = useState<number>(0);
  const [surfaceProbeActive, setSurfaceProbeActive] = useState<boolean>(false);
  const meshRef = useRef<HTMLDivElement | null>(null);

  const surfaceHealthStats = useMemo(() => {
    let reachable = 0;
    let failing = 0;
    let checking = 0;
    let idle = 0;

    for (const entry of VISUALIZATION_SURFACE_ENTRIES) {
      const state = surfaceHealth[entry.href]?.state || 'idle';
      if (state === 'reachable') reachable += 1;
      else if (state === 'failing') failing += 1;
      else if (state === 'checking') checking += 1;
      else idle += 1;
    }

    return { reachable, failing, checking, idle };
  }, [surfaceHealth]);

  const repairQueue = useMemo(
    () =>
      VISUALIZATION_SURFACE_ENTRIES.filter((entry) => entry.status === 'needs-work')
        .map((entry) => ({
          entry,
          health: surfaceHealth[entry.href] || ({ state: 'idle' } as VisualizationSurfaceHealth),
        }))
        .sort((left, right) => {
          const priorityDiff =
            surfaceHealthPriority(left.health.state) - surfaceHealthPriority(right.health.state);
          if (priorityDiff !== 0) return priorityDiff;
          return left.entry.title.localeCompare(right.entry.title);
        }),
    [surfaceHealth]
  );

  const displayJobs =
    telemetry?.superCycle?.processes?.length && telemetry.status === 'ok'
      ? mapTelemetryToJobs(telemetry.superCycle.processes, telemetry.recentActivity || [])
      : CONCEPT_CHRON_JOBS;
  const masterCadenceSeconds = Math.max(
    1,
    Math.round(
      (telemetry?.orchestrator?.heartbeatIntervalMs || CONCEPT_MASTER_CADENCE_SECONDS * 1000) / 1000
    )
  );
  const projectionMode = telemetry?.superCycle?.projectionMode || 'live';
  const projectedMode = projectionMode === 'contract-fallback';
  const meshSockets = buildMeshSockets(displayJobs.length);

  useEffect(() => {
    const animationTimer = window.setInterval(() => {
      setTick((current) => current + 1);
    }, 80);
    return () => window.clearInterval(animationTimer);
  }, []);

  useEffect(() => {
    if (import.meta.env.MODE === 'test') return;

    let isActive = true;

    const markChecking = () => {
      setSurfaceHealth((current) => {
        const next = { ...current };
        for (const surface of VISUALIZATION_SURFACE_ENTRIES) {
          next[surface.href] = {
            ...next[surface.href],
            state: 'checking',
          };
        }
        return next;
      });
    };

    const probeSurface = async (
      surface: VisualizationSurfaceEntry
    ): Promise<VisualizationSurfaceHealth> => {
      const checkedAt = new Date().toISOString();
      try {
        const headResponse = await fetchWithTimeout(
          surface.href,
          {
            method: 'HEAD',
            credentials: 'include',
            cache: 'no-store',
          },
          SURFACE_HEALTH_PROBE_TIMEOUT_MS
        );
        if (headResponse.ok) {
          if (headResponse.headers.get('X-TNF-Routing') === 'SPA-App') {
            return {
              state: 'failing',
              statusCode: headResponse.status,
              checkedAt,
              error: 'SPA shell returned instead of visualization asset',
            };
          }
          return { state: 'reachable', statusCode: headResponse.status, checkedAt };
        }
        if (![405, 501].includes(headResponse.status)) {
          return {
            state: 'failing',
            statusCode: headResponse.status,
            checkedAt,
            error: `HTTP ${headResponse.status}`,
          };
        }
      } catch (error) {
        const message = (error as Error).message || 'request failed';
        if (message !== 'timeout') {
          // Continue to GET fallback for network-adjacent issues.
        }
      }

      try {
        const getResponse = await fetchWithTimeout(
          surface.href,
          {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store',
            headers: { Accept: 'text/html,*/*' },
          },
          SURFACE_HEALTH_PROBE_TIMEOUT_MS
        );
        if (!getResponse.ok) {
          return {
            state: 'failing',
            statusCode: getResponse.status,
            checkedAt,
            error: `HTTP ${getResponse.status}`,
          };
        }
        if (getResponse.headers.get('X-TNF-Routing') === 'SPA-App') {
          return {
            state: 'failing',
            statusCode: getResponse.status,
            checkedAt,
            error: 'SPA shell returned instead of visualization asset',
          };
        }
        return { state: 'reachable', statusCode: getResponse.status, checkedAt };
      } catch (error) {
        return {
          state: 'failing',
          checkedAt,
          error: (error as Error).message || 'request failed',
        };
      }
    };

    const runProbe = async () => {
      setSurfaceProbeActive(true);
      markChecking();

      for (const surface of VISUALIZATION_SURFACE_ENTRIES) {
        const health = await probeSurface(surface);
        if (!isActive) return;
        setSurfaceHealth((current) => ({
          ...current,
          [surface.href]: health,
        }));
      }

      if (isActive) {
        setSurfaceProbeActive(false);
      }
    };

    void runProbe();

    return () => {
      isActive = false;
    };
  }, [surfaceProbeRun]);

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
      if (current.size === next.size) {
        let unchanged = true;
        for (const value of current) {
          if (!next.has(value)) {
            unchanged = false;
            break;
          }
        }
        if (unchanged) return current;
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

  useEffect(() => {
    setSocketAssignments((current) => {
      const next: Record<string, number> = {};
      const used = new Set<number>();

      for (const job of displayJobs) {
        const assigned = current[job.id];
        if (
          Number.isInteger(assigned) &&
          (assigned as number) >= 0 &&
          (assigned as number) < meshSockets.length &&
          !used.has(assigned as number)
        ) {
          next[job.id] = assigned as number;
          used.add(assigned as number);
        }
      }

      let cursor = 0;
      for (const job of displayJobs) {
        if (Number.isInteger(next[job.id])) continue;
        while (used.has(cursor) && cursor < meshSockets.length) {
          cursor += 1;
        }
        const assigned = cursor < meshSockets.length ? cursor : used.size;
        next[job.id] = assigned;
        used.add(assigned);
      }

      const currentKeys = Object.keys(current);
      const nextKeys = Object.keys(next);
      if (currentKeys.length !== nextKeys.length) {
        return next;
      }
      for (const key of nextKeys) {
        if (current[key] !== next[key]) return next;
      }
      return current;
    });
  }, [displayJobs, meshSockets.length]);

  useEffect(() => {
    if (!dragState) return;

    const toBoardPoint = (clientX: number, clientY: number) => {
      const rect = meshRef.current?.getBoundingClientRect();
      if (!rect || rect.width <= 0 || rect.height <= 0) {
        return null;
      }
      const rawX = ((clientX - rect.left) / rect.width) * 100;
      const rawY = ((clientY - rect.top) / rect.height) * 100;
      return {
        x: Math.max(4, Math.min(96, rawX)),
        y: Math.max(4, Math.min(96, rawY)),
      };
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerId !== dragState.pointerId) return;
      const point = toBoardPoint(event.clientX, event.clientY);
      if (!point) return;
      setDragPosition({ jobId: dragState.jobId, x: point.x, y: point.y });
    };

    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerId !== dragState.pointerId) return;
      const point =
        toBoardPoint(event.clientX, event.clientY) ||
        (dragPosition?.jobId === dragState.jobId ? { x: dragPosition.x, y: dragPosition.y } : null);

      if (point) {
        setSocketAssignments((current) => {
          const currentSocket = current[dragState.jobId];
          const occupied = new Set<number>();
          for (const job of displayJobs) {
            if (job.id === dragState.jobId) continue;
            const assigned = current[job.id];
            if (Number.isInteger(assigned)) {
              occupied.add(assigned as number);
            }
          }

          let nearest: { index: number; distance: number } | null = null;
          for (const socket of meshSockets) {
            if (occupied.has(socket.index) && socket.index !== currentSocket) continue;
            const dx = socket.x - point.x;
            const dy = socket.y - point.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (!nearest || distance < nearest.distance) {
              nearest = { index: socket.index, distance };
            }
          }

          if (!nearest || nearest.distance > SNAP_DISTANCE_PERCENT) {
            return current;
          }

          if (current[dragState.jobId] === nearest.index) {
            return current;
          }
          return { ...current, [dragState.jobId]: nearest.index };
        });
      }

      setDragState(null);
      setDragPosition(null);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, [displayJobs, dragPosition, dragState, meshSockets]);

  const occupiedSockets = new Map<number, string>();
  displayJobs.forEach((job, index) => {
    const assigned = socketAssignments[job.id];
    const fallback = Math.min(index, meshSockets.length - 1);
    const socketIndex =
      Number.isInteger(assigned) &&
      (assigned as number) >= 0 &&
      (assigned as number) < meshSockets.length
        ? (assigned as number)
        : fallback;
    if (!occupiedSockets.has(socketIndex)) {
      occupiedSockets.set(socketIndex, job.id);
    }
  });

  const dragTargetSocketIndex =
    dragState && dragPosition?.jobId === dragState.jobId
      ? (() => {
          let nearest: { index: number; distance: number } | null = null;
          for (const socket of meshSockets) {
            const occupant = occupiedSockets.get(socket.index);
            if (occupant && occupant !== dragState.jobId) continue;
            const dx = socket.x - dragPosition.x;
            const dy = socket.y - dragPosition.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (!nearest || distance < nearest.distance) {
              nearest = { index: socket.index, distance };
            }
          }
          return nearest && nearest.distance <= SNAP_DISTANCE_PERCENT ? nearest.index : null;
        })()
      : null;

  const selectedJob = displayJobs.find((job) => job.id === selectedJobId) ?? displayJobs[0];
  const lockedCount = displayJobs.filter((job) => lockedJobs.has(job.id)).length;
  const openSockets = Math.max(0, meshSockets.length - displayJobs.length);

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

  const getSocketForJob = (job: DisplayChronJob, index: number) => {
    const assigned = socketAssignments[job.id];
    const fallback = Math.min(index, meshSockets.length - 1);
    const socketIndex =
      Number.isInteger(assigned) &&
      (assigned as number) >= 0 &&
      (assigned as number) < meshSockets.length
        ? (assigned as number)
        : fallback;
    return (
      meshSockets[socketIndex] || {
        id: `fallback-${job.id}`,
        index: socketIndex,
        x: job.x,
        y: job.y,
      }
    );
  };

  const startDrag = (event: React.PointerEvent<HTMLButtonElement>, jobId: string) => {
    const rect = meshRef.current?.getBoundingClientRect();
    if (!rect) return;
    event.preventDefault();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setSelectedJobId(jobId);
    setDragState({ jobId, pointerId: event.pointerId });
    setDragPosition({
      jobId,
      x: Math.max(4, Math.min(96, x)),
      y: Math.max(4, Math.min(96, y)),
    });
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
              Master Clock Visualization
            </div>
            <h1 className="mt-4 max-w-4xl font-serif text-4xl leading-tight text-white sm:text-5xl lg:text-6xl">
              Turn TNF chron jobs into a living watch movement.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              Drag gears into open mesh sockets, keep them coupled to the heartbeat, and inspect
              exact producer intervals with last-run and next-fire telemetry in one board.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                to="/visualizations/terminals"
                className="inline-flex items-center gap-2 rounded-full border border-cyan-300/35 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-100 transition hover:border-cyan-200 hover:bg-cyan-500/20"
              >
                <TerminalSquare className="h-4 w-4" />
                Open Terminal Graph View
              </Link>
              <a
                href={`/visualizations/surface?${new URLSearchParams({
                  src: '/visualizations/TNF_INTELLIGENCE_DASHBOARD.html',
                  title: 'TNF Intelligence Dashboard',
                  section: 'System Views',
                }).toString()}`}
                className="inline-flex items-center gap-2 rounded-full border border-purple-300/35 bg-purple-500/10 px-4 py-2 text-sm text-purple-100 transition hover:border-purple-200 hover:bg-purple-500/20"
              >
                <Brain className="h-4 w-4" />
                Open Intelligence Density Map
              </a>
              <a
                href={`/visualizations/surface?${new URLSearchParams({
                  src: '/visualizations/dashboard.html',
                  title: 'Legacy Visualization Card Dashboard',
                  section: 'System Views',
                }).toString()}`}
                className="inline-flex items-center gap-2 rounded-full border border-blue-300/35 bg-blue-500/10 px-4 py-2 text-sm text-blue-100 transition hover:border-blue-200 hover:bg-blue-500/20"
              >
                <LayoutGrid className="h-4 w-4" />
                Open Legacy Card Dashboard
              </a>
              <Link
                to="/nexus?layer=lexicon"
                className="inline-flex items-center gap-2 rounded-full border border-emerald-300/35 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-100 transition hover:border-emerald-200 hover:bg-emerald-500/20"
              >
                <BookOpen className="h-4 w-4" />
                Open Codebase Lexicon
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Locked Jobs</div>
              <div className="mt-2 text-2xl font-semibold text-white">
                {lockedCount}/{displayJobs.length}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Open Sockets</div>
              <div className="mt-2 text-2xl font-semibold text-cyan-200">{openSockets}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Pulse</div>
              <div className="mt-2 text-2xl font-semibold text-rose-300">
                {describeCadence(masterCadenceSeconds)}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Coherence</div>
              <div className="mt-2 text-2xl font-semibold text-emerald-300">
                {projectedMode ? 'Projected' : 'Direct'}
              </div>
            </div>
          </div>
        </div>

        <section className="rounded-[2rem] border border-white/10 bg-slate-950/45 p-5 shadow-[0_24px_80px_rgba(2,6,23,0.4)] backdrop-blur md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/25 bg-blue-400/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-blue-100">
                <LayoutGrid className="h-3.5 w-3.5" />
                Visualization Surfaces
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-white sm:text-3xl">
                Full catalog wiring is now inside this route.
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                Each card links to a live surface and marks whether the experience is route-native
                or legacy static HTML. The cards flagged as needs-work represent the cleanup queue.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Surfaces</div>
                <div className="mt-2 text-2xl font-semibold text-white">
                  {VISUALIZATION_SURFACE_TOTAL}
                </div>
              </div>
              <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.2em] text-amber-100">Needs Work</div>
                <div className="mt-2 text-2xl font-semibold text-amber-50">
                  {VISUALIZATION_NEEDS_WORK_TOTAL}
                </div>
              </div>
              <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.2em] text-emerald-100">
                  Native Routes
                </div>
                <div className="mt-2 text-2xl font-semibold text-emerald-50">
                  {VISUALIZATION_NATIVE_ROUTE_TOTAL}
                </div>
              </div>
              <div className="rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.2em] text-rose-100">Failing Now</div>
                <div className="mt-2 text-2xl font-semibold text-rose-50">
                  {surfaceHealthStats.failing}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-900/35 px-4 py-3">
            <div className="text-sm text-slate-300">
              {surfaceProbeActive
                ? `Probing ${VISUALIZATION_SURFACE_TOTAL} surfaces now…`
                : `Reachable ${surfaceHealthStats.reachable}/${VISUALIZATION_SURFACE_TOTAL} • checking ${surfaceHealthStats.checking} • idle ${surfaceHealthStats.idle}`}
            </div>
            <button
              type="button"
              onClick={() => setSurfaceProbeRun((current) => current + 1)}
              className="inline-flex items-center gap-2 rounded-full border border-cyan-300/35 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-100 transition hover:border-cyan-200 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={surfaceProbeActive}
            >
              <RefreshCw className={`h-4 w-4 ${surfaceProbeActive ? 'animate-spin' : ''}`} />
              {surfaceProbeActive ? 'Checking Surfaces' : 'Recheck Surfaces'}
            </button>
          </div>

          <div className="mt-7 space-y-6">
            {VISUALIZATION_SECTIONS.map((section) => (
              <div
                key={section.id}
                className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4 md:p-5"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-2">
                    <Network className="h-4 w-4 text-cyan-300" />
                    <h3 className="text-lg font-semibold text-white">{section.label}</h3>
                  </div>
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    {section.items.length} surfaces
                  </div>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">{section.summary}</p>

                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {section.items.map((item) => {
                    const isStaticHtml = item.integration === 'static-html';
                    const needsWork = item.status === 'needs-work';
                    const health = surfaceHealth[item.href];
                    const healthState = health?.state || 'idle';
                    const cardHref = isStaticHtml
                      ? `/visualizations/surface?${new URLSearchParams({
                          src: item.href,
                          title: item.title,
                          section: section.label,
                        }).toString()}`
                      : item.href;
                    return (
                      <a
                        key={item.href}
                        href={cardHref}
                        className="rounded-2xl border border-white/10 bg-slate-950/45 p-4 transition hover:border-cyan-300/30 hover:bg-slate-900/70"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                          <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-300">{item.description}</p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] ${
                              isStaticHtml
                                ? 'border-purple-300/25 bg-purple-400/10 text-purple-100'
                                : 'border-emerald-300/25 bg-emerald-400/10 text-emerald-100'
                            }`}
                          >
                            {isStaticHtml ? (
                              <Wrench className="h-3 w-3" />
                            ) : (
                              <CheckCircle className="h-3 w-3" />
                            )}
                            {isStaticHtml ? 'Static HTML' : 'Route Native'}
                          </span>

                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] ${
                              needsWork
                                ? 'border-amber-300/25 bg-amber-400/10 text-amber-100'
                                : 'border-cyan-300/25 bg-cyan-400/10 text-cyan-100'
                            }`}
                          >
                            {needsWork ? (
                              <AlertCircle className="h-3 w-3" />
                            ) : (
                              <CheckCircle className="h-3 w-3" />
                            )}
                            {needsWork ? 'Needs Work' : 'Stable'}
                          </span>

                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] ${
                              healthState === 'reachable'
                                ? 'border-emerald-300/25 bg-emerald-400/10 text-emerald-100'
                                : healthState === 'failing'
                                  ? 'border-rose-300/25 bg-rose-400/10 text-rose-100'
                                  : 'border-slate-300/25 bg-slate-400/10 text-slate-100'
                            }`}
                          >
                            {healthState === 'reachable' ? (
                              <CheckCircle className="h-3 w-3" />
                            ) : healthState === 'failing' ? (
                              <AlertCircle className="h-3 w-3" />
                            ) : (
                              <Clock3 className="h-3 w-3" />
                            )}
                            {healthState === 'reachable'
                              ? `Reachable${health?.statusCode ? ` ${health.statusCode}` : ''}`
                              : healthState === 'failing'
                                ? `Failing${health?.statusCode ? ` ${health.statusCode}` : ''}`
                                : healthState === 'checking'
                                  ? 'Checking'
                                  : 'Unchecked'}
                          </span>

                          {item.tags.slice(0, 2).map((tag) => (
                            <span
                              key={`${item.href}-${tag}`}
                              className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-slate-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        {health?.checkedAt ? (
                          <div className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-400">
                            Checked {new Date(health.checkedAt).toLocaleTimeString()}
                          </div>
                        ) : null}
                        {healthState === 'failing' && health?.error ? (
                          <div className="mt-1 text-xs text-rose-200/90">{health.error}</div>
                        ) : null}
                      </a>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-7 rounded-[1.4rem] border border-white/10 bg-white/5 p-4 md:p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-white">Priority Repair Queue</h3>
              <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                {repairQueue.length} items
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-300">
              Needs-work surfaces ranked by current runtime health first, then alphabetical.
            </p>
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {repairQueue.slice(0, 8).map(({ entry, health }) => {
                const queueHref =
                  entry.integration === 'static-html'
                    ? `/visualizations/surface?${new URLSearchParams({
                        src: entry.href,
                        title: entry.title,
                        section: entry.sectionLabel,
                      }).toString()}`
                    : entry.href;
                return (
                  <a
                    key={`queue-${entry.href}`}
                    href={queueHref}
                    className="rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 transition hover:border-cyan-300/30 hover:bg-slate-900/65"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-medium text-white">{entry.title}</div>
                      <div
                        className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] ${
                          health.state === 'failing'
                            ? 'border-rose-300/35 bg-rose-400/10 text-rose-100'
                            : health.state === 'reachable'
                              ? 'border-emerald-300/35 bg-emerald-400/10 text-emerald-100'
                              : 'border-slate-300/35 bg-slate-400/10 text-slate-100'
                        }`}
                      >
                        {health.state}
                      </div>
                    </div>
                    <div className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400">
                      {entry.sectionLabel}
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </section>

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
                ? projectedMode
                  ? `Live heartbeat with projected super-cycle contract • pulse ${describeCadence(masterCadenceSeconds)}`
                  : `Live CloudRuntime/Redis Master Clock state • heartbeat ${describeCadence(masterCadenceSeconds)}`
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
                  Mesh sockets stay visible as open docking points. Drag any gear, snap it into an
                  open socket, and keep audit overlays attached to each process.
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
              <div
                ref={meshRef}
                className="relative min-h-[560px] overflow-hidden rounded-[1.6rem] border border-white/10 bg-[radial-gradient(circle_at_center,_rgba(34,211,238,0.1),_transparent_46%),linear-gradient(180deg,_rgba(15,23,42,0.78),_rgba(2,6,23,0.92))]"
              >
                <div className="absolute inset-0 opacity-50">
                  <div className="absolute inset-[8%] rounded-full border border-dashed border-cyan-400/15" />
                  <div className="absolute inset-[20%] rounded-full border border-dashed border-slate-500/20" />
                  <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-cyan-300/15 to-transparent" />
                  <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-gradient-to-r from-transparent via-cyan-300/15 to-transparent" />
                </div>

                {meshSockets.map((socket) => {
                  const occupiedBy = occupiedSockets.get(socket.index);
                  const isDropTarget = dragTargetSocketIndex === socket.index;
                  return (
                    <div
                      key={socket.id}
                      className={`pointer-events-none absolute z-0 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border ${
                        occupiedBy
                          ? 'border-transparent bg-cyan-300/8'
                          : 'border-cyan-300/35 bg-cyan-400/10'
                      } ${isDropTarget ? 'border-emerald-300 bg-emerald-300/20 shadow-[0_0_18px_rgba(110,231,183,0.55)]' : ''}`}
                      style={{ left: `${socket.x}%`, top: `${socket.y}%` }}
                    />
                  );
                })}

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
                  <div className="text-xs uppercase tracking-[0.26em] text-slate-400">1 turn</div>
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

                {displayJobs.map((job, index) => {
                  const locked = lockedJobs.has(job.id);
                  const relativeRate = masterCadenceSeconds / job.cadenceSeconds;
                  const rotationFactor = Math.max(0.18, relativeRate);
                  const rotation = locked
                    ? tick * timeScale * rotationFactor * 0.75 * job.direction
                    : job.direction * 14;
                  const socket = getSocketForJob(job, index);
                  const isDragging = dragPosition?.jobId === job.id;
                  const renderX = isDragging ? dragPosition.x : socket.x;
                  const renderY = isDragging ? dragPosition.y : socket.y;

                  return (
                    <button
                      key={job.id}
                      type="button"
                      onClick={() => setSelectedJobId(job.id)}
                      onPointerDown={(event) => startDrag(event, job.id)}
                      className={`absolute z-30 rounded-full transition ${
                        selectedJobId === job.id
                          ? 'ring-4 ring-white/20'
                          : 'ring-1 ring-transparent hover:ring-white/10'
                      } ${locked ? 'opacity-100' : 'opacity-40 saturate-50'} ${
                        isDragging ? 'cursor-grabbing' : 'cursor-grab'
                      }`}
                      style={{
                        left: `${renderX}%`,
                        top: `${renderY}%`,
                        width: `${job.size}px`,
                        height: `${job.size}px`,
                        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                        transition: isDragging
                          ? 'opacity 120ms ease'
                          : 'transform 80ms linear, opacity 200ms ease, filter 200ms ease',
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
                          {job.live ? (
                            <>
                              <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-cyan-200/90">
                                run {formatAge(job.lastRunAgeMs)}
                              </div>
                              <div className="text-[10px] uppercase tracking-[0.18em] text-emerald-200/90">
                                next {formatCountdown(job.nextFireInMs)}
                              </div>
                            </>
                          ) : null}
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
                          <ToggleLeft className="h-5 w-5 text-slate-400" />
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-between text-xs uppercase tracking-[0.22em] text-slate-400">
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
                        <div className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                          {job.status || 'running'} • run {formatAge(job.lastRunAgeMs)} • next{' '}
                          {formatCountdown(job.nextFireInMs)}
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
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Cadence</div>
                  <div className="mt-2 text-lg font-semibold text-white">
                    {selectedJob ? describeCadence(selectedJob.cadenceSeconds) : 'Unavailable'}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
                    Relative Rotation
                  </div>
                  <div className="mt-2 text-lg font-semibold text-white">
                    {selectedJob
                      ? `${(masterCadenceSeconds / selectedJob.cadenceSeconds).toFixed(2)}x of the master clock`
                      : 'Unavailable'}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Coupling</div>
                  <div className="mt-2 text-lg font-semibold text-white">
                    {selectedJob && lockedJobs.has(selectedJob.id)
                      ? 'Locked and turning'
                      : 'Detached for tuning'}
                  </div>
                </div>
                {selectedJob?.live ? (
                  <>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                      <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
                        Interval Contract
                      </div>
                      <div className="mt-2 text-lg font-semibold text-white">
                        {selectedJob.intendedIntervalMs
                          ? `${Math.round(selectedJob.intendedIntervalMs / 1000)}s`
                          : 'Unavailable'}
                      </div>
                      <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                        {resolveIntervalSourceLabel(
                          selectedJob.intervalSource,
                          selectedJob.intervalExact
                        )}{' '}
                        • {resolveCadenceSourceLabel(selectedJob.cadenceSource)}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                      <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
                        Execution Window
                      </div>
                      <div className="mt-2 text-lg font-semibold text-white">
                        Last run {formatAge(selectedJob.lastRunAgeMs)} • next{' '}
                        {formatCountdown(selectedJob.nextFireInMs)}
                      </div>
                      <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                        {selectedJob.nextExpectedAt
                          ? `Next fire ${new Date(selectedJob.nextExpectedAt).toLocaleTimeString()}`
                          : 'Next fire pending'}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                      <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
                        Latest Timeline Event
                      </div>
                      <div className="mt-2 text-lg font-semibold text-white">
                        {selectedJob.lastActivityEvent || 'No process-tagged event yet'}
                      </div>
                      <div className="mt-1 text-sm text-slate-400">
                        {selectedJob.lastActivityContent ||
                          'Timeline activity will appear here as process logs stream in.'}
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
                            <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
                              {describeCadence(job.cadenceSeconds)}
                            </div>
                          </div>
                          <div className="mt-2 text-sm text-slate-400">
                            {job.live
                              ? `${locked ? 'Coupled to the live watchboard.' : 'Visible but detached.'} Last run ${formatAge(job.lastRunAgeMs)}; next fire ${formatCountdown(job.nextFireInMs)}.`
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
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
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
                Mesh Interaction
              </div>
              <div className="mt-4 space-y-3 text-sm leading-6 text-cyan-50/90">
                <div className="flex gap-3">
                  <Grip className="mt-1 h-4 w-4 shrink-0 text-cyan-200" />
                  Drag any gear into open sockets. Drop highlights appear when a free socket is
                  within snap range.
                </div>
                <div className="flex gap-3">
                  <Gauge className="mt-1 h-4 w-4 shrink-0 text-cyan-200" />
                  Every live gear now shows exact interval contract data, last-run age, and
                  next-fire countdown.
                </div>
                <div className="flex gap-3">
                  <Activity className="mt-1 h-4 w-4 shrink-0 text-cyan-200" />
                  Process-tagged timeline events are merged into each gear’s telemetry card.
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Visualizations;
