import { ActionCard, GlassCard, PremiumButton, StatsCard } from '@/components/ui/premium';
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
    // Simulate loading agents from API
    setTimeout(() => {
      setAgents([
        {
          id: '1',
          name: 'Data Analyst Champion',
          type: 'Analytics Specialist',
          status: 'active',
          lastActive: 'Active now',
          description:
            'Elite intelligence unit mastering data patterns and generating strategic insights',
          capabilities: ['Neural Data Processing', 'Predictive Analytics', 'Visual Intelligence'],
        },
        {
          id: '2',
          name: 'Support Commander',
          type: 'Customer Relations',
          status: 'active',
          lastActive: 'Conquering workflows',
          description: 'Frontline warrior handling customer missions with precision and empathy',
          capabilities: ['Real-time Support', 'Intelligent Triage', 'Knowledge Synthesis'],
        },
        {
          id: '3',
          name: 'Code Guardian',
          type: 'Development Sentinel',
          status: 'inactive',
          lastActive: 'Standing by',
          description:
            'Vigilant protector analyzing code architecture and security vulnerabilities',
          capabilities: ['Deep Code Analysis', 'Threat Detection', 'Architecture Review'],
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-xs font-semibold text-green-300">DEPLOYED</span>
          </div>
        );
      case 'inactive':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-gray-500/20 to-slate-500/20 border border-gray-500/30">
            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
            <span className="text-xs font-semibold text-gray-300">STANDBY</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-red-500/20 to-rose-500/20 border border-red-500/30">
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center relative overflow-hidden">
        {/* Animated orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-700"></div>

        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-white text-lg font-semibold">Assembling your AI army...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6 relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-500"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Bot className="w-10 h-10 text-purple-400" />
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                  AI Command Center
                </h1>
              </div>
              <p className="text-gray-300 text-lg">Command your elite AI champions</p>
            </div>
            <Link to="/agents/new">
              <PremiumButton icon={Sparkles} size="lg">
                Forge Your Next AI Champion
              </PremiumButton>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 animate-slide-up">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent, index) => (
            <div
              key={agent.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <GlassCard hover={true} className="h-full group">
                {/* Agent Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
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
                <div className="flex items-center gap-2 mb-4 text-sm text-gray-400">
                  <TrendingUp className="w-4 h-4" />
                  <span>{agent.lastActive}</span>
                </div>

                {/* Description */}
                <p className="text-gray-300 mb-4 leading-relaxed">{agent.description}</p>

                {/* Capabilities */}
                <div className="mb-6">
                  <p className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">
                    Core Abilities
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {agent.capabilities.map((capability, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 text-xs font-medium bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-full text-purple-200"
                      >
                        {capability}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link to={`/agents/${agent.id}`} className="flex-1">
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
                    {agent.status === 'active' ? 'Deactivate' : 'Deploy'}
                  </PremiumButton>
                </div>
              </GlassCard>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-purple-400" />
            Command Operations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
    </div>
  );
}
