// @ts-nocheck
import { CapabilityBadge } from '@/components/ui/CapabilityBadge';
import { useFeatureCapabilities } from '@/hooks/useFeatureCapabilities';
import axios from 'axios';
import {
  Activity,
  AlertTriangle,
  Brain,
  Cpu,
  Database,
  FileText,
  Globe,
  Layers,
  Loader2,
  Maximize,
  Network,
  RefreshCcw,
  Search,
  Shield,
  Tags,
  Wrench,
  Zap,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { GlassCard } from '../components/ui/premium/GlassCard';
import { PremiumButton } from '../components/ui/premium/PremiumButton';
// MemoryVisualizer kept for future “cluster view” mode; Semantic tab now primarily uses GraphVisualizer (ReactFlow)

import { GraphVisualizerWrapper as GraphVisualizer } from '../components/wizard/graph/GraphVisualizer';

type AgentIndex = {
  generatedAt: string;
  counts: { agentDefinitions: number; overlayConfigs: number };
  agents: Array<{
    id: string;
    name: string;
    description?: string;
    tools?: string[];
    traits?: string[];
    abilities?: string[];
    overlayTools?: string[];
    template?: string;
    bodyMarkdown?: string;
    semantic?: {
      relatedConcepts?: Array<{ concept: string; score: number }>;
      definingDocs?: Array<{ path: string; score: number; snippet?: string }>;
    };
    sources: { definitionPath: string; overlayPaths?: string[] };
  }>;
};

type SemanticNode = {
  id: string;
  data: {
    label: string;
    kind: 'category' | 'agent' | 'tool' | 'trait' | 'ability' | 'concept' | 'doc';
    meta?: {
      path?: string;
      snippet?: string;
      concept?: string;
    };
  };
  position: { x: number; y: number };
  style?: Record<string, any>;
};

type SemanticEdge = {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
};

type TopologyNode = {
  id: string;
  data: { label: string };
  position: { x: number; y: number };
  type?: string;
};

type TopologyEdge = {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
};

type ObservatoryMetrics = {
  activeNodes: number | null;
  agencies: number | null;
  throughput: number | null;
  securityStatus: 'healthy' | 'degraded' | 'unknown';
  networkLatencyMs: number | null;
  memoryUsagePercent: number | null;
  activeAgentRatePercent: number | null;
};

type EndpointResolution<T = any> = {
  data: T;
  source: string;
  usedAlternate: boolean;
};

type ObservatoryDataSources = {
  orchestratorAgents: string;
  orchestratorHealth: string;
  systemHealth: string;
  systemMetrics: string;
};

const SOURCE_UNRESOLVED = 'unresolved';

function slugId(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function categorizeAgent(name: string): string {
  const n = name.toLowerCase();
  if (/(support|customer|helpdesk|ticket)/.test(n)) return 'Support';
  if (/(marketing|seo|growth|funnel|sales|ad-|ads|affiliate)/.test(n)) return 'Marketing & Growth';
  if (/(content|podcast|tiktok|youtube|social|newsletter|copy|writer)/.test(n))
    return 'Content & Media';
  if (/(devops|infra|deployment|docker|kubernetes|railway|cloud|security)/.test(n))
    return 'DevOps & Security';
  if (/(research|information|retrieval|analyst|analysis|intel|intelligence)/.test(n))
    return 'Research & Analysis';
  if (/(product|ux|ui|design)/.test(n)) return 'Product & Design';
  if (/(code|coding|typescript|backend|frontend|qa|test)/.test(n)) return 'Engineering';
  return 'General';
}

export const SystemObservatory: React.FC = () => {
  const { capabilities } = useFeatureCapabilities();
  const [activeLayer, setActiveLayer] = useState<'topology' | 'semantic' | 'metrics'>('topology');
  const [agentIndex, setAgentIndex] = useState<AgentIndex | null>(null);
  const [agentIndexLoading, setAgentIndexLoading] = useState(true);
  const [agentIndexError, setAgentIndexError] = useState<string | null>(null);
  const [agentSearch, setAgentSearch] = useState<string>('');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [selectedDocPath, setSelectedDocPath] = useState<string | null>(null);
  const [topologyGraph, setTopologyGraph] = useState<{
    nodes: TopologyNode[];
    edges: TopologyEdge[];
  }>({
    nodes: [],
    edges: [],
  });
  const [topologyLoading, setTopologyLoading] = useState(true);
  const [topologyError, setTopologyError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<ObservatoryMetrics>({
    activeNodes: null,
    agencies: null,
    throughput: null,
    securityStatus: 'unknown',
    networkLatencyMs: null,
    memoryUsagePercent: null,
    activeAgentRatePercent: null,
  });
  const [dataSources, setDataSources] = useState<ObservatoryDataSources>({
    orchestratorAgents: SOURCE_UNRESOLVED,
    orchestratorHealth: SOURCE_UNRESOLVED,
    systemHealth: SOURCE_UNRESOLVED,
    systemMetrics: SOURCE_UNRESOLVED,
  });

  const fetchFirstJson = async (
    paths: string[],
    contextLabel: string
  ): Promise<EndpointResolution | null> => {
    for (let idx = 0; idx < paths.length; idx++) {
      const path = paths[idx];
      const usedAlternate = idx > 0;
      try {
        const response = await axios.get(path, {
          validateStatus: () => true,
        });
        if (response.status < 200 || response.status >= 300) continue;
        if (usedAlternate) {
          console.warn(
            `[System Observatory] ${contextLabel} using alternate endpoint: ${paths[0]} -> ${path}`
          );
        }
        return {
          data: response.data ?? {},
          source: path,
          usedAlternate,
        };
      } catch {
        // try next endpoint alias
      }
    }
    return null;
  };

  const unwrap = (payload: any) => {
    if (!payload || typeof payload !== 'object') return {};
    if (payload.data && typeof payload.data === 'object') return payload.data;
    return payload;
  };

  const loadTopologyAndMetrics = async () => {
    setTopologyLoading(true);
    setTopologyError(null);
    try {
      const [agentsResult, orchestratorHealthResult, systemHealthResult, systemMetricsResult] =
        await Promise.all([
          fetchFirstJson(
            ['/api/orchestrator/agents', '/orchestrator/agents'],
            'orchestrator agents'
          ),
          fetchFirstJson(
            ['/api/orchestrator/health', '/orchestrator/health'],
            'orchestrator health'
          ),
          fetchFirstJson(
            ['/api/system/health', '/system/health', '/api/health', '/health'],
            'system health'
          ),
          fetchFirstJson(['/api/system/metrics', '/system/metrics'], 'system metrics'),
        ]);

      const formatSource = (result: EndpointResolution | null) =>
        result ? `${result.source}${result.usedAlternate ? ' (alt)' : ''}` : 'unavailable';
      setDataSources({
        orchestratorAgents: formatSource(agentsResult),
        orchestratorHealth: formatSource(orchestratorHealthResult),
        systemHealth: formatSource(systemHealthResult),
        systemMetrics: formatSource(systemMetricsResult),
      });

      const agentsData = unwrap(agentsResult?.data);
      const orchestratorHealth = unwrap(orchestratorHealthResult?.data);
      const systemHealth = unwrap(systemHealthResult?.data);
      const systemMetrics = unwrap(systemMetricsResult?.data);
      const agents = Array.isArray(agentsData.agents) ? agentsData.agents : [];

      const nodes: TopologyNode[] = [
        {
          id: 'orchestrator',
          data: { label: 'Orchestrator' },
          position: { x: 320, y: 40 },
          type: 'input',
        },
      ];
      const edges: TopologyEdge[] = [];

      agents.slice(0, 80).forEach((agent: any, idx: number) => {
        const status = typeof agent.status === 'string' ? agent.status : 'unknown';
        const agentId = String(agent.agentId ?? agent.id ?? `agent-${idx}`);
        const column = idx % 4;
        const row = Math.floor(idx / 4);
        nodes.push({
          id: `agent:${agentId}`,
          data: { label: `${agentId} (${status})` },
          position: { x: 40 + column * 190, y: 150 + row * 90 },
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
          agents.filter((a: any) => a?.status === 'active' || a?.status === 'online').length
      );
      const throughput =
        Number(systemMetrics?.api?.requestsPerSecond ?? systemMetrics?.requestsPerSecond ?? NaN) ||
        null;
      const memoryUsage =
        Number(systemMetrics?.memory?.usagePercent ?? systemMetrics?.memoryUsage ?? NaN) || null;
      const networkLatency =
        Number(
          systemMetrics?.api?.averageResponseTimeMs ??
            systemMetrics?.api?.avgResponseTime ??
            systemMetrics?.avgResponseTime
        ) || null;
      const healthStatus = String(systemHealth?.status ?? 'unknown').toLowerCase();

      setMetrics({
        activeNodes: agents.length,
        agencies: agentIndex
          ? new Set(agentIndex.agents.map((a) => categorizeAgent(a.name))).size
          : null,
        throughput,
        securityStatus:
          healthStatus === 'healthy' || healthStatus === 'ok'
            ? 'healthy'
            : healthStatus === 'degraded' || healthStatus === 'warning'
              ? 'degraded'
              : 'unknown',
        networkLatencyMs: networkLatency,
        memoryUsagePercent: memoryUsage,
        activeAgentRatePercent:
          totalAgents > 0 ? Math.round((activeAgents / totalAgents) * 100) : null,
      });
    } catch (error) {
      setTopologyGraph({ nodes: [], edges: [] });
      setTopologyError(
        error instanceof Error ? error.message : 'Failed to load observatory topology'
      );
      setMetrics((prev) => ({
        ...prev,
        activeNodes: null,
        throughput: null,
        networkLatencyMs: null,
        memoryUsagePercent: null,
        activeAgentRatePercent: null,
      }));
    } finally {
      setTopologyLoading(false);
    }
  };

  useEffect(() => {
    setAgentIndexLoading(true);
    setAgentIndexError(null);
    axios
      .get('/observatory/agents.index.json', { validateStatus: () => true })
      .then((response) => {
        if (response.status < 200 || response.status >= 300) {
          throw new Error(`Failed to load agent index (${response.status})`);
        }
        setAgentIndex(response.data);
      })
      .catch((error) => {
        setAgentIndex(null);
        setAgentIndexError(error instanceof Error ? error.message : 'Failed to load agent index');
      })
      .finally(() => setAgentIndexLoading(false));
  }, []);

  useEffect(() => {
    void loadTopologyAndMetrics();
  }, [agentIndex?.generatedAt]);

  const filteredAgents = useMemo(() => {
    const agents = agentIndex?.agents ?? [];
    const q = agentSearch.trim().toLowerCase();
    if (!q) return agents;
    return agents.filter((a) => {
      const hay =
        `${a.name} ${a.description ?? ''} ${(a.tools ?? []).join(' ')} ${(a.traits ?? []).join(' ')} ${(a.abilities ?? []).join(' ')}`.toLowerCase();
      return hay.includes(q);
    });
  }, [agentIndex, agentSearch]);

  const agentsByCategory = useMemo(() => {
    const map = new Map<string, AgentIndex['agents']>();
    for (const a of filteredAgents) {
      const cat = categorizeAgent(a.name);
      map.set(cat, [...(map.get(cat) ?? []), a]);
    }
    // stable order
    const ordered = Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    return ordered;
  }, [filteredAgents]);

  const selectedAgent = useMemo(() => {
    if (!selectedAgentId) return null;
    return (agentIndex?.agents ?? []).find((a) => a.id === selectedAgentId) ?? null;
  }, [agentIndex, selectedAgentId]);

  const selectedDoc = useMemo(() => {
    if (!selectedAgent || !selectedDocPath) return null;
    return (
      (selectedAgent.semantic?.definingDocs ?? []).find((d) => d.path === selectedDocPath) ?? null
    );
  }, [selectedAgent, selectedDocPath]);

  const semanticGraph = useMemo((): { nodes: SemanticNode[]; edges: SemanticEdge[] } => {
    // Two modes:
    // - Overview: categories -> agents (collapsed)
    // - Focused: selected agent -> tools/traits/abilities (1-hop)

    const nodes: SemanticNode[] = [];
    const edges: SemanticEdge[] = [];

    const nodeStyleByKind: Record<SemanticNode['data']['kind'], any> = {
      category: {
        background: 'rgba(79,70,229,0.10)',
        border: '1px solid rgba(99,102,241,0.25)',
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
        background: 'rgba(168,85,247,0.10)',
        border: '1px solid rgba(192,132,252,0.25)',
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

    const edgeStyleByLabel: Record<string, any> = {
      contains: { stroke: 'rgba(99,102,241,0.35)', strokeWidth: 1 },
      uses: { stroke: 'rgba(251,191,36,0.40)', strokeWidth: 1.5 },
      trait: { stroke: 'rgba(192,132,252,0.40)', strokeWidth: 1.5 },
      ability: { stroke: 'rgba(52,211,153,0.40)', strokeWidth: 1.5 },
      concept: { stroke: 'rgba(251,113,133,0.40)', strokeWidth: 1.5 },
      doc: { stroke: 'rgba(148,163,184,0.30)', strokeWidth: 1 },
    };

    if (!selectedAgent) {
      const cats = agentsByCategory.slice(0, 12); // keep light
      cats.forEach(([category, agents], i) => {
        const catId = `cat:${slugId(category)}`;
        nodes.push({
          id: catId,
          data: { label: category, kind: 'category' },
          position: { x: 0, y: i * 80 },
          style: nodeStyleByKind.category,
        });

        agents.slice(0, 18).forEach((a, j) => {
          const agentId = `agent:${a.id}`;
          nodes.push({
            id: agentId,
            data: { label: a.name, kind: 'agent' },
            position: { x: 240 + (j % 2) * 240, y: i * 80 + Math.floor(j / 2) * 44 },
            style: nodeStyleByKind.agent,
          });
          edges.push({
            id: `e:${catId}->${agentId}`,
            source: catId,
            target: agentId,
            label: 'contains',
            style: edgeStyleByLabel.contains,
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

    const tools = selectedAgent.tools ?? [];
    tools.slice(0, 30).forEach((t, idx) => {
      const id = `tool:${slugId(t)}`;
      nodes.push({
        id,
        data: { label: t, kind: 'tool' },
        position: { x: 320, y: -260 + idx * 36 },
        style: nodeStyleByKind.tool,
      });
      edges.push({
        id: `e:${rootId}->${id}`,
        source: rootId,
        target: id,
        label: 'uses',
        animated: true,
        style: edgeStyleByLabel.uses,
      });
    });

    const traits = selectedAgent.traits ?? [];
    traits.slice(0, 20).forEach((t, idx) => {
      const id = `trait:${slugId(t)}`;
      nodes.push({
        id,
        data: { label: t, kind: 'trait' },
        position: { x: 700, y: -260 + idx * 36 },
        style: nodeStyleByKind.trait,
      });
      edges.push({
        id: `e:${rootId}->${id}`,
        source: rootId,
        target: id,
        label: 'trait',
        style: edgeStyleByLabel.trait,
      });
    });

    const abilities = selectedAgent.abilities ?? [];
    abilities.slice(0, 20).forEach((a, idx) => {
      const id = `ability:${slugId(a)}`;
      nodes.push({
        id,
        data: { label: a, kind: 'ability' },
        position: { x: 700, y: 140 + idx * 36 },
        style: nodeStyleByKind.ability,
      });
      edges.push({
        id: `e:${rootId}->${id}`,
        source: rootId,
        target: id,
        label: 'ability',
        style: edgeStyleByLabel.ability,
      });
    });

    // semantic enrichment: concept neighborhood + defining docs
    const concepts = selectedAgent.semantic?.relatedConcepts ?? [];
    concepts.slice(0, 12).forEach((c, idx) => {
      const id = `concept:${slugId(c.concept)}`;
      nodes.push({
        id,
        data: { label: c.concept, kind: 'concept', meta: { concept: c.concept } },
        position: { x: 320, y: 220 + idx * 34 },
        style: nodeStyleByKind.concept,
      });
      edges.push({
        id: `e:${rootId}->${id}`,
        source: rootId,
        target: id,
        label: 'concept',
        style: edgeStyleByLabel.concept,
      });
    });

    const docs = selectedAgent.semantic?.definingDocs ?? [];
    docs.slice(0, 10).forEach((d, idx) => {
      const id = `doc:${slugId(d.path)}`;
      const label = d.path.length > 42 ? `…${d.path.slice(-42)}` : d.path;
      nodes.push({
        id,
        data: { label, kind: 'doc', meta: { path: d.path, snippet: d.snippet } },
        position: { x: 980, y: -240 + idx * 44 },
        style: nodeStyleByKind.doc,
      });
      edges.push({
        id: `e:${rootId}->${id}`,
        source: rootId,
        target: id,
        label: 'doc',
        style: edgeStyleByLabel.doc,
      });
    });

    return { nodes, edges };
  }, [agentsByCategory, selectedAgent]);

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-md bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/20 shadow-none">
            <Globe className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-widest uppercase">
              System{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                Observatory
              </span>
            </h1>
            <p className="text-muted-foreground font-mono text-sm uppercase tracking-widest">
              Global Fleet Intelligence & Node Topology
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <SourceBadge label="Agents" value={dataSources.orchestratorAgents} />
              <SourceBadge label="Orchestrator" value={dataSources.orchestratorHealth} />
              <SourceBadge label="System Health" value={dataSources.systemHealth} />
              <SourceBadge label="System Metrics" value={dataSources.systemMetrics} />
              <CapabilityBadge
                label="Swarm API"
                enabled={
                  capabilities.swarm
                    ? Object.keys(capabilities.swarm.unavailable || {}).length === 0
                    : null
                }
              />
              <CapabilityBadge
                label="Local AI"
                enabled={capabilities.localAI ? capabilities.localAI.enabled : null}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 bg-transparent/5 p-1 rounded-md border border-white/10 backdrop-blur-md">
          <TabButton
            active={activeLayer === 'topology'}
            icon={<Network className="w-4 h-4" />}
            label="Network"
            onClick={() => setActiveLayer('topology')}
          />
          <TabButton
            active={activeLayer === 'semantic'}
            icon={<Database className="w-4 h-4" />}
            label="Semantic"
            onClick={() => setActiveLayer('semantic')}
          />
          <TabButton
            active={activeLayer === 'metrics'}
            icon={<Activity className="w-4 h-4" />}
            label="Metrics"
            onClick={() => setActiveLayer('metrics')}
          />
        </div>
      </div>

      {/* Main Visualizer Area */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 h-[700px]">
        <div className="xl:col-span-3 h-full">
          {activeLayer === 'topology' && (
            <div className="h-full">
              {topologyLoading ? (
                <div className="h-full rounded-md border border-white/10 bg-black/30 flex items-center justify-center text-gray-400 text-sm">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading live topology...
                </div>
              ) : topologyGraph.nodes.length > 0 ? (
                <GraphVisualizer
                  nodes={topologyGraph.nodes as any}
                  edges={topologyGraph.edges as any}
                />
              ) : (
                <div className="h-full rounded-md border border-white/10 bg-black/30 flex flex-col items-center justify-center text-gray-400 text-sm px-3 text-center">
                  <AlertTriangle className="w-5 h-5 mb-2 text-amber-400" />
                  <div>{topologyError ?? 'No topology data available from backend.'}</div>
                </div>
              )}
            </div>
          )}
          {activeLayer === 'semantic' && (
            <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Agent directory */}
              <GlassCard className="p-4 border-white/5 bg-black/40 lg:col-span-1 h-full overflow-hidden flex flex-col">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-md bg-indigo-500/10 border border-indigo-500/20">
                      <Tags className="w-4 h-4 text-indigo-300" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-gray-400 uppercase tracking-widest">
                        Agents
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {agentIndexLoading
                          ? 'Loading…'
                          : agentIndex
                            ? `${agentIndex.counts.agentDefinitions} loaded`
                            : 'Unavailable'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative mb-3">
                  <input
                    value={agentSearch}
                    onChange={(e) => setAgentSearch(e.target.value)}
                    placeholder="Search agents, tools, traits…"
                    className="w-full bg-transparent/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-indigo-600/40"
                  />
                  <div className="absolute right-2 top-2.5 text-muted-foreground">
                    <Search className="w-4 h-4" />
                  </div>
                </div>

                <div className="flex-1 overflow-auto pr-1 space-y-2">
                  {agentIndexError && (
                    <div className="text-xs text-red-300 border border-red-500/30 bg-red-500/10 rounded-md p-2">
                      {agentIndexError}
                    </div>
                  )}
                  {agentsByCategory.map(([category, agents]) => (
                    <details
                      key={category}
                      className="group rounded-md border border-white/10 bg-transparent/5"
                    >
                      <summary className="cursor-pointer select-none list-none px-3 py-2 flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">
                          {category}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {agents.length}
                        </span>
                      </summary>
                      <div className="px-3 pb-2 space-y-1">
                        {agents.slice(0, 60).map((a) => (
                          <button
                            key={a.id}
                            onClick={() => setSelectedAgentId(a.id)}
                            className={`w-full text-left text-sm px-2 py-1.5 rounded-md transition-all border ${
                              selectedAgentId === a.id
                                ? 'bg-indigo-600/20 border-indigo-500/30 text-white'
                                : 'bg-black/20 border-transparent text-gray-300 hover:bg-transparent/5 hover:text-white'
                            }`}
                          >
                            <div className="font-semibold leading-tight">{a.name}</div>
                            {a.description && (
                              <div className="text-[10px] text-muted-foreground line-clamp-2">
                                {a.description}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </details>
                  ))}
                </div>
              </GlassCard>

              {/* Semantic graph */}
              <div className="lg:col-span-2 h-full space-y-3">
                <div className="flex flex-wrap gap-2 text-[10px] font-mono text-muted-foreground">
                  <span className="px-2 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-gray-300">
                    Category
                  </span>
                  <span className="px-2 py-1 rounded-full border border-sky-500/20 bg-sky-500/10 text-gray-300">
                    Agent
                  </span>
                  <span className="px-2 py-1 rounded-full border border-amber-500/20 bg-amber-500/10 text-gray-300">
                    Tool
                  </span>
                  <span className="px-2 py-1 rounded-full border border-purple-500/20 bg-purple-500/10 text-gray-300">
                    Trait
                  </span>
                  <span className="px-2 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-gray-300">
                    Ability
                  </span>
                  <span className="px-2 py-1 rounded-full border border-rose-500/20 bg-rose-500/10 text-gray-300">
                    Concept
                  </span>
                  <span className="px-2 py-1 rounded-full border border-slate-400/20 bg-slate-400/10 text-gray-300">
                    Doc
                  </span>
                </div>

                <div className="h-[640px]">
                  <GraphVisualizer
                    nodes={semanticGraph.nodes as any}
                    edges={semanticGraph.edges as any}
                    onNodeClick={(_, node: any) => {
                      const kind = node?.data?.kind;
                      if (kind === 'agent' && typeof node.id === 'string') {
                        const id = node.id.replace(/^agent:/, '');
                        setSelectedAgentId(id);
                        setSelectedDocPath(null);
                      }
                      if (kind === 'doc') {
                        const p = node?.data?.meta?.path;
                        if (typeof p === 'string') setSelectedDocPath(p);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          )}
          {activeLayer === 'metrics' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
              <MetricsCard
                title="Network Latency"
                color="blue"
                value={metrics.networkLatencyMs !== null ? `${metrics.networkLatencyMs}ms` : 'N/A'}
                progress={
                  metrics.networkLatencyMs !== null
                    ? Math.max(0, 100 - Math.min(metrics.networkLatencyMs, 100))
                    : 0
                }
              />
              <MetricsCard
                title="Throughput (req/s)"
                color="purple"
                value={metrics.throughput !== null ? `${metrics.throughput}` : 'N/A'}
                progress={metrics.throughput !== null ? Math.min(100, metrics.throughput) : 0}
              />
              <MetricsCard
                title="Memory Usage"
                color="emerald"
                value={
                  metrics.memoryUsagePercent !== null ? `${metrics.memoryUsagePercent}%` : 'N/A'
                }
                progress={metrics.memoryUsagePercent ?? 0}
              />
              <MetricsCard
                title="Agent Activity"
                color="amber"
                value={
                  metrics.activeAgentRatePercent !== null
                    ? `${metrics.activeAgentRatePercent}%`
                    : 'N/A'
                }
                progress={metrics.activeAgentRatePercent ?? 0}
              />
            </div>
          )}
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          <h2 className="text-sm font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">
            Live Context
          </h2>

          <GlassCard className="p-4 border-white/5 space-y-6">
            <SidebarStat
              label="Active Nodes"
              value={metrics.activeNodes !== null ? String(metrics.activeNodes) : 'N/A'}
              icon={<Cpu className="text-blue-400" />}
            />
            <SidebarStat
              label="Agencies"
              value={metrics.agencies !== null ? String(metrics.agencies) : 'N/A'}
              icon={<Layers className="text-purple-400" />}
            />
            <SidebarStat
              label="Throughput (req/s)"
              value={metrics.throughput !== null ? String(metrics.throughput) : 'N/A'}
              icon={<Zap className="text-amber-400" />}
            />
            <SidebarStat
              label="Security Level"
              value={
                metrics.securityStatus === 'healthy'
                  ? 'Healthy'
                  : metrics.securityStatus === 'degraded'
                    ? 'Degraded'
                    : 'Unknown'
              }
              icon={<Shield className="text-emerald-400" />}
            />
          </GlassCard>

          {activeLayer === 'semantic' && (
            <GlassCard className="p-4 border-white/5 bg-black/40">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-md bg-purple-500/10 border border-purple-500/20">
                    <Brain className="w-4 h-4 text-purple-300" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-gray-400 uppercase tracking-widest">
                      Selected Agent
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      {selectedAgent ? selectedAgent.id : 'None'}
                    </div>
                  </div>
                </div>
              </div>

              {!selectedAgent && (
                <div className="text-xs text-muted-foreground">
                  Pick an agent from the list (or click a node in the semantic graph) to view its
                  full profile.
                </div>
              )}

              {selectedAgent && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <PremiumButton
                      variant="outline"
                      className="flex-1 text-[10px] py-1 h-8"
                      onClick={async () => {
                        try {
                          const pack = {
                            kind: 'TNF::ContextPack',
                            version: 1,
                            generatedAt: new Date().toISOString(),
                            agent: {
                              id: selectedAgent.id,
                              name: selectedAgent.name,
                              description: selectedAgent.description,
                              tools: selectedAgent.tools ?? [],
                              traits: selectedAgent.traits ?? [],
                              abilities: selectedAgent.abilities ?? [],
                              overlayTools: selectedAgent.overlayTools ?? [],
                              template: selectedAgent.template,
                              sources: selectedAgent.sources,
                              semantic: selectedAgent.semantic,
                              bodyMarkdown: selectedAgent.bodyMarkdown,
                            },
                          };
                          await navigator.clipboard.writeText(JSON.stringify(pack, null, 2));
                        } catch (e) {
                          // swallow; clipboard may be unavailable depending on browser context
                        }
                      }}
                    >
                      Copy Context Pack
                    </PremiumButton>
                    <PremiumButton
                      variant="outline"
                      className="text-[10px] py-1 h-8"
                      onClick={() => {
                        setSelectedAgentId(null);
                        setSelectedDocPath(null);
                      }}
                    >
                      Clear
                    </PremiumButton>
                  </div>
                  <div>
                    <div className="text-sm font-black text-white leading-tight">
                      {selectedAgent.name}
                    </div>
                    {selectedAgent.description && (
                      <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {selectedAgent.description}
                      </div>
                    )}
                  </div>

                  <details className="rounded-md border border-white/10 bg-transparent/5">
                    <summary className="cursor-pointer select-none list-none px-3 py-2 flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-indigo-300" />
                      <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">
                        Tools
                      </span>
                      <span className="ml-auto text-[10px] text-muted-foreground font-mono">
                        {(selectedAgent.tools ?? []).length}
                      </span>
                    </summary>
                    <div className="px-3 pb-3 pt-1 space-y-1">
                      {(selectedAgent.tools ?? []).length === 0 && (
                        <div className="text-xs text-muted-foreground">
                          No tools listed in front matter.
                        </div>
                      )}
                      {(selectedAgent.tools ?? []).map((t) => (
                        <div key={t} className="text-xs text-gray-400 font-mono">
                          • {t}
                        </div>
                      ))}
                    </div>
                  </details>

                  {(selectedAgent.traits?.length ||
                    selectedAgent.abilities?.length ||
                    selectedAgent.overlayTools?.length) && (
                    <details className="rounded-md border border-white/10 bg-transparent/5">
                      <summary className="cursor-pointer select-none list-none px-3 py-2 flex items-center gap-2">
                        <Tags className="w-4 h-4 text-purple-300" />
                        <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">
                          Traits / Abilities
                        </span>
                      </summary>
                      <div className="px-3 pb-3 pt-1 space-y-2">
                        {!!selectedAgent.traits?.length && (
                          <div>
                            <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                              Traits
                            </div>
                            <div className="text-xs text-gray-400 font-mono">
                              {selectedAgent.traits.join(', ')}
                            </div>
                          </div>
                        )}
                        {!!selectedAgent.abilities?.length && (
                          <div>
                            <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                              Abilities
                            </div>
                            <div className="text-xs text-gray-400 font-mono">
                              {selectedAgent.abilities.join(', ')}
                            </div>
                          </div>
                        )}
                        {!!selectedAgent.overlayTools?.length && (
                          <div>
                            <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                              Overlay Tools
                            </div>
                            <div className="text-xs text-gray-400 font-mono">
                              {selectedAgent.overlayTools.join(', ')}
                            </div>
                          </div>
                        )}
                      </div>
                    </details>
                  )}

                  {(selectedAgent.semantic?.relatedConcepts?.length ||
                    selectedAgent.semantic?.definingDocs?.length) && (
                    <details className="rounded-md border border-white/10 bg-transparent/5" open>
                      <summary className="cursor-pointer select-none list-none px-3 py-2 flex items-center gap-2">
                        <Database className="w-4 h-4 text-rose-300" />
                        <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">
                          Semantic
                        </span>
                      </summary>
                      <div className="px-3 pb-3 pt-1 space-y-3">
                        {!!selectedAgent.semantic?.relatedConcepts?.length && (
                          <div>
                            <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                              Related concepts
                            </div>
                            <div className="space-y-1">
                              {selectedAgent.semantic.relatedConcepts.slice(0, 10).map((c) => (
                                <div
                                  key={c.concept}
                                  className="flex items-center justify-between gap-3 text-[10px] text-gray-400 font-mono"
                                >
                                  <span>{c.concept}</span>
                                  <span className="text-muted-foreground">{c.score}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {!!selectedAgent.semantic?.definingDocs?.length && (
                          <div>
                            <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                              Defining docs (click to preview)
                            </div>
                            <div className="space-y-1">
                              {selectedAgent.semantic.definingDocs.slice(0, 10).map((d) => (
                                <button
                                  key={d.path}
                                  onClick={() => setSelectedDocPath(d.path)}
                                  className={`w-full flex items-center justify-between gap-3 text-[10px] font-mono px-2 py-1 rounded border transition-all ${
                                    selectedDocPath === d.path
                                      ? 'bg-transparent/10 border-white/10 text-white'
                                      : 'bg-black/20 border-transparent text-gray-400 hover:bg-transparent/5 hover:text-white'
                                  }`}
                                >
                                  <span className="truncate text-left">{d.path}</span>
                                  <span className="text-muted-foreground">{d.score}</span>
                                </button>
                              ))}
                            </div>

                            {selectedDoc && (
                              <div className="mt-3 rounded-md bg-black/30 border border-white/5 p-2">
                                <div className="text-[10px] text-muted-foreground font-mono mb-1">
                                  Preview: {selectedDoc.path}
                                </div>
                                <div className="text-[10px] leading-relaxed text-gray-400 whitespace-pre-wrap font-mono">
                                  {selectedDoc.snippet ?? 'No snippet available.'}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </details>
                  )}

                  <details className="rounded-md border border-white/10 bg-transparent/5">
                    <summary className="cursor-pointer select-none list-none px-3 py-2 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-300" />
                      <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">
                        Definition
                      </span>
                    </summary>
                    <div className="px-3 pb-3 pt-1 space-y-2">
                      <div className="text-[10px] text-muted-foreground font-mono">
                        Source: {selectedAgent.sources.definitionPath}
                      </div>
                      {selectedAgent.sources.overlayPaths?.length ? (
                        <div className="text-[10px] text-muted-foreground font-mono">
                          Overlay: {selectedAgent.sources.overlayPaths.join(', ')}
                        </div>
                      ) : null}
                      {selectedAgent.bodyMarkdown ? (
                        <pre className="text-[10px] leading-relaxed text-gray-400 whitespace-pre-wrap font-mono max-h-56 overflow-auto rounded-md bg-black/30 border border-white/5 p-2">
                          {selectedAgent.bodyMarkdown}
                        </pre>
                      ) : (
                        <div className="text-xs text-muted-foreground">
                          No body markdown captured.
                        </div>
                      )}
                    </div>
                  </details>
                </div>
              )}
            </GlassCard>
          )}

          <GlassCard className="p-4 bg-indigo-600/5 border-indigo-500/20">
            <h3 className="text-white font-bold mb-2 flex items-center gap-2">
              <RefreshCcw className="w-4 h-4 text-indigo-400 animate-spin-slow" />
              Auto-Discovery
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed mb-4">
              New agents are automatically indexed into the semantic space and message bus.
            </p>
            <PremiumButton
              variant="outline"
              className="w-full text-[10px] py-1 h-8"
              onClick={() => void loadTopologyAndMetrics()}
            >
              Re-scan Fleet
            </PremiumButton>
          </GlassCard>

          <div className="p-4 rounded-md border border-white/5 bg-black/40">
            <div className="text-[10px] font-bold text-muted-foreground uppercase mb-2">
              Observatory Command
            </div>
            <div className="flex gap-2">
              <SmallAction icon={<Search />} />
              <SmallAction icon={<Maximize />} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SourceBadge: React.FC<{ label: string; value: string }> = ({ label, value }) => {
  const normalized = value.toLowerCase();
  const isUnavailable = normalized.includes('unavailable') || value === SOURCE_UNRESOLVED;
  const isAlternate = normalized.includes('(alt)');
  const tone = isUnavailable
    ? 'border-red-500/40 bg-red-500/10 text-red-300'
    : isAlternate
      ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
      : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300';

  return (
    <div className={`rounded-full border px-2 py-1 text-[10px] font-mono ${tone}`}>
      <span className="text-gray-300">{label}:</span> {value}
    </div>
  );
};

const TabButton: React.FC<{
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}> = ({ active, icon, label, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
      active
        ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]'
        : 'text-gray-400 hover:text-white hover:bg-transparent/5'
    }`}
  >
    {icon}
    <span className="text-sm font-bold">{label}</span>
  </button>
);

const SidebarStat: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({
  label,
  value,
  icon,
}) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-md bg-transparent/5 border border-white/5">{icon}</div>
      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</span>
    </div>
    <span className="text-sm font-black text-white">{value}</span>
  </div>
);

const MetricsCard: React.FC<{
  title: string;
  color: 'blue' | 'purple' | 'emerald' | 'amber';
  value: string;
  progress: number;
}> = ({ title, color, value, progress }) => {
  const colors = {
    blue: 'border-blue-500/30 text-blue-400',
    purple: 'border-purple-500/30 text-purple-400',
    emerald: 'border-emerald-500/30 text-emerald-400',
    amber: 'border-amber-500/30 text-amber-400',
  };
  return (
    <GlassCard
      className={`p-4 ${colors[color]} relative flex flex-col justify-end overflow-hidden`}
    >
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Activity className="w-24 h-24" />
      </div>
      <div className="text-[10px] font-black uppercase tracking-[0.2em] mb-1">{title}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="mt-4 h-1 w-full bg-transparent/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-current"
          style={{ width: `${Math.max(0, Math.min(progress, 100))}%` }}
        />
      </div>
    </GlassCard>
  );
};

const SmallAction: React.FC<{ icon: React.ReactNode }> = ({ icon }) => (
  <button className="p-2 rounded-md bg-transparent/5 border border-white/10 text-muted-foreground hover:text-white hover:bg-transparent/10 transition-all">
    {React.cloneElement(icon as React.ReactElement, { className: 'w-4 h-4' })}
  </button>
);

export default SystemObservatory;
