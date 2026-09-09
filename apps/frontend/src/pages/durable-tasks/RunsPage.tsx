import OpsPageHeader from '@/components/ops/OpsPageHeader';
import { Badge, GlassCard, PremiumButton, PremiumSelect } from '@/components/ui';
import { durableTasksApi, type DurableRun } from '@/services/durableTasksApi';
import { Loader2, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function statusColor(status: string): string {
  if (status === 'COMPLETED') return 'bg-emerald-500/20 text-emerald-200';
  if (status === 'FAILED') return 'bg-rose-500/20 text-rose-200';
  if (status === 'CANCELLED') return 'bg-slate-500/20 text-slate-200';
  if (status === 'RUNNING') return 'bg-sky-500/20 text-sky-200';
  return 'bg-amber-500/20 text-amber-100';
}

export default function RunsPage() {
  const [runs, setRuns] = useState<DurableRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await durableTasksApi.drain(10);
      setRuns(await durableTasksApi.listRuns(status === 'all' ? undefined : { status }));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6 p-6">
      <OpsPageHeader
        eyebrow="Forge"
        title="Durable Runs"
        subtitle="Execution history for cloud DurableTasks"
      />

      <div className="flex flex-wrap items-center gap-3">
        <PremiumSelect value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="QUEUED">QUEUED</option>
          <option value="RUNNING">RUNNING</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="FAILED">FAILED</option>
          <option value="CANCELLED">CANCELLED</option>
        </PremiumSelect>
        <PremiumButton variant="secondary" size="sm" onClick={() => void load()}>
          <RefreshCw className="h-4 w-4" /> Refresh
        </PremiumButton>
        <Link className="text-sm text-sky-400 hover:underline" to="/durable-tasks">
          Tasks
        </Link>
        <Link className="text-sm text-sky-400 hover:underline" to="/schedules">
          Schedules
        </Link>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-950/40 px-3 py-2 text-sm text-rose-100">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading runs…
        </div>
      ) : (
        <div className="space-y-2">
          {runs.map((r) => (
            <Link key={r.id} to={`/runs/${r.id}`}>
              <GlassCard className="p-4 hover:border-sky-500/40 transition-colors flex flex-wrap justify-between gap-2">
                <div>
                  <div className="font-mono text-sm">{r.id}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {r.taskId} · v{r.taskVersion} · {r.machine || 'small'} · attempt {r.attempt}
                    {r.durationMs != null ? ` · ${r.durationMs}ms` : ''}
                    {r.estimatedCostUnits != null ? ` · ${r.estimatedCostUnits} cost units` : ''}
                  </div>
                </div>
                <Badge className={statusColor(r.status)}>{r.status}</Badge>
              </GlassCard>
            </Link>
          ))}
          {!runs.length && (
            <p className="text-sm text-muted-foreground">
              No runs yet. Trigger one from{' '}
              <Link className="text-sky-400 hover:underline" to="/durable-tasks">
                Durable Tasks
              </Link>
              .
            </p>
          )}
        </div>
      )}
    </div>
  );
}
