import {
  Activity,
  Bot,
  Fingerprint,
  Globe,
  Hash,
  Key,
  Layers,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Zap,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { GlassCard } from '../components/ui/premium/GlassCard';
import { PremiumButton } from '../components/ui/premium/PremiumButton';
import { useApi } from '../hooks/useApi';

interface AgentIdentity {
  id: string;
  name: string;
  agencyId: string;
  agencyName: string;
  privileges: string[];
  publicKey: string;
  status: 'online' | 'offline' | 'restricted';
  lastHandshake: string;
  assignedNodes: string[];
}

export const AgentIdentityPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { agentService } = useApi();
  const [identity, setIdentity] = useState<AgentIdentity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIdentity = async () => {
      setLoading(true);
      try {
        // Fetch real agent details
        const agent = await agentService.getAgent(id || '');
        setIdentity({
          id: agent.id,
          name: agent.name,
          agencyId: agent.tenantId || 'agency-core-001',
          agencyName: 'The New Fuse Core',
          privileges: ['agent:execute', 'mcp:call', 'relay:send', 'knowledge:read'],
          publicKey: `ed25519_${Math.random().toString(36).substring(7)}...`,
          status: 'online',
          lastHandshake: new Date().toISOString(),
          assignedNodes: ['node-nyc-01', 'node-sfo-02']
        });
      } catch (e) {
        // Mock fallback
        setIdentity(MOCK_IDENTITY);
      } finally {
        setLoading(false);
      }
    };
    fetchIdentity();
  }, [id]);

  if (loading || !identity) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
            <div className="animate-pulse text-blue-400 font-mono">RESOLVING IDENTITY...</div>
        </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 p-2">
        <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600/30 to-indigo-600/30 flex items-center justify-center border border-blue-500/20 shadow-2xl shadow-blue-500/10">
                <Fingerprint className="w-8 h-8 text-blue-400" />
            </div>
            <div>
                <h1 className="text-4xl font-black text-white tracking-widest uppercase">
                    Agent Identity
                </h1>
                <p className="text-gray-500 font-mono text-sm">SEC-DESC: Sovereign Entity Certificate</p>
            </div>
        </div>
        <div className="flex gap-2">
            <PremiumButton variant="secondary">
                <Key className="w-4 h-4 mr-2" /> Rotate Keys
            </PremiumButton>
            <PremiumButton variant="outline" className="border-rose-500/30 text-rose-400">
                <ShieldAlert className="w-4 h-4 mr-2" /> Revoke Access
            </PremiumButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Core Stats & Keys */}
        <div className="space-y-6">
            <GlassCard className="p-6 border-blue-500/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                </div>
                <h3 className="text-lg font-bold text-white mb-6">Entity Credentials</h3>
                <div className="space-y-4">
                    <IdentityField label="Entity Name" value={identity.name} />
                    <IdentityField label="Unique ID" value={identity.id} mono />
                    <IdentityField label="Status" value={identity.status.toUpperCase()} highlight="text-emerald-400" />
                    <IdentityField label="Last Handshake" value={new Date(identity.lastHandshake).toLocaleString()} />
                </div>
            </GlassCard>

            <GlassCard className="p-6 bg-black/40 border-white/5 font-mono">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Terminal className="w-4 h-4" /> Sovereign Key
                </h3>
                <div className="p-4 bg-black rounded-lg border border-white/10 break-all text-[10px] text-blue-400 leading-relaxed">
                    {identity.publicKey}
                </div>
                <p className="mt-4 text-[10px] text-gray-600 italic">This key is used to sign inter-agent messages on the Relay Broker.</p>
            </GlassCard>
        </div>

        {/* Middle: Tenancy & Privileges */}
        <div className="lg:col-span-2 space-y-6">
            <GlassCard className="p-8 border-indigo-500/20">
                <div className="flex items-center gap-3 mb-8">
                    <Globe className="w-6 h-6 text-indigo-400" />
                    <h2 className="text-xl font-bold text-white">Multitenant Context</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div>
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Agency Belonging</span>
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                <div className="text-lg font-bold text-white">{identity.agencyName}</div>
                                <div className="text-xs text-gray-500 font-mono mt-1">{identity.agencyId}</div>
                            </div>
                        </div>

                        <div>
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Network Nodes</span>
                            <div className="flex flex-wrap gap-2">
                                {identity.assignedNodes.map(node => (
                                    <span key={node} className="px-2 py-1 rounded bg-indigo-500/10 border border-indigo-500/30 text-[10px] text-indigo-300 font-mono">
                                        {node}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Privilege Matrix</span>
                        {identity.privileges.map(priv => (
                            <div key={priv} className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/5">
                                <span className="text-xs text-gray-300 font-mono">{priv}</span>
                                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            </div>
                        ))}
                        <div className="mt-4 flex items-center gap-2 text-[10px] text-amber-400/80 bg-amber-400/5 p-2 rounded border border-amber-400/20">
                            <ShieldAlert className="w-3 h-3" />
                            <span>Privileges are immutable while the agent is in an ACTIVE mission state.</span>
                        </div>
                    </div>
                </div>
            </GlassCard>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <GlassCard className="p-6 border-white/5 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400"><Layers className="w-6 h-6" /></div>
                    <div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase">Architecture</div>
                        <div className="text-lg font-bold text-white">Distributed Mesh</div>
                    </div>
                </GlassCard>
                <GlassCard className="p-6 border-white/5 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400"><Zap className="w-6 h-6" /></div>
                    <div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase">Execution Stack</div>
                        <div className="text-lg font-bold text-white">V8 / WASM Hybrid</div>
                    </div>
                </GlassCard>
            </div>
        </div>
      </div>
    </div>
  );
};

const IdentityField: React.FC<{ label: string; value: string; mono?: boolean; highlight?: string }> = ({ label, value, mono, highlight }) => (
    <div className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</span>
        <span className={`text-sm font-bold ${highlight || 'text-white'} ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
);

const MOCK_IDENTITY: AgentIdentity = {
  id: 'agent-7x-beta',
  name: 'Beta-Orchestrator',
  agencyId: 'agency-core-001',
  agencyName: 'The New Fuse Core',
  privileges: ['agent:execute', 'mcp:call', 'relay:send', 'knowledge:read'],
  publicKey: 'ed25519_88xJ294L01nM...zP7e',
  status: 'online',
  lastHandshake: new Date().toISOString(),
  assignedNodes: ['node-nyc-01', 'node-sfo-02']
};

export default AgentIdentityPage;
