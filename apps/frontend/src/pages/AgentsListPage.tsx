import {
  Activity,
  AlertCircle,
  Bot,
  Eye,
  PlayCircle,
  Sparkles,
  StopCircle,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ActionCard, GlassCard, PremiumButton, StatsCard } from '../components/ui/premium';
import { agentService, type Agent as ServiceAgent } from '../services/AgentService';

interface Agent {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive' | 'error';
  lastActive: string;
  description: string;
  capabilities: string[];
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const fetchedAgents = await agentService.getAgents();
      // Transform API agents to UI Agents
      const uiAgents: Agent[] = fetchedAgents.map((a: ServiceAgent) => ({
        id: a.id,
        name: a.name,
        type: a.type || 'Custom Agent',
        status: (a.status as any) || 'inactive',
        lastActive: a.updatedAt ? new Date(a.updatedAt).toLocaleDateString() : 'Unknown', // Using date string for now
        description: a.description || 'No description provided.',
        capabilities: a.capabilities || [],
      }));
      setAgents(uiAgents);
    } catch (error) {
      console.error('Failed to load agents', error);
      // Fallback or empty state could be handled here
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.3)]">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-xs font-semibold text-green-300">DEPLOYED</span>
          </div>
        );
      case 'inactive':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-500/20 border border-slate-500/30">
            <div className="w-2 h-2 rounded-full bg-slate-400"></div>
            <span className="text-xs font-semibold text-slate-300">STANDBY</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.3)]">
            <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></div>
            <span className="text-xs font-semibold text-red-300">ALERT</span>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-white text-lg font-semibold animate-pulse">
            Assembling your AI army...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center animate-in slide-in-from-top-4 duration-500">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">AI Command Center</h1>
          <p className="text-gray-400 text-lg">Command and monitor your elite AI champions</p>
        </div>
        <Link to="/agents/new">
          <PremiumButton icon={Sparkles} size="lg" variant="gradient">
            Forge New Champion
          </PremiumButton>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-bottom-4 duration-500 delay-100">
        <StatsCard
          label="Total Champions"
          value={agents.length}
          icon={Bot}
          gradient="purple"
          change="+2 this week"
          changeType="positive"
        />

        <StatsCard
          label="Deployed & Active"
          value={agents.filter((a) => a.status === 'active').length}
          icon={Activity}
          gradient="green"
          change="Conquering tasks"
          changeType="positive"
        />

        <StatsCard
          label="On Standby"
          value={agents.filter((a) => a.status === 'inactive').length}
          icon={Zap}
          gradient="cyan"
          change="Ready for deployment"
          changeType="neutral"
        />

        <StatsCard
          label="System Alerts"
          value={agents.filter((a) => a.status === 'error').length}
          icon={AlertCircle}
          gradient="orange"
          change="Requires attention"
          changeType="neutral"
        />
      </div>

      {/* Agents List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent, index) => (
          <div
            key={agent.id}
            className="animate-in fade-in zoom-in duration-500 fill-mode-both"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <GlassCard hover={true} className="h-full group flex flex-col">
              {/* Agent Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-md bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-none group-hover:scale-110 transition-transform duration-300">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
                      {agent.name}
                    </h3>
                    <p className="text-sm text-gray-400">{agent.type}</p>
                  </div>
                </div>
                {getStatusBadge(agent.status)}
              </div>

              {/* Last Active */}
              <div className="flex items-center gap-2 mb-4 text-sm text-gray-400 bg-transparent/5 p-2 rounded-md">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <span>{agent.lastActive}</span>
              </div>

              {/* Description */}
              <p className="text-gray-300 mb-6 leading-relaxed flex-grow">{agent.description}</p>

              {/* Capabilities */}
              <div className="mb-6">
                <p className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider">
                  Core Abilities
                </p>
                <div className="flex flex-wrap gap-2">
                  {agent.capabilities.map((capability, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 text-xs font-medium bg-blue-500/10 border border-blue-500/20 rounded-md text-blue-200"
                    >
                      {capability}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3 mt-auto">
                <Link to={`/agents/${agent.id}`} className="w-full">
                  <PremiumButton variant="outline" size="sm" icon={Eye} fullWidth>
                    Inspect
                  </PremiumButton>
                </Link>
                <PremiumButton
                  variant={agent.status === 'active' ? 'danger' : 'primary'}
                  size="sm"
                  icon={agent.status === 'active' ? StopCircle : PlayCircle}
                  fullWidth
                >
                  {agent.status === 'active' ? 'Halt' : 'Deploy'}
                </PremiumButton>
              </div>
            </GlassCard>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-12 pt-8 border-t border-white/10">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-purple-400" />
          Command Operations
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/agents/new">
            <ActionCard
              title="Forge New Champion"
              description="Create and deploy a powerful new AI agent to your command center"
              icon={Sparkles}
              gradient="purple"
              onClick={() => {}}
            />
          </Link>
          <Link to="/dashboard/agents">
            <ActionCard
              title="Battle Analytics"
              description="Monitor performance metrics and strategic insights from your AI army"
              icon={TrendingUp}
              gradient="blue"
              onClick={() => {}}
            />
          </Link>
          <Link to="/multi-agent-chat">
            <ActionCard
              title="Multi-Agent Arena"
              description="Orchestrate collaborative missions between multiple AI champions"
              icon={Activity}
              gradient="cyan"
              onClick={() => {}}
            />
          </Link>
        </div>
      </div>
    </div>
  );
}
