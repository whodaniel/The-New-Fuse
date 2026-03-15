import { GlassCard, PremiumButton, StatsCard } from '@/components/ui/premium';
import { Activity, Bot, Eye, Loader2, PlayCircle, Sparkles, Target } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface Agent {
  id: string;
  name: string;
  type: string;
  status: string;
  description?: string;
}

const Agents = () => {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [deployingId, setDeployingId] = useState<string | null>(null);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/agents', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch agents (${response.status})`);
      }

      const data = await response.json();
      setAgents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      setAgents([]);
      toast.error('Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const handleDeploy = async (agentId: string) => {
    try {
      setDeployingId(agentId);
      const response = await fetch(`/api/agents/${agentId}/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        credentials: 'include',
        body: JSON.stringify({ target: 'cloud' }),
      });

      if (!response.ok) {
        throw new Error(`Deployment failed (${response.status})`);
      }

      toast.success('Agent deployed successfully');
      await loadAgents();
    } catch (error) {
      console.error('Deploy failed:', error);
      toast.error(error instanceof Error ? error.message : 'Deploy failed');
    } finally {
      setDeployingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const normalized = status.toLowerCase();
    if (normalized === 'active') {
      return (
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          <span className="text-xs font-semibold text-green-300">DEPLOYED</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-gray-500/20 to-slate-500/20 border border-gray-500/30">
        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
        <span className="text-xs font-semibold text-gray-300">STANDBY</span>
      </div>
    );
  };

  const activeAgents = useMemo(
    () => agents.filter((agent) => agent.status?.toLowerCase() === 'active').length,
    [agents]
  );
  const totalTasks = useMemo(() => activeAgents * 3, [activeAgents]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <div className="relative z-10 space-y-8">
        <div className="flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <Bot className="w-8 h-8 text-purple-400" />
            <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Agent Command
            </h2>
          </div>
          <PremiumButton
            onClick={() => navigate('/dashboard/agents/new')}
            icon={Sparkles}
            size="lg"
          >
            Forge New Champion
          </PremiumButton>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-up">
          <StatsCard
            label="Total Champions"
            value={agents.length}
            icon={Bot}
            gradient="purple"
            change="Live fleet size"
            changeType="positive"
          />
          <StatsCard
            label="Active Deployments"
            value={activeAgents}
            icon={Activity}
            gradient="green"
            change="Backed by deployment API"
            changeType="positive"
          />
          <StatsCard
            label="Missions in Progress"
            value={totalTasks}
            icon={Target}
            gradient="blue"
            change="Estimated active load"
            changeType="positive"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent, index) => (
            <div
              key={agent.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <GlassCard
                hover={true}
                className="h-full group cursor-pointer"
                onClick={() => navigate(`/dashboard/agents/${agent.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-md bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-none">
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

                <p className="text-gray-300 mb-4 leading-relaxed text-sm">
                  {agent.description || 'No description provided.'}
                </p>

                <div className="flex gap-2">
                  <PremiumButton
                    variant="outline"
                    size="sm"
                    icon={Eye}
                    fullWidth
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/dashboard/agents/${agent.id}`);
                    }}
                  >
                    Inspect
                  </PremiumButton>
                  {agent.status?.toLowerCase() !== 'active' && (
                    <PremiumButton
                      variant="primary"
                      size="sm"
                      icon={deployingId === agent.id ? Loader2 : PlayCircle}
                      fullWidth
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDeploy(agent.id);
                      }}
                      disabled={deployingId === agent.id}
                    >
                      {deployingId === agent.id ? 'Deploying...' : 'Deploy'}
                    </PremiumButton>
                  )}
                </div>
              </GlassCard>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Agents;
