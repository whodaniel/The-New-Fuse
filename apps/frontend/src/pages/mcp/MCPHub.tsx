import { GlassCard } from '@/components/ui/premium/GlassCard';
import { PremiumButton } from '@/components/ui/premium/PremiumButton';
import { useApi } from '@/hooks/useApi';
import {
  Activity,
  Box,
  Cpu,
  Globe,
  Layout,
  Play,
  RotateCcw,
  Search,
  Settings,
  Shield,
  Square,
  Zap,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface MCPServer {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'starting' | 'error';
  type: string;
  tools: number;
  resources: number;
  lastActive?: string;
}

export const MCPHub: React.FC = () => {
  const api = useApi();
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchServers = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const response = await api.get('/mcp/servers');
      if (response?.success && Array.isArray(response.data)) {
        setServers(response.data);
      } else {
        setServers([]);
        setFetchError('MCP server inventory endpoint is unavailable');
      }
    } catch (error) {
      console.error('Failed to fetch MCP servers:', error);
      setServers([]);
      setFetchError('MCP server inventory endpoint is unavailable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServers();
  }, []);

  const handleStartServer = async (id: string) => {
    await api.post(`/mcp/servers/${id}/start`);
    fetchServers();
  };

  const handleStopServer = async (id: string) => {
    await api.post(`/mcp/servers/${id}/stop`);
    fetchServers();
  };

  const filteredServers = servers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            MCP Orchestration Hub
          </h1>
          <p className="text-gray-400 mt-2">
            Manage, monitor, and scale your Model Context Protocol infrastructure.
          </p>
        </div>
        <div className="flex gap-2">
          <PremiumButton onClick={fetchServers} variant="secondary">
            <RotateCcw className="w-4 h-4 mr-2" /> Refresh
          </PremiumButton>
          <PremiumButton variant="primary">
            <Zap className="w-4 h-4 mr-2" /> Deploy New Server
          </PremiumButton>
        </div>
      </div>
      {fetchError && (
        <GlassCard className="p-4 border border-amber-500/40 bg-amber-500/10">
          <p className="text-amber-200 text-sm">{fetchError}. Live data could not be loaded.</p>
        </GlassCard>
      )}

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          icon={<Cpu className="text-blue-400" />}
          label="Active Servers"
          value={servers.filter((s) => s.status === 'running').length.toString()}
        />
        <MetricCard
          icon={<Zap className="text-yellow-400" />}
          label="Total Tools"
          value={servers.reduce((acc, s) => acc + s.tools, 0).toString()}
        />
        <MetricCard
          icon={<Box className="text-purple-400" />}
          label="Shared Resources"
          value={servers.reduce((acc, s) => acc + s.resources, 0).toString()}
        />
        <MetricCard
          icon={<Activity className="text-green-400" />}
          label="System Uptime"
          value="99.98%"
        />
      </div>

      {/* Control Panel */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Filter by name, type, or tool..."
              className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <PremiumButton variant="outline" className="h-10 px-4">
            <Settings className="w-4 h-4" />
          </PremiumButton>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-500 text-sm border-b border-white/10">
                <th className="pb-3 font-semibold">Server Identity</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Capabilities</th>
                <th className="pb-3 font-semibold">System Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-400 animate-pulse">
                    Synchronizing with MCP Bridge...
                  </td>
                </tr>
              ) : filteredServers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-400">
                    No active MCP servers found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredServers.map((server) => (
                  <tr key={server.id} className="hover:bg-white/5 transition-colors group">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center border border-white/10">
                          {server.type === 'remote' ? (
                            <Globe className="w-5 h-5 text-blue-400" />
                          ) : (
                            <Layout className="w-5 h-5 text-purple-400" />
                          )}
                        </div>
                        <div>
                          <div className="text-white font-medium">{server.name}</div>
                          <div className="text-xs text-gray-500 font-mono capitalize">
                            {server.type} Protocol
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            server.status === 'running'
                              ? 'bg-green-500 animate-pulse'
                              : server.status === 'error'
                                ? 'bg-red-500'
                                : 'bg-gray-500'
                          }`}
                        />
                        <span className="text-sm text-gray-300 capitalize">{server.status}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex gap-4">
                        <div className="text-center">
                          <div className="text-white font-semibold">{server.tools}</div>
                          <div className="text-[10px] text-gray-500 uppercase tracking-tighter">
                            Tools
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-white font-semibold">{server.resources}</div>
                          <div className="text-[10px] text-gray-500 uppercase tracking-tighter">
                            Res.
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {server.status === 'running' ? (
                          <button
                            onClick={() => handleStopServer(server.id)}
                            className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                            title="Stop Instance"
                          >
                            <Square className="w-4 h-4 fill-current" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStartServer(server.id)}
                            className="p-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all"
                            title="Start Instance"
                          >
                            <Play className="w-4 h-4 fill-current" />
                          </button>
                        )}
                        <button
                          className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all"
                          title="Configure Tools"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Advanced Features Hub */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <FeatureLink
          icon={<Shield className="text-green-400" />}
          title="Security Sandbox"
          description="Manage ACLs and permissions for tools executing on host machine."
          action="Manage Policies"
        />
        <FeatureLink
          icon={<Globe className="text-blue-400" />}
          title="Distributed Relays"
          description="Connect to remote MCP servers over WebSocket or SSE tunnels."
          action="Manage Tunnels"
        />
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({
  icon,
  label,
  value,
}) => (
  <GlassCard className="p-4 flex items-center gap-4">
    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
      {icon}
    </div>
    <div>
      <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">{label}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  </GlassCard>
);

const FeatureLink: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  action: string;
}> = ({ icon, title, description, action }) => (
  <GlassCard className="p-6 flex flex-col items-start gap-4">
    <div className="p-3 rounded-xl bg-white/5 border border-white/10">{icon}</div>
    <div>
      <h3 className="text-xl font-bold text-white">{title}</h3>
      <p className="text-gray-400 text-sm mt-1">{description}</p>
    </div>
    <PremiumButton variant="outline" className="mt-2 text-xs h-9 px-4">
      {action}
    </PremiumButton>
  </GlassCard>
);

export default MCPHub;
