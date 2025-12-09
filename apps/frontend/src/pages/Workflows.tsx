import { ActionCard, GlassCard, PremiumButton } from '@/components/ui/premium';
import { Activity, Clock, TrendingUp, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

// ... imports ...

export default function Workflows() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="flex items-center justify-between animate-slide-in-down">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Intelligence Orchestration
          </h1>
          <p className="text-slate-300 mt-2">Coordinate and automate multi-agent workflows</p>
        </div>
        <Link to="/workflows/builder">
          <PremiumButton size="lg" variant="gradient">
            <Zap className="w-4 h-4 mr-2" />
            Orchestrate New Intelligence
          </PremiumButton>
        </Link>
      </div>

      {/* Active Workflows Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-in-up">
        {[1, 2, 3, 4].map((workflow) => (
          <ActionCard
            key={workflow}
            title={`Workflow ${workflow}`}
            description="This workflow automates the process of data collection, analysis, and reporting."
            icon={<Activity className="w-5 h-5" />}
            gradient={
              workflow % 3 === 0 ? 'from-yellow-500 to-orange-500' : 'from-green-500 to-emerald-500'
            }
          >
            <div className="space-y-4">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <div
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    workflow % 3 === 0
                      ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 border border-yellow-500/30'
                      : 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border border-green-500/30'
                  }`}
                >
                  {workflow % 3 === 0 ? 'Draft' : 'Active'}
                </div>
                <div className="flex items-center text-xs text-slate-400">
                  <Clock className="w-3 h-3 mr-1" />
                  Last run: 3 hours ago
                </div>
              </div>

              {/* Agent Count */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                  A1
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                  A2
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white text-xs font-bold">
                  A3
                </div>
                <span className="text-xs text-slate-400">+2 more agents</span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <PremiumButton size="sm" variant="secondary" className="flex-1">
                  Edit
                </PremiumButton>
                <PremiumButton size="sm" variant="gradient" className="flex-1">
                  <Zap className="w-3 h-3 mr-1" />
                  Run
                </PremiumButton>
              </div>
            </div>
          </ActionCard>
        ))}
      </div>

      {/* Workflow Builder Section */}
      <GlassCard className="animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Workflow Builder</h2>
        </div>
        <div className="h-96 bg-slate-900/50 rounded-lg border border-slate-700/50 flex items-center justify-center backdrop-blur-sm">
          <p className="text-slate-400">Workflow builder will be displayed here</p>
        </div>
        <div className="mt-4 flex justify-end">
          <Link to="/workflows/builder">
            <PremiumButton variant="gradient">
              <Zap className="w-4 h-4 mr-2" />
              Open Builder
            </PremiumButton>
          </Link>
        </div>
      </GlassCard>

      {/* Recent Executions */}
      <GlassCard className="animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Recent Executions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left py-3 font-medium text-slate-300">Workflow</th>
                <th className="text-left py-3 font-medium text-slate-300">Status</th>
                <th className="text-left py-3 font-medium text-slate-300">Started</th>
                <th className="text-left py-3 font-medium text-slate-300">Duration</th>
                <th className="text-left py-3 font-medium text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((execution) => (
                <tr
                  key={execution}
                  className="border-b border-slate-700/30 last:border-0 hover:bg-white/5 transition-colors"
                >
                  <td className="py-4 text-white">Workflow {(execution % 4) + 1}</td>
                  <td className="py-4">
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        execution % 3 === 0
                          ? 'bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-300 border border-red-500/30'
                          : execution % 3 === 1
                            ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 border border-yellow-500/30'
                            : 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border border-green-500/30'
                      }`}
                    >
                      {execution % 3 === 0
                        ? 'Failed'
                        : execution % 3 === 1
                          ? 'Running'
                          : 'Completed'}
                    </span>
                  </td>
                  <td className="py-4 text-slate-400">{execution} hours ago</td>
                  <td className="py-4 text-slate-400">{execution * 2} minutes</td>
                  <td className="py-4">
                    <PremiumButton size="sm" variant="ghost">
                      View Logs
                    </PremiumButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
