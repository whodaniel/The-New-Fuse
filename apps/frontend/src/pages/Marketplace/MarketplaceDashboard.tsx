// @ts-nocheck
import { Badge, GlassCard, PremiumButton, PremiumInput } from '@/components/ui';
import { useAuthorization } from '@/hooks/useAuthorization';
import {
  marketplaceService,
  type MarketplaceCatalogItem,
  type MarketplaceKind,
} from '@/services/marketplace.service';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Boxes,
  Brain,
  Cpu,
  Eye,
  Fingerprint,
  HardDrive,
  LayoutGrid,
  Network,
  Plus,
  Search,
  ShieldCheck,
  Terminal,
  Wand2,
} from 'lucide-react';
import { useState } from 'react';

const TABS: { id: 'all' | MarketplaceKind; label: string; icon: any }[] = [
  { id: 'all', label: 'All Primitives', icon: LayoutGrid },
  { id: 'skill', label: 'Sensory & Skills', icon: Eye },
  { id: 'workflow', label: 'Synapses', icon: Network },
  { id: 'agent_template', label: 'Operatives', icon: Brain },
  { id: 'model', label: 'Neural Backbones', icon: Cpu },
  { id: 'mcp_server', label: 'Hardware Hubs', icon: HardDrive },
];

function kindIcon(kind: MarketplaceKind) {
  if (kind === 'workflow') return <Network className="w-4 h-4" />;
  if (kind === 'mcp_server') return <HardDrive className="w-4 h-4" />;
  if (kind === 'skill') return <Eye className="w-4 h-4" />;
  if (kind === 'agent_template') return <Brain className="w-4 h-4" />;
  if (kind === 'model') return <Cpu className="w-4 h-4" />;
  return <Terminal className="w-4 h-4" />;
}

export default function MarketplaceDashboard() {
  const { isAdmin } = useAuthorization();
  const [tab, setTab] = useState<'all' | MarketplaceKind>('all');
  const [search, setSearch] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['marketplace-catalog', tab, search],
    queryFn: () =>
      marketplaceService.getCatalog({
        kind: tab === 'all' ? undefined : tab,
        status: 'published',
        q: search.trim() || undefined,
      }),
  });

  const items = data?.items || [];

  return (
    <div className="dark min-h-screen bg-[#020617] text-slate-100 p-4 lg:p-10 space-y-12 relative overflow-hidden">
      {/* Dynamic Background */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-amber-500">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Intelligence Catalog
            </div>
            <div>
              <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">
                Nexus Marketplace
              </h1>
              <p className="text-slate-400 font-bold uppercase text-xs tracking-[0.2em] mt-3 flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-amber-500" />
                Augment the Hive with Hardware-Intimate Primitives
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <PremiumButton
              variant="outline"
              onClick={() => refetch()}
              className="border-slate-800 bg-slate-900/50 text-slate-400 h-12 px-6"
            >
              Refresh Index
            </PremiumButton>
            <PremiumButton className="bg-amber-500 hover:bg-amber-600 text-black font-black h-12 px-8 shadow-lg shadow-amber-500/10">
              <Plus className="mr-2 h-5 w-5" />
              Propose Primitive
            </PremiumButton>
          </div>
        </header>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'CATALOG SIZE', value: items.length, icon: Boxes, color: 'text-amber-500' },
          {
            label: 'SENSORY NODES',
            value: items.filter((i: MarketplaceCatalogItem) => i.category === 'sensory').length,
            icon: Eye,
            color: 'text-sky-500',
          },
          {
            label: 'FORGE BLUPRINTS',
            value: items.filter((i: MarketplaceCatalogItem) => i.kind === 'workflow').length,
            icon: Wand2,
            color: 'text-fuchsia-500',
          },
          {
            label: 'NEURAL BACKBONES',
            value: items.filter((i: MarketplaceCatalogItem) => i.kind === 'model').length,
            icon: Cpu,
            color: 'text-emerald-500',
          },
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
        <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
          <div className="flex-1 relative group w-full">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4 group-focus-within:text-amber-500 transition-colors" />
            <PremiumInput
              placeholder="Search by capability, tag, or hardware spec..."
              className="pl-12 h-14 bg-slate-950/50 border-slate-800 text-slate-100 placeholder:text-slate-600"
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded-xl border border-white/5 overflow-x-auto max-w-full">
            {TABS.map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  tab === item.id
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {isLoading ? (
        <div className="py-32 text-center space-y-4">
          <div className="w-12 h-12 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 text-xs font-black uppercase tracking-[0.3em]">
            Syncing Intelligence Hub...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item: MarketplaceCatalogItem) => (
            <GlassCard
              key={item.id}
              className="group relative p-0 rounded-2xl border border-white/5 bg-slate-900/40 hover:border-amber-500/30 transition-all duration-300 overflow-hidden backdrop-blur-xl"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-slate-800 group-hover:bg-amber-500 transition-colors" />
              <div className="p-6 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xl">
                      {kindIcon(item.kind)}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white tracking-tight group-hover:text-amber-400 transition-colors uppercase leading-tight">
                        {item.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-slate-950 border-slate-800 text-slate-500 text-[9px] font-black uppercase px-2 py-0.5">
                          {item.category}
                        </Badge>
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">
                          {item.successRate}% Success
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-black text-white">
                      {item.pricePerRun === 0 ? 'FREE' : `$${item.pricePerRun}`}
                    </div>
                    <p className="text-[8px] text-slate-500 font-bold uppercase mt-0.5">
                      Per Execution
                    </p>
                  </div>
                </div>

                <p className="text-slate-400 text-sm line-clamp-2 leading-relaxed font-medium">
                  {item.description}
                </p>

                <div className="space-y-3">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">
                    Hardware Capabilities
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {item.capabilities.slice(0, 3).map((cap: string) => (
                      <Badge
                        key={cap}
                        className="bg-white/5 text-slate-400 border-white/5 text-[9px] font-black uppercase"
                      >
                        {cap.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {item.status}
                    </span>
                  </div>
                  <PremiumButton
                    variant="outline"
                    size="sm"
                    className="border-slate-800 h-8 px-4 text-[10px] font-black uppercase bg-slate-900/50 hover:bg-slate-800"
                  >
                    Clone Primitive
                  </PremiumButton>
                </div>
              </div>
            </GlassCard>
          ))}
          {items.length === 0 && (
            <div className="col-span-full py-32 text-center bg-slate-950/20 rounded-[3rem] border border-dashed border-slate-800 opacity-50">
              <Boxes className="w-12 h-12 mx-auto mb-4 text-slate-700" />
              <p className="text-xs font-black uppercase tracking-widest">
                No primitives detected in this sector
              </p>
            </div>
          )}
        </div>
      )}

      <footer className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 opacity-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 tracking-widest">
            <Fingerprint className="w-3.5 h-3.5" /> Identity:{' '}
            <span className="text-emerald-500">AUTHENTICATED</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 tracking-widest">
            <Network className="w-3.5 h-3.5" /> Synaptic Link:{' '}
            <span className="text-sky-500">ACTIVE</span>
          </div>
        </div>
        <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">
          © 2026 THE NEW FUSE • NEXUS-CATALOG-V1
        </p>
      </footer>
    </div>
  );
}
