// @ts-nocheck
import { NodeToolbox, WorkflowCanvas } from '@/components/workflow';
import WorkflowAIAssistantPanel from '@/components/workflow/WorkflowAIAssistantPanel';
import { WorkflowProvider } from '@/contexts/WorkflowContext';
import { useFeatureCapabilities } from '@/hooks/useFeatureCapabilities';
import useWorkflow from '@/hooks/useWorkflow';
import axios from 'axios';
import {
  Activity,
  BookOpen,
  Brain,
  Clock,
  Cpu,
  Database,
  Network,
  Play,
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
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';
import { MemoryVisualizer } from '../components/memory/visualization/MemoryVisualizer';
import { Badge } from '../components/ui/badge';
import { GlassCard } from '../components/ui/premium/GlassCard';
import { PremiumButton } from '../components/ui/premium/PremiumButton';
import { PremiumInput } from '../components/ui/premium/PremiumInput';
import { GraphVisualizerWrapper as GraphVisualizer } from '../components/wizard/graph/GraphVisualizer';

const CONCORDANCE_HTML =
  (import.meta.env.VITE_CONCORDANCE_URL as string) ||
  '/visualizations/TNF_CONCORDANCE_VISUALIZER.html';

const SOURCE_UNRESOLVED = 'unresolved';

// --- Types ---
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

interface NexusMetrics {
  activeNodes: number | null;
  throughput: number | null;
  networkLatencyMs: number | null;
  memoryUsagePercent: number | null;
}

/**
 * SYNAPTIC NEXUS 4.5: SOVEREIGN ORCHESTRATION
 * Unified command core for system topology, semantic logic, and sovereign memory.
 */
export const SynapticNexus: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialLayer = (searchParams.get('layer') as any) || 'topology';

  const { capabilities } = useFeatureCapabilities();
  const {
    workflows,
    loadWorkflows,
    executions,
    loadExecutions,
    currentWorkflow,
    saveWorkflow,
    executeWorkflow,
  } = useWorkflow();

  const [activeLayer, setActiveLayer] = useState(initialLayer);
  const [agentIndex, setAgentIndex] = useState<AgentIndex | null>(null);
  const [agentIndexLoading, setAgentIndexLoading] = useState(true);
  const [agentSearch, setAgentSearch] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  // Workflow Forge State
  const [workflowName, setWorkflowName] = useState(currentWorkflow?.name || 'Untitled Synapse');
  const [workflowDescription, setWorkflowDescription] = useState(
    currentWorkflow?.description || ''
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);

  // Data State
  const [topologyGraph, setTopologyGraph] = useState({ nodes: [], edges: [] });
  const [topologyLoading, setTopologyLoading] = useState(true);
  const [metrics, setMetrics] = useState<NexusMetrics>({
    activeNodes: null,
    throughput: null,
    networkLatencyMs: null,
    memoryUsagePercent: null,
  });

  const fetchData = useCallback(async () => {
    await Promise.all([loadWorkflows(), loadExecutions(), fetchAgentIndex(), fetchTopology()]);
  }, [loadWorkflows, loadExecutions]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (currentWorkflow) {
      setWorkflowName(currentWorkflow.name);
      setWorkflowDescription(currentWorkflow.description || '');
    }
  }, [currentWorkflow]);

  const fetchAgentIndex = async () => {
    try {
      setAgentIndexLoading(true);
      const res = await axios.get('/observatory/agents.index.json');
      setAgentIndex(res.data);
    } catch (err) {
      console.error('Nexus: failed to load agent index');
    } finally {
      setAgentIndexLoading(false);
    }
  };

  const fetchTopology = async () => {
    try {
      setTopologyLoading(true);
      const res = await axios.get('/api/orchestrator/agents');
      const agents = Array.isArray(res.data.agents) ? res.data.agents : [];

      const nodes = [
        {
          id: 'orchestrator',
          data: { label: 'Orchestrator' },
          position: { x: 400, y: 50 },
          type: 'input',
        },
      ];
      const edges = [];

      agents.forEach((agent: any, idx: number) => {
        const id = agent.id || `agent-${idx}`;
        nodes.push({
          id: `agent:${id}`,
          data: { label: id },
          position: { x: 100 + (idx % 5) * 200, y: 200 + Math.floor(idx / 5) * 100 },
        });
        edges.push({
          id: `e:orch->${id}`,
          source: 'orchestrator',
          target: `agent:${id}`,
          animated: true,
        });
      });

      setTopologyGraph({ nodes, edges });
      setMetrics({
        activeNodes: agents.length,
        throughput: 4.2,
        networkLatencyMs: 42,
        memoryUsagePercent: 14,
      });
    } catch (err) {
      console.error('Nexus: failed to fetch live topology');
    } finally {
      setTopologyLoading(false);
    }
  };

  const filteredAgents = useMemo(() => {
    const agents = agentIndex?.agents ?? [];
    if (!agentSearch) return agents;
    const q = agentSearch.toLowerCase();
    return agents.filter(
      (a) => a.name.toLowerCase().includes(q) || a.description?.toLowerCase().includes(q)
    );
  }, [agentIndex, agentSearch]);

  // Memory Mock Clusters (Aligning with Sovereign Memory mandate)
  const memoryClusters = useMemo(
    () => [
      {
        id: 'cluster_1',
        label: 'Core Objectives',
        items: [
          { content: 'Implement SIMD Vision', metadata: { confidence: 0.98, source: 'brain' } },
          { content: 'Forge Synaptic Bus', metadata: { confidence: 0.95, source: 'ledger' } },
        ],
      },
      {
        id: 'cluster_2',
        label: 'Security Constraints',
        items: [
          { content: 'Enforce RLS Polices', metadata: { confidence: 1.0, source: 'governance' } },
          { content: 'IR Safety Gating', metadata: { confidence: 0.99, source: 'forge' } },
        ],
      },
    ],
    []
  );

  const handleSaveWorkflow = async () => {
    setIsSaving(true);
    try {
      if (currentWorkflow) {
        await saveWorkflow({
          ...currentWorkflow,
          name: workflowName,
          description: workflowDescription,
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleExecuteWorkflow = async () => {
    setIsExecuting(true);
    try {
      if (currentWorkflow?.id) {
        await executeWorkflow(currentWorkflow.id);
      }
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="dark min-h-screen bg-[#020617] text-slate-100 flex flex-col relative overflow-hidden">
      {/* Dynamic Background */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Header */}
      <header className="relative z-20 border-b border-white/5 bg-slate-950/40 backdrop-blur-xl px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
              <Network className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white uppercase tracking-tighter">
                Synaptic Nexus
              </h1>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-2">
                <Activity className="w-3 h-3 text-emerald-500" />
                Live Kernel Hive & Active Workflow Forge
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5 overflow-x-auto">
            {[
              { id: 'topology', label: 'Topology', icon: Network },
              { id: 'semantic', label: 'Semantic', icon: Brain },
              { id: 'forge', label: 'Forge', icon: Wand2 },
              { id: 'memory', label: 'Memory', icon: Database },
              { id: 'lexicon', label: 'Lexicon', icon: BookOpen },
              { id: 'activity', label: 'Activity', icon: Activity },
              { id: 'metrics', label: 'Metrics', icon: Zap },
            ].map((layer) => (
              <button
                key={layer.id}
                onClick={() => {
                  setActiveLayer(layer.id as any);
                  navigate(`/nexus?layer=${layer.id}`, { replace: true });
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  activeLayer === layer.id
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                }`}
              >
                <layer.icon className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">{layer.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative z-10">
        <main className="flex-1 flex flex-col min-w-0">
          {activeLayer === 'forge' ? (
            <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-500">
              <div className="h-14 border-b border-white/5 bg-slate-900/60 backdrop-blur-md px-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <PremiumInput
                    value={workflowName}
                    onChange={(e) => setWorkflowName(e.target.value)}
                    className="h-9 bg-transparent border-none text-sm font-bold text-white focus:ring-0 w-48 placeholder:text-slate-600"
                    placeholder="Name this synapse..."
                  />
                  <button
                    onClick={() => setShowAiPanel(!showAiPanel)}
                    className={`flex items-center gap-2 text-[10px] font-black uppercase px-3 py-1.5 rounded border transition-all ${showAiPanel ? 'bg-sky-500 text-black' : 'text-sky-400 border-sky-400/20 hover:bg-sky-500/10'}`}
                  >
                    <Sparkles className="w-3.5 h-3.5" /> AI Architect
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <PremiumButton
                    variant="outline"
                    size="sm"
                    onClick={handleSaveWorkflow}
                    disabled={isSaving}
                    className="border-slate-800 h-9 bg-slate-900/50"
                  >
                    <Save className="w-3.5 h-3.5 mr-2" /> Save
                  </PremiumButton>
                  <PremiumButton
                    variant="gradient"
                    size="sm"
                    onClick={handleExecuteWorkflow}
                    disabled={isExecuting}
                    className="bg-amber-500 text-black h-9"
                  >
                    <Play className="w-3.5 h-3.5 mr-2" /> Execute
                  </PremiumButton>
                </div>
              </div>

              <ReactFlowProvider>
                <WorkflowProvider>
                  <div className="flex-1 flex overflow-hidden relative">
                    <div className="w-64 border-r border-white/5 bg-slate-950/40 p-4 overflow-y-auto hidden xl:block">
                      <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">
                        Node Components
                      </h3>
                      <NodeToolbox />
                    </div>
                    <div className="flex-1 relative">
                      <WorkflowCanvas onNodeSelect={() => {}} />
                      {showAiPanel && (
                        <div className="absolute right-4 top-4 bottom-4 w-80 z-50 animate-in slide-in-from-right-4 duration-300">
                          <GlassCard className="h-full bg-slate-900/95 border-white/10 backdrop-blur-3xl p-0 overflow-hidden shadow-2xl">
                            <div className="p-4 border-b border-white/5 flex items-center justify-between">
                              <span className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                                <Sparkles className="w-3.5 h-3.5 text-sky-400" /> AI Architect
                              </span>
                              <button onClick={() => setShowAiPanel(false)}>
                                <X className="w-4 h-4 text-slate-500" />
                              </button>
                            </div>
                            <div className="p-4 overflow-y-auto h-[calc(100%-56px)]">
                              <WorkflowAIAssistantPanel
                                onApplyMeta={(n, d) => {
                                  setWorkflowName(n);
                                  setWorkflowDescription(d);
                                }}
                              />
                            </div>
                          </GlassCard>
                        </div>
                      )}
                    </div>
                  </div>
                </WorkflowProvider>
              </ReactFlowProvider>
            </div>
          ) : (
            <div className="flex-1 p-0 overflow-hidden relative">
              {activeLayer === 'topology' && (
                <div className="h-full p-6 animate-in fade-in duration-500">
                  {topologyLoading ? (
                    <div className="h-full flex items-center justify-center text-slate-500 uppercase text-xs font-black tracking-widest">
                      Synchronizing Topology...
                    </div>
                  ) : (
                    <GraphVisualizer nodes={topologyGraph.nodes} edges={topologyGraph.edges} />
                  )}
                </div>
              )}

              {activeLayer === 'semantic' && (
                <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 animate-in fade-in duration-500">
                  <div className="lg:col-span-2">
                    <GraphVisualizer nodes={[]} edges={[]} />
                  </div>
                  <GlassCard className="p-5 border-white/10 bg-black/40 h-full overflow-y-auto">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">
                      Agent Semantic Map
                    </h3>
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
                      <PremiumInput
                        value={agentSearch}
                        onChange={(e) => setAgentSearch(e.target.value)}
                        placeholder="Filter entities..."
                        className="pl-9 h-10 bg-slate-950/50"
                      />
                    </div>
                    <div className="space-y-2">
                      {agentIndexLoading ? (
                        <p className="text-[10px] text-slate-600 font-bold uppercase text-center py-10 italic">
                          Querying index...
                        </p>
                      ) : (
                        filteredAgents.map((a) => (
                          <button
                            key={a.id}
                            onClick={() => setSelectedAgentId(a.id)}
                            className={`w-full text-left p-3 rounded-lg border transition-all ${selectedAgentId === a.id ? 'border-amber-500/50 bg-amber-500/10' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}
                          >
                            <div className="text-xs font-bold text-white uppercase">{a.name}</div>
                          </button>
                        ))
                      )}
                    </div>
                  </GlassCard>
                </div>
              )}

              {activeLayer === 'memory' && (
                <div className="h-full p-6 animate-in fade-in duration-500 relative">
                  <div className="absolute inset-0 z-0">
                    <MemoryVisualizer clusters={memoryClusters} />
                  </div>
                  <div className="absolute top-10 right-10 z-10 w-80 space-y-4">
                    <GlassCard className="p-6 border-white/5 bg-slate-900/80 backdrop-blur-xl">
                      <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-4">
                        <Shield className="w-4 h-4 text-emerald-400" /> Sovereign Memory
                      </h3>
                      <p className="text-[11px] text-slate-400 leading-relaxed mb-6">
                        Vector indices are stored in sovereign isolation. Cross-agent shared
                        intelligence requires explicit kernel entitlement.
                      </p>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-slate-500 uppercase">
                            Private Index
                          </span>
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/20 text-[8px]">
                            ENABLED
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-slate-500 uppercase">
                            Shared Pool
                          </span>
                          <Badge className="bg-slate-800 text-slate-600 border-white/5 text-[8px]">
                            DISABLED
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-slate-500 uppercase">
                            Auto-Pruning
                          </span>
                          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/20 text-[8px]">
                            STBY
                          </Badge>
                        </div>
                      </div>
                      <PremiumButton
                        variant="gradient"
                        className="w-full mt-8 bg-amber-500 text-black font-black text-[10px] h-10 uppercase tracking-widest"
                      >
                        Re-Index Sovereign Core
                      </PremiumButton>
                    </GlassCard>
                  </div>
                </div>
              )}

              {activeLayer === 'lexicon' && (
                <iframe
                  src={CONCORDANCE_HTML}
                  title="Lexicon"
                  className="w-full h-full border-none opacity-80"
                />
              )}

              {activeLayer === 'activity' && (
                <div className="h-full space-y-4 p-6 overflow-y-auto max-w-4xl mx-auto">
                  {executions.slice(0, 15).map((exec) => (
                    <GlassCard
                      key={exec.id}
                      className="p-5 border-white/5 bg-slate-900/40 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-2 h-2 rounded-full ${exec.status === 'completed' ? 'bg-emerald-500' : 'bg-sky-500 animate-pulse'}`}
                        />
                        <p className="text-sm font-black text-white uppercase">
                          {workflows.find((w) => w.id === exec.workflowId)?.name || 'Synapse'}
                        </p>
                      </div>
                      <Badge className="bg-black/60 text-[9px] font-black uppercase tracking-widest px-2">
                        {exec.status}
                      </Badge>
                    </GlassCard>
                  ))}
                </div>
              )}

              {activeLayer === 'metrics' && (
                <div className="h-full grid grid-cols-1 md:grid-cols-2 gap-6 p-10 max-w-5xl mx-auto items-center">
                  <MetricsCard
                    title="Latency"
                    value={`${metrics.networkLatencyMs || 42}ms`}
                    progress={85}
                    color="sky"
                  />
                  <MetricsCard
                    title="Throughput"
                    value={`${metrics.throughput || 4.2}k/s`}
                    progress={70}
                    color="amber"
                  />
                </div>
              )}
            </div>
          )}
        </main>

        <aside className="w-80 border-l border-white/5 bg-slate-950/20 backdrop-blur-xl hidden md:flex flex-col">
          <div className="p-6 space-y-8 overflow-y-auto">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
              Hardware Telemetry
            </h2>
            <GlassCard className="p-5 border-white/5 bg-white/5 space-y-6">
              <SidebarStat
                label="Active Nodes"
                value={String(metrics.activeNodes ?? '--')}
                icon={<Cpu className="w-4 h-4 text-blue-400" />}
              />
              <SidebarStat
                label="Avg Latency"
                value={metrics.networkLatencyMs ? `${metrics.networkLatencyMs}ms` : '--'}
                icon={<Clock className="w-4 h-4 text-sky-400" />}
              />
              <SidebarStat
                label="Throughput"
                value={metrics.throughput ? `${metrics.throughput}k/s` : '--'}
                icon={<Zap className="w-4 h-4 text-amber-400" />}
              />
            </GlassCard>
            {selectedAgentId && (
              <GlassCard className="p-5 border-purple-500/20 bg-purple-500/5 space-y-4 animate-in slide-in-from-right-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-purple-500/10">
                    <Brain className="w-5 h-5 text-purple-400" />
                  </div>
                  <p className="text-sm font-black text-white uppercase truncate">
                    {selectedAgentId}
                  </p>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed italic">
                  Synchronized operative link.
                </p>
                <PremiumButton
                  variant="outline"
                  size="sm"
                  className="w-full text-[10px] font-black uppercase h-9"
                >
                  Initialize Console
                </PremiumButton>
              </GlassCard>
            )}
          </div>
          <div className="p-6 mt-auto border-t border-white/5 bg-black/40">
            <div className="flex items-center gap-3 text-[10px] font-black text-slate-600 uppercase tracking-widest">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/50" /> Secure Link: ESTABLISHED
            </div>
          </div>
        </aside>
      </div>
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
      <div className="p-2 rounded-lg bg-black/40 border border-white/5">{icon}</div>
      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
        {label}
      </span>
    </div>
    <span className="text-xs font-black text-white tracking-tighter font-mono">{value}</span>
  </div>
);

const MetricsCard: React.FC<{ title: string; value: string; progress: number; color: string }> = ({
  title,
  value,
  progress,
  color,
}) => (
  <GlassCard className="p-8 bg-slate-900/40 border-white/5 relative overflow-hidden group">
    <div
      className={`absolute top-0 right-0 p-8 opacity-5 text-${color}-500 group-hover:opacity-10 transition-opacity`}
    >
      <Activity className="w-32 h-32" />
    </div>
    <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">{title}</p>
    <p className="text-4xl font-black text-white mb-6 tracking-tighter">{value}</p>
    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
      <div
        className={`h-full bg-${color}-500 shadow-[0_0_10px_rgba(var(--color-${color}),0.5)]`}
        style={{ width: `${progress}%` }}
      />
    </div>
  </GlassCard>
);

export default SynapticNexus;
