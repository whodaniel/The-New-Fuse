// @ts-nocheck
import { Badge, GlassCard, PremiumButton, PremiumInput } from '@/components/ui';
import { useDebounce } from '@/hooks/useDebounce';
import { agentService, type Agent, type AgentTemplate } from '@/services/AgentService';
import {
  ArrowRight,
  BookOpen,
  Bot,
  Clock,
  Cpu,
  HardDrive,
  LayoutGrid,
  Library,
  List,
  Network,
  Plus,
  Search,
  ShieldCheck,
  Terminal,
  Zap,
} from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

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
  description?: string;
  bank?: 'tnf' | 'claude';
  filename?: string;
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
    description: agent.description,
    bank: agent.metadata?.bank,
    filename: agent.metadata?.filename,
    metrics: {
      throughput: agent.metadata?.throughput || '4.2k/s',
      latency: agent.metadata?.latency || '42ms',
      successRate: agent.metadata?.successRate || 98.4,
      visionFps: agent.configuration?.sensory?.vision === 'simd-optimized' ? 34 : undefined,
    },
  };
};

const transformTemplate = (template: AgentTemplate): UIAgent => ({
  id: template.id,
  name: template.name,
  model: template.bank === 'claude' ? 'Claude Bank' : 'TNF Bank',
  provider: template.bank,
  status: 'STANDBY',
  kernel: 'persona',
  type: template.category || 'Library',
  description: template.description,
  bank: template.bank,
  filename: template.filename,
  capabilities: [],
  metrics: {
    throughput: '—',
    latency: '—',
    successRate: 0,
  },
});

const AgentCard = memo(
  ({
    agent,
    mode,
    onForge,
  }: {
    agent: UIAgent;
    mode: 'fleet' | 'library';
    onForge?: (agent: UIAgent) => void;
  }) => {
    const navigate = useNavigate();

    const statusConfig = {
      ACTIVE: {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400',
        border: 'border-emerald-500/20',
      },
      STANDBY: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' },
      FAULT: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
      TUNING: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
    };

    const style = statusConfig[agent.status];

    return (
      <GlassCard
        onClick={() => {
          if (mode === 'library') {
            onForge?.(agent);
            return;
          }
          navigate(`/agents/${agent.id}`);
        }}
        className="group relative p-0 rounded-2xl border border-white/5 bg-slate-900/40 hover:border-amber-500/30 transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-xl"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-slate-800/50">
          <div
            className={`h-full ${style.bg.replace('/10', '')} transition-all duration-500`}
            style={{ width: mode === 'fleet' && agent.status === 'ACTIVE' ? '100%' : '30%' }}
          />
        </div>

        <div className="p-6 space-y-4">
          <div className="flex justify-between items-start gap-3">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-14 h-14 shrink-0 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
                {agent.pfpUrl ? (
                  <img src={agent.pfpUrl} alt={agent.name} className="w-full h-full object-cover" />
                ) : mode === 'library' ? (
                  <BookOpen className="w-7 h-7 text-amber-500/80" />
                ) : (
                  <Bot className="w-7 h-7 text-slate-500" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-black text-white tracking-tight group-hover:text-amber-400 transition-colors uppercase truncate">
                  {agent.name}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge
                    className={`${style.bg} ${style.text} ${style.border} text-[9px] font-black tracking-widest px-2 py-0.5`}
                  >
                    {mode === 'library' ? (agent.bank || 'bank').toUpperCase() : agent.status}
                  </Badge>
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">
                    {mode === 'library' ? agent.filename : agent.kernel}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-2 bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </div>
          </div>

          {agent.description ? (
            <p className="text-xs text-slate-400 line-clamp-2">{agent.description}</p>
          ) : null}

          {mode === 'fleet' ? (
            <div className="grid grid-cols-3 gap-2 text-[10px] uppercase tracking-wider text-slate-500">
              <div>
                <p className="font-black text-slate-600">Throughput</p>
                <p className="text-slate-300 font-bold">{agent.metrics.throughput}</p>
              </div>
              <div>
                <p className="font-black text-slate-600">Latency</p>
                <p className="text-slate-300 font-bold">{agent.metrics.latency}</p>
              </div>
              <div>
                <p className="font-black text-slate-600">Success</p>
                <p className="text-slate-300 font-bold">{agent.metrics.successRate}%</p>
              </div>
            </div>
          ) : (
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-500/80">
              Stock persona · Forge to create live instance
            </p>
          )}
        </div>
      </GlassCard>
    );
  }
);

AgentCard.displayName = 'AgentCard';

type TabMode = 'fleet' | 'library';

export const AgentsRevolution = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = (searchParams.get('tab') || 'fleet').toLowerCase();
  const mode: TabMode = tabParam === 'library' ? 'library' : 'fleet';

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [fleet, setFleet] = useState<UIAgent[]>([]);
  const [library, setLibrary] = useState<UIAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setMode = (next: TabMode) => {
    const params = new URLSearchParams(searchParams);
    if (next === 'fleet') params.delete('tab');
    else params.set('tab', next);
    setSearchParams(params, { replace: true });
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [fleetAgents, templates] = await Promise.all([
        agentService.getFleetAgents().catch((err) => {
          console.error(err);
          return [] as Agent[];
        }),
        agentService.getLibraryTemplates('all').catch((err) => {
          console.error(err);
          return [] as AgentTemplate[];
        }),
      ]);
      setFleet(fleetAgents.map(transformAgent));
      setLibrary(templates.map(transformTemplate));
      if (fleetAgents.length === 0 && templates.length === 0) {
        setError(
          'No fleet instances or stock personas returned. Confirm you are signed in and the agent bank catalog is deployed.'
        );
      }
    } catch (err) {
      console.error('Error fetching fleet/library data:', err);
      setError('CRITICAL: Failed to synchronize with the operative ledger.');
      setFleet([]);
      setLibrary([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const agents = mode === 'fleet' ? fleet : library;

  const filteredAgents = useMemo(
    () =>
      agents.filter((agent) => {
        const q = debouncedSearchQuery.toLowerCase();
        if (!q) return true;
        return (
          agent.name.toLowerCase().includes(q) ||
          agent.model.toLowerCase().includes(q) ||
          (agent.description || '').toLowerCase().includes(q) ||
          (agent.filename || '').toLowerCase().includes(q)
        );
      }),
    [agents, debouncedSearchQuery]
  );

  const handleForge = (agent: UIAgent) => {
    const query = new URLSearchParams({
      templateId: agent.filename || agent.id,
      bank: agent.bank || 'tnf',
      name: agent.name,
    });
    navigate(`/agents/new?${query.toString()}`);
  };

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
                Live instances + stock persona bank
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

        <div className="inline-flex rounded-xl border border-white/10 bg-slate-950/60 p-1 gap-1">
          <button
            type="button"
            onClick={() => setMode('fleet')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-black uppercase tracking-widest transition-colors ${
              mode === 'fleet'
                ? 'bg-amber-500 text-black'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            Fleet ({fleet.length})
          </button>
          <button
            type="button"
            onClick={() => setMode('library')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-black uppercase tracking-widest transition-colors ${
              mode === 'library'
                ? 'bg-amber-500 text-black'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Library className="w-3.5 h-3.5" />
            Library ({library.length})
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {[
            {
              label: mode === 'fleet' ? 'FLEET SIZE' : 'STOCK PERSONAS',
              value: agents.length,
              icon: mode === 'fleet' ? Bot : Library,
              color: 'text-amber-500',
            },
            {
              label: mode === 'fleet' ? 'ACTIVE SYNAPSES' : 'TNF BANK',
              value:
                mode === 'fleet'
                  ? fleet.filter((a) => a.status === 'ACTIVE').length
                  : library.filter((a) => a.bank === 'tnf').length,
              icon: Zap,
              color: 'text-emerald-500',
            },
            {
              label: mode === 'fleet' ? 'AVG LATENCY' : 'CLAUDE BANK',
              value: mode === 'fleet' ? '42ms' : library.filter((a) => a.bank === 'claude').length,
              icon: Clock,
              color: 'text-sky-500',
            },
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

        {error ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
            {error}
          </div>
        ) : null}

        <GlassCard className="p-4 bg-slate-900/40 border-white/5">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex-1 relative group w-full">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4 group-focus-within:text-amber-500 transition-colors" />
              <PremiumInput
                placeholder={
                  mode === 'fleet'
                    ? 'Filter operatives by callsign, model backbone, or directive...'
                    : 'Filter stock personas by name, bank, or filename...'
                }
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
              {mode === 'library' ? (
                <Library className="w-10 h-10 text-slate-700" />
              ) : (
                <Bot className="w-10 h-10 text-slate-700" />
              )}
            </div>
            <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">
              {mode === 'library' ? 'No Stock Personas Found' : 'No Operatives Registered'}
            </h3>
            <p className="text-slate-500 mb-8 max-w-sm mx-auto text-sm font-bold uppercase tracking-tighter">
              {mode === 'library'
                ? 'Package the agent bank catalog or open Library after login.'
                : 'Forge from Library stock or create a new operative.'}
            </p>
            <PremiumButton
              onClick={() => (mode === 'library' ? setMode('fleet') : setMode('library'))}
              className="bg-amber-500 text-black font-black px-10 h-14"
            >
              {mode === 'library' ? 'Back to Fleet' : 'Browse Library'}
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
              <AgentCard key={agent.id} agent={agent} mode={mode} onForge={handleForge} />
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
