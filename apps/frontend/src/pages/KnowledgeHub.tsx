import { Book, Database, Layers, Search, Settings, Shield, Upload, Zap } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { MemoryVisualizer } from '../components/memory/visualization/MemoryVisualizer';
import { GlassCard } from '../components/ui/premium/GlassCard';
import { PremiumButton } from '../components/ui/premium/PremiumButton';

interface VectorIndex {
  id: string;
  name: string;
  dimension: number;
  metric: string;
  vectorsCount: number;
  status: 'ready' | 'indexing' | 'error';
}

export const KnowledgeHub: React.FC = () => {
  const [indices, setIndices] = useState<VectorIndex[]>([]);
  const [clusters, setClusters] = useState<any[]>([]);
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchKnowledgeData = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [indicesResponse, clustersResponse] = await Promise.all([
        fetch('/api/knowledge/indices'),
        fetch('/api/knowledge/clusters'),
      ]);

      const nextIndices =
        indicesResponse.ok &&
        (indicesResponse.headers.get('content-type') || '').includes('application/json')
          ? await indicesResponse.json()
          : [];
      const nextClusters =
        clustersResponse.ok &&
        (clustersResponse.headers.get('content-type') || '').includes('application/json')
          ? await clustersResponse.json()
          : [];

      setIndices(Array.isArray(nextIndices) ? nextIndices : []);
      setClusters(Array.isArray(nextClusters) ? nextClusters : []);
      if (!indicesResponse.ok || !clustersResponse.ok) {
        setFetchError('Knowledge APIs are partially unavailable');
      }
    } catch (error) {
      console.error('Failed to fetch knowledge data:', error);
      setIndices([]);
      setClusters([]);
      setFetchError('Knowledge APIs are unavailable');
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
          <p className="text-gray-400 mt-2">
            Manage vector embeddings, semantic indices, and agent memory clusters.
          </p>
        </div>
        <div className="flex gap-2">
          <PremiumButton variant="secondary" onClick={fetchKnowledgeData}>
            <Search className="w-4 h-4 mr-2" /> Semantic Search
          </PremiumButton>
          <PremiumButton variant="primary">
            <Upload className="w-4 h-4 mr-2" /> Ingest Documents
          </PremiumButton>
        </div>
      </div>
      {fetchError && (
        <GlassCard className="p-4 border border-amber-500/40 bg-amber-500/10">
          <p className="text-sm text-amber-200">{fetchError}. No synthetic index data is shown.</p>
        </GlassCard>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Total Vectors"
          value={indices.reduce((total, index) => total + index.vectorsCount, 0).toLocaleString()}
          icon={<Database className="text-purple-400" />}
        />
        <StatCard
          label="Memory Clusters"
          value={clusters.length.toString()}
          icon={<Layers className="text-blue-400" />}
        />
        <StatCard label="Avg Search Query" value="--" icon={<Zap className="text-amber-400" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Indices Management */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Book className="w-5 h-5 text-purple-400" />
            Vector Indices
          </h2>
          {showVisualizer ? (
            <div className="h-[600px] w-full mb-8">
              <MemoryVisualizer clusters={clusters} />
              <PremiumButton
                variant="ghost"
                className="mt-2 text-rose-400"
                onClick={() => setShowVisualizer(false)}
              >
                Close Visualizer
              </PremiumButton>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loading ? (
                <GlassCard className="p-4 text-sm text-gray-400">
                  Loading knowledge indices...
                </GlassCard>
              ) : indices.length === 0 ? (
                <GlassCard className="p-4 text-sm text-gray-400">
                  No live vector indices available.
                </GlassCard>
              ) : (
                indices.map((index) => (
                  <GlassCard
                    key={index.id}
                    className="p-4 border-white/5 hover:border-purple-500/30 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          index.status === 'ready'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}
                      >
                        {index.status}
                      </span>
                      <Settings className="w-4 h-4 text-foreground group-hover:text-gray-400 transition-colors" />
                    </div>
                    <h3 className="text-lg font-bold text-white">{index.name}</h3>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Dimensions</span>
                        <span className="text-gray-300">{index.dimension}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Metric</span>
                        <span className="text-gray-300">{index.metric}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Vectors</span>
                        <span className="text-gray-300">{index.vectorsCount.toLocaleString()}</span>
                      </div>
                    </div>
                  </GlassCard>
                ))
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            Memory Security
          </h2>
          <GlassCard className="p-4 space-y-4">
            <p className="text-xs text-gray-400">
              Knowledge is stored in sovereign isolation per agency. Encryption is handled at the
              Vector Store layer.
            </p>
            <div className="pt-2 space-y-2">
              <SecurityToggle label="Private Memory" active />
              <SecurityToggle label="Shared Intelligence" />
              <SecurityToggle label="Automated Pruning" active />
            </div>
          </GlassCard>

          <GlassCard className="p-4 bg-gradient-to-br from-purple-600/10 to-transparent">
            <h3 className="text-lg font-bold text-white mb-2">Memory Studio</h3>
            <p className="text-xs text-gray-400 mb-4">
              Visualize agent relationships and semantic clusters in 3D space.
            </p>
            <PremiumButton
              variant="outline"
              className="w-full"
              onClick={() => setShowVisualizer(true)}
            >
              Launch Visualizer
            </PremiumButton>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({
  label,
  value,
  icon,
}) => (
  <GlassCard className="p-4 flex items-center gap-4">
    <div className="w-12 h-12 rounded-md bg-transparent/5 border border-white/10 flex items-center justify-center">
      {icon}
    </div>
    <div>
      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
        {label}
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  </GlassCard>
);

const SecurityToggle: React.FC<{ label: string; active?: boolean }> = ({ label, active }) => (
  <div className="flex items-center justify-between">
    <span className="text-xs text-gray-300">{label}</span>
    <div
      className={`w-8 h-4 rounded-full relative transition-colors ${active ? 'bg-emerald-500/40' : 'bg-transparent/10'}`}
    >
      <div
        className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${active ? 'right-0.5 bg-emerald-400' : 'left-0.5 bg-transparent0'}`}
      />
    </div>
  </div>
);

export default KnowledgeHub;
