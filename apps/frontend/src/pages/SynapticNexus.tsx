import { NodeToolbox, WorkflowCanvas } from '@/components/workflow';
import WorkflowAIAssistantPanel from '@/components/workflow/WorkflowAIAssistantPanel';
import useWorkflow from '@/hooks/useWorkflow';
import { Workflow, workflowService } from '@/services/WorkflowService';
import axios from 'axios';
import {
  Activity,
  BookOpen,
  Bot,
  Brain,
  Clock,
  Cpu,
  Database,
  Link2,
  Loader2,
  Network,
  Play,
  RefreshCcw,
  Save,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Wand2,
  X,
  Zap,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Edge, Node, ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';
import { MemoryVisualizer } from '../components/memory/visualization/MemoryVisualizer';
import { Badge } from '../components/ui/badge';
import { GlassCard } from '../components/ui/premium/GlassCard';
import { PremiumButton } from '../components/ui/premium/PremiumButton';
import { PremiumInput } from '../components/ui/premium/PremiumInput';
import { ArtifactGraphViewer } from '../components/wizard/graph/ArtifactGraphViewer';
import { GraphVisualizerWrapper as GraphVisualizer } from '../components/wizard/graph/GraphVisualizer';

const CONCORDANCE_HTML =
  (import.meta.env.VITE_CONCORDANCE_URL as string) ||
  '/visualizations/TNF_CONCORDANCE_VISUALIZER.html';
const DEFAULT_WORKFLOW_NAME = 'Untitled Synapse';

type NexusLayer = 'topology' | 'semantic' | 'forge' | 'memory' | 'lexicon' | 'activity' | 'metrics';

interface AgentIndex {
  generatedAt: string;
  counts: { agentDefinitions: number; overlayConfigs: number };
  agents: Array<AgentEntry>;
}

interface AgentEntry {
  id: string;
  name: string;
  description?: string;
  tools?: string[];
  traits?: string[];
  abilities?: string[];
  overlayTools?: string[];
  semantic?: {
    relatedConcepts?: Array<{ concept: string; score: number }>;
    definingDocs?: Array<{ path: string; score: number; snippet?: string }>;
  };
}

interface ClusterItem {
  id: string;
  content: string;
  metadata: {
    confidence: number;
    source: string;
  };
}

interface MemoryCluster {
  id: string;
  label: string;
  items: ClusterItem[];
}

interface KnowledgeIndex {
  id: string;
  name: string;
  dimension: number;
  metric: string;
  vectorsCount: number;
  status: 'ready' | 'indexing' | 'error';
}

interface NexusMetrics {
  activeNodes: number | null;
  throughput: number | null;
  networkLatencyMs: number | null;
  memoryUsagePercent: number | null;
  activeAgentRatePercent: number | null;
  securityStatus: 'healthy' | 'degraded' | 'unknown';
}

interface ActivityEvent {
  id: string;
  label: string;
  status: string;
  source: 'workflow' | 'master-clock';
  timestamp: Date;
}

interface GraphArtifactDataset {
  id: string;
  title?: string;
  sourceRoot?: string;
  graph?: { file?: string | null; nodes?: number; edges?: number };
  missingRequirements?: string[];
}

interface GraphArtifactsIndex {
  generatedAt?: string;
  source?: string;
  datasets?: GraphArtifactDataset[];
  missingImplementations?: Array<{ datasetId: string; requirement: string }>;
  totals?: {
    datasets?: number;
    graphNodes?: number;
    graphEdges?: number;
    missingImplementations?: number;
  };
}

interface DataSourceSnapshot {
  orchestratorAgents: string;
  orchestratorHealth: string;
  systemHealth: string;
  systemMetrics: string;
  graphArtifacts: string;
  agentIndex: string;
}

const SOURCE_UNRESOLVED = 'unresolved';

const LAYERS: Array<{
  id: NexusLayer;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'topology', label: 'Topology', icon: Network },
  { id: 'semantic', label: 'Semantic', icon: Brain },
  { id: 'forge', label: 'Forge', icon: Wand2 },
  { id: 'memory', label: 'Memory', icon: Database },
  { id: 'lexicon', label: 'Lexicon', icon: BookOpen },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'metrics', label: 'Metrics', icon: Zap },
];

const unwrap = (payload: any): Record<string, any> => {
  if (!payload || typeof payload !== 'object') return {};
  if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
    return payload.data as Record<string, any>;
  }
  return payload;
};

const normalizeLayer = (rawLayer: string | null): NexusLayer => {
  const normalized = String(rawLayer || 'topology').toLowerCase();
  if (normalized === 'graphs' || normalized === 'graph') return 'forge';
  if (normalized === 'observatory') return 'topology';
  const candidate = normalized as NexusLayer;
  return LAYERS.some((layer) => layer.id === candidate) ? candidate : 'topology';
};

const slugId = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const categorizeAgent = (name: string): string => {
  const normalized = name.toLowerCase();
  if (/(support|customer|helpdesk|ticket)/.test(normalized)) return 'Support';
  if (/(marketing|seo|growth|funnel|sales|ad-|ads|affiliate)/.test(normalized))
    return 'Marketing & Growth';
  if (/(content|podcast|tiktok|youtube|social|newsletter|copy|writer)/.test(normalized))
    return 'Content & Media';
  if (/(devops|infra|deployment|docker|kubernetes|cloud|security)/.test(normalized))
    return 'DevOps & Security';
  if (/(research|information|retrieval|analyst|analysis|intel|intelligence)/.test(normalized))
    return 'Research & Analysis';
  if (/(product|ux|ui|design)/.test(normalized)) return 'Product & Design';
  if (/(code|coding|typescript|backend|frontend|qa|test)/.test(normalized)) return 'Engineering';
  return 'General';
};

const sanitizeGraph = (nodes: unknown, edges: unknown): { nodes: Node[]; edges: Edge[] } => ({
  nodes: Array.isArray(nodes) ? (nodes as Node[]) : [],
  edges: Array.isArray(edges) ? (edges as Edge[]) : [],
});

const formatTimestamp = (value: Date): string => {
  if (Number.isNaN(value.getTime())) return 'Unknown time';
  return value.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const pickStatusTone = (status: string): string => {
  const normalized = status.toLowerCase();
  if (
    normalized.includes('fail') ||
    normalized.includes('error') ||
    normalized.includes('stalled')
  ) {
    return 'bg-rose-500/20 text-rose-200 border-rose-400/30';
  }
  if (normalized.includes('running') || normalized.includes('pending')) {
    return 'bg-sky-500/20 text-sky-200 border-sky-400/30';
  }
  if (
    normalized.includes('complete') ||
    normalized.includes('healthy') ||
    normalized.includes('ok')
  ) {
    return 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30';
  }
  return 'bg-slate-700/40 text-slate-200 border-white/10';
};

const normalizeAssetPath = (path: string | null | undefined): string | null => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return path.startsWith('/') ? path : `/${path}`;
};

const resolveColorClasses = (
  tone: 'sky' | 'amber' | 'emerald' | 'indigo'
): { icon: string; bar: string; glow: string } => {
  switch (tone) {
    case 'amber':
      return {
        icon: 'text-amber-500',
        bar: 'bg-amber-500',
        glow: 'shadow-[0_0_10px_rgba(245,158,11,0.45)]',
      };
    case 'emerald':
      return {
        icon: 'text-emerald-500',
        bar: 'bg-emerald-500',
        glow: 'shadow-[0_0_10px_rgba(16,185,129,0.45)]',
      };
    case 'indigo':
      return {
        icon: 'text-cyan-400',
        bar: 'bg-cyan-400',
        glow: 'shadow-[0_0_10px_rgba(34,211,238,0.45)]',
      };
    case 'sky':
    default:
      return {
        icon: 'text-sky-500',
        bar: 'bg-sky-500',
        glow: 'shadow-[0_0_10px_rgba(56,189,248,0.45)]',
      };
  }
};

/**
 * SYNAPTIC NEXUS 4.5: SOVEREIGN ORCHESTRATION
 * Unified command core for topology, semantic intelligence, forge execution, and sovereign memory.
 */
export const SynapticNexus: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const nexusBasePath = location.pathname.startsWith('/workflows/nexus')
    ? '/workflows/nexus'
    : '/nexus';

  const {
    workflows,
    loadWorkflows,
    executions,
    loadExecutions,
    currentWorkflow,
    setCurrentWorkflow,
    createWorkflow,
    saveWorkflow,
    publishWorkflow,
    executeWorkflowViaWebhook,
  } = useWorkflow();

  const [activeLayer, setActiveLayer] = useState<NexusLayer>(
    normalizeLayer(searchParams.get('layer'))
  );
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(
    searchParams.get('workflowId')
  );
  const [workflowName, setWorkflowName] = useState(DEFAULT_WORKFLOW_NAME);
  const [forgeGraph, setForgeGraph] = useState<{ nodes: Node[]; edges: Edge[] }>({
    nodes: [],
    edges: [],
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isCreatingWorkflow, setIsCreatingWorkflow] = useState(false);
  const [isPublishingWorkflow, setIsPublishingWorkflow] = useState(false);
  const [forgeStatusMessage, setForgeStatusMessage] = useState<string | null>(null);
  const [showAiPanel, setShowAiPanel] = useState(false);

  const [agentIndex, setAgentIndex] = useState<AgentIndex | null>(null);
  const [agentIndexLoading, setAgentIndexLoading] = useState(true);
  const [agentIndexError, setAgentIndexError] = useState<string | null>(null);
  const [agentSearch, setAgentSearch] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const [topologyGraph, setTopologyGraph] = useState<{ nodes: Node[]; edges: Edge[] }>({
    nodes: [],
    edges: [],
  });
  const [topologyLoading, setTopologyLoading] = useState(true);
  const [topologyError, setTopologyError] = useState<string | null>(null);
  const [dataSources, setDataSources] = useState<DataSourceSnapshot>({
    orchestratorAgents: SOURCE_UNRESOLVED,
    orchestratorHealth: SOURCE_UNRESOLVED,
    systemHealth: SOURCE_UNRESOLVED,
    systemMetrics: SOURCE_UNRESOLVED,
    graphArtifacts: SOURCE_UNRESOLVED,
    agentIndex: SOURCE_UNRESOLVED,
  });
  const [graphArtifacts, setGraphArtifacts] = useState<GraphArtifactsIndex | null>(null);
  const [graphArtifactsLoading, setGraphArtifactsLoading] = useState(true);
  const [graphArtifactsError, setGraphArtifactsError] = useState<string | null>(null);
  const [selectedArtifactGraphUrl, setSelectedArtifactGraphUrl] = useState<string | null>(null);
  const [selectedArtifactTitle, setSelectedArtifactTitle] = useState<string | null>(null);

  const [memoryClusters, setMemoryClusters] = useState<MemoryCluster[]>([]);
  const [memoryIndices, setMemoryIndices] = useState<KnowledgeIndex[]>([]);
  const [memoryLoading, setMemoryLoading] = useState(true);
  const [memoryError, setMemoryError] = useState<string | null>(null);

  const [clockActivity, setClockActivity] = useState<
    Array<{ timestamp: string | null; eventType: string; content: string }>
  >([]);
  const [clockLoading, setClockLoading] = useState(true);
  const [clockError, setClockError] = useState<string | null>(null);

  const [metrics, setMetrics] = useState<NexusMetrics>({
    activeNodes: null,
    throughput: null,
    networkLatencyMs: null,
    memoryUsagePercent: null,
    activeAgentRatePercent: null,
    securityStatus: 'unknown',
  });

  const updateNexusUrl = useCallback(
    (layer: NexusLayer, workflowId?: string | null, replace = true) => {
      const params = new URLSearchParams();
      params.set('layer', layer);
      if (workflowId) {
        params.set('workflowId', workflowId);
      }
      navigate(`${nexusBasePath}?${params.toString()}`, { replace });
    },
    [navigate, nexusBasePath]
  );

  const fetchFirstJson = useCallback(
    async (
      paths: string[]
    ): Promise<{ data: any; source: string; usedAlternate: boolean } | null> => {
      for (const [index, path] of paths.entries()) {
        try {
          const response = await axios.get(path, { validateStatus: () => true });
          if (response.status >= 200 && response.status < 300) {
            return { data: response.data, source: path, usedAlternate: index > 0 };
          }
        } catch {
          // try next alias
        }
      }
      return null;
    },
    []
  );

  const formatSourceLabel = useCallback(
    (result: { source: string; usedAlternate: boolean } | null): string =>
      result ? `${result.source}${result.usedAlternate ? ' (alt)' : ''}` : 'unavailable',
    []
  );

  const hydrateForgeFromWorkflow = useCallback(
    (workflow: Workflow, updateUrl = true) => {
      const nextGraph = sanitizeGraph(workflow.nodes, workflow.edges);
      setSelectedWorkflowId(workflow.id);
      setCurrentWorkflow(workflow);
      setWorkflowName(workflow.name || DEFAULT_WORKFLOW_NAME);
      setForgeGraph(nextGraph);
      setForgeStatusMessage(null);
      if (updateUrl) {
        updateNexusUrl(activeLayer, workflow.id);
      }
    },
    [activeLayer, setCurrentWorkflow, updateNexusUrl]
  );

  const fetchAgentIndex = useCallback(async () => {
    try {
      setAgentIndexLoading(true);
      setAgentIndexError(null);
      const result = await fetchFirstJson([
        '/observatory/agents.index.json',
        '/api/observatory/agents.index.json',
      ]);

      setDataSources((previous) => ({
        ...previous,
        agentIndex: formatSourceLabel(result),
      }));

      if (!result) {
        throw new Error('Agent index endpoint unavailable');
      }

      setAgentIndex(result.data as AgentIndex);
    } catch (error) {
      setAgentIndex(null);
      setAgentIndexError(error instanceof Error ? error.message : 'Failed to load agent index');
    } finally {
      setAgentIndexLoading(false);
    }
  }, [fetchFirstJson, formatSourceLabel]);

  const fetchTopologyAndMetrics = useCallback(async () => {
    try {
      setTopologyLoading(true);
      setTopologyError(null);

      const [agentsResult, orchestratorHealthResult, systemHealthResult, systemMetricsResult] =
        await Promise.all([
          fetchFirstJson(['/api/orchestrator/agents', '/orchestrator/agents']),
          fetchFirstJson(['/api/orchestrator/health', '/orchestrator/health']),
          fetchFirstJson(['/api/system/health', '/system/health', '/api/health', '/health']),
          fetchFirstJson(['/api/system/metrics', '/system/metrics']),
        ]);

      setDataSources((previous) => ({
        ...previous,
        orchestratorAgents: formatSourceLabel(agentsResult),
        orchestratorHealth: formatSourceLabel(orchestratorHealthResult),
        systemHealth: formatSourceLabel(systemHealthResult),
        systemMetrics: formatSourceLabel(systemMetricsResult),
      }));

      const agentsData = unwrap(agentsResult?.data);
      const orchestratorHealth = unwrap(orchestratorHealthResult?.data);
      const systemHealth = unwrap(systemHealthResult?.data);
      const systemMetrics = unwrap(systemMetricsResult?.data);
      const agents = Array.isArray(agentsData.agents) ? agentsData.agents : [];

      const nodes: Node[] = [
        {
          id: 'orchestrator',
          data: { label: 'Orchestrator' },
          position: { x: 360, y: 40 },
          type: 'input',
        },
      ];
      const edges: Edge[] = [];

      agents.slice(0, 80).forEach((agent: any, idx: number) => {
        const status = typeof agent.status === 'string' ? agent.status : 'unknown';
        const agentId = String(agent.agentId ?? agent.id ?? `agent-${idx}`);
        const column = idx % 4;
        const row = Math.floor(idx / 4);

        nodes.push({
          id: `agent:${agentId}`,
          data: { label: `${agentId} (${status})` },
          position: { x: 60 + column * 200, y: 170 + row * 90 },
        });

        edges.push({
          id: `edge:orchestrator:${agentId}`,
          source: 'orchestrator',
          target: `agent:${agentId}`,
          animated: status === 'active' || status === 'online',
        });
      });

      setTopologyGraph({ nodes, edges });
      if (!agentsResult) {
        setTopologyError('Orchestrator topology endpoints unavailable.');
      } else if (agents.length === 0) {
        setTopologyError('No active orchestrator agents are currently reporting.');
      }

      const totalAgents = Number((orchestratorHealth?.metrics?.totalAgents ?? agents.length) || 0);
      const activeAgents = Number(
        orchestratorHealth?.metrics?.activeAgents ??
          agents.filter((agent: any) => agent?.status === 'active' || agent?.status === 'online')
            .length
      );

      const throughput =
        Number(systemMetrics?.api?.requestsPerSecond ?? systemMetrics?.requestsPerSecond ?? NaN) ||
        null;
      const memoryUsage =
        Number(systemMetrics?.memory?.usagePercent ?? systemMetrics?.memory?.usage ?? NaN) || null;
      const networkLatency =
        Number(
          systemMetrics?.api?.averageResponseTimeMs ??
            systemMetrics?.api?.avgResponseTime ??
            systemMetrics?.avgResponseTime
        ) || null;
      const healthStatus = String(systemHealth?.status ?? 'unknown').toLowerCase();

      setMetrics((previous) => ({
        ...previous,
        activeNodes: agents.length,
        throughput,
        networkLatencyMs: networkLatency,
        memoryUsagePercent: memoryUsage,
        activeAgentRatePercent:
          totalAgents > 0 ? Math.round((activeAgents / totalAgents) * 100) : null,
        securityStatus:
          healthStatus === 'healthy' || healthStatus === 'ok'
            ? 'healthy'
            : healthStatus === 'degraded' || healthStatus === 'warning'
              ? 'degraded'
              : 'unknown',
      }));
    } catch (error) {
      setTopologyGraph({ nodes: [], edges: [] });
      setTopologyError(
        error instanceof Error ? error.message : 'Failed to load live topology and metrics.'
      );
      setMetrics((previous) => ({
        ...previous,
        activeNodes: null,
        throughput: null,
        networkLatencyMs: null,
        memoryUsagePercent: null,
        activeAgentRatePercent: null,
      }));
    } finally {
      setTopologyLoading(false);
    }
  }, [fetchFirstJson, formatSourceLabel]);

  const fetchGraphArtifacts = useCallback(async () => {
    try {
      setGraphArtifactsLoading(true);
      setGraphArtifactsError(null);

      const result = await fetchFirstJson([
        '/api/visualizations/data/graph-artifacts.index.json',
        '/visualizations/data/graph-artifacts.index.json',
      ]);

      setDataSources((previous) => ({
        ...previous,
        graphArtifacts: formatSourceLabel(result),
      }));

      if (!result) {
        setGraphArtifacts(null);
        setGraphArtifactsError(
          'Graph artifacts index unavailable. Run the graph publisher to expose visualization bundles.'
        );
        return;
      }

      const payload = unwrap(result.data);
      const datasets = Array.isArray(payload.datasets) ? payload.datasets : [];
      const missingImplementations = Array.isArray(payload.missingImplementations)
        ? payload.missingImplementations
        : [];
      const totals = payload.totals && typeof payload.totals === 'object' ? payload.totals : {};

      setGraphArtifacts({
        generatedAt: typeof payload.generatedAt === 'string' ? payload.generatedAt : undefined,
        source: typeof payload.source === 'string' ? payload.source : undefined,
        datasets,
        missingImplementations,
        totals,
      });

      if (datasets.length === 0) {
        setGraphArtifactsError('No graph datasets are currently published.');
      }
    } catch (error) {
      setGraphArtifacts(null);
      setGraphArtifactsError(
        error instanceof Error ? error.message : 'Failed to load graph artifact index.'
      );
    } finally {
      setGraphArtifactsLoading(false);
    }
  }, [fetchFirstJson, formatSourceLabel]);

  const fetchMemoryData = useCallback(async () => {
    try {
      setMemoryLoading(true);
      setMemoryError(null);

      const [clustersResult, indicesResult] = await Promise.all([
        fetchFirstJson(['/api/knowledge/clusters', '/knowledge/clusters']),
        fetchFirstJson(['/api/knowledge/indices', '/knowledge/indices']),
      ]);

      const rawClusters = clustersResult?.data;
      const rawIndices = indicesResult?.data;

      const nextClusters = Array.isArray(rawClusters)
        ? rawClusters
            .map((cluster: any) => ({
              id: String(cluster?.id ?? `cluster-${Math.random()}`),
              label: String(cluster?.label ?? 'Unnamed cluster'),
              items: Array.isArray(cluster?.items)
                ? cluster.items
                    .map((item: any, index: number) => ({
                      id: String(item?.id ?? `${cluster?.id || 'cluster'}-${index}`),
                      content: String(item?.content ?? ''),
                      metadata: {
                        confidence:
                          typeof item?.metadata?.confidence === 'number'
                            ? item.metadata.confidence
                            : 0.5,
                        source: String(item?.metadata?.source ?? 'unknown'),
                      },
                    }))
                    .filter((item: ClusterItem) => item.content.length > 0)
                : [],
            }))
            .filter((cluster: MemoryCluster) => cluster.items.length > 0)
        : [];

      const nextIndices = Array.isArray(rawIndices) ? (rawIndices as KnowledgeIndex[]) : [];

      setMemoryClusters(nextClusters);
      setMemoryIndices(nextIndices);

      if (!clustersResult || !indicesResult) {
        setMemoryError('Knowledge APIs are partially unavailable.');
      }
    } catch (error) {
      setMemoryClusters([]);
      setMemoryIndices([]);
      setMemoryError(error instanceof Error ? error.message : 'Failed to load memory data.');
    } finally {
      setMemoryLoading(false);
    }
  }, [fetchFirstJson]);

  const fetchMasterClock = useCallback(async () => {
    try {
      setClockLoading(true);
      setClockError(null);

      const result = await fetchFirstJson(['/api/system/master-clock', '/system/master-clock']);
      const payload = unwrap(result?.data);
      const recent = Array.isArray(payload?.recentActivity) ? payload.recentActivity : [];

      const normalized = recent.map((entry: any) => ({
        timestamp: typeof entry?.timestamp === 'string' ? entry.timestamp : null,
        eventType: String(entry?.eventType ?? 'unknown'),
        content: String(entry?.content ?? '').trim(),
      }));

      setClockActivity(normalized);
      if (!result) {
        setClockError('Master clock endpoint unavailable.');
      }
    } catch (error) {
      setClockActivity([]);
      setClockError(
        error instanceof Error ? error.message : 'Failed to load master clock activity.'
      );
    } finally {
      setClockLoading(false);
    }
  }, [fetchFirstJson]);

  const loadNexusData = useCallback(async () => {
    await Promise.all([
      loadWorkflows(),
      loadExecutions(),
      fetchAgentIndex(),
      fetchTopologyAndMetrics(),
      fetchGraphArtifacts(),
      fetchMemoryData(),
      fetchMasterClock(),
    ]);
  }, [
    fetchAgentIndex,
    fetchGraphArtifacts,
    fetchMasterClock,
    fetchMemoryData,
    fetchTopologyAndMetrics,
    loadExecutions,
    loadWorkflows,
  ]);

  useEffect(() => {
    void loadNexusData();
  }, [loadNexusData]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void Promise.all([fetchTopologyAndMetrics(), fetchMasterClock(), loadExecutions()]);
    }, 20000);

    return () => {
      window.clearInterval(timer);
    };
  }, [fetchMasterClock, fetchTopologyAndMetrics, loadExecutions]);

  useEffect(() => {
    const layerFromUrl = normalizeLayer(searchParams.get('layer'));
    if (layerFromUrl !== activeLayer) {
      setActiveLayer(layerFromUrl);
    }

    const workflowIdFromUrl = searchParams.get('workflowId');
    if (workflowIdFromUrl && workflowIdFromUrl !== selectedWorkflowId) {
      const candidate = workflows.find((workflow) => workflow.id === workflowIdFromUrl);
      if (candidate) {
        hydrateForgeFromWorkflow(candidate, false);
      } else {
        setSelectedWorkflowId(workflowIdFromUrl);
      }
    }
  }, [activeLayer, hydrateForgeFromWorkflow, searchParams, selectedWorkflowId, workflows]);

  useEffect(() => {
    if (workflows.length === 0) {
      if (!selectedWorkflowId) {
        setWorkflowName(DEFAULT_WORKFLOW_NAME);
      }
      return;
    }

    const queryWorkflowId = searchParams.get('workflowId');
    const workflowToLoad =
      workflows.find((workflow) => workflow.id === queryWorkflowId) ??
      workflows.find((workflow) => workflow.id === selectedWorkflowId) ??
      workflows[0];

    if (!workflowToLoad) return;

    if (selectedWorkflowId !== workflowToLoad.id) {
      hydrateForgeFromWorkflow(workflowToLoad, !queryWorkflowId);
      return;
    }

    if (!currentWorkflow || currentWorkflow.id !== workflowToLoad.id) {
      setCurrentWorkflow(workflowToLoad);
    }

    if (workflowName === DEFAULT_WORKFLOW_NAME && workflowToLoad.name) {
      setWorkflowName(workflowToLoad.name);
    }

    if (forgeGraph.nodes.length === 0 && forgeGraph.edges.length === 0) {
      const nextGraph = sanitizeGraph(workflowToLoad.nodes, workflowToLoad.edges);
      if (nextGraph.nodes.length > 0 || nextGraph.edges.length > 0) {
        setForgeGraph(nextGraph);
      }
    }
  }, [
    currentWorkflow,
    forgeGraph.edges.length,
    forgeGraph.nodes.length,
    hydrateForgeFromWorkflow,
    searchParams,
    selectedWorkflowId,
    setCurrentWorkflow,
    workflowName,
    workflows,
  ]);

  const filteredAgents = useMemo(() => {
    const agents = agentIndex?.agents ?? [];
    const query = agentSearch.trim().toLowerCase();
    if (!query) return agents;
    return agents.filter((agent) => {
      const haystack =
        `${agent.name} ${agent.description ?? ''} ${(agent.tools ?? []).join(' ')} ${(agent.traits ?? []).join(' ')} ${(agent.abilities ?? []).join(' ')}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [agentIndex, agentSearch]);

  const agentsByCategory = useMemo(() => {
    const grouped = new Map<string, AgentEntry[]>();
    for (const agent of filteredAgents) {
      const category = categorizeAgent(agent.name);
      grouped.set(category, [...(grouped.get(category) ?? []), agent]);
    }
    return Array.from(grouped.entries()).sort((left, right) => left[0].localeCompare(right[0]));
  }, [filteredAgents]);

  const selectedAgent = useMemo(() => {
    if (!selectedAgentId) return null;
    return (agentIndex?.agents ?? []).find((agent) => agent.id === selectedAgentId) ?? null;
  }, [agentIndex, selectedAgentId]);

  const graphArtifactDatasets = useMemo(
    () => (Array.isArray(graphArtifacts?.datasets) ? graphArtifacts.datasets : []),
    [graphArtifacts]
  );

  const openArtifactPreview = useCallback((dataset: GraphArtifactDataset) => {
    const artifactUrl = normalizeAssetPath(dataset.graph?.file);
    if (!artifactUrl) return;
    setSelectedArtifactGraphUrl(artifactUrl);
    setSelectedArtifactTitle(dataset.title || dataset.id);
  }, []);

  useEffect(() => {
    if (!selectedArtifactGraphUrl) return;
    const stillExists = graphArtifactDatasets.some(
      (dataset) => normalizeAssetPath(dataset.graph?.file) === selectedArtifactGraphUrl
    );
    if (!stillExists) {
      setSelectedArtifactGraphUrl(null);
      setSelectedArtifactTitle(null);
    }
  }, [graphArtifactDatasets, selectedArtifactGraphUrl]);

  const semanticGraph = useMemo((): { nodes: Node[]; edges: Edge[] } => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const nodeStyleByKind: Record<string, any> = {
      category: {
        background: 'rgba(14,116,144,0.12)',
        border: '1px solid rgba(34,211,238,0.28)',
        color: '#e5e7eb',
        fontWeight: 800,
        padding: 10,
        borderRadius: 14,
      },
      agent: {
        background: 'rgba(2,132,199,0.10)',
        border: '1px solid rgba(56,189,248,0.25)',
        color: '#e5e7eb',
        fontWeight: 700,
        padding: 10,
        borderRadius: 14,
      },
      tool: {
        background: 'rgba(245,158,11,0.10)',
        border: '1px solid rgba(251,191,36,0.25)',
        color: '#e5e7eb',
        fontWeight: 600,
        padding: 10,
        borderRadius: 14,
      },
      trait: {
        background: 'rgba(6,182,212,0.10)',
        border: '1px solid rgba(34,211,238,0.25)',
        color: '#e5e7eb',
        fontWeight: 600,
        padding: 10,
        borderRadius: 14,
      },
      ability: {
        background: 'rgba(16,185,129,0.10)',
        border: '1px solid rgba(52,211,153,0.25)',
        color: '#e5e7eb',
        fontWeight: 600,
        padding: 10,
        borderRadius: 14,
      },
      concept: {
        background: 'rgba(244,63,94,0.08)',
        border: '1px solid rgba(251,113,133,0.22)',
        color: '#e5e7eb',
        fontWeight: 600,
        padding: 10,
        borderRadius: 14,
      },
      doc: {
        background: 'rgba(148,163,184,0.08)',
        border: '1px solid rgba(148,163,184,0.20)',
        color: '#e5e7eb',
        fontWeight: 500,
        padding: 10,
        borderRadius: 14,
      },
    };

    if (!selectedAgent) {
      agentsByCategory.slice(0, 12).forEach(([category, agents], rowIndex) => {
        const categoryId = `cat:${slugId(category)}`;
        nodes.push({
          id: categoryId,
          data: { label: category, kind: 'category' },
          position: { x: 0, y: rowIndex * 90 },
          style: nodeStyleByKind.category,
        });

        agents.slice(0, 20).forEach((agent, agentIndexInCategory) => {
          const agentId = `agent:${agent.id}`;
          nodes.push({
            id: agentId,
            data: { label: agent.name, kind: 'agent' },
            position: {
              x: 250 + (agentIndexInCategory % 2) * 240,
              y: rowIndex * 90 + Math.floor(agentIndexInCategory / 2) * 42,
            },
            style: nodeStyleByKind.agent,
          });
          edges.push({
            id: `edge:${categoryId}->${agentId}`,
            source: categoryId,
            target: agentId,
            label: 'contains',
            style: { stroke: 'rgba(56,189,248,0.35)', strokeWidth: 1 },
          });
        });
      });

      return { nodes, edges };
    }

    const rootId = `agent:${selectedAgent.id}`;
    nodes.push({
      id: rootId,
      data: { label: selectedAgent.name, kind: 'agent' },
      position: { x: 0, y: 0 },
      style: nodeStyleByKind.agent,
    });

    (selectedAgent.tools ?? []).slice(0, 30).forEach((tool, index) => {
      const id = `tool:${slugId(tool)}`;
      nodes.push({
        id,
        data: { label: tool, kind: 'tool' },
        position: { x: 320, y: -260 + index * 36 },
        style: nodeStyleByKind.tool,
      });
      edges.push({
        id: `edge:${rootId}->${id}`,
        source: rootId,
        target: id,
        label: 'uses',
        animated: true,
        style: { stroke: 'rgba(251,191,36,0.40)', strokeWidth: 1.5 },
      });
    });

    (selectedAgent.traits ?? []).slice(0, 20).forEach((trait, index) => {
      const id = `trait:${slugId(trait)}`;
      nodes.push({
        id,
        data: { label: trait, kind: 'trait' },
        position: { x: 700, y: -260 + index * 36 },
        style: nodeStyleByKind.trait,
      });
      edges.push({
        id: `edge:${rootId}->${id}`,
        source: rootId,
        target: id,
        label: 'trait',
        style: { stroke: 'rgba(34,211,238,0.40)', strokeWidth: 1.5 },
      });
    });

    (selectedAgent.abilities ?? []).slice(0, 20).forEach((ability, index) => {
      const id = `ability:${slugId(ability)}`;
      nodes.push({
        id,
        data: { label: ability, kind: 'ability' },
        position: { x: 700, y: 140 + index * 36 },
        style: nodeStyleByKind.ability,
      });
      edges.push({
        id: `edge:${rootId}->${id}`,
        source: rootId,
        target: id,
        label: 'ability',
        style: { stroke: 'rgba(52,211,153,0.40)', strokeWidth: 1.5 },
      });
    });

    (selectedAgent.semantic?.relatedConcepts ?? []).slice(0, 12).forEach((concept, index) => {
      const id = `concept:${slugId(concept.concept)}`;
      nodes.push({
        id,
        data: { label: concept.concept, kind: 'concept' },
        position: { x: 320, y: 220 + index * 34 },
        style: nodeStyleByKind.concept,
      });
      edges.push({
        id: `edge:${rootId}->${id}`,
        source: rootId,
        target: id,
        label: 'concept',
        style: { stroke: 'rgba(251,113,133,0.40)', strokeWidth: 1.5 },
      });
    });

    (selectedAgent.semantic?.definingDocs ?? []).slice(0, 10).forEach((doc, index) => {
      const id = `doc:${slugId(doc.path)}`;
      const label = doc.path.length > 42 ? `…${doc.path.slice(-42)}` : doc.path;
      nodes.push({
        id,
        data: { label, kind: 'doc' },
        position: { x: 980, y: -240 + index * 44 },
        style: nodeStyleByKind.doc,
      });
      edges.push({
        id: `edge:${rootId}->${id}`,
        source: rootId,
        target: id,
        label: 'doc',
        style: { stroke: 'rgba(148,163,184,0.30)', strokeWidth: 1 },
      });
    });

    return { nodes, edges };
  }, [agentsByCategory, selectedAgent]);

  const activityEvents = useMemo((): ActivityEvent[] => {
    const workflowEvents = executions.map((execution) => {
      const workflowNameForExecution =
        workflows.find((workflow) => workflow.id === execution.workflowId)?.name ||
        execution.workflowId ||
        'Workflow';

      return {
        id: `workflow:${execution.id}`,
        label: `${workflowNameForExecution}`,
        status: execution.status,
        source: 'workflow' as const,
        timestamp: new Date(execution.startTime),
      };
    });

    const masterClockEvents: ActivityEvent[] = [];
    clockActivity.forEach((entry, index) => {
      const timestamp = entry.timestamp ? new Date(entry.timestamp) : new Date(0);
      if (Number.isNaN(timestamp.getTime())) {
        return;
      }
      masterClockEvents.push({
        id: `clock:${entry.timestamp || 'unknown'}:${index}`,
        label: entry.content || entry.eventType,
        status: entry.eventType,
        source: 'master-clock',
        timestamp,
      });
    });

    return [...workflowEvents, ...masterClockEvents]
      .sort((left, right) => right.timestamp.getTime() - left.timestamp.getTime())
      .slice(0, 30);
  }, [clockActivity, executions, workflows]);

  const activeWorkflow = useMemo(() => {
    if (!selectedWorkflowId) return null;
    return workflows.find((workflow) => workflow.id === selectedWorkflowId) ?? currentWorkflow;
  }, [currentWorkflow, selectedWorkflowId, workflows]);

  const selectedWorkflowBuilderPath = useMemo(() => {
    return selectedWorkflowId
      ? `/workflows/builder?id=${encodeURIComponent(selectedWorkflowId)}`
      : '/workflows/builder';
  }, [selectedWorkflowId]);

  const selectedWorkflowDetailPath = useMemo(() => {
    return selectedWorkflowId ? `/workflows/${selectedWorkflowId}` : '/workflows';
  }, [selectedWorkflowId]);

  const selectedWorkflowExecutionPath = useMemo(() => {
    return selectedWorkflowId
      ? `/workflows/${selectedWorkflowId}/execution`
      : '/workflows/executions';
  }, [selectedWorkflowId]);

  const openWorkflowSurface = useCallback(
    (path: string) => {
      navigate(path);
    },
    [navigate]
  );

  const handleLayerChange = useCallback(
    (layer: NexusLayer) => {
      setActiveLayer(layer);
      updateNexusUrl(layer, selectedWorkflowId);
    },
    [selectedWorkflowId, updateNexusUrl]
  );

  const handleWorkflowSelection = useCallback(
    (workflowId: string) => {
      const selected = workflows.find((workflow) => workflow.id === workflowId);
      if (!selected) return;
      hydrateForgeFromWorkflow(selected);
    },
    [hydrateForgeFromWorkflow, workflows]
  );

  const ensureWorkflowForForge = useCallback(async (): Promise<Workflow> => {
    const existing =
      workflows.find((workflow) => workflow.id === selectedWorkflowId) ?? currentWorkflow;
    if (existing) {
      return existing;
    }

    setIsCreatingWorkflow(true);
    try {
      const seedName = workflowName.trim() || DEFAULT_WORKFLOW_NAME;
      const created = await createWorkflow(seedName, 'Created from Synaptic Nexus Forge');
      const updated = await saveWorkflow({
        ...created,
        name: seedName,
        nodes: forgeGraph.nodes,
        edges: forgeGraph.edges,
        status: created.status || 'draft',
        version: created.version || 1,
        createdBy: created.createdBy || 'current-user',
        tags: created.tags || [],
        triggers: created.triggers || [],
        variables: created.variables || {},
      });
      hydrateForgeFromWorkflow(updated);
      await loadWorkflows();
      setForgeStatusMessage(`Created workflow ${updated.name}.`);
      return updated;
    } finally {
      setIsCreatingWorkflow(false);
    }
  }, [
    createWorkflow,
    currentWorkflow,
    forgeGraph.edges,
    forgeGraph.nodes,
    hydrateForgeFromWorkflow,
    loadWorkflows,
    saveWorkflow,
    selectedWorkflowId,
    workflowName,
    workflows,
  ]);

  const handleSaveWorkflow = useCallback(async () => {
    setIsSaving(true);
    setForgeStatusMessage(null);
    try {
      const base = await ensureWorkflowForForge();
      const nameToSave = workflowName.trim() || DEFAULT_WORKFLOW_NAME;
      const updated = await saveWorkflow({
        ...base,
        name: nameToSave,
        nodes: forgeGraph.nodes,
        edges: forgeGraph.edges,
        status: base.status || 'draft',
        version: base.version || 1,
        createdBy: base.createdBy || 'current-user',
        tags: base.tags || [],
        triggers: base.triggers || [],
        variables: base.variables || {},
      });

      hydrateForgeFromWorkflow(updated);
      await loadWorkflows();
      setForgeStatusMessage(`Saved ${updated.name}.`);
    } catch (error) {
      setForgeStatusMessage(
        error instanceof Error ? `Save failed: ${error.message}` : 'Save failed unexpectedly.'
      );
    } finally {
      setIsSaving(false);
    }
  }, [
    ensureWorkflowForForge,
    forgeGraph.edges,
    forgeGraph.nodes,
    hydrateForgeFromWorkflow,
    loadWorkflows,
    saveWorkflow,
    workflowName,
  ]);

  const handleExecuteWorkflow = useCallback(async () => {
    if (forgeGraph.nodes.length === 0) {
      setForgeStatusMessage('Execution blocked: add at least one node to the workflow graph.');
      return;
    }

    setIsExecuting(true);
    setForgeStatusMessage(null);
    try {
      if (activeWorkflow?.id) {
        await workflowService.executeWorkflow(
          activeWorkflow.id,
          { source: 'synaptic-nexus' },
          forgeGraph
        );
        setForgeStatusMessage(`Execution started for ${activeWorkflow.name}.`);
      } else {
        await workflowService.executeWorkflow(undefined, { source: 'synaptic-nexus' }, forgeGraph);
        setForgeStatusMessage('Execution started for dynamic graph definition.');
      }

      await loadExecutions(activeWorkflow?.id);
    } catch (error) {
      setForgeStatusMessage(
        error instanceof Error
          ? `Execution failed: ${error.message}`
          : 'Execution failed unexpectedly.'
      );
    } finally {
      setIsExecuting(false);
    }
  }, [activeWorkflow, forgeGraph, loadExecutions]);

  const handlePublishActiveWorkflow = useCallback(async () => {
    if (!activeWorkflow?.id) {
      setForgeStatusMessage('Publish unavailable: save this workflow first.');
      return;
    }

    if (activeWorkflow.status?.toLowerCase() === 'active') {
      setForgeStatusMessage(`${activeWorkflow.name} is already published.`);
      return;
    }

    setIsPublishingWorkflow(true);
    setForgeStatusMessage(null);
    try {
      const published = await publishWorkflow(activeWorkflow.id);
      hydrateForgeFromWorkflow(published);
      await loadWorkflows();
      setForgeStatusMessage(`Published ${published.name}.`);
    } catch (error) {
      setForgeStatusMessage(
        error instanceof Error ? `Publish failed: ${error.message}` : 'Publish failed unexpectedly.'
      );
    } finally {
      setIsPublishingWorkflow(false);
    }
  }, [activeWorkflow, hydrateForgeFromWorkflow, loadWorkflows, publishWorkflow]);

  const handleGraphChange = useCallback((graph: { nodes: Node[]; edges: Edge[] }) => {
    const nextGraph = sanitizeGraph(graph.nodes, graph.edges);
    setForgeGraph(nextGraph);
  }, []);

  const resolveWebhookTriggerId = useCallback((workflow: Workflow): string | undefined => {
    if (!Array.isArray(workflow.triggers)) return undefined;
    const webhookTrigger = workflow.triggers.find(
      (trigger: any) => String(trigger?.type || '').toLowerCase() === 'webhook'
    );
    if (!webhookTrigger) return undefined;
    return webhookTrigger.id || webhookTrigger.name || webhookTrigger.slug || webhookTrigger.key;
  }, []);

  const getWebhookUrl = useCallback(
    (workflow: Workflow) => {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const triggerId = resolveWebhookTriggerId(workflow);
      return triggerId
        ? `${origin}/api/workflows/${workflow.id}/webhook/${triggerId}`
        : `${origin}/api/workflows/${workflow.id}/webhook`;
    },
    [resolveWebhookTriggerId]
  );

  const handleCopyWebhookUrl = useCallback(async () => {
    if (!activeWorkflow?.id) {
      setForgeStatusMessage('Webhook unavailable: save this workflow first.');
      return;
    }
    const webhookUrl = getWebhookUrl(activeWorkflow);
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setForgeStatusMessage(`Webhook URL copied for ${activeWorkflow.name}.`);
    } catch {
      setForgeStatusMessage('Failed to copy webhook URL.');
    }
  }, [activeWorkflow, getWebhookUrl]);

  const handleTestWebhook = useCallback(async () => {
    if (!activeWorkflow?.id) {
      setForgeStatusMessage('Webhook unavailable: save this workflow first.');
      return;
    }
    try {
      const triggerId = resolveWebhookTriggerId(activeWorkflow);
      await executeWorkflowViaWebhook(
        activeWorkflow.id,
        {
          event: 'nexus-webhook-test',
          source: 'synaptic-nexus',
          workflowId: activeWorkflow.id,
          timestamp: new Date().toISOString(),
        },
        {
          triggerId,
          source: 'synaptic-nexus',
        }
      );
      await loadExecutions(activeWorkflow.id);
      setForgeStatusMessage(`Webhook accepted for ${activeWorkflow.name}.`);
    } catch (error) {
      setForgeStatusMessage(
        error instanceof Error ? `Webhook test failed: ${error.message}` : 'Webhook test failed.'
      );
    }
  }, [activeWorkflow, executeWorkflowViaWebhook, loadExecutions, resolveWebhookTriggerId]);

  const activeLayerMeta = useMemo(
    () => LAYERS.find((layer) => layer.id === activeLayer) ?? LAYERS[0],
    [activeLayer]
  );

  return (
    <div className="dark min-h-screen bg-[#020617] text-slate-100 flex flex-col relative overflow-hidden selection:bg-amber-400/25">
      <div className="absolute -top-28 -left-24 h-96 w-96 rounded-full bg-sky-500/20 blur-3xl pointer-events-none" />
      <div className="absolute top-1/4 -right-24 h-[28rem] w-[28rem] rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-36 left-1/3 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <header className="sticky top-0 relative z-30 border-b border-white/10 bg-gradient-to-r from-slate-950/90 via-slate-900/85 to-slate-950/90 backdrop-blur-2xl px-4 md:px-6 py-4 shadow-[0_8px_30px_rgba(2,6,23,0.45)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-400/20 via-amber-500/10 to-sky-500/10 border border-amber-300/30 shadow-[0_0_28px_rgba(245,158,11,0.24)]">
              <Network className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
                Synaptic Nexus
              </h1>
              <p className="text-[11px] font-black text-slate-200 uppercase tracking-[0.28em] flex items-center gap-2">
                <Activity className="w-3 h-3 text-emerald-500" />
                Live Kernel Hive & Active Workflow Forge
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge className="border-sky-400/25 bg-sky-500/15 text-sky-100 text-[9px] font-black uppercase tracking-widest">
                  Layer: {activeLayerMeta.label}
                </Badge>
                <Badge className="border-amber-300/25 bg-amber-500/15 text-amber-100 text-[9px] font-black uppercase tracking-widest">
                  Workflows: {workflows.length}
                </Badge>
                <Badge className="border-emerald-300/25 bg-emerald-500/15 text-emerald-100 text-[9px] font-black uppercase tracking-widest">
                  Live Events: {activityEvents.length}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-black/35 p-2 rounded-2xl border border-white/10 shadow-inner shadow-black/30 overflow-x-auto">
            {LAYERS.map((layer) => (
              <button
                key={layer.id}
                onClick={() => handleLayerChange(layer.id)}
                aria-label={`Switch to ${layer.label} layer`}
                title={layer.label}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 whitespace-nowrap ${
                  activeLayer === layer.id
                    ? 'bg-gradient-to-r from-amber-300 to-amber-500 text-slate-950 shadow-[0_10px_24px_rgba(245,158,11,0.3)]'
                    : 'text-slate-200 hover:text-white hover:bg-white/10 hover:-translate-y-0.5'
                }`}
              >
                <layer.icon className="w-3.5 h-3.5" />
                <span>{layer.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <section className="relative z-20 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl px-4 md:px-6 py-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.26em] text-slate-200">
              Workflow Surfaces
            </p>
            <p className="text-[11px] text-slate-300">
              Nexus stays linked to every builder, template, and runtime console.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PremiumButton
              size="sm"
              variant="outline"
              className="h-8 border-slate-700 text-slate-100 bg-slate-900/60"
              onClick={() => openWorkflowSurface('/workflows')}
            >
              <Activity className="w-3.5 h-3.5 mr-1.5" />
              Ops
            </PremiumButton>
            <PremiumButton
              size="sm"
              variant="outline"
              className="h-8 border-slate-700 text-slate-100 bg-slate-900/60"
              onClick={() => openWorkflowSurface(selectedWorkflowBuilderPath)}
            >
              <Wand2 className="w-3.5 h-3.5 mr-1.5" />
              Builder
            </PremiumButton>
            <PremiumButton
              size="sm"
              variant="outline"
              className="h-8 border-slate-700 text-slate-100 bg-slate-900/60"
              onClick={() => openWorkflowSurface('/workflows/builder-enhanced')}
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Enhanced
            </PremiumButton>
            <PremiumButton
              size="sm"
              variant="outline"
              className="h-8 border-slate-700 text-slate-100 bg-slate-900/60"
              onClick={() => openWorkflowSurface('/workflows/builder-n8n')}
            >
              <Network className="w-3.5 h-3.5 mr-1.5" />
              N8N
            </PremiumButton>
            <PremiumButton
              size="sm"
              variant="outline"
              className="h-8 border-slate-700 text-slate-100 bg-slate-900/60"
              onClick={() => openWorkflowSurface('/workflows/templates')}
            >
              <BookOpen className="w-3.5 h-3.5 mr-1.5" />
              Templates
            </PremiumButton>
            <PremiumButton
              size="sm"
              variant="outline"
              className="h-8 border-slate-700 text-slate-100 bg-slate-900/60"
              onClick={() => openWorkflowSurface(selectedWorkflowExecutionPath)}
            >
              <Play className="w-3.5 h-3.5 mr-1.5" />
              Execution
            </PremiumButton>
            <PremiumButton
              size="sm"
              variant="outline"
              className="h-8 border-slate-700 text-slate-100 bg-slate-900/60"
              onClick={() => openWorkflowSurface('/workflows/console')}
            >
              <Cpu className="w-3.5 h-3.5 mr-1.5" />
              Console
            </PremiumButton>
          </div>
        </div>
      </section>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative z-10">
        <main className="flex-1 flex flex-col min-w-0">
          {activeLayer === 'forge' ? (
            <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-500">
              <div className="min-h-14 border-b border-white/10 bg-gradient-to-r from-slate-900/80 via-slate-900/75 to-slate-950/70 backdrop-blur-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center flex-wrap gap-3 min-w-0 rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
                  <label
                    htmlFor="nexus-workflow-select"
                    className="text-[11px] font-black uppercase tracking-widest text-slate-200"
                  >
                    Workflow
                  </label>
                  <select
                    id="nexus-workflow-select"
                    aria-label="Select workflow"
                    value={selectedWorkflowId || ''}
                    onChange={(event) => handleWorkflowSelection(event.target.value)}
                    className="h-9 min-w-44 max-w-64 bg-slate-950/70 border border-white/10 rounded-md px-2 text-xs font-semibold text-slate-100"
                  >
                    <option value="" disabled>
                      {workflows.length > 0 ? 'Select workflow' : 'No workflow found'}
                    </option>
                    {workflows.map((workflow) => (
                      <option key={workflow.id} value={workflow.id}>
                        {workflow.name}
                      </option>
                    ))}
                  </select>

                  <PremiumInput
                    value={workflowName}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      setWorkflowName(event.target.value)
                    }
                    aria-label="Workflow name"
                    className="h-9 bg-slate-950/60 border border-white/10 text-sm font-bold text-white focus:ring-0 w-52 placeholder:text-slate-400"
                    placeholder="Name this synapse..."
                  />

                  <button
                    onClick={() => setShowAiPanel(!showAiPanel)}
                    aria-label="Toggle AI Architect panel"
                    aria-pressed={showAiPanel}
                    title="Toggle AI Architect panel"
                    className={`flex items-center gap-2 text-[10px] font-black uppercase px-3 py-1.5 rounded-xl border transition-all duration-200 ${showAiPanel ? 'bg-sky-400 text-slate-950 border-sky-300 shadow-[0_8px_20px_rgba(56,189,248,0.3)]' : 'text-sky-300 border-sky-300/25 hover:bg-sky-500/15 hover:-translate-y-0.5'}`}
                  >
                    <Sparkles className="w-3.5 h-3.5" /> AI Architect
                  </button>
                </div>

                <div className="flex items-center flex-wrap gap-2 shrink-0 rounded-2xl border border-white/10 bg-black/20 px-2 py-2">
                  <PremiumButton
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      void loadNexusData();
                    }}
                    className="border-slate-700 text-slate-100 h-9 bg-slate-900/60 hover:bg-slate-800/80"
                    title="Refresh live data"
                  >
                    <RefreshCcw className="w-3.5 h-3.5 mr-2" />
                    Refresh
                  </PremiumButton>
                  <PremiumButton
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      void handleSaveWorkflow();
                    }}
                    disabled={isSaving || isCreatingWorkflow}
                    className="border-slate-700 text-slate-100 h-9 bg-slate-900/60 hover:bg-slate-800/80"
                  >
                    {isSaving ? (
                      <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5 mr-2" />
                    )}
                    Save
                  </PremiumButton>
                  <PremiumButton
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      void handlePublishActiveWorkflow();
                    }}
                    disabled={
                      isPublishingWorkflow ||
                      isCreatingWorkflow ||
                      !activeWorkflow?.id ||
                      activeWorkflow.status?.toLowerCase() === 'active'
                    }
                    className="border-slate-700 text-slate-100 h-9 bg-slate-900/60 hover:bg-slate-800/80"
                  >
                    {isPublishingWorkflow ? (
                      <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                    ) : (
                      <Zap className="w-3.5 h-3.5 mr-2" />
                    )}
                    Publish
                  </PremiumButton>
                  <PremiumButton
                    variant="gradient"
                    size="sm"
                    onClick={() => {
                      void handleExecuteWorkflow();
                    }}
                    disabled={isExecuting}
                    className="bg-gradient-to-r from-amber-300 to-amber-500 text-slate-950 h-9 shadow-[0_8px_22px_rgba(245,158,11,0.32)]"
                  >
                    {isExecuting ? (
                      <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5 mr-2" />
                    )}
                    Execute
                  </PremiumButton>
                  <PremiumButton
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      void handleCopyWebhookUrl();
                    }}
                    className="border-slate-700 text-slate-100 h-9 bg-slate-900/60 hover:bg-slate-800/80"
                    disabled={!activeWorkflow?.id}
                  >
                    <Link2 className="w-3.5 h-3.5 mr-2" />
                    Copy Hook
                  </PremiumButton>
                  <PremiumButton
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      void handleTestWebhook();
                    }}
                    className="border-slate-700 text-slate-100 h-9 bg-slate-900/60 hover:bg-slate-800/80"
                    disabled={!activeWorkflow?.id}
                  >
                    <Play className="w-3.5 h-3.5 mr-2" />
                    Test Hook
                  </PremiumButton>
                </div>
              </div>

              {forgeStatusMessage && (
                <div className="px-4 py-2 border-b border-white/10 bg-amber-500/10 text-[11px] font-semibold text-amber-100">
                  {forgeStatusMessage}
                </div>
              )}

              <ReactFlowProvider>
                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
                  <div className="w-full lg:w-72 border-b lg:border-b-0 lg:border-r border-white/10 bg-gradient-to-b from-slate-950/65 to-slate-900/45 p-4 overflow-y-auto max-h-64 lg:max-h-none">
                    <h3 className="text-[10px] font-black text-slate-100 uppercase tracking-[0.2em] mb-4">
                      Node Components
                    </h3>
                    <NodeToolbox />
                    <div className="mt-8 pt-8 border-t border-white/5">
                      <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-4">
                        Kernel Operatives
                      </h3>
                      <div className="space-y-2 opacity-70">
                        {filteredAgents.slice(0, 8).map((agent) => (
                          <div
                            key={agent.id}
                            className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center gap-3 transition-transform duration-200 hover:-translate-y-0.5 hover:border-sky-400/30"
                          >
                            <Bot className="w-4 h-4 text-sky-300" />
                            <span className="text-[11px] font-bold truncate text-slate-300">
                              {agent.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 relative">
                    <WorkflowCanvas
                      onNodeSelect={() => {}}
                      initialNodes={forgeGraph.nodes}
                      initialEdges={forgeGraph.edges}
                      onGraphChange={handleGraphChange}
                    />
                    {showAiPanel && (
                      <div className="absolute left-2 right-2 top-2 bottom-2 md:left-auto md:right-4 md:top-4 md:bottom-4 md:w-80 z-50 animate-in slide-in-from-right-4 duration-300">
                        <GlassCard className="h-full bg-slate-900/96 border-white/10 backdrop-blur-3xl p-0 overflow-hidden shadow-[0_16px_42px_rgba(2,6,23,0.6)]">
                          <div className="p-4 border-b border-white/5 flex items-center justify-between">
                            <span className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                              <Sparkles className="w-3.5 h-3.5 text-sky-400" /> AI Architect
                            </span>
                            <button
                              onClick={() => setShowAiPanel(false)}
                              aria-label="Close AI Architect panel"
                              className="rounded-lg p-1.5 hover:bg-white/10 transition-colors"
                            >
                              <X className="w-4 h-4 text-slate-200" />
                            </button>
                          </div>
                          <div className="p-4 overflow-y-auto h-[calc(100%-56px)]">
                            <WorkflowAIAssistantPanel
                              onApplyMeta={(name?: string) => {
                                if (name) setWorkflowName(name);
                              }}
                            />
                          </div>
                        </GlassCard>
                      </div>
                    )}
                  </div>
                </div>
              </ReactFlowProvider>
            </div>
          ) : (
            <div className="flex-1 p-1 md:p-2 overflow-hidden relative">
              {activeLayer === 'topology' && (
                <div className="h-full p-4 md:p-6 animate-in fade-in duration-500 grid grid-rows-[minmax(0,1fr)_auto] gap-4 overflow-y-auto">
                  <div className="min-h-0">
                    {topologyLoading ? (
                      <div className="h-full flex items-center justify-center text-slate-300 uppercase text-xs font-black tracking-widest">
                        Synchronizing Topology...
                      </div>
                    ) : topologyGraph.nodes.length > 0 ? (
                      <div className="h-full rounded-2xl overflow-hidden border border-white/10 bg-slate-950/45 shadow-[0_12px_30px_rgba(2,6,23,0.4)]">
                        <GraphVisualizer nodes={topologyGraph.nodes} edges={topologyGraph.edges} />
                      </div>
                    ) : (
                      <div className="h-full rounded-2xl border border-white/10 bg-slate-950/50 flex items-center justify-center text-sm text-slate-300">
                        {topologyError ?? 'No topology data available right now.'}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                    <GlassCard className="p-4 border-white/10 bg-black/25 space-y-3">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-200">
                        Endpoint Sources
                      </h3>
                      <SourceLine label="Agents" value={dataSources.orchestratorAgents} />
                      <SourceLine label="Orchestrator" value={dataSources.orchestratorHealth} />
                      <SourceLine label="System Health" value={dataSources.systemHealth} />
                      <SourceLine label="System Metrics" value={dataSources.systemMetrics} />
                      <SourceLine label="Agent Index" value={dataSources.agentIndex} />
                      <SourceLine label="Graph Artifacts" value={dataSources.graphArtifacts} />
                    </GlassCard>

                    <GlassCard className="p-4 border-white/10 bg-black/25 space-y-3 xl:col-span-2">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-200">
                          Graph Artifact Datasets
                        </h3>
                        <span className="text-[10px] font-mono text-slate-300">
                          {graphArtifactDatasets.length} datasets
                        </span>
                      </div>

                      {graphArtifactsLoading ? (
                        <p className="text-[11px] text-slate-300 italic">
                          Scanning published graph bundles...
                        </p>
                      ) : graphArtifactDatasets.length === 0 ? (
                        <p className="text-[11px] text-slate-300 italic">
                          {graphArtifactsError || 'No graph datasets available.'}
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                          {graphArtifactDatasets.slice(0, 12).map((dataset) => {
                            const artifactUrl = normalizeAssetPath(dataset.graph?.file);
                            return (
                              <div
                                key={dataset.id}
                                className="rounded-lg border border-white/10 bg-slate-900/50 px-3 py-2"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="text-xs font-black text-white uppercase truncate">
                                      {dataset.title || dataset.id}
                                    </p>
                                    <p className="text-[10px] text-slate-300 font-mono truncate">
                                      {artifactUrl || 'No graph file'}
                                    </p>
                                  </div>
                                  <PremiumButton
                                    variant="outline"
                                    size="sm"
                                    disabled={!artifactUrl}
                                    onClick={() => openArtifactPreview(dataset)}
                                    className="h-7 text-[10px] border-slate-700 text-slate-100 bg-slate-900/60"
                                  >
                                    Preview
                                  </PremiumButton>
                                </div>
                                <div className="mt-1 text-[10px] text-slate-300">
                                  {(dataset.graph?.nodes ?? 0).toLocaleString()} nodes •{' '}
                                  {(dataset.graph?.edges ?? 0).toLocaleString()} edges
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {graphArtifactsError && (
                        <div className="rounded border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[10px] text-amber-200">
                          {graphArtifactsError}
                        </div>
                      )}
                    </GlassCard>
                  </div>
                </div>
              )}

              {activeLayer === 'semantic' && (
                <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 p-4 md:p-6 animate-in fade-in duration-500">
                  <div className="lg:col-span-2">
                    <div className="h-full rounded-2xl overflow-hidden border border-white/10 bg-slate-950/45 shadow-[0_12px_30px_rgba(2,6,23,0.4)]">
                      <GraphVisualizer
                        nodes={semanticGraph.nodes}
                        edges={semanticGraph.edges}
                        onNodeClick={(_, node: any) => {
                          if (node?.data?.kind === 'agent' && typeof node?.id === 'string') {
                            const id = node.id.replace(/^agent:/, '');
                            setSelectedAgentId(id);
                          }
                        }}
                      />
                    </div>
                  </div>
                  <GlassCard className="p-5 border-white/10 bg-gradient-to-b from-slate-900/70 to-slate-950/60 h-full overflow-y-auto shadow-[0_12px_30px_rgba(2,6,23,0.4)]">
                    <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest mb-4">
                      Agent Semantic Map
                    </h3>
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-300" />
                      <PremiumInput
                        value={agentSearch}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                          setAgentSearch(event.target.value)
                        }
                        aria-label="Filter agents"
                        placeholder="Filter entities..."
                        className="pl-9 h-10 bg-slate-950/50"
                      />
                    </div>

                    {agentIndexError && (
                      <div className="mb-3 p-2 rounded border border-amber-500/30 bg-amber-500/10 text-[11px] text-amber-200">
                        {agentIndexError}
                      </div>
                    )}

                    <div className="space-y-2">
                      {agentIndexLoading ? (
                        <p className="text-[10px] text-slate-300 font-bold uppercase text-center py-10 italic">
                          Querying index...
                        </p>
                      ) : agentsByCategory.length === 0 ? (
                        <p className="text-[10px] text-slate-300 font-bold uppercase text-center py-10 italic">
                          No agents matched your query.
                        </p>
                      ) : (
                        agentsByCategory.map(([category, categoryAgents]) => (
                          <details
                            key={category}
                            className="rounded-xl border border-white/10 bg-black/25"
                          >
                            <summary className="cursor-pointer px-3 py-2 text-[11px] font-black text-slate-200 uppercase tracking-widest flex items-center justify-between [&::-webkit-details-marker]:hidden">
                              <span>{category}</span>
                              <span className="text-slate-300">{categoryAgents.length}</span>
                            </summary>
                            <div className="px-2 pb-2 space-y-1">
                              {categoryAgents.slice(0, 50).map((agent) => (
                                <button
                                  key={agent.id}
                                  onClick={() => setSelectedAgentId(agent.id)}
                                  className={`w-full text-left p-2 rounded-lg border transition-all duration-200 ${selectedAgentId === agent.id ? 'border-amber-400/60 bg-amber-500/12 shadow-[0_8px_18px_rgba(245,158,11,0.22)]' : 'border-white/10 bg-white/5 hover:bg-white/10 hover:-translate-y-0.5'}`}
                                >
                                  <div className="text-xs font-bold text-white uppercase truncate">
                                    {agent.name}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </details>
                        ))
                      )}
                    </div>
                  </GlassCard>
                </div>
              )}

              {activeLayer === 'memory' && (
                <div className="h-full p-4 md:p-6 animate-in fade-in duration-500 relative">
                  <div className="absolute inset-0 z-0">
                    {memoryLoading ? (
                      <div className="h-full flex items-center justify-center text-slate-300 text-sm font-semibold">
                        Loading sovereign memory clusters...
                      </div>
                    ) : memoryClusters.length > 0 ? (
                      <MemoryVisualizer clusters={memoryClusters} />
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-300 text-sm font-semibold">
                        No memory clusters available.
                      </div>
                    )}
                  </div>

                  <div className="mt-4 md:mt-0 md:absolute md:top-8 md:right-8 z-10 w-full md:w-80 space-y-4 px-0 md:px-0">
                    <GlassCard className="p-6 border-white/10 bg-gradient-to-b from-slate-900/85 to-slate-950/80 backdrop-blur-xl shadow-[0_14px_34px_rgba(2,6,23,0.5)]">
                      <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-4">
                        <Shield className="w-4 h-4 text-emerald-400" /> Sovereign Memory
                      </h3>

                      {memoryError && (
                        <div className="mb-4 p-3 rounded border border-amber-500/30 bg-amber-500/10 text-[11px] text-amber-200">
                          {memoryError}
                        </div>
                      )}

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-slate-300 uppercase">
                            Private Index
                          </span>
                          <Badge
                            className={`${memoryIndices.some((index) => index.status === 'ready') ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-300 border-white/5'} text-[8px]`}
                          >
                            {memoryIndices.some((index) => index.status === 'ready')
                              ? 'ENABLED'
                              : 'UNAVAILABLE'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-slate-300 uppercase">
                            Shared Pool
                          </span>
                          <Badge className="bg-slate-800 text-slate-300 border-white/5 text-[8px]">
                            DISABLED
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-slate-300 uppercase">
                            Auto-Pruning
                          </span>
                          <Badge
                            className={`${memoryClusters.length > 0 ? 'bg-amber-500/20 text-amber-400 border-amber-500/20' : 'bg-slate-800 text-slate-300 border-white/5'} text-[8px]`}
                          >
                            {memoryClusters.length > 0 ? 'STBY' : 'IDLE'}
                          </Badge>
                        </div>
                      </div>

                      <div className="mt-5 space-y-2 max-h-36 overflow-y-auto">
                        {memoryIndices.length > 0 ? (
                          memoryIndices.map((index) => (
                            <div
                              key={index.id}
                              className="p-2 rounded border border-white/10 bg-black/20 text-[10px]"
                            >
                              <div className="font-black text-slate-100 uppercase">
                                {index.name}
                              </div>
                              <div className="text-slate-400 mt-1">
                                {index.vectorsCount.toLocaleString()} vectors • {index.dimension}d •{' '}
                                {index.metric}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-[10px] text-slate-300 italic">
                            No index metadata available.
                          </div>
                        )}
                      </div>
                    </GlassCard>
                  </div>
                </div>
              )}

              {activeLayer === 'lexicon' && (
                <div className="h-full p-4 md:p-6">
                  <div className="h-full rounded-2xl overflow-hidden border border-white/10 bg-slate-950/45 shadow-[0_12px_30px_rgba(2,6,23,0.4)]">
                    <iframe
                      src={CONCORDANCE_HTML}
                      title="Lexicon"
                      className="w-full h-full border-none opacity-90"
                    />
                  </div>
                </div>
              )}

              {activeLayer === 'activity' && (
                <div className="h-full space-y-4 p-4 md:p-6 overflow-y-auto max-w-5xl mx-auto">
                  {(clockLoading || executions.length === 0) && activityEvents.length === 0 ? (
                    <div className="text-center text-slate-300 text-sm py-12">
                      {clockLoading
                        ? 'Loading activity stream...'
                        : 'No recent activity available.'}
                    </div>
                  ) : (
                    activityEvents.map((event) => (
                      <GlassCard
                        key={event.id}
                        className="p-5 border-white/10 bg-gradient-to-r from-slate-900/55 to-slate-950/45 flex items-center justify-between gap-3 transition-transform duration-200 hover:-translate-y-0.5 shadow-[0_10px_22px_rgba(2,6,23,0.38)]"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div
                            className={`w-2 h-2 rounded-full ${event.source === 'workflow' ? 'bg-sky-500' : 'bg-emerald-500'}`}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-black text-white uppercase truncate">
                              {event.label}
                            </p>
                            <p className="text-[10px] text-slate-300 uppercase tracking-widest mt-1">
                              {event.source === 'workflow' ? 'workflow-execution' : 'master-clock'}{' '}
                              • {formatTimestamp(event.timestamp)}
                            </p>
                          </div>
                        </div>
                        <Badge
                          className={`${pickStatusTone(event.status)} border text-[9px] font-black uppercase tracking-widest px-2`}
                        >
                          {event.status}
                        </Badge>
                      </GlassCard>
                    ))
                  )}

                  {clockError && (
                    <GlassCard className="p-3 border border-amber-500/30 bg-amber-500/10 text-[11px] text-amber-200">
                      {clockError}
                    </GlassCard>
                  )}
                </div>
              )}

              {activeLayer === 'metrics' && (
                <div className="h-full grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 p-4 md:p-10 max-w-5xl mx-auto items-center">
                  <MetricsCard
                    title="Latency"
                    value={
                      metrics.networkLatencyMs !== null ? `${metrics.networkLatencyMs}ms` : 'N/A'
                    }
                    progress={
                      metrics.networkLatencyMs !== null
                        ? Math.max(0, 100 - Math.min(metrics.networkLatencyMs, 100))
                        : 0
                    }
                    tone="sky"
                  />
                  <MetricsCard
                    title="Throughput"
                    value={metrics.throughput !== null ? `${metrics.throughput}` : 'N/A'}
                    progress={metrics.throughput !== null ? Math.min(100, metrics.throughput) : 0}
                    tone="amber"
                  />
                  <MetricsCard
                    title="Memory Usage"
                    value={
                      metrics.memoryUsagePercent !== null ? `${metrics.memoryUsagePercent}%` : 'N/A'
                    }
                    progress={metrics.memoryUsagePercent ?? 0}
                    tone="emerald"
                  />
                  <MetricsCard
                    title="Active Agent Rate"
                    value={
                      metrics.activeAgentRatePercent !== null
                        ? `${metrics.activeAgentRatePercent}%`
                        : 'N/A'
                    }
                    progress={metrics.activeAgentRatePercent ?? 0}
                    tone="indigo"
                  />
                </div>
              )}
            </div>
          )}
        </main>

        <aside className="w-full md:w-80 border-t md:border-t-0 md:border-l border-white/10 bg-gradient-to-b from-slate-950/65 to-slate-900/40 backdrop-blur-xl flex flex-col max-h-[40vh] md:max-h-none">
          <div className="p-6 space-y-8 overflow-y-auto">
            <h2 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
              Hardware Telemetry
            </h2>
            <GlassCard className="p-5 border-white/10 bg-black/25 space-y-6 shadow-[0_10px_24px_rgba(2,6,23,0.35)]">
              <SidebarStat
                label="Active Nodes"
                value={String(metrics.activeNodes ?? '--')}
                icon={<Cpu className="w-4 h-4 text-blue-400" />}
              />
              <SidebarStat
                label="Avg Latency"
                value={metrics.networkLatencyMs !== null ? `${metrics.networkLatencyMs}ms` : '--'}
                icon={<Clock className="w-4 h-4 text-sky-400" />}
              />
              <SidebarStat
                label="Throughput"
                value={metrics.throughput !== null ? String(metrics.throughput) : '--'}
                icon={<Zap className="w-4 h-4 text-amber-400" />}
              />
              <SidebarStat
                label="Memory"
                value={
                  metrics.memoryUsagePercent !== null ? `${metrics.memoryUsagePercent}%` : '--'
                }
                icon={<Database className="w-4 h-4 text-emerald-400" />}
              />
            </GlassCard>

            {activeWorkflow && (
              <GlassCard className="p-5 border-amber-400/20 bg-amber-500/10 space-y-4 shadow-[0_12px_28px_rgba(245,158,11,0.2)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-amber-200 uppercase tracking-[0.24em]">
                      Active Workflow
                    </p>
                    <p className="text-sm font-black text-white uppercase truncate mt-1">
                      {activeWorkflow.name}
                    </p>
                  </div>
                  <Badge className="bg-black/35 border-amber-300/35 text-amber-100 text-[9px] font-black uppercase tracking-widest">
                    {activeWorkflow.status}
                  </Badge>
                </div>

                {activeWorkflow.description && (
                  <p className="text-[11px] text-slate-200 leading-relaxed italic">
                    {activeWorkflow.description}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="rounded-lg border border-white/10 bg-black/25 px-2 py-1.5 text-slate-200">
                    Nodes: {activeWorkflow.nodes?.length ?? 0}
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/25 px-2 py-1.5 text-slate-200">
                    Edges: {activeWorkflow.edges?.length ?? 0}
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/25 px-2 py-1.5 text-slate-200">
                    Triggers:{' '}
                    {Array.isArray(activeWorkflow.triggers) ? activeWorkflow.triggers.length : 0}
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/25 px-2 py-1.5 text-slate-200">
                    Variables:{' '}
                    {activeWorkflow.variables ? Object.keys(activeWorkflow.variables).length : 0}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <PremiumButton
                    size="sm"
                    variant="outline"
                    className="h-8 border-slate-700 text-slate-100 bg-slate-900/60"
                    onClick={() => openWorkflowSurface(selectedWorkflowBuilderPath)}
                  >
                    <Wand2 className="w-3.5 h-3.5 mr-1.5" />
                    Builder
                  </PremiumButton>
                  <PremiumButton
                    size="sm"
                    variant="outline"
                    className="h-8 border-slate-700 text-slate-100 bg-slate-900/60"
                    onClick={() => openWorkflowSurface(selectedWorkflowDetailPath)}
                  >
                    <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                    Detail
                  </PremiumButton>
                  <PremiumButton
                    size="sm"
                    variant="outline"
                    className="h-8 border-slate-700 text-slate-100 bg-slate-900/60"
                    onClick={() => {
                      void handlePublishActiveWorkflow();
                    }}
                    disabled={
                      isPublishingWorkflow || activeWorkflow.status?.toLowerCase() === 'active'
                    }
                  >
                    {isPublishingWorkflow ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Zap className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    Publish
                  </PremiumButton>
                </div>
              </GlassCard>
            )}

            {selectedAgent && (
              <GlassCard className="p-5 border-sky-400/20 bg-sky-500/10 space-y-4 animate-in slide-in-from-right-4 shadow-[0_12px_28px_rgba(2,132,199,0.22)]">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-sky-400/15 border border-sky-300/20">
                    <Brain className="w-5 h-5 text-sky-200" />
                  </div>
                  <p className="text-sm font-black text-white uppercase truncate">
                    {selectedAgent.name}
                  </p>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed italic">
                  {selectedAgent.description || 'Synchronized operative link.'}
                </p>
                {(selectedAgent.tools ?? []).length > 0 && (
                  <div className="space-y-1">
                    {(selectedAgent.tools ?? []).slice(0, 6).map((tool) => (
                      <div
                        key={tool}
                        className="text-[10px] px-2 py-1 rounded border border-white/10 bg-black/20 text-slate-300"
                      >
                        {tool}
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            )}
          </div>
          <div className="p-6 mt-auto border-t border-white/5 bg-black/40">
            <div className="flex items-center gap-3 text-[10px] font-black text-slate-300 uppercase tracking-widest">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/50" /> Secure Link:{' '}
              {metrics.securityStatus === 'healthy'
                ? 'ESTABLISHED'
                : metrics.securityStatus === 'degraded'
                  ? 'DEGRADED'
                  : 'UNKNOWN'}
            </div>
          </div>
        </aside>
      </div>

      {selectedArtifactGraphUrl && (
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm p-4 md:p-8">
          <div className="h-full rounded-2xl border border-white/10 bg-slate-950 shadow-[0_24px_64px_rgba(2,6,23,0.7)] overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-3 bg-slate-900/70">
              <div className="min-w-0">
                <h3 className="text-sm font-black uppercase tracking-widest text-white truncate">
                  Artifact Preview
                </h3>
                <p className="text-[10px] text-slate-300 font-mono truncate">
                  {selectedArtifactTitle || selectedArtifactGraphUrl}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedArtifactGraphUrl(null);
                  setSelectedArtifactTitle(null);
                }}
                aria-label="Close artifact preview"
                className="rounded-md p-2 text-slate-200 hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 min-h-0 p-2">
              <ArtifactGraphViewer
                artifactUrl={selectedArtifactGraphUrl}
                title={selectedArtifactTitle || 'Graph Artifact'}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SidebarStat: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({
  label,
  value,
  icon,
}) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-lg bg-black/55 border border-white/10 shadow-inner shadow-black/40">
        {icon}
      </div>
      <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest">
        {label}
      </span>
    </div>
    <span className="text-xs font-black text-white tracking-tighter font-mono">{value}</span>
  </div>
);

const SourceLine: React.FC<{ label: string; value: string }> = ({ label, value }) => {
  const lower = value.toLowerCase();
  const isUnavailable = lower.includes('unavailable') || value === SOURCE_UNRESOLVED;
  const isAlternate = lower.includes('(alt)');
  const tone = isUnavailable
    ? 'text-rose-200 border-rose-400/30 bg-rose-500/10'
    : isAlternate
      ? 'text-amber-100 border-amber-300/30 bg-amber-500/10'
      : 'text-emerald-100 border-emerald-300/25 bg-emerald-500/10';

  return (
    <div className={`rounded-md border px-2 py-1.5 text-[10px] font-mono ${tone}`}>
      <span className="text-slate-200">{label}:</span> {value}
    </div>
  );
};

const MetricsCard: React.FC<{
  title: string;
  value: string;
  progress: number;
  tone: 'sky' | 'amber' | 'emerald' | 'indigo';
}> = ({ title, value, progress, tone }) => {
  const color = resolveColorClasses(tone);

  return (
    <GlassCard className="p-8 bg-gradient-to-br from-slate-900/55 to-slate-950/50 border-white/10 relative overflow-hidden group shadow-[0_12px_28px_rgba(2,6,23,0.4)]">
      <div
        className={`absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity ${color.icon}`}
      >
        <Activity className="w-32 h-32" />
      </div>
      <p className="text-[11px] font-black text-slate-200 uppercase tracking-[0.3em] mb-1">
        {title}
      </p>
      <p className="text-4xl font-black text-white mb-6 tracking-tighter">{value}</p>
      <div className="h-2 w-full bg-slate-800/90 rounded-full overflow-hidden border border-white/5">
        <div
          className={`h-full ${color.bar} ${color.glow} transition-all duration-500`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </GlassCard>
  );
};

export default SynapticNexus;
