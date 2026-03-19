import { GlassCard, StatsCard } from '@/components/ui/premium/GlassCard';
import { PremiumButton } from '@/components/ui/premium/PremiumButton';
import GraphVisualizerWrapper from '@/components/wizard/graph/GraphVisualizer';
import { useAuthorization } from '@/hooks/useAuthorization';
import { AnimatePresence, motion, Variants } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  Bot,
  Clock3,
  MessageSquare,
  Network,
  Play,
  RefreshCw,
  Save,
  Search,
  Server,
  Shield,
  StopCircle,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import type { Edge, Node } from 'reactflow';
import { LlmRoutingControl } from './components/LlmRoutingControl';
import { OAuthInstanceRotationControl } from './components/OAuthInstanceRotationControl';

interface RelayChannel {
  id: string;
  name: string;
  members?: string[];
}

interface ActivityEvent {
  id: string;
  type: string;
  source: string;
  content: string;
  timestamp: Date;
  status: 'success' | 'warning' | 'error' | 'info';
  channelId?: string;
  metadata?: Record<string, unknown>;
}

interface MeshInstance {
  name: string;
  status: string;
  load: string;
}

interface Agent {
  id: string;
  name: string;
  status?: string;
}

interface VoteCounts {
  up?: number;
  down?: number;
}

interface ActivityMetadata {
  eventType?: string;
  lane?: string;
  horizon?: string;
  taskId?: string;
  title?: string;
  score?: number;
  top?: Array<{
    id?: string;
    title?: string;
    score?: number;
    votes?: VoteCounts;
  }>;
  votes?: VoteCounts;
  itinerary?: {
    lane?: string;
    horizon?: string;
  };
  [key: string]: unknown;
}

interface ProcessRunHistory {
  runId: string;
  actorId: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  status: string;
  exitCode: number;
  error?: string | null;
  outputPreview?: string | null;
}

interface ChronologicalProcess {
  id: string;
  title: string;
  description?: string;
  canonical: {
    layer: string;
    scope: string;
    category: string;
    categoryDescription?: string | null;
    ownerAgentId?: string | null;
    ownerUserId?: string | null;
    locked?: boolean;
    requiresApproval?: boolean;
  };
  procedural: {
    layer: string;
    enabled: boolean;
    cadence: string;
    timezone: string;
    nextRunAt?: string | null;
    nextRunHint?: string;
    runNowCommand?: {
      command: string;
      args: string[];
      timeoutMs: number;
    } | null;
  };
  runtime: {
    status: string;
    lastRunAt?: string | null;
    lastDurationMs?: number | null;
    lastExitCode?: number | null;
    lastError?: string | null;
    lastOutputPreview?: string | null;
    recentRuns?: ProcessRunHistory[];
  };
  controls: {
    canEdit: boolean;
    canRunNow: boolean;
    editDeniedReason?: string | null;
    runDeniedReason?: string | null;
  };
  docs?: {
    protocol?: string | null;
    runbook?: string | null;
  };
}

interface GraphSelectionContext {
  kind: 'root' | 'source' | 'event' | 'task';
  source?: string;
  eventType?: string;
  taskId?: string;
  lane?: string;
  horizon?: string;
}

interface ChronologicalProcessHistoryPayload {
  process: {
    id: string;
    title: string;
  };
  total: number;
  runs: ProcessRunHistory[];
}

type ChronologicalStatusFilter =
  | 'all'
  | 'healthy'
  | 'error'
  | 'running'
  | 'paused'
  | 'scheduled'
  | 'manual';
type ChronologicalScopeFilter = 'all' | 'system_framework' | 'tenant';
type ChronologicalSortOption =
  | 'title_asc'
  | 'status_asc'
  | 'next_run_asc'
  | 'next_run_desc'
  | 'last_run_desc';

const asMetadata = (value: unknown): ActivityMetadata | undefined =>
  value && typeof value === 'object' ? (value as ActivityMetadata) : undefined;

const getActivityMetadata = (activity: ActivityEvent): ActivityMetadata =>
  asMetadata(activity.metadata) || {};

const mapRawActivityEvent = (e: Record<string, unknown>): ActivityEvent => ({
  id: String(e.id || e.streamId || `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
  type: String(e.type || e.eventType || 'message'),
  source: String(e.source || 'system'),
  content: String(e.content || ''),
  timestamp: new Date(String(e.relayTimestamp || e.originalTimestamp || Date.now())),
  status: String(e.content || '')
    .toLowerCase()
    .includes('error')
    ? 'error'
    : 'success',
  channelId: e.channel ? String(e.channel) : undefined,
  metadata: asMetadata(e.metadata),
});

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
  },
};

export default function SuperAdminControlPanel() {
  const { isSuperAdmin, isBizSynthMasterAdmin } = useAuthorization();

  // Relay URLs
  const relayHttpBase = useMemo(
    () =>
      (import.meta.env.VITE_RELAY_HTTP_URL as string | undefined)?.replace(/\/$/, '') ||
      'http://localhost:3000',
    []
  );

  const relayWsUrl = useMemo(() => {
    const fromEnv = (import.meta.env.VITE_RELAY_WS_URL as string | undefined)?.trim();
    if (fromEnv) return fromEnv;
    return `${relayHttpBase.replace(/^http/i, 'ws')}/ws`;
  }, [relayHttpBase]);

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meshInstances, setMeshInstances] = useState<MeshInstance[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [channels, setChannels] = useState<RelayChannel[]>([]);
  const [stats, setStats] = useState({
    onlineAgents: 0,
    activeSessions: 0,
    messagesLastHour: 0,
    systemLoad: 0,
    uptime: 'N/A',
    nodes: 'N/A',
  });

  const wsRef = useRef<WebSocket | null>(null);
  const agentHubRef = useRef<HTMLDivElement | null>(null);
  const [connected, setConnected] = useState(false);
  const [selectedGraphNode, setSelectedGraphNode] = useState<{
    id: string;
    label: string;
    context: GraphSelectionContext;
  } | null>(null);
  const [streamFilter, setStreamFilter] = useState<{
    source?: string;
    eventType?: string;
    taskId?: string;
    lane?: string;
    horizon?: string;
  } | null>(null);
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<ActivityEvent | null>(null);
  const [highlightedAgentId, setHighlightedAgentId] = useState<string | null>(null);
  const [chronologicalProcesses, setChronologicalProcesses] = useState<ChronologicalProcess[]>([]);
  const [chronologicalSummary, setChronologicalSummary] = useState<{
    total: number;
    enabled: number;
    disabled: number;
    locked: number;
    healthy: number;
    errored: number;
  } | null>(null);
  const [chronologicalError, setChronologicalError] = useState<string | null>(null);
  const [chronologicalLoading, setChronologicalLoading] = useState(false);
  const [processDrafts, setProcessDrafts] = useState<
    Record<string, { enabled: boolean; cadence: string; timezone: string; notes: string }>
  >({});
  const [busyProcessMap, setBusyProcessMap] = useState<Record<string, boolean>>({});
  const [chronologicalQuery, setChronologicalQuery] = useState('');
  const [chronologicalStatusFilter, setChronologicalStatusFilter] =
    useState<ChronologicalStatusFilter>('all');
  const [chronologicalScopeFilter, setChronologicalScopeFilter] =
    useState<ChronologicalScopeFilter>('all');
  const [chronologicalSort, setChronologicalSort] =
    useState<ChronologicalSortOption>('next_run_asc');
  const [historyModalProcess, setHistoryModalProcess] = useState<ChronologicalProcess | null>(null);
  const [historyModalData, setHistoryModalData] =
    useState<ChronologicalProcessHistoryPayload | null>(null);
  const [historyModalLoading, setHistoryModalLoading] = useState(false);
  const [historyModalError, setHistoryModalError] = useState<string | null>(null);

  const orchestrationSignals = useMemo(() => {
    return activities
      .filter((activity) => {
        const metadata = getActivityMetadata(activity);
        const eventType = String(metadata.eventType || activity.type || '').toLowerCase();
        return eventType === 'task_poll_ranked' || eventType === 'task_queued_from_votes';
      })
      .slice(0, 12)
      .map((activity) => {
        const metadata = getActivityMetadata(activity);
        const eventType = String(metadata.eventType || activity.type || '');
        const top = Array.isArray(metadata.top) ? metadata.top : [];
        const lead = top[0] || null;
        const score = metadata.score ?? lead?.score ?? null;
        const votes = metadata.votes || lead?.votes || null;
        const taskId = metadata.taskId || lead?.id || null;
        const title = metadata.title || lead?.title || null;
        return {
          id: activity.id,
          timestamp: activity.timestamp,
          eventType,
          content: activity.content,
          score: typeof score === 'number' ? score : null,
          votes:
            votes && typeof votes === 'object'
              ? {
                  up: Number(votes.up || 0),
                  down: Number(votes.down || 0),
                }
              : null,
          taskId: taskId ? String(taskId) : null,
          title: title ? String(title) : null,
        };
      });
  }, [activities]);

  const realtimeTrends = useMemo(() => {
    const now = Date.now();
    const windowMs = 5 * 60 * 1000;
    const recentSignals = orchestrationSignals.filter(
      (signal) => now - signal.timestamp.getTime() <= windowMs
    );
    const recentActivities = activities.filter(
      (activity) => now - activity.timestamp.getTime() <= windowMs
    );
    const queueEvents = recentSignals.filter(
      (signal) => signal.eventType.toLowerCase() === 'task_queued_from_votes'
    );
    const scored = recentSignals.filter((signal) => typeof signal.score === 'number');
    const avgScore = scored.length
      ? Math.round(scored.reduce((sum, signal) => sum + (signal.score || 0), 0) / scored.length)
      : 0;
    const votePressure = recentSignals.reduce(
      (sum, signal) => sum + ((signal.votes?.up || 0) - (signal.votes?.down || 0)),
      0
    );
    return {
      eventsPerMin: Number((recentActivities.length / 5).toFixed(1)),
      queuePerMin: Number((queueEvents.length / 5).toFixed(1)),
      avgScore,
      votePressure,
      sampleSize: recentActivities.length,
    };
  }, [activities, orchestrationSignals]);

  const extractTaskRouting = useCallback((activity: ActivityEvent) => {
    const metadata = getActivityMetadata(activity);
    const lane = String(metadata.lane || metadata.itinerary?.lane || '').trim();
    const horizon = String(metadata.horizon || metadata.itinerary?.horizon || '').trim();
    return { lane, horizon };
  }, []);

  const orchestrationHierarchyGraph = useMemo(() => {
    const baseNodes: Node[] = [
      {
        id: 'tnf-master-clock',
        type: 'default',
        position: { x: 0, y: 0 },
        data: { label: 'TNF Master Clock' },
      },
    ];
    const baseEdges: Edge[] = [];
    const nodesById = new Map<string, Node>(baseNodes.map((node) => [node.id, node]));
    const edgeSet = new Set<string>();
    const taskNodeBudget = 40;
    let taskNodesUsed = 0;

    for (const activity of activities.slice(0, 120)) {
      const source = String(activity.source || 'unknown').slice(0, 40);
      const sourceNodeId = `source:${source}`;

      if (!nodesById.has(sourceNodeId)) {
        nodesById.set(sourceNodeId, {
          id: sourceNodeId,
          type: 'default',
          position: { x: 0, y: 0 },
          data: { label: `Source: ${source}` },
        });
      }

      const sourceEdgeId = `tnf-master-clock->${sourceNodeId}`;
      if (!edgeSet.has(sourceEdgeId)) {
        baseEdges.push({
          id: sourceEdgeId,
          source: 'tnf-master-clock',
          target: sourceNodeId,
          type: 'smoothstep',
        });
        edgeSet.add(sourceEdgeId);
      }

      const eventType = String(activity.metadata?.eventType || activity.type || 'event').slice(
        0,
        60
      );
      const eventNodeId = `event:${source}:${eventType}`;
      if (!nodesById.has(eventNodeId)) {
        nodesById.set(eventNodeId, {
          id: eventNodeId,
          type: 'default',
          position: { x: 0, y: 0 },
          data: { label: eventType },
        });
      }

      const eventEdgeId = `${sourceNodeId}->${eventNodeId}`;
      if (!edgeSet.has(eventEdgeId)) {
        baseEdges.push({
          id: eventEdgeId,
          source: sourceNodeId,
          target: eventNodeId,
          type: 'smoothstep',
        });
        edgeSet.add(eventEdgeId);
      }

      const taskId = String(getActivityMetadata(activity).taskId || '').trim();
      if (!taskId || taskNodesUsed >= taskNodeBudget) continue;

      const { lane, horizon } = extractTaskRouting(activity);
      const laneLabel = lane || 'unclassified_lane';
      const laneNodeId = `lane:${source}:${eventType}:${laneLabel}`;
      if (!nodesById.has(laneNodeId)) {
        nodesById.set(laneNodeId, {
          id: laneNodeId,
          type: 'default',
          position: { x: 0, y: 0 },
          data: { label: `Lane ${laneLabel}` },
        });
      }

      const laneEdgeId = `${eventNodeId}->${laneNodeId}`;
      if (!edgeSet.has(laneEdgeId)) {
        baseEdges.push({
          id: laneEdgeId,
          source: eventNodeId,
          target: laneNodeId,
          type: 'smoothstep',
        });
        edgeSet.add(laneEdgeId);
      }

      const horizonLabel = horizon || 'unspecified_horizon';
      const horizonNodeId = `horizon:${source}:${eventType}:${laneLabel}:${horizonLabel}`;
      if (!nodesById.has(horizonNodeId)) {
        nodesById.set(horizonNodeId, {
          id: horizonNodeId,
          type: 'default',
          position: { x: 0, y: 0 },
          data: { label: `Horizon ${horizonLabel}` },
        });
      }

      const horizonEdgeId = `${laneNodeId}->${horizonNodeId}`;
      if (!edgeSet.has(horizonEdgeId)) {
        baseEdges.push({
          id: horizonEdgeId,
          source: laneNodeId,
          target: horizonNodeId,
          type: 'smoothstep',
        });
        edgeSet.add(horizonEdgeId);
      }

      const taskNodeId = `task:${taskId}`;
      if (!nodesById.has(taskNodeId)) {
        taskNodesUsed += 1;
        nodesById.set(taskNodeId, {
          id: taskNodeId,
          type: 'default',
          position: { x: 0, y: 0 },
          data: {
            label: `Task ${taskId.slice(0, 18)} · ${laneLabel} · ${horizonLabel}`,
          },
        });
      }

      const taskEdgeId = `${horizonNodeId}->${taskNodeId}`;
      if (!edgeSet.has(taskEdgeId)) {
        baseEdges.push({
          id: taskEdgeId,
          source: horizonNodeId,
          target: taskNodeId,
          type: 'smoothstep',
        });
        edgeSet.add(taskEdgeId);
      }
    }

    return {
      nodes: Array.from(nodesById.values()),
      edges: baseEdges,
    };
  }, [activities, extractTaskRouting]);

  const filteredActivities = useMemo(() => {
    if (!streamFilter) return activities;
    return activities.filter((activity) => {
      const metadata = getActivityMetadata(activity);
      const sourceMatch = streamFilter.source ? activity.source === streamFilter.source : true;
      const eventType = String(metadata.eventType || activity.type || '');
      const eventMatch = streamFilter.eventType ? eventType === streamFilter.eventType : true;
      const taskId = String(metadata.taskId || '').trim();
      const taskMatch = streamFilter.taskId ? taskId === streamFilter.taskId : true;
      const lane = String(metadata.lane || metadata.itinerary?.lane || '').trim();
      const horizon = String(metadata.horizon || metadata.itinerary?.horizon || '').trim();
      const laneMatch = streamFilter.lane ? lane === streamFilter.lane : true;
      const horizonMatch = streamFilter.horizon ? horizon === streamFilter.horizon : true;
      return sourceMatch && eventMatch && taskMatch && laneMatch && horizonMatch;
    });
  }, [activities, streamFilter]);

  const jumpToAgent = useCallback(
    (source?: string) => {
      if (!source) return;
      const matched = agents.find(
        (agent) =>
          agent.id.toLowerCase().includes(source.toLowerCase()) ||
          agent.name.toLowerCase().includes(source.toLowerCase())
      );
      if (!matched) return;
      setHighlightedAgentId(matched.id);
      agentHubRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    [agents]
  );

  const handleGraphNodeClick = useCallback(
    (_event: MouseEvent, node: Node) => {
      const nodeId = String(node.id || '');
      const label =
        typeof node.data === 'object' && node.data && 'label' in node.data
          ? String((node.data as { label?: unknown }).label || nodeId)
          : nodeId;

      let context: GraphSelectionContext = { kind: 'root' };
      if (nodeId === 'tnf-master-clock') {
        context = { kind: 'root' };
        setStreamFilter(null);
        setSelectedTaskDetail(null);
      } else if (nodeId.startsWith('source:')) {
        const source = nodeId.slice('source:'.length);
        context = { kind: 'source', source };
        setStreamFilter({ source });
        setSelectedTaskDetail(null);
      } else if (nodeId.startsWith('event:')) {
        const raw = nodeId.slice('event:'.length);
        const splitAt = raw.indexOf(':');
        const source = splitAt > -1 ? raw.slice(0, splitAt) : raw;
        const eventType = splitAt > -1 ? raw.slice(splitAt + 1) : '';
        context = { kind: 'event', source, eventType };
        setStreamFilter({
          source: source || undefined,
          eventType: eventType || undefined,
        });
        setSelectedTaskDetail(null);
      } else if (nodeId.startsWith('task:')) {
        const taskId = nodeId.slice('task:'.length);
        const taskEvent =
          activities.find(
            (activity) => String(getActivityMetadata(activity).taskId || '') === taskId
          ) || null;
        const { lane, horizon } = taskEvent
          ? extractTaskRouting(taskEvent)
          : { lane: '', horizon: '' };
        context = { kind: 'task', taskId, lane, horizon };
        setStreamFilter({
          taskId,
          lane: lane || undefined,
          horizon: horizon || undefined,
        });
        setSelectedTaskDetail(taskEvent);
      }

      setSelectedGraphNode({ id: nodeId, label, context });
    },
    [activities]
  );

  const syncRecentActivity = useCallback(async () => {
    try {
      const res = await fetch(`${relayHttpBase}/activity/recent?count=80`);
      if (!res.ok) return;
      const payload = await res.json();
      const rows: ActivityEvent[] = (payload?.events || []).map(mapRawActivityEvent);
      if (!rows.length) return;

      setActivities((prev) => {
        const merged = [...rows, ...prev];
        const seen = new Set<string>();
        const deduped: ActivityEvent[] = [];
        for (const item of merged) {
          if (seen.has(item.id)) continue;
          seen.add(item.id);
          deduped.push(item);
          if (deduped.length >= 120) break;
        }
        return deduped;
      });
    } catch {
      // silent: realtime visualizer sync should not hard-fail UI
    }
  }, [relayHttpBase]);

  const adminAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }, []);

  const loadChronologicalProcesses = useCallback(async () => {
    setChronologicalLoading(true);
    setChronologicalError(null);
    try {
      const res = await fetch('/api/admin/metrics/chronological-processes', {
        headers: {
          ...adminAuthHeaders(),
        },
      });
      if (!res.ok) {
        throw new Error(`Failed to load chronological control plane (${res.status})`);
      }

      const payload = await res.json();
      const items: ChronologicalProcess[] = Array.isArray(payload?.processes)
        ? payload.processes
        : [];
      setChronologicalProcesses(items);
      setChronologicalSummary(payload?.summary || null);

      setProcessDrafts((prev) => {
        const next = { ...prev };
        for (const process of items) {
          if (!next[process.id]) {
            next[process.id] = {
              enabled: Boolean(process.procedural?.enabled),
              cadence: String(process.procedural?.cadence || ''),
              timezone: String(process.procedural?.timezone || 'UTC'),
              notes: '',
            };
          }
        }
        return next;
      });
    } catch (err) {
      console.error('Failed to load chronological processes', err);
      setChronologicalError('Unable to load chronological control plane data.');
    } finally {
      setChronologicalLoading(false);
    }
  }, [adminAuthHeaders]);

  const updateProcessDraft = useCallback(
    (
      processId: string,
      patch: Partial<{ enabled: boolean; cadence: string; timezone: string; notes: string }>
    ) => {
      setProcessDrafts((prev) => ({
        ...prev,
        [processId]: {
          enabled: prev[processId]?.enabled ?? true,
          cadence: prev[processId]?.cadence ?? '',
          timezone: prev[processId]?.timezone ?? 'UTC',
          notes: prev[processId]?.notes ?? '',
          ...patch,
        },
      }));
    },
    []
  );

  const saveChronologicalProcess = useCallback(
    async (process: ChronologicalProcess) => {
      const draft = processDrafts[process.id];
      if (!draft) return;
      setBusyProcessMap((prev) => ({ ...prev, [process.id]: true }));
      setChronologicalError(null);
      try {
        const res = await fetch(`/api/admin/metrics/chronological-processes/${process.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...adminAuthHeaders(),
          },
          body: JSON.stringify({
            enabled: draft.enabled,
            cadence: draft.cadence,
            timezone: draft.timezone,
            notes: draft.notes,
          }),
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText || `Save failed (${res.status})`);
        }

        await loadChronologicalProcesses();
      } catch (err) {
        console.error(`Failed to save process ${process.id}`, err);
        setChronologicalError(`Failed to save ${process.title}.`);
      } finally {
        setBusyProcessMap((prev) => ({ ...prev, [process.id]: false }));
      }
    },
    [adminAuthHeaders, loadChronologicalProcesses, processDrafts]
  );

  const runChronologicalProcessNow = useCallback(
    async (process: ChronologicalProcess) => {
      setBusyProcessMap((prev) => ({ ...prev, [process.id]: true }));
      setChronologicalError(null);
      try {
        const res = await fetch(`/api/admin/metrics/chronological-processes/${process.id}/run`, {
          method: 'POST',
          headers: {
            ...adminAuthHeaders(),
          },
        });
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText || `Run failed (${res.status})`);
        }

        await loadChronologicalProcesses();
      } catch (err) {
        console.error(`Failed to run process ${process.id}`, err);
        setChronologicalError(`Run-now failed for ${process.title}.`);
      } finally {
        setBusyProcessMap((prev) => ({ ...prev, [process.id]: false }));
      }
    },
    [adminAuthHeaders, loadChronologicalProcesses]
  );

  const openProcessHistoryModal = useCallback(
    async (process: ChronologicalProcess) => {
      setHistoryModalProcess(process);
      setHistoryModalLoading(true);
      setHistoryModalError(null);
      setHistoryModalData(null);
      try {
        const res = await fetch(
          `/api/admin/metrics/chronological-processes/${process.id}/history?limit=200`,
          {
            headers: {
              ...adminAuthHeaders(),
            },
          }
        );
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText || `History failed (${res.status})`);
        }
        const payload = (await res.json()) as ChronologicalProcessHistoryPayload;
        setHistoryModalData(payload);
      } catch (err) {
        console.error(`Failed to load process history ${process.id}`, err);
        setHistoryModalError(`Unable to load history for ${process.title}.`);
      } finally {
        setHistoryModalLoading(false);
      }
    },
    [adminAuthHeaders]
  );

  const closeProcessHistoryModal = useCallback(() => {
    setHistoryModalProcess(null);
    setHistoryModalData(null);
    setHistoryModalError(null);
    setHistoryModalLoading(false);
  }, []);

  const chronologicalFilteredProcesses = useMemo(() => {
    const query = chronologicalQuery.trim().toLowerCase();
    const filtered = chronologicalProcesses.filter((process) => {
      if (
        query &&
        !`${process.title} ${process.id} ${process.canonical.category} ${process.canonical.scope}`
          .toLowerCase()
          .includes(query)
      ) {
        return false;
      }
      if (
        chronologicalStatusFilter !== 'all' &&
        process.runtime.status !== chronologicalStatusFilter
      ) {
        return false;
      }
      if (
        chronologicalScopeFilter !== 'all' &&
        process.canonical.scope !== chronologicalScopeFilter
      ) {
        return false;
      }
      return true;
    });

    const nextRunValue = (process: ChronologicalProcess): number =>
      process.procedural.nextRunAt
        ? new Date(process.procedural.nextRunAt).getTime()
        : Number.MAX_SAFE_INTEGER;
    const lastRunValue = (process: ChronologicalProcess): number =>
      process.runtime.lastRunAt ? new Date(process.runtime.lastRunAt).getTime() : 0;

    filtered.sort((a, b) => {
      switch (chronologicalSort) {
        case 'title_asc':
          return a.title.localeCompare(b.title);
        case 'status_asc':
          return a.runtime.status.localeCompare(b.runtime.status) || a.title.localeCompare(b.title);
        case 'next_run_desc':
          return nextRunValue(b) - nextRunValue(a);
        case 'last_run_desc':
          return lastRunValue(b) - lastRunValue(a);
        case 'next_run_asc':
        default:
          return nextRunValue(a) - nextRunValue(b);
      }
    });

    return filtered;
  }, [
    chronologicalProcesses,
    chronologicalQuery,
    chronologicalStatusFilter,
    chronologicalScopeFilter,
    chronologicalSort,
  ]);

  // Load Initial Data
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [healthRes, activityRes, agentsRes, channelsRes] = await Promise.all([
        fetch(`${relayHttpBase}/health`).then((res) => (res.ok ? res.json() : null)),
        fetch(`${relayHttpBase}/activity/recent?count=50`).then((res) =>
          res.ok ? res.json() : { events: [] }
        ),
        fetch(`${relayHttpBase}/agents`).then((res) => (res.ok ? res.json() : [])),
        fetch(`${relayHttpBase}/channels`).then((res) => (res.ok ? res.json() : [])),
      ]);

      if (healthRes) {
        setStats((prev) => ({
          ...prev,
          onlineAgents: healthRes.agents || 0,
          activeSessions: healthRes.channels || 0,
          uptime: healthRes.uptime || 'N/A',
          nodes: healthRes.nodes || 'N/A',
        }));

        const items = [];
        if (healthRes.database)
          items.push({
            name: 'Database Pool',
            status: healthRes.database.status === 'connected' ? 'Healthy' : 'Error',
            load: 'Active',
          });
        if (healthRes.redis)
          items.push({
            name: 'Memory Cache',
            status: healthRes.redis.status === 'connected' ? 'Healthy' : 'Error',
            load: 'Sync',
          });
        if (healthRes.status)
          items.push({
            name: 'Core Gateway',
            status: healthRes.status === 'healthy' ? 'Healthy' : 'Critical',
            load: healthRes.load || 'Monitoring',
          });
        setMeshInstances(items);
      }

      if (activityRes.events) {
        setActivities(activityRes.events.map(mapRawActivityEvent));
      }

      setAgents(agentsRes);
      setChannels(channelsRes);
    } catch (err) {
      console.error('Failed to load control panel data:', err);
      setError('Connection to Relay failed. Is the standalone relay running?');
    } finally {
      setLoading(false);
    }
  }, [relayHttpBase]);

  // Connect WebSocket for Live updates
  const connectSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(relayWsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        // Request initial lists
        ws.send(JSON.stringify({ type: 'AGENT_LIST', source: 'admin-panel' }));
        ws.send(JSON.stringify({ type: 'CHANNEL_LIST', source: 'admin-panel' }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'CHANNEL_MESSAGE' || msg.type === 'MESSAGE_RECEIVE') {
            const payload = msg.payload;
            const newEvent: ActivityEvent = {
              id: payload.id || `evt-${Date.now()}`,
              type: payload.type || 'message',
              source: payload.from || 'unknown',
              content: payload.content || '',
              timestamp: new Date(payload.timestamp || Date.now()),
              status: 'info',
              channelId: payload.channel,
              metadata: payload.metadata,
            };
            setActivities((prev) => [newEvent, ...prev].slice(0, 100));
          } else if (msg.type === 'AGENT_LIST') {
            setAgents(msg.payload.agents || []);
          } else if (msg.type === 'CHANNEL_LIST') {
            setChannels(msg.payload.channels || []);
          } else if (msg.type === 'AGENT_STATUS') {
            // Update single agent status
            setAgents((prev) => {
              const exists = prev.find((a) => a.id === msg.payload.agent.id);
              if (exists) {
                return prev.map((a) => (a.id === msg.payload.agent.id ? msg.payload.agent : a));
              }
              return [...prev, msg.payload.agent];
            });
          }
        } catch (e) {
          console.warn('Failed to parse socket message', e);
        }
      };

      ws.onclose = () => setConnected(false);
      ws.onerror = () => setConnected(false);
    } catch (e) {
      console.error('Socket connection error', e);
    }
  }, [relayWsUrl]);

  useEffect(() => {
    loadInitialData();
    loadChronologicalProcesses();
    connectSocket();

    const interval = setInterval(loadInitialData, 30000);
    const activityInterval = setInterval(syncRecentActivity, 4000);
    return () => {
      clearInterval(interval);
      clearInterval(activityInterval);
      wsRef.current?.close();
    };
  }, [loadInitialData, loadChronologicalProcesses, connectSocket, syncRecentActivity]);

  // Actions
  const handleHaltAgents = async () => {
    if (!confirm('EMERGENCY: Are you sure you want to HALT ALL AGENTS across the network?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/autonomous/director/stop', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        alert('HALT command issued successfully.');
      } else {
        throw new Error('Failed to stop director');
      }
    } catch (e) {
      console.error('Halt failed', e);
      alert('Failed to issue HALT command.');
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <GlassCard className="p-4 text-center max-w-md">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-400">
            This terminal is restricted to Super Admin accounts. Unauthorized access attempts are
            logged.
          </p>
          <Link to="/" className="mt-6 block text-cyan-400 hover:underline">
            Return to Safety
          </Link>
        </GlassCard>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="p-4 lg:p-10 space-y-8 bg-slate-950 min-h-screen text-slate-100 font-sans selection:bg-cyan-500/30"
    >
      {/* Header Area */}
      <motion.header
        variants={itemVariants}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="relative">
          <div className="absolute -left-4 top-0 bottom-0 w-1 bg-cyan-500 rounded-full shadow-none-[0_0_15px_rgba(6,182,212,0.5)]" />
          <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
            <span className="p-2 bg-cyan-500/10 rounded-md border border-cyan-500/20 backdrop-blur-md">
              <Network className="w-10 h-10 text-cyan-400" />
            </span>
            <span>
              TNF{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Master Control
              </span>
            </span>
          </h1>
          <p className="text-slate-400 mt-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-500" />
            System-level monitoring & orchestration mesh
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div
            className={`px-4 py-2 rounded-full border flex items-center gap-2 text-xs font-bold tracking-widest uppercase transition-all duration-500 ${connected ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-none-[0_0_20px_rgba(16,185,129,0.1)]' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}
          >
            <div
              className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse shadow-none-[0_0_8px_#10b981]' : 'bg-red-500'}`}
            />
            {connected ? 'Relay Active' : 'Relay Offline'}
          </div>

          <PremiumButton variant="secondary" size="sm" onClick={loadInitialData} className="group">
            <RefreshCw
              className={`w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500 ${loading ? 'animate-spin' : ''}`}
            />
            Sync Mesh
          </PremiumButton>

          {isBizSynthMasterAdmin && (
            <Link to="/nexus" target="_blank">
              <PremiumButton
                variant="primary"
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-500 shadow-none-[0_0_20px_rgba(79,70,229,0.4)]"
              >
                <Search className="w-4 h-4 mr-2" />
                Launch Nexus 3D
              </PremiumButton>
            </Link>
          )}
        </div>
      </motion.header>

      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatsCard
          label="Active Agents"
          value={agents.length}
          icon={Bot}
          gradient="cyan"
          change="Network nodes"
          changeType="neutral"
        />
        <StatsCard
          label="Cloud Nodes"
          value={stats.nodes}
          icon={Server}
          gradient="blue"
          change="Mesh deployment"
          changeType="neutral"
        />
        <StatsCard
          label="Relay Channels"
          value={channels.length}
          icon={MessageSquare}
          gradient="purple"
          change="Live Streaming"
          changeType="positive"
        />
        <StatsCard
          label="Network Uptime"
          value={stats.uptime}
          icon={Activity}
          gradient="green"
          change="System telemetry"
          changeType="neutral"
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        {error && (
          <div className="mb-4 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
            {error}
          </div>
        )}
      </motion.div>

      <motion.div variants={itemVariants}>
        <LlmRoutingControl />
      </motion.div>

      <motion.div variants={itemVariants}>
        <OAuthInstanceRotationControl />
      </motion.div>

      <motion.div variants={itemVariants}>
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm uppercase tracking-widest font-bold text-slate-300">
              Realtime Orchestration Trends
            </h3>
            <span className="text-[10px] text-slate-500">Window: last 5 minutes</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="rounded-md border border-white/10 bg-transparent/5 p-3">
              <div className="text-slate-500 uppercase tracking-wide mb-1">Events / Min</div>
              <div className="text-xl font-bold text-cyan-300">{realtimeTrends.eventsPerMin}</div>
            </div>
            <div className="rounded-md border border-white/10 bg-transparent/5 p-3">
              <div className="text-slate-500 uppercase tracking-wide mb-1">Queued / Min</div>
              <div className="text-xl font-bold text-indigo-300">{realtimeTrends.queuePerMin}</div>
            </div>
            <div className="rounded-md border border-white/10 bg-transparent/5 p-3">
              <div className="text-slate-500 uppercase tracking-wide mb-1">Avg Score</div>
              <div className="text-xl font-bold text-emerald-300">{realtimeTrends.avgScore}</div>
            </div>
            <div className="rounded-md border border-white/10 bg-transparent/5 p-3">
              <div className="text-slate-500 uppercase tracking-wide mb-1">Vote Pressure</div>
              <div
                className={`text-xl font-bold ${realtimeTrends.votePressure >= 0 ? 'text-amber-300' : 'text-rose-300'}`}
              >
                {realtimeTrends.votePressure >= 0 ? '+' : ''}
                {realtimeTrends.votePressure}
              </div>
            </div>
          </div>
          <div className="mt-3 text-[10px] text-slate-500">
            Sampled events: {realtimeTrends.sampleSize}
          </div>
        </GlassCard>
      </motion.div>

      <motion.div variants={itemVariants}>
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm uppercase tracking-widest font-bold text-slate-300">
              Nested Orchestration Map
            </h3>
            <span className="text-[10px] text-slate-500">
              Master Clock → Source → Event Type → Lane → Horizon → Task
            </span>
          </div>
          <div className="rounded-md border border-white/10 bg-black/20 p-2">
            <GraphVisualizerWrapper
              nodes={orchestrationHierarchyGraph.nodes}
              edges={orchestrationHierarchyGraph.edges}
              config={{ layout: { type: 'dagre' } }}
              onNodeClick={handleGraphNodeClick}
            />
          </div>
          <div className="mt-3 rounded-md border border-white/10 bg-transparent/5 p-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="text-slate-300">
                Selected node:{' '}
                <span className="font-semibold">{selectedGraphNode?.label || 'none'}</span>
              </div>
              <div className="text-slate-500">
                Stream matches: {filteredActivities.length}/{activities.length}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                className="rounded border border-cyan-500/30 px-2 py-1 text-cyan-300 hover:bg-cyan-500/10"
                onClick={() => {
                  if (!selectedGraphNode) return;
                  const c = selectedGraphNode.context;
                  setStreamFilter({
                    source: c.source,
                    eventType: c.eventType,
                    taskId: c.taskId,
                    lane: c.lane,
                    horizon: c.horizon,
                  });
                }}
              >
                Filter Stream
              </button>
              <button
                className="rounded border border-indigo-500/30 px-2 py-1 text-indigo-300 hover:bg-indigo-500/10"
                onClick={() => jumpToAgent(selectedGraphNode?.context.source)}
              >
                Jump To Agent
              </button>
              <button
                className="rounded border border-emerald-500/30 px-2 py-1 text-emerald-300 hover:bg-emerald-500/10"
                onClick={() => {
                  const taskId = selectedGraphNode?.context.taskId;
                  if (!taskId) return;
                  const event =
                    activities.find(
                      (activity) => String(getActivityMetadata(activity).taskId || '') === taskId
                    ) || null;
                  setSelectedTaskDetail(event);
                }}
              >
                Open Task Detail
              </button>
              <button
                className="rounded border border-white/20 px-2 py-1 text-slate-300 hover:bg-transparent/10"
                onClick={() => {
                  setStreamFilter(null);
                  setSelectedTaskDetail(null);
                  setSelectedGraphNode(null);
                }}
              >
                Clear
              </button>
            </div>
            {selectedTaskDetail && (
              <div className="mt-3 rounded border border-white/10 bg-black/20 p-2">
                <div className="text-slate-400">Task Detail</div>
                <div className="text-slate-200 font-semibold">
                  {String(getActivityMetadata(selectedTaskDetail).taskId || 'unknown')}
                </div>
                <div className="text-slate-300 truncate">{selectedTaskDetail.content}</div>
              </div>
            )}
          </div>
        </GlassCard>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Live Interaction Feed */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
          <GlassCard className="flex flex-col h-[650px] overflow-hidden group">
            <div className="p-4 border-b border-white/5 bg-transparent/2 flex items-center justify-between">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400 animate-pulse" />
                Live Interaction Stream
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-mono">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                  LISTENING
                </div>
                <div className="text-[10px] text-slate-500 font-mono">TNF:ACTIVITY:STREAM</div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-sm scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              <AnimatePresence mode="popLayout">
                {filteredActivities.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full flex flex-col items-center justify-center text-slate-600 gap-4"
                  >
                    <Search className="w-12 h-12 opacity-20" />
                    <p className="text-slate-500 tracking-widest text-xs uppercase">
                      Awaiting mesh synchronization...
                    </p>
                  </motion.div>
                ) : (
                  filteredActivities.map((activity) => (
                    <motion.div
                      key={activity.id}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="p-4 rounded-md bg-transparent/2 border border-white/5 hover:border-white/10 hover:bg-transparent/5 transition-all group/item"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-tighter ${
                              activity.status === 'error'
                                ? 'bg-red-500/20 text-red-400'
                                : activity.source === 'system'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : 'bg-cyan-500/20 text-cyan-400'
                            }`}
                          >
                            {activity.source}
                          </span>
                          <span className="text-slate-500 text-[10px] tabular-nums">
                            {activity.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        {activity.channelId && (
                          <div className="text-[10px] text-slate-500 group-hover/item:text-slate-400 transition-colors">
                            CHL:{' '}
                            <span className="text-slate-400 font-bold">
                              {activity.channelId.slice(0, 8)}...
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-slate-300 break-words leading-relaxed pl-1 border-l-2 border-transparent group-hover/item:border-cyan-500/50 transition-all">
                        {activity.content}
                      </div>
                      {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/5 text-[10px] text-slate-500 grid grid-cols-2 gap-x-4 gap-y-1">
                          {Object.entries(activity.metadata)
                            .slice(0, 4)
                            .map(([k, v]: [string, unknown]) => (
                              <div key={k} className="truncate bg-transparent/2 px-2 py-1 rounded">
                                <span className="text-slate-600 uppercase mr-1">{k}:</span>{' '}
                                {String(v)}
                              </div>
                            ))}
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
              <div className="h-px w-full" id="stream-bottom" />
            </div>
          </GlassCard>
        </motion.div>

        {/* Sidebar Status Panels */}
        <motion.div variants={itemVariants} className="space-y-8">
          <GlassCard className="p-4 transition-transform hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-400" />
                Orchestration Signals
              </h3>
              <span className="bg-indigo-500/20 text-indigo-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                {orchestrationSignals.length} EVENTS
              </span>
            </div>
            {orchestrationSignals.length === 0 ? (
              <div className="text-slate-500 text-xs">No vote-driven task events yet.</div>
            ) : (
              <div className="space-y-2">
                {orchestrationSignals.slice(0, 6).map((signal) => (
                  <div
                    key={signal.id}
                    className="rounded-md border border-white/10 bg-transparent/5 p-3 text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-indigo-300 uppercase tracking-wide">
                        {signal.eventType}
                      </span>
                      <span className="text-slate-500">
                        {signal.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    {signal.taskId && (
                      <div className="text-slate-300 font-mono mb-1">
                        Task: {signal.taskId.slice(0, 18)}
                      </div>
                    )}
                    {signal.title && (
                      <div className="text-slate-300 mb-1 truncate">{signal.title}</div>
                    )}
                    <div className="flex items-center gap-3 text-slate-400">
                      <span>Score: {signal.score ?? '-'}</span>
                      <span>
                        Votes: +{signal.votes?.up ?? 0} / -{signal.votes?.down ?? 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          {/* Online Agents List */}
          <div ref={agentHubRef}>
            <GlassCard className="p-4 transition-transform hover:scale-[1.02]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Bot className="w-5 h-5 text-cyan-400" />
                  Connectivity Hub
                </h3>
                <span className="bg-cyan-500/20 text-cyan-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {agents.length} LIVE
                </span>
              </div>
              <div className="space-y-2">
                {agents.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-transparent/5 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Bot className="w-6 h-6 text-slate-600" />
                    </div>
                    <p className="text-slate-500 text-xs">No active nodes detected</p>
                  </div>
                ) : (
                  agents.slice(0, 6).map((agent) => (
                    <div
                      key={agent.id}
                      className={`flex items-center justify-between p-3 rounded-md hover:bg-transparent/5 border transition-all group ${
                        highlightedAgentId === agent.id
                          ? 'border-cyan-400/60 bg-cyan-500/10'
                          : 'border-transparent hover:border-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-md bg-slate-900 flex items-center justify-center border border-white/10 group-hover:border-cyan-500/50 transition-colors">
                            <Bot className="w-5 h-5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-950 shadow-none-[0_0_8px_#10b981]" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold">{agent.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {agent.id.slice(0, 8)}
                          </div>
                        </div>
                      </div>
                      <div className="text-[10px] font-bold text-cyan-500/50 group-hover:text-cyan-400 transition-colors px-2 py-1 bg-cyan-500/5 rounded uppercase">
                        {agent.status || 'Active'}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <Link
                to="/admin/agent-management"
                className="group mt-6 flex items-center justify-center gap-2 w-full py-2 rounded-md bg-transparent/5 border border-white/10 text-xs text-slate-400 hover:text-white transition-all font-bold tracking-widest uppercase"
              >
                Full Agent Fleet
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </Link>
            </GlassCard>
          </div>

          <GlassCard className="p-4 transition-transform hover:scale-[1.01]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Clock3 className="w-5 h-5 text-amber-300" />
                Chronological Control Plane
              </h3>
              <button
                onClick={loadChronologicalProcesses}
                className="text-[10px] px-2 py-1 rounded border border-amber-300/30 text-amber-200 hover:bg-amber-400/10"
              >
                Refresh
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3 text-[10px]">
              <div className="rounded border border-white/10 px-2 py-1 text-slate-300">
                Total: <span className="font-bold">{chronologicalSummary?.total ?? 0}</span>
              </div>
              <div className="rounded border border-emerald-500/20 px-2 py-1 text-emerald-300">
                Enabled: <span className="font-bold">{chronologicalSummary?.enabled ?? 0}</span>
              </div>
              <div className="rounded border border-rose-500/20 px-2 py-1 text-rose-300">
                Disabled: <span className="font-bold">{chronologicalSummary?.disabled ?? 0}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 mb-3 text-[10px]">
              <input
                value={chronologicalQuery}
                onChange={(event) => setChronologicalQuery(event.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded px-2 py-1 text-slate-200"
                placeholder="Filter by title, id, category, scope"
              />
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={chronologicalStatusFilter}
                  onChange={(event) =>
                    setChronologicalStatusFilter(event.target.value as ChronologicalStatusFilter)
                  }
                  className="bg-slate-900 border border-white/10 rounded px-2 py-1 text-slate-200"
                >
                  <option value="all">Status: all</option>
                  <option value="healthy">Healthy</option>
                  <option value="error">Error</option>
                  <option value="running">Running</option>
                  <option value="paused">Paused</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="manual">Manual</option>
                </select>
                <select
                  value={chronologicalScopeFilter}
                  onChange={(event) =>
                    setChronologicalScopeFilter(event.target.value as ChronologicalScopeFilter)
                  }
                  className="bg-slate-900 border border-white/10 rounded px-2 py-1 text-slate-200"
                >
                  <option value="all">Scope: all</option>
                  <option value="system_framework">System Framework</option>
                  <option value="tenant">Tenant</option>
                </select>
                <select
                  value={chronologicalSort}
                  onChange={(event) =>
                    setChronologicalSort(event.target.value as ChronologicalSortOption)
                  }
                  className="bg-slate-900 border border-white/10 rounded px-2 py-1 text-slate-200"
                >
                  <option value="next_run_asc">Sort: Next Run ↑</option>
                  <option value="next_run_desc">Sort: Next Run ↓</option>
                  <option value="last_run_desc">Sort: Last Run ↓</option>
                  <option value="status_asc">Sort: Status</option>
                  <option value="title_asc">Sort: Title</option>
                </select>
              </div>
              <div className="text-slate-500">
                Showing {chronologicalFilteredProcesses.length}/{chronologicalProcesses.length}
              </div>
            </div>

            {chronologicalError && (
              <div className="mb-3 text-[10px] text-rose-300 border border-rose-500/30 rounded px-2 py-1">
                {chronologicalError}
              </div>
            )}

            {chronologicalLoading && chronologicalProcesses.length === 0 ? (
              <div className="text-[10px] text-slate-500">Loading schedules...</div>
            ) : (
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {chronologicalFilteredProcesses.length === 0 ? (
                  <div className="text-[10px] text-slate-500">
                    No chronological processes match the current filters.
                  </div>
                ) : (
                  chronologicalFilteredProcesses.map((process) => {
                    const draft = processDrafts[process.id] || {
                      enabled: process.procedural.enabled,
                      cadence: process.procedural.cadence,
                      timezone: process.procedural.timezone,
                      notes: '',
                    };
                    const busy = Boolean(busyProcessMap[process.id]);
                    return (
                      <div
                        key={process.id}
                        className="rounded-md border border-white/10 bg-black/20 p-3 text-[10px]"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <div className="text-slate-100 font-semibold leading-tight">
                              {process.title}
                            </div>
                            <div className="text-slate-500 font-mono">{process.id}</div>
                          </div>
                          <div
                            className={`uppercase px-2 py-0.5 rounded border ${
                              process.runtime.status === 'error'
                                ? 'border-rose-500/30 text-rose-300'
                                : process.runtime.status === 'healthy'
                                  ? 'border-emerald-500/30 text-emerald-300'
                                  : process.runtime.status === 'running'
                                    ? 'border-cyan-500/30 text-cyan-300'
                                    : 'border-white/20 text-slate-300'
                            }`}
                          >
                            {process.runtime.status}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div className="text-slate-400">
                            Canonical: {process.canonical.scope} / {process.canonical.category}
                          </div>
                          <div className="text-slate-400 text-right">
                            {process.canonical.locked ? 'Locked' : 'Mutable'}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2 mb-2">
                          <label className="flex items-center gap-2 text-slate-300">
                            <input
                              type="checkbox"
                              className="accent-cyan-400"
                              checked={draft.enabled}
                              disabled={!process.controls.canEdit || busy}
                              onChange={(event) =>
                                updateProcessDraft(process.id, { enabled: event.target.checked })
                              }
                            />
                            Enabled
                          </label>

                          <input
                            value={draft.cadence}
                            disabled={!process.controls.canEdit || busy}
                            onChange={(event) =>
                              updateProcessDraft(process.id, { cadence: event.target.value })
                            }
                            className="w-full bg-slate-900 border border-white/10 rounded px-2 py-1 text-slate-200"
                            placeholder="*/15 * * * *"
                          />
                          <input
                            value={draft.timezone}
                            disabled={!process.controls.canEdit || busy}
                            onChange={(event) =>
                              updateProcessDraft(process.id, { timezone: event.target.value })
                            }
                            className="w-full bg-slate-900 border border-white/10 rounded px-2 py-1 text-slate-200"
                            placeholder="UTC"
                          />
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          <button
                            onClick={() => saveChronologicalProcess(process)}
                            disabled={!process.controls.canEdit || busy}
                            className="flex items-center gap-1 px-2 py-1 rounded border border-cyan-500/30 text-cyan-300 disabled:opacity-50"
                          >
                            <Save className="w-3 h-3" />
                            Save
                          </button>
                          <button
                            onClick={() => runChronologicalProcessNow(process)}
                            disabled={!process.controls.canRunNow || busy}
                            className="flex items-center gap-1 px-2 py-1 rounded border border-indigo-500/30 text-indigo-300 disabled:opacity-50"
                          >
                            <Play className="w-3 h-3" />
                            Run Now
                          </button>
                          <button
                            onClick={() => openProcessHistoryModal(process)}
                            disabled={busy}
                            className="flex items-center gap-1 px-2 py-1 rounded border border-amber-500/30 text-amber-300 disabled:opacity-50"
                          >
                            <Clock3 className="w-3 h-3" />
                            History
                          </button>
                        </div>

                        <div className="text-slate-500 leading-relaxed">
                          <div>Next: {process.procedural.nextRunHint || '-'}</div>
                          <div>
                            Next At:{' '}
                            {process.procedural.nextRunAt
                              ? new Date(process.procedural.nextRunAt).toLocaleString()
                              : 'unresolved'}
                          </div>
                          <div>Last: {process.runtime.lastRunAt || 'never'}</div>
                          {process.runtime.lastError && (
                            <div className="text-rose-300 truncate">
                              Error: {process.runtime.lastError}
                            </div>
                          )}
                        </div>

                        {Array.isArray(process.runtime.recentRuns) &&
                          process.runtime.recentRuns.length > 0 && (
                            <div className="mt-2 border-t border-white/10 pt-2">
                              <div className="text-slate-400 mb-1">Recent Runs</div>
                              <div className="space-y-1">
                                {process.runtime.recentRuns.slice(0, 3).map((run) => (
                                  <div
                                    key={run.runId}
                                    className="rounded border border-white/10 px-2 py-1 text-slate-400"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-mono">{run.status}</span>
                                      <span>{run.durationMs}ms</span>
                                    </div>
                                    <div className="text-slate-500">
                                      {new Date(run.finishedAt).toLocaleString()} · exit{' '}
                                      {run.exitCode}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </GlassCard>

          {historyModalProcess && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4">
              <div className="w-full max-w-3xl rounded-lg border border-white/15 bg-slate-950 shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-100">
                      {historyModalProcess.title} Run History
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {historyModalProcess.id}
                    </div>
                  </div>
                  <button
                    onClick={closeProcessHistoryModal}
                    className="rounded border border-white/20 px-2 py-1 text-[10px] text-slate-300 hover:bg-white/10"
                  >
                    Close
                  </button>
                </div>
                <div className="max-h-[65vh] overflow-y-auto p-4 text-[11px]">
                  {historyModalLoading && (
                    <div className="text-slate-500">Loading execution history...</div>
                  )}
                  {historyModalError && (
                    <div className="rounded border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-rose-200">
                      {historyModalError}
                    </div>
                  )}
                  {!historyModalLoading && !historyModalError && historyModalData && (
                    <div className="space-y-2">
                      <div className="text-slate-400">
                        Showing {historyModalData.runs.length} of {historyModalData.total} runs
                      </div>
                      {historyModalData.runs.length === 0 ? (
                        <div className="text-slate-500">No runs recorded yet.</div>
                      ) : (
                        historyModalData.runs.map((run) => (
                          <div
                            key={run.runId}
                            className="rounded border border-white/10 bg-black/20 px-3 py-2"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="font-mono text-slate-300">{run.runId}</div>
                              <div
                                className={`px-2 py-0.5 rounded border uppercase ${
                                  run.status === 'error'
                                    ? 'border-rose-500/30 text-rose-300'
                                    : run.status === 'healthy'
                                      ? 'border-emerald-500/30 text-emerald-300'
                                      : 'border-white/20 text-slate-300'
                                }`}
                              >
                                {run.status}
                              </div>
                            </div>
                            <div className="mt-1 text-slate-400">
                              {new Date(run.finishedAt).toLocaleString()} · {run.durationMs}ms ·
                              exit {run.exitCode} · actor {run.actorId}
                            </div>
                            {run.error && <div className="mt-1 text-rose-300">{run.error}</div>}
                            {run.outputPreview && (
                              <div className="mt-1 text-slate-500 break-all">
                                {run.outputPreview}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quick Orchestration */}
          <GlassCard className="p-4 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 relative">
              <Zap className="w-5 h-5 text-red-500 shadow-none-[0_0_10px_rgba(239,68,68,0.5)]" />
              Emergency Core
            </h3>
            <div className="grid grid-cols-2 gap-3 relative">
              <button
                onClick={handleHaltAgents}
                className="p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-md text-red-400 text-[10px] font-black tracking-widest uppercase transition-all flex flex-col items-center gap-3 hover:shadow-none-[0_0_20px_rgba(239,68,68,0.2)] active:scale-95"
              >
                <StopCircle className="w-6 h-6" />
                HALT FLEET
              </button>
              <button className="p-4 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-md text-blue-400 text-[10px] font-black tracking-widest uppercase transition-all flex flex-col items-center gap-3 active:scale-95">
                <RefreshCw className="w-6 h-6" />
                RESET MESH
              </button>
            </div>
            <p className="text-[9px] text-slate-600 mt-6 text-center italic font-mono uppercase tracking-widest leading-relaxed">
              Direct mesh commands bypass <br /> authorization middleware.
            </p>
          </GlassCard>

          {/* System Health */}
          <GlassCard className="p-4 bg-slate-900/50">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Server className="w-5 h-5 text-emerald-400" />
              Mesh Integrity
            </h3>
            <div className="space-y-4">
              {meshInstances.length === 0 ? (
                <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  ANALYZING MESH...
                </div>
              ) : (
                meshInstances.map((s, i) => (
                  <div key={i} className="flex justify-between items-center group/health">
                    <span className="text-xs font-medium text-slate-400 group-hover/health:text-slate-200 transition-colors uppercase tracking-tight">
                      {s.name}
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] text-slate-600 font-mono tracking-tighter">
                        {s.load}
                      </span>
                      <div className="relative">
                        <div
                          className={`w-2 h-2 rounded-full ${s.status === 'Healthy' ? 'bg-emerald-500 shadow-none-[0_0_8px_#10b981]' : 'bg-red-500 shadow-none-[0_0_8px_#ef4444]'}`}
                        />
                        {s.status === 'Healthy' && (
                          <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-20" />
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </motion.div>
  );
}
