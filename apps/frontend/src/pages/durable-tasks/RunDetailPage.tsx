import OpsPageHeader from '@/components/ops/OpsPageHeader';
import { Badge, GlassCard, PremiumButton } from '@/components/ui';
import { durableTasksApi, type DurableRun, type DurableRunEvent } from '@/services/durableTasksApi';
import { ArrowLeft, Loader2, RotateCcw, Square } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

export default function RunDetailPage() {
  const { runId = '' } = useParams();
  const [run, setRun] = useState<DurableRun | null>(null);
  const [events, setEvents] = useState<DurableRunEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!runId) return;
    setError(null);
    try {
      await durableTasksApi.drain(5);
      const [r, ev] = await Promise.all([
        durableTasksApi.getRun(runId),
        durableTasksApi.listEvents(runId),
      ]);
      setRun(r);
      setEvents(ev);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [runId]);

  useEffect(() => {
    void load();
    const t = window.setInterval(() => void load(), 2500);
    return () => window.clearInterval(t);
  }, [load]);

  const onCancel = async () => {
    if (!runId) return;
    setBusy(true);
    try {
      setRun(await durableTasksApi.cancelRun(runId));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const onReplay = async () => {
    if (!runId) return;
    setBusy(true);
    try {
      const { run: next } = await durableTasksApi.replayRun(runId);
      window.location.href = `/runs/${next.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <OpsPageHeader title={runId || 'Run'} subtitle="DurableTask run detail + event timeline" />

      <div className="flex flex-wrap gap-2">
        <Link to="/runs">
          <PremiumButton variant="secondary" size="sm">
            <ArrowLeft className="h-4 w-4" /> Back to runs
          </PremiumButton>
        </Link>
        <PremiumButton
          variant="secondary"
          size="sm"
          disabled={busy || !run || run.status === 'COMPLETED' || run.status === 'FAILED'}
          onClick={() => void onCancel()}
        >
          <Square className="h-4 w-4" /> Cancel
        </PremiumButton>
        <PremiumButton size="sm" disabled={busy || !run} onClick={() => void onReplay()}>
          <RotateCcw className="h-4 w-4" /> Replay
        </PremiumButton>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-950/40 px-3 py-2 text-sm text-rose-100">
          {error}
        </div>
      )}

      {!run ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : (
        <>
          <GlassCard className="p-4 space-y-2">
            <div className="flex flex-wrap gap-2 items-center">
              <Badge>{run.status}</Badge>
              <span className="text-sm">
                {run.taskId} · v{run.taskVersion} · {run.machine || 'small'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              created {run.createdAt}
              {run.durationMs != null ? ` · duration ${run.durationMs}ms` : ''}
              {run.estimatedCostUnits != null
                ? ` · estimated ${run.estimatedCostUnits} cost units`
                : ''}
            </p>
            {run.error && <p className="text-sm text-rose-300">{run.error}</p>}
            <pre className="text-xs overflow-auto rounded bg-black/30 p-3 max-h-48">
              {JSON.stringify({ payload: run.payload, result: run.result }, null, 2)}
            </pre>
          </GlassCard>

          <GlassCard className="p-4">
            <h2 className="text-sm font-semibold mb-3">Events</h2>
            <ul className="space-y-2">
              {events.map((ev) => (
                <li key={ev.seq} className="text-xs border-b border-white/5 pb-2">
                  <span className="text-muted-foreground">#{ev.seq}</span>{' '}
                  <span className="font-medium">{ev.type}</span>{' '}
                  <span className="text-muted-foreground">{ev.at}</span>
                  {ev.data != null && (
                    <pre className="mt-1 opacity-80">{JSON.stringify(ev.data)}</pre>
                  )}
                </li>
              ))}
              {!events.length && <li className="text-sm text-muted-foreground">No events yet.</li>}
            </ul>
          </GlassCard>
        </>
      )}
    </div>
  );
}
