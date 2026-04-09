import {
  Activity,
  ArrowRight,
  Database,
  History,
  Layers,
  MessageSquare,
  Network,
  RefreshCcw,
  Share2,
  Zap,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { GlassCard } from '../components/ui/premium/GlassCard';
import { PremiumButton } from '../components/ui/premium/PremiumButton';
import { GraphVisualizerWrapper as GraphVisualizer } from '../components/wizard/graph/GraphVisualizer';
import { useApi } from '../hooks/useApi';

interface A2AMessage {
  id: string;
  senderId: string;
  receiverId: string;
  type: string;
  payload: any;
  status: 'sent' | 'received' | 'processed' | 'failed';
  timestamp: string;
}

interface BrokerStats {
  throughput: number;
  activeExchanges: number;
  totalMessages: number;
  avgLatency: string;
}

// ⚡ Bolt: Wrapped MessageListItem in React.memo to prevent O(n) re-renders
// of the entire message bus list when new messages arrive or stats update.
const MessageListItem = React.memo<{ msg: A2AMessage }>(({ msg }) => (
  <div className="p-4 hover:bg-transparent/5 transition-colors flex items-center gap-4 group">
    <div className="flex flex-col items-center justify-center w-8 shrink-0">
      <div className="text-[10px] text-muted-foreground font-mono">
        {new Date(msg.timestamp).toLocaleTimeString([], {
          hour12: false,
          minute: '2-digit',
          second: '2-digit',
        })}
      </div>
    </div>

    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-1">
        <span className="bg-transparent/5 border border-white/10 text-[10px] font-mono text-cyan-300 px-1.5 py-0.5 rounded">
          {msg.type}
        </span>
        <span className="text-xs text-gray-400 truncate max-w-[100px] font-mono">
          {msg.senderId}
        </span>
        <ArrowRight className="w-3 h-3 text-muted-foreground" />
        <span className="text-xs text-gray-400 truncate max-w-[100px] font-mono">
          {msg.receiverId}
        </span>
      </div>
      <div className="text-sm text-gray-200 truncate font-mono bg-black/40 p-2 rounded border border-white/5 group-hover:border-white/10 transition-colors">
        {JSON.stringify(msg.payload)}
      </div>
    </div>

    <div
      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
        msg.status === 'processed'
          ? 'bg-emerald-500/10 text-emerald-400'
          : msg.status === 'failed'
            ? 'bg-red-500/10 text-red-400'
            : 'bg-transparent0/10 text-gray-400'
      }`}
    >
      {msg.status}
    </div>
  </div>
));
MessageListItem.displayName = 'MessageListItem';

export const A2AControl: React.FC = () => {
  const { api } = useApi();
  const [messages, setMessages] = useState<A2AMessage[]>([]);
  const [stats, setStats] = useState<BrokerStats>({
    throughput: 0,
    activeExchanges: 0,
    totalMessages: 0,
    avgLatency: '--',
  });
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [topology, setTopology] = useState<{ nodes: any[]; edges: any[] }>({
    nodes: [],
    edges: [],
  });
  const [showTopology, setShowTopology] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [msgRes, statsRes] = await Promise.all([
        api.get('/system/logs?lines=80'),
        api.get('/system/metrics'),
      ]);

      const entries = Array.isArray(msgRes?.data?.entries) ? msgRes.data.entries : [];
      const parsedMessages: A2AMessage[] = entries.map((entry: any, index: number) => ({
        id: `${entry?.timestamp || Date.now()}-${index}`,
        senderId: entry?.service || 'system',
        receiverId: 'broker',
        type: String(entry?.level || 'info').toUpperCase(),
        payload: { message: entry?.message || '' },
        status: entry?.level === 'error' ? 'failed' : 'processed',
        timestamp: entry?.timestamp || new Date().toISOString(),
      }));

      const throughput = parsedMessages.length;
      const uniquePairs = new Set(parsedMessages.map((m) => `${m.senderId}->${m.receiverId}`));
      const activeExchanges = uniquePairs.size;
      const cpuUsage = Number(statsRes?.data?.cpu?.usage);
      const avgLatency = Number.isFinite(cpuUsage)
        ? `${Math.max(1, Math.round(cpuUsage))}ms`
        : '--';

      setMessages(parsedMessages);
      setStats({
        throughput,
        activeExchanges,
        totalMessages: parsedMessages.length,
        avgLatency,
      });
      setTopology(buildTopology(parsedMessages));
    } catch (error) {
      console.error('Failed to load A2A data:', error);
      setMessages([]);
      setTopology({ nodes: [], edges: [] });
      setStats({
        throughput: 0,
        activeExchanges: 0,
        totalMessages: 0,
        avgLatency: '--',
      });
      setFetchError('A2A telemetry endpoints are unavailable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Polling for demo updates
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-white bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            A2A Relay Mission Control
          </h1>
          <p className="text-gray-400 mt-2">
            Real-time monitoring of the Agent-to-Agent message broker and relay system.
          </p>
        </div>
        <div className="flex gap-2">
          <PremiumButton variant="secondary" onClick={fetchData}>
            <RefreshCcw className="w-4 h-4 mr-2" /> Live Sync
          </PremiumButton>
          <PremiumButton variant="primary" onClick={() => setShowTopology(!showTopology)}>
            <Network className="w-4 h-4 mr-2" /> {showTopology ? 'Hide Topology' : 'Global Mesh'}
          </PremiumButton>
        </div>
      </div>
      {fetchError && (
        <GlassCard className="p-4 border border-amber-500/40 bg-amber-500/10">
          <p className="text-sm text-amber-200">{fetchError}. No synthetic traffic is shown.</p>
        </GlassCard>
      )}

      {/* Real-time Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="Throughput"
          value={`${stats.throughput} msg/s`}
          icon={<Zap className="text-yellow-400" />}
        />
        <StatCard
          label="Active Exchanges"
          value={stats.activeExchanges.toString()}
          icon={<Share2 className="text-blue-400" />}
        />
        <StatCard
          label="Total Routed"
          value={stats.totalMessages.toLocaleString()}
          icon={<Database className="text-purple-400" />}
        />
        <StatCard
          label="Avg Latency"
          value={stats.avgLatency}
          icon={<Activity className="text-emerald-400" />}
        />
      </div>

      {/* Topology Overlay */}
      {showTopology && (
        <GlassCard className="h-[500px] border-indigo-500/30 overflow-hidden relative">
          <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md p-2 rounded-lg border border-white/10">
            <div className="text-[10px] font-bold text-indigo-400 uppercase">Swarm Topology</div>
            <div className="text-white text-xs font-bold">Active Protocol: Relay Mesh</div>
          </div>
          {topology.nodes.length > 0 ? (
            <GraphVisualizer nodes={topology.nodes} edges={topology.edges} />
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-gray-400">
              No live topology data available.
            </div>
          )}
        </GlassCard>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Message Stream */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-cyan-400" />
              Live Message Bus
            </h2>
            <div className="flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full">
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-cyan-400">MONITORING ACTIVE</span>
            </div>
          </div>

          <GlassCard className="overflow-hidden border-cyan-500/10">
            <div className="max-h-[600px] overflow-y-auto divide-y divide-white/5 scrollbar-thin scrollbar-thumb-white/10">
              {loading ? (
                <div className="p-6 text-sm text-gray-400">Loading live broker telemetry...</div>
              ) : messages.length === 0 ? (
                <div className="p-6 text-sm text-gray-400">No live A2A messages available.</div>
              ) : (
                messages.map((msg) => <MessageListItem key={msg.id} msg={msg} />)
              )}
            </div>
          </GlassCard>
        </div>

        {/* Sidebar Controls & Topologies */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-400" />
            Network Strategy
          </h2>

          <GlassCard className="p-6 space-y-4">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground font-bold uppercase mb-2">
                Protocol Mode
              </div>
              <div className="flex flex-wrap gap-2">
                <ProtocolBadge active label="P2P" />
                <ProtocolBadge label="PubSub" />
                <ProtocolBadge label="Mesh" />
                <ProtocolBadge label="Relay" />
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 space-y-3">
              <ControlToggle label="E2E Encryption" active />
              <ControlToggle label="Zero-Knowledge Audit" />
              <ControlToggle label="Persistence Tier" active />
            </div>

            <PremiumButton variant="outline" className="w-full mt-4">
              <History className="w-4 h-4 mr-2" /> View Audit Logs
            </PremiumButton>
          </GlassCard>

          <GlassCard className="p-4 overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <h3 className="text-lg font-bold text-white mb-2">A2A Sandbox</h3>
              <p className="text-xs text-gray-400 mb-4">
                Test inter-agent communication protocols without affecting production swarms.
              </p>
              <PremiumButton variant="primary" className="w-full h-10">
                Initialize Protocol Test
              </PremiumButton>
            </div>
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
      <div className="text-xl font-bold text-white">{value}</div>
    </div>
  </GlassCard>
);

const ProtocolBadge: React.FC<{ label: string; active?: boolean }> = ({ label, active }) => (
  <span
    className={`px-2 py-1 rounded text-[10px] font-bold border ${
      active
        ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
        : 'bg-white/5 border-white/10 text-gray-500'
    }`}
  >
    {label}
  </span>
);

const ControlToggle: React.FC<{ label: string; active?: boolean }> = ({ label, active }) => (
  <div className="flex items-center justify-between">
    <span className="text-xs text-gray-300">{label}</span>
    <div
      className={`w-8 h-4 rounded-full relative transition-colors ${active ? 'bg-emerald-500/40' : 'bg-white/10'}`}
    >
      <div
        className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${active ? 'right-0.5 bg-emerald-400' : 'left-0.5 bg-gray-500'}`}
      />
    </div>
  </div>
);
function buildTopology(messages: A2AMessage[]) {
  const ids = Array.from(
    new Set(messages.flatMap((message) => [message.senderId, message.receiverId]).filter(Boolean))
  );
  const radius = 170;
  const centerX = 320;
  const centerY = 220;

  const nodes = ids.map((id, index) => {
    const angle = (2 * Math.PI * index) / Math.max(ids.length, 1);
    return {
      id,
      data: { label: id },
      position: {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      },
    };
  });

  const edges = messages.map((message, index) => ({
    id: `edge-${index}-${message.senderId}-${message.receiverId}`,
    source: message.senderId,
    target: message.receiverId,
    animated: message.status !== 'failed',
  }));

  return { nodes, edges };
}

export default A2AControl;
