import {
  Activity,
  Cpu,
  Database,
  Globe,
  Layers,
  Maximize,
  Network,
  RefreshCcw,
  Search,
  Shield,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';
import { MemoryVisualizer } from '../components/memory/visualization/MemoryVisualizer';
import { GlassCard } from '../components/ui/premium/GlassCard';
import { PremiumButton } from '../components/ui/premium/PremiumButton';
import { GalaxyVisualizer } from '../components/wizard/graph/GalaxyVisualizer';

export const SystemObservatory: React.FC = () => {
  const [activeLayer, setActiveLayer] = useState<'topology' | 'semantic' | 'metrics'>('topology');

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/20 shadow-2xl">
            <Globe className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-widest uppercase">
              System{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                Observatory
              </span>
            </h1>
            <p className="text-gray-500 font-mono text-sm uppercase tracking-widest">
              Global Fleet Intelligence & Node Topology
            </p>
          </div>
        </div>

        <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/10 backdrop-blur-md">
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
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 h-[700px]">
        <div className="xl:col-span-3 h-full">
          {activeLayer === 'topology' && (
            <div className="h-full">
              <GalaxyVisualizer nodes={MOCK_NODES} edges={MOCK_EDGES} />
            </div>
          )}
          {activeLayer === 'semantic' && (
            <div className="h-full">
              <MemoryVisualizer clusters={MOCK_SEMANTIC_CLUSTERS} />
            </div>
          )}
          {activeLayer === 'metrics' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
              <MetricsCard title="Network Latency" color="blue" />
              <MetricsCard title="Throughput (msg/s)" color="purple" />
              <MetricsCard title="Memory Usage" color="emerald" />
              <MetricsCard title="Agent Satisfaction" color="amber" />
            </div>
          )}
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          <h2 className="text-sm font-black text-gray-500 uppercase tracking-[0.2em] mb-4">
            Live Context
          </h2>

          <GlassCard className="p-6 border-white/5 space-y-6">
            <SidebarStat
              label="Active Nodes"
              value="142"
              icon={<Cpu className="text-blue-400" />}
            />
            <SidebarStat
              label="Agencies"
              value="12"
              icon={<Layers className="text-purple-400" />}
            />
            <SidebarStat
              label="Throughput"
              value="2.4k/s"
              icon={<Zap className="text-amber-400" />}
            />
            <SidebarStat
              label="Security Level"
              value="Level 4"
              icon={<Shield className="text-emerald-400" />}
            />
          </GlassCard>

          <GlassCard className="p-6 bg-indigo-600/5 border-indigo-500/20">
            <h3 className="text-white font-bold mb-2 flex items-center gap-2">
              <RefreshCcw className="w-4 h-4 text-indigo-400 animate-spin-slow" />
              Auto-Discovery
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed mb-4">
              New agents are automatically indexed into the semantic space and message bus.
            </p>
            <PremiumButton variant="outline" className="w-full text-[10px] py-1 h-8">
              Re-scan Fleet
            </PremiumButton>
          </GlassCard>

          <div className="p-4 rounded-xl border border-white/5 bg-black/40">
            <div className="text-[10px] font-bold text-gray-500 uppercase mb-2">
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

const TabButton: React.FC<{
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}> = ({ active, icon, label, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
      active
        ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]'
        : 'text-gray-400 hover:text-white hover:bg-white/5'
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
      <div className="p-2 rounded-lg bg-white/5 border border-white/5">{icon}</div>
      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</span>
    </div>
    <span className="text-sm font-black text-white">{value}</span>
  </div>
);

const MetricsCard: React.FC<{ title: string; color: 'blue' | 'purple' | 'emerald' | 'amber' }> = ({
  title,
  color,
}) => {
  const colors = {
    blue: 'border-blue-500/30 text-blue-400',
    purple: 'border-purple-500/30 text-purple-400',
    emerald: 'border-emerald-500/30 text-emerald-400',
    amber: 'border-amber-500/30 text-amber-400',
  };
  return (
    <GlassCard
      className={`p-6 ${colors[color]} relative flex flex-col justify-end overflow-hidden`}
    >
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Activity className="w-24 h-24" />
      </div>
      <div className="text-[10px] font-black uppercase tracking-[0.2em] mb-1">{title}</div>
      <div className="text-2xl font-bold text-white">NORMALIZED</div>
      <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
        <div className="h-full w-2/3 bg-current" />
      </div>
    </GlassCard>
  );
};

const SmallAction: React.FC<{ icon: React.ReactNode }> = ({ icon }) => (
  <button className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-500 hover:text-white hover:bg-white/10 transition-all">
    {React.cloneElement(icon as React.ReactElement, { className: 'w-4 h-4' })}
  </button>
);

const MOCK_NODES = [
  { id: '1', data: { label: 'US-East-1' }, position: { x: 250, y: 50 }, type: 'input' },
  { id: '2', data: { label: 'EU-Central-1' }, position: { x: 100, y: 150 } },
  { id: '3', data: { label: 'AP-South-1' }, position: { x: 400, y: 150 } },
  { id: '4', data: { label: 'Relay-Core' }, position: { x: 250, y: 250 }, type: 'output' },
];

const MOCK_EDGES = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e1-3', source: '1', target: '3', animated: true },
  { id: 'e2-4', source: '2', target: '4' },
  { id: 'e3-4', source: '3', target: '4' },
];

const MOCK_SEMANTIC_CLUSTERS = [
  {
    id: 'c1',
    label: 'Aura Protocol',
    items: [
      {
        id: 'p1',
        content: 'Initialization logic for sub-second handshake',
        metadata: { confidence: 0.99, source: 'sys' },
      },
      {
        id: 'p2',
        content: 'Quantum-safe key exchange',
        metadata: { confidence: 0.91, source: 'sec' },
      },
    ],
  },
  {
    id: 'c2',
    label: 'Sovereign ID',
    items: [
      {
        id: 'p3',
        content: 'Zero-knowledge proofs for agent identity',
        metadata: { confidence: 0.95, source: 'auth' },
      },
    ],
  },
];

export default SystemObservatory;
