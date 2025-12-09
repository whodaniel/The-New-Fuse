import { GlassCard, PremiumButton, StatsCard } from '@/components/ui/premium';
import { Activity, Bot, Eye, PlayCircle, Sparkles, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const agentData = [
  {
    id: 1,
    name: 'Task Dominator',
    type: 'Workflow Champion',
    status: 'Active',
    tasks: 12,
    description: 'Elite task execution specialist conquering complex workflows with precision',
  },
  {
    id: 2,
    name: 'Data Synthesizer',
    type: 'Intelligence Processor',
    status: 'Idle',
    tasks: 8,
    description:
      'Advanced data processing unit transforming raw information into strategic insights',
  },
  {
    id: 3,
    name: 'Communication Nexus',
    type: 'Message Orchestrator',
    status: 'Active',
    tasks: 15,
    description: 'Strategic communication hub coordinating cross-platform message flows',
  },
];

const Agents = () => {
  const navigate = useNavigate();

  const getStatusBadge = (status: string) => {
    if (status === 'Active') {
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

  const activeAgents = agentData.filter((a) => a.status === 'Active').length;
  const totalTasks = agentData.reduce((sum, agent) => sum + agent.tasks, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6 relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <div className="relative z-10 space-y-8">
        {/* Header */}
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

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up">
          <StatsCard
            label="Total Champions"
            value={agentData.length}
            icon={Bot}
            gradient="purple"
            change="+1 this week"
            changeType="positive"
          />
          <StatsCard
            label="Active Deployments"
            value={activeAgents}
            icon={Activity}
            gradient="green"
            change="Conquering workflows"
            changeType="positive"
          />
          <StatsCard
            label="Missions in Progress"
            value={totalTasks}
            icon={Target}
            gradient="blue"
            change="+7 today"
            changeType="positive"
          />
        </div>

        {/* Agents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agentData.map((agent, index) => (
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

                {/* Description */}
                <p className="text-gray-300 mb-4 leading-relaxed text-sm">{agent.description}</p>

                {/* Task Count */}
                <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Active Missions</span>
                    <span className="text-2xl font-bold text-white">{agent.tasks}</span>
                  </div>
                </div>

                {/* Actions */}
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
                  {agent.status === 'Idle' && (
                    <PremiumButton
                      variant="primary"
                      size="sm"
                      icon={PlayCircle}
                      fullWidth
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      Deploy
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
