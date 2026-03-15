import { GlassCard } from '@/components/ui/premium/GlassCard';
import { PremiumButton } from '@/components/ui/premium/PremiumButton';
import { useApi } from '@/hooks/useApi';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  History,
  PlayCircle,
  RotateCcw,
  Search,
  StopCircle,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface Execution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: string;
  duration: string;
  progress: number;
}

export const ExecutionConsole: React.FC = () => {
  const { api } = useApi();
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchExecutions = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await api.get('/workflow/executions');
      if (res?.success && Array.isArray(res.data)) {
        setExecutions(res.data);
      } else {
        setExecutions([]);
        setFetchError('Workflow execution endpoint is unavailable');
      }
    } catch (error) {
      console.error('Failed to fetch workflow executions:', error);
      setExecutions([]);
      setFetchError('Workflow execution endpoint is unavailable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExecutions();
    const interval = setInterval(fetchExecutions, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8 animate-in slide-in-from-right duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Workflow Execution Console
          </h1>
          <p className="text-gray-400 mt-2">
            Active runtime monitoring for autonomous pipelines and agent swarms.
          </p>
        </div>
        <div className="flex gap-2">
          <PremiumButton variant="secondary" onClick={fetchExecutions}>
            <RotateCcw className="w-4 h-4 mr-2" /> Hard Sync
          </PremiumButton>
        </div>
      </div>
      {fetchError && (
        <GlassCard className="p-4 border border-amber-500/40 bg-amber-500/10">
          <p className="text-sm text-amber-200">{fetchError}. No synthetic executions are shown.</p>
        </GlassCard>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatusSummary
          label="Running"
          value={executions.filter((e) => e.status === 'running').length.toString()}
          color="blue"
        />
        <StatusSummary
          label="Completed"
          value={executions.filter((e) => e.status === 'completed').length.toString()}
          color="emerald"
        />
        <StatusSummary
          label="Failed"
          value={executions.filter((e) => e.status === 'failed').length.toString()}
          color="rose"
        />
        <StatusSummary
          label="Queue Depth"
          value={executions.filter((e) => e.status === 'pending').length.toString()}
          color="gray"
        />
      </div>

      <GlassCard className="overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-transparent/5">
          <div className="flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">Live Runtimes</h2>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by ID or workflow..."
              className="w-full bg-black/40 border border-white/10 rounded-md pl-10 pr-4 py-1.5 text-xs text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-transparent/5 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-white/10">
              <tr>
                <th className="px-3 py-2">Runtime Identity</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Runtime Progress</th>
                <th className="px-3 py-2">Duration</th>
                <th className="px-3 py-2">System Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td className="px-3 py-8 text-sm text-gray-400" colSpan={5}>
                    Loading live execution telemetry...
                  </td>
                </tr>
              ) : executions.length === 0 ? (
                <tr>
                  <td className="px-3 py-8 text-sm text-gray-400" colSpan={5}>
                    No live workflow executions available.
                  </td>
                </tr>
              ) : (
                executions.map((exec) => (
                  <tr key={exec.id} className="hover:bg-transparent/5 transition-colors group">
                    <td className="px-3 py-2">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white">{exec.workflowName}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {exec.id}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${
                          exec.status === 'running'
                            ? 'bg-blue-500/10 border-blue-500/50 text-blue-400'
                            : exec.status === 'completed'
                              ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                              : exec.status === 'failed'
                                ? 'bg-rose-500/10 border-rose-500/50 text-rose-400'
                                : 'bg-transparent0/10 border-gray-500/50 text-gray-400'
                        }`}
                      >
                        {exec.status === 'running' && (
                          <Activity className="w-3 h-3 animate-pulse" />
                        )}
                        {exec.status}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="w-48 space-y-1.5">
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>Step Progress</span>
                          <span>{exec.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                          <div
                            className={`h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-1000`}
                            style={{ width: `${exec.progress}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Clock className="w-3.5 h-3.5" />
                        {exec.duration}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 rounded-md bg-transparent/5 hover:bg-transparent/10 text-white transition-all">
                          <History className="w-4 h-4" />
                        </button>
                        {exec.status === 'running' && (
                          <button className="p-2 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all">
                            <StopCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};

const StatusSummary: React.FC<{ label: string; value: string; color: string }> = ({
  label,
  value,
  color,
}) => (
  <GlassCard className="p-4 flex items-center justify-between border-white/5">
    <div>
      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
        {label}
      </div>
      <div className={`text-2xl font-bold text-${color}-400`}>{value}</div>
    </div>
    <div className={`p-2 rounded-md bg-${color}-500/10 text-${color}-400`}>
      {label === 'Running' ? (
        <Activity className="w-5 h-5 animate-pulse" />
      ) : label === 'Completed' ? (
        <CheckCircle className="w-5 h-5" />
      ) : label === 'Failed' ? (
        <AlertTriangle className="w-5 h-5" />
      ) : (
        <Clock className="w-5 h-5" />
      )}
    </div>
  </GlassCard>
);

export default ExecutionConsole;
