// @ts-nocheck
import { Badge, GlassCard, PremiumButton, PremiumInput } from '@/components/ui';
import { useDebounce } from '@/hooks/useDebounce';
import { agentService, type Agent } from '@/services/AgentService';
import {
  ArrowRight,
  Bot,
  Clock,
  Cpu,
  HardDrive,
  Layers,
  LayoutGrid,
  List,
  Network,
  Plus,
  Search,
  ShieldCheck,
  Terminal,
  Zap,
} from 'lucide-react';
import { memo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Transformed agent interface for Command UI
interface UIAgent {
  id: string;
  name: string;
  model: string;
  provider: string;
  status: 'ACTIVE' | 'STANDBY' | 'FAULT' | 'TUNING';
  metrics: {
    throughput: string;
    latency: string;
    successRate: number;
    visionFps?: number;
  };
  kernel: string;
  type: string;
  pfpUrl?: string;
  capabilities: string[];
}

const transformAgent = (agent: Agent): UIAgent => {
  const statusMap: Record<string, UIAgent['status']> = {
    active: 'ACTIVE',
    standby: 'STANDBY',
    error: 'FAULT',
    training: 'TUNING',
  };

  return {
    id: agent.id,
    name: agent.name,
    model: agent.model || 'Dola-Seed-2.0',
    provider: agent.provider || 'KiloCode',
    status: statusMap[agent.status] || 'STANDBY',
    kernel: agent.metadata?.kernelVersion || 'v0.9.4',
    type: agent.type || 'executor',
    pfpUrl: agent.metadata?.pfpUrl,
    capabilities: agent.capabilities || [],
    metrics: {
      throughput: agent.metadata?.throughput || '4.2k/s',
      latency: agent.metadata?.latency || '42ms',
      successRate: agent.metadata?.successRate || 98.4,
      visionFps: agent.configuration?.sensory?.vision === 'simd-optimized' ? 34 : undefined,
    },
  };
};

const AgentCard = memo(({ agent }: { agent: UIAgent }) => {
  const navigate = useNavigate();

  const statusConfig = {
    ACTIVE: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    STANDBY: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' },
    FAULT: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
    TUNING: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  };

  const style = statusConfig[agent.status];

  return (
    <GlassCard
      onClick={() => navigate(`/agents/${agent.id}`)}
      className="group relative p-0 rounded-2xl border border-white/5 bg-slate-900/40 hover:border-amber-500/30 transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-xl"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-slate-800/50">
        <div
          className={`h-full ${style.bg.replace('/10', '')} transition-all duration-500`}
          style={{ width: agent.status === 'ACTIVE' ? '100%' : '30%' }}
        />
      </div>

      <div className="p-6 space-y-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform shadow-2xl">
              {agent.pfpUrl ? (
                <img src={agent.pfpUrl} alt={agent.name} className="w-full h-full object-cover" />
              ) : (
                <Bot className="w-8 h-8 text-slate-500" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tight group-hover:text-amber-400 transition-colors uppercase">
                {agent.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  className={`${style.bg} ${style.text} ${style.border} text-[9px] font-black tracking-widest px-2 py-0.5`}
                >
                  {agent.status}
                </Badge>
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">
                  {agent.kernel}
                </span>
              </div>
            </div>
          </div>
          <div className="p-2 bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
            <Terminal className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-black/40 rounded-lg border border-white/5 space-y-1">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-amber-500" /> Neural Link
            </p>
            <p className="text-xs font-bold text-white truncate">{agent.model}</p>
          </div>
          <div className="p-3 bg-black/40 rounded-lg border border-white/5 space-y-1">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Network className="w-3 h-3 text-sky-400" /> Interface
            </p>
            <p className="text-xs font-bold text-white truncate">{agent.type}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">
            <span>Kernel Telemetry</span>
            <span className="text-amber-500">{agent.metrics.successRate}% RELIABILITY</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/5 rounded p-2 text-center">
              <p className="text-[8px] text-slate-500 font-bold mb-0.5">TPS</p>
              <p className="text-xs font-black text-slate-200">{agent.metrics.throughput}</p>
            </div>
            <div className="bg-white/5 rounded p-2 text-center">
              <p className="text-[8px] text-slate-500 font-bold mb-0.5">RTT</p>
              <p className="text-xs font-black text-slate-200">{agent.metrics.latency}</p>
            </div>
            <div className="bg-white/5 rounded p-2 text-center">
              <p className="text-[8px] text-slate-500 font-bold mb-0.5">FPS</p>
              <p className="text-xs font-black text-slate-200">{agent.metrics.visionFps || '--'}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex gap-1.5">
            {agent.capabilities.slice(0, 2).map((cap) => (
              <div
                key={cap}
                className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center"
                title={cap}
              >
                {cap === 'relay' ? (
                  <Network className="w-3 h-3 text-amber-500" />
                ) : (
                  <Layers className="w-3 h-3 text-sky-400" />
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs font-black text-amber-500 uppercase tracking-tighter">
            Initialize Console <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </GlassCard>
  );
});

AgentCard.displayName = 'AgentCard';

export const AgentsRevolution = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [agents, setAgents] = useState<UIAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedAgents = await agentService.getAgents();
      setAgents(fetchedAgents.map(transformAgent));
    } catch (err) {
      console.error('Error fetching fleet data:', err);
      setError('CRITICAL: Failed to synchronize with the operative ledger.');
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      agent.model.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 text-xs font-black uppercase tracking-[0.3em]">
            Querying Hardware Fleet...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 relative overflow-hidden pb-20">
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 p-4 lg:p-10 max-w-7xl mx-auto space-y-12">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-amber-500">
              <ShieldCheck className="w-3.5 h-3.5" />
              Secure Operative Ledger
            </div>
            <div>
              <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">
                Agent Fleet Command
              </h1>
              <p className="text-slate-400 font-bold uppercase text-xs tracking-[0.2em] mt-3 flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-amber-500" />
                Real-time Hive Telemetry & Hardware Orchestration
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <PremiumButton
              onClick={fetchData}
              variant="outline"
              className="border-slate-800 bg-slate-900/50 text-slate-400 h-12 px-6"
            >
              Sync Ledger
            </PremiumButton>
            <PremiumButton
              onClick={() => navigate('/agents/new')}
              className="bg-amber-500 hover:bg-amber-600 text-black font-black h-12 px-8 shadow-lg shadow-amber-500/10"
            >
              <Plus className="mr-2 h-5 w-5" />
              Forge Operative
            </PremiumButton>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {[
            { label: 'FLEET SIZE', value: agents.length, icon: Bot, color: 'text-amber-500' },
            {
              label: 'ACTIVE SYNAPSES',
              value: agents.filter((a) => a.status === 'ACTIVE').length,
              icon: Zap,
              color: 'text-emerald-500',
            },
            { label: 'AVG LATENCY', value: '42ms', icon: Clock, color: 'text-sky-500' },
            { label: 'KERNEL LOAD', value: '14%', icon: Cpu, color: 'text-fuchsia-500' },
          ].map((stat) => (
            <GlassCard
              key={stat.label}
              className="p-5 border-white/5 bg-slate-900/40 flex items-center gap-4"
            >
              <div className={`p-3 rounded-xl bg-black/40 border border-white/5 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  {stat.label}
                </p>
                <p className="text-2xl font-black text-white tracking-tight">{stat.value}</p>
              </div>
            </GlassCard>
          ))}
        </div>

        <GlassCard className="p-4 bg-slate-900/40 border-white/5">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex-1 relative group w-full">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4 group-focus-within:text-amber-500 transition-colors" />
              <PremiumInput
                placeholder="Filter operatives by callsign, model backbone, or directive..."
                className="pl-12 h-14 bg-slate-950/50 border-slate-800 text-slate-100 placeholder:text-slate-600"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded-xl border border-white/5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 rounded-lg transition-all ${
                  viewMode === 'list'
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </GlassCard>

        {filteredAgents.length === 0 ? (
          <div className="text-center py-32 bg-slate-950/20 rounded-[3rem] border border-dashed border-slate-800">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-900 flex items-center justify-center border border-white/10">
              <Bot className="w-10 h-10 text-slate-700" />
            </div>
            <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">
              No Operatives Registered
            </h3>
            <p className="text-slate-500 mb-8 max-w-sm mx-auto text-sm font-bold uppercase tracking-tighter">
              Synchronize the ledger or forge a new operative soul to begin.
            </p>
            <PremiumButton
              onClick={() => navigate('/agents/new')}
              className="bg-amber-500 text-black font-black px-10 h-14"
            >
              Forge First Operative
            </PremiumButton>
          </div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }
          >
            {filteredAgents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}

        <footer className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 opacity-50">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 tracking-widest">
              <Network className="w-3.5 h-3.5" /> Synaptic Bus:{' '}
              <span className="text-emerald-500">OPTIMAL</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 tracking-widest">
              <HardDrive className="w-3.5 h-3.5" /> Hardware Link:{' '}
              <span className="text-sky-500">ARM64-DARWIN</span>
            </div>
          </div>
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">
            © 2026 THE NEW FUSE • KERNEL-FLEET-V1
          </p>
        </footer>
      </div>
    </div>
  );
};

export default AgentsRevolution;
