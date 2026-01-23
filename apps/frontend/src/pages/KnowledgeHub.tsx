import {
  Book,
  Database,
  Layers,
  Search,
  Settings,
  Shield,
  Upload,
  Zap,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { GlassCard } from '../components/ui/premium/GlassCard';
import { PremiumButton } from '../components/ui/premium/PremiumButton';
import { useApi } from '../hooks/useApi';
import { MemoryVisualizer } from '../components/memory/visualization/MemoryVisualizer';

interface VectorIndex {
  id: string;
  name: string;
  dimension: number;
  metric: string;
  vectorsCount: number;
  status: 'ready' | 'indexing' | 'error';
}

export const KnowledgeHub: React.FC = () => {
  const { api } = useApi();
  const [indices, setIndices] = useState<VectorIndex[]>([]);
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchKnowledgeData = async () => {
    try {
      // Real backend endpoint for vector store if it exists
      await api.get('/monitoring/metrics'); // fallback for demo
      setIndices(MOCK_INDICES);
    } catch (e) {
      setIndices(MOCK_INDICES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKnowledgeData();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-white bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Sovereign Knowledge Hub
          </h1>
          <p className="text-gray-400 mt-2">Manage vector embeddings, semantic indices, and agent memory clusters.</p>
        </div>
        <div className="flex gap-2">
            <PremiumButton variant="secondary">
                <Search className="w-4 h-4 mr-2" /> Semantic Search
            </PremiumButton>
            <PremiumButton variant="primary">
                <Upload className="w-4 h-4 mr-2" /> Ingest Documents
            </PremiumButton>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Total Vectors" value="1.2M" icon={<Database className="text-purple-400" />} />
        <StatCard label="Memory Clusters" value="24" icon={<Layers className="text-blue-400" />} />
        <StatCard label="Avg Search Query" value="18ms" icon={<Zap className="text-amber-400" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Indices Management */}
        <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Book className="w-5 h-5 text-purple-400" />
                Vector Indices
            </h2>
            {showVisualizer ? (
                <div className="h-[600px] w-full mb-8">
                    <MemoryVisualizer clusters={MOCK_CLUSTERS} />
                    <PremiumButton variant="ghost" className="mt-2 text-rose-400" onClick={() => setShowVisualizer(false)}>
                        Close Visualizer
                    </PremiumButton>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {indices.map(index => (
                    <GlassCard key={index.id} className="p-5 border-white/5 hover:border-purple-500/30 transition-all group">
                        <div className="flex items-center justify-between mb-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                index.status === 'ready' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                            }`}>
                                {index.status}
                            </span>
                            <Settings className="w-4 h-4 text-gray-700 group-hover:text-gray-400 transition-colors" />
                        </div>
                        <h3 className="text-lg font-bold text-white">{index.name}</h3>
                        <div className="mt-4 space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Dimensions</span>
                                <span className="text-gray-300">{index.dimension}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Metric</span>
                                <span className="text-gray-300">{index.metric}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Vectors</span>
                                <span className="text-gray-300">{index.vectorsCount.toLocaleString()}</span>
                            </div>
                        </div>
                    </GlassCard>
                ))}
                </div>
            )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                Memory Security
            </h2>
            <GlassCard className="p-6 space-y-4">
                <p className="text-xs text-gray-400">Knowledge is stored in sovereign isolation per agency. Encryption is handled at the Vector Store layer.</p>
                <div className="pt-2 space-y-2">
                    <SecurityToggle label="Private Memory" active />
                    <SecurityToggle label="Shared Intelligence" />
                    <SecurityToggle label="Automated Pruning" active />
                </div>
            </GlassCard>

            <GlassCard className="p-6 bg-gradient-to-br from-purple-600/10 to-transparent">
                <h3 className="text-lg font-bold text-white mb-2">Memory Studio</h3>
                <p className="text-xs text-gray-400 mb-4">Visualize agent relationships and semantic clusters in 3D space.</p>
                <PremiumButton variant="outline" className="w-full" onClick={() => setShowVisualizer(true)}>
                    Launch Visualizer
                </PremiumButton>
            </GlassCard>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({ label, value, icon }) => (
  <GlassCard className="p-4 flex items-center gap-4">
    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
      {icon}
    </div>
    <div>
      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  </GlassCard>
);

const SecurityToggle: React.FC<{ label: string; active?: boolean }> = ({ label, active }) => (
  <div className="flex items-center justify-between">
    <span className="text-xs text-gray-300">{label}</span>
    <div className={`w-8 h-4 rounded-full relative transition-colors ${active ? 'bg-emerald-500/40' : 'bg-white/10'}`}>
      <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${active ? 'right-0.5 bg-emerald-400' : 'left-0.5 bg-gray-500'}`} />
    </div>
  </div>
);

const MOCK_INDICES: VectorIndex[] = [
  { id: '1', name: 'Document Index', dimension: 1536, metric: 'cosine', vectorsCount: 452000, status: 'ready' },
  { id: '2', name: 'Agent Memory', dimension: 1536, metric: 'euclidean', vectorsCount: 124000, status: 'ready' },
  { id: '3', name: 'Market Data', dimension: 768, metric: 'dot_product', vectorsCount: 654000, status: 'indexing' },
];

const MOCK_CLUSTERS = [
    {
        id: 'cluster-1',
        label: 'Financial Algorithms',
        items: [
            { id: 'i1', content: 'Portfolio Optimization V2', metadata: { confidence: 0.95, source: 'alg-v2-final' } },
            { id: 'i2', content: 'Risk Assessment Module', metadata: { confidence: 0.88, source: 'risk-engine' } },
            { id: 'i3', content: 'Arbitrage Strategy 7', metadata: { confidence: 0.92, source: 'market-data-hub' } }
        ]
    },
    {
        id: 'cluster-2',
        label: 'Natural Language Memory',
        items: [
            { id: 'i4', content: 'Draft of Q1 Report', metadata: { confidence: 0.99, source: 'writer-agent' } },
            { id: 'i5', content: 'Meeting Notes: Core Design', metadata: { confidence: 0.85, source: 'coord-agent' } }
        ]
    },
    {
        id: 'cluster-3',
        label: 'Network Topologies',
        items: [
            { id: 'i6', content: 'Mesh Gateway Config', metadata: { confidence: 0.94, source: 'net-admin' } }
        ]
    }
];

export default KnowledgeHub;
