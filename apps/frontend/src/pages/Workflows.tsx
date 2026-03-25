import OpsPageHeader from '@/components/ops/OpsPageHeader';
import { ActionCard, GlassCard, PremiumButton } from '@/components/ui/premium';
import useWorkflow from '@/hooks/useWorkflow';
import { formatDistanceToNow } from 'date-fns';
import { Activity, Clock, Edit, Loader2, Play, Rocket, TrendingUp, Zap } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';

export default function Workflows() {
  const navigate = useNavigate();
  const {
    workflows,
    executions,
    loadWorkflows,
    loadExecutions,
    executeWorkflow,
    publishWorkflow,
    loading,
  } = useWorkflow();

  useEffect(() => {
    loadWorkflows();
    loadExecutions();
  }, [loadWorkflows, loadExecutions]);

  const handleEdit = (id: string) => {
    navigate(`/workflows/builder?id=${id}`);
  };

  const handleRun = async (id: string, name: string) => {
    try {
      toast.promise(executeWorkflow(id), {
        loading: `Starting workflow "${name}"...`,
        success: `Workflow "${name}" started successfully!`,
        error: `Failed to start workflow "${name}".`,
      });
      // Refresh executions after a short delay to show the new run
      setTimeout(() => loadExecutions(), 1000);
    } catch (error) {
      console.error(error);
    }
  };

  const handlePublish = async (id: string, name: string) => {
    try {
      await toast.promise(publishWorkflow(id), {
        loading: `Publishing workflow "${name}"...`,
        success: `Workflow "${name}" published.`,
        error: `Failed to publish workflow "${name}".`,
      });
      loadWorkflows();
    } catch (error) {
      console.error(error);
    }
  };

  // Helper to determine status color
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'completed':
        return 'bg-linear-to-r from-green-500/20 to-emerald-500/20 text-green-300 border border-green-500/30';
      case 'running':
        return 'bg-linear-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 border border-yellow-500/30';
      case 'failed':
        return 'bg-linear-to-r from-red-500/20 to-pink-500/20 text-red-300 border border-red-500/30';
      default: // Draft or unknown
        return 'bg-linear-to-r from-slate-500/20 to-slate-600/20 text-slate-300 border border-slate-500/30';
    }
  };

  const getGradient = (index: number) => {
    const gradients = [
      'from-blue-500 to-cyan-500',
      'from-purple-500 to-pink-500',
      'from-green-500 to-emerald-500',
      'from-orange-500 to-red-500',
    ];
    return gradients[index % gradients.length];
  };

  const getLastRun = (workflowId: string) => {
    const wfExecutions = executions
      .filter((e) => e.workflowId === workflowId)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    if (wfExecutions.length > 0) {
      return formatDistanceToNow(new Date(wfExecutions[0].startTime), { addSuffix: true });
    }
    return 'Never';
  };

  const runningExecutions = executions.filter((execution) => execution.status === 'running').length;
  const failedExecutions = executions.filter((execution) => execution.status === 'failed').length;

  if (loading && workflows.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in">
      <OpsPageHeader
        eyebrow="Automation"
        title="Workflow Operations"
        subtitle="Build, run, and monitor repeatable orchestration pipelines."
        meta={
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-2 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
              {workflows.length} workflows
            </span>
            <span className="px-2 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
              {runningExecutions} running
            </span>
            <span className="px-2 py-1 rounded-full bg-red-500/10 text-red-300 border border-red-500/20">
              {failedExecutions} failed
            </span>
          </div>
        }
        actions={
          <Link to="/workflows/builder">
            <PremiumButton size="lg" variant="gradient">
              <Zap className="w-4 h-4 mr-2" />
              New Workflow
            </PremiumButton>
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard className="p-4">
          <p className="text-xs uppercase tracking-wide text-gray-400">Total Runs</p>
          <p className="text-xl font-bold text-white mt-1">{executions.length}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-xs uppercase tracking-wide text-gray-400">Running Now</p>
          <p className="text-xl font-bold text-white mt-1">{runningExecutions}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-xs uppercase tracking-wide text-gray-400">Failure Count</p>
          <p className="text-xl font-bold text-white mt-1">{failedExecutions}</p>
        </GlassCard>
      </div>

      {/* Active Workflows Grid */}
      {workflows.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-4 animate-slide-in-up">
          {workflows.map((workflow, index) => (
            <ActionCard
              key={workflow.id}
              title={workflow.name}
              description={workflow.description || 'No description provided'}
              icon={<Activity className="w-5 h-5" />}
              gradient={getGradient(index)}
            >
              <div className="space-y-4">
                {/* Status Badge */}
                <div className="flex items-center justify-between">
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${getStatusColor(workflow.status)}`}
                  >
                    {workflow.status}
                  </div>
                  <div className="flex items-center text-xs text-slate-400">
                    <Clock className="w-3 h-3 mr-1" />
                    Last run: {getLastRun(workflow.id)}
                  </div>
                </div>

                {/* Node/Step Count */}
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <div className="px-2 py-1 bg-transparent/5 rounded">
                    {workflow.nodes?.length || 0} Steps
                  </div>
                  <div className="px-2 py-1 bg-transparent/5 rounded">v{workflow.version}</div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <PremiumButton
                    size="sm"
                    variant="secondary"
                    className="flex-1"
                    onClick={() => handleEdit(workflow.id)}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </PremiumButton>
                  <PremiumButton
                    size="sm"
                    variant="gradient"
                    className="flex-1"
                    onClick={() => handleRun(workflow.id, workflow.name)}
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Run
                  </PremiumButton>
                  {workflow.status?.toLowerCase() === 'draft' && (
                    <PremiumButton
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handlePublish(workflow.id, workflow.name)}
                    >
                      <Rocket className="w-3 h-3 mr-1" />
                      Publish
                    </PremiumButton>
                  )}
                </div>
              </div>
            </ActionCard>
          ))}
        </div>
      ) : (
        <GlassCard className="text-center py-12">
          <p className="text-slate-400 mb-4">
            No workflows found. Create your first intelligence pipeline!
          </p>
          <Link to="/workflows/builder">
            <PremiumButton variant="gradient">Create Workflow</PremiumButton>
          </Link>
        </GlassCard>
      )}

      {/* Workflow Builder Section */}
      <div className="animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
        <GlassCard>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-md bg-linear-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Workflow Builder</h2>
          </div>
          <div className="h-96 bg-slate-900/50 rounded-md border border-slate-700/50 flex items-center justify-center backdrop-blur-sm">
            <p className="text-slate-400">Select a workflow to visualize or create a new one.</p>
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
      </div>

      {/* Recent Executions */}
      <div className="animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
        <GlassCard>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-md bg-linear-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Recent Executions</h2>
          </div>
          {executions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left py-2 font-medium text-slate-300">Execution ID</th>
                    <th className="text-left py-2 font-medium text-slate-300">Status</th>
                    <th className="text-left py-2 font-medium text-slate-300">Started</th>
                    <th className="text-left py-2 font-medium text-slate-300">Duration</th>
                    <th className="text-left py-2 font-medium text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {executions.slice(0, 10).map((execution) => (
                    <tr
                      key={execution.id}
                      className="border-b border-slate-700/30 last:border-0 hover:bg-transparent/5 transition-colors"
                    >
                      <td className="py-2 text-white font-medium font-mono text-xs">
                        {execution.id.substring(0, 8)}...
                      </td>
                      <td className="py-2">
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full uppercase ${getStatusColor(execution.status)}`}
                        >
                          {execution.status}
                        </span>
                      </td>
                      <td className="py-2 text-slate-400">
                        {formatDistanceToNow(new Date(execution.startTime), { addSuffix: true })}
                      </td>
                      <td className="py-2 text-slate-400">
                        {execution.endTime
                          ? `${Math.round((new Date(execution.endTime).getTime() - new Date(execution.startTime).getTime()) / 1000)}s`
                          : 'Running...'}
                      </td>
                      <td className="py-2">
                        <PremiumButton size="sm" variant="ghost">
                          View Logs
                        </PremiumButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">No recent executions found.</div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
