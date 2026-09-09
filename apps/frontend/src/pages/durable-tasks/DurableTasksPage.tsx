import OpsPageHeader from '@/components/ops/OpsPageHeader';
import { Badge, GlassCard, PremiumButton, PremiumInput } from '@/components/ui';
import {
  durableTasksApi,
  type DurableMachine,
  type DurableTaskDef,
} from '@/services/durableTasksApi';
import { Loader2, Play, Plus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function UsageBanner() {
  const [usage, setUsage] = useState<{
    backend: string;
    monthCostUnits: number;
    freeUnitsMonth: number;
    remainingFreeUnits: number;
    unitUsd: number;
    enforce: boolean;
    queue?: { available: boolean; tenants: number; depth: number };
    workerEnabled?: boolean;
  } | null>(null);

  useEffect(() => {
    void durableTasksApi
      .usage()
      .then(setUsage)
      .catch(() => setUsage(null));
  }, []);

  if (!usage) return null;
  return (
    <GlassCard className="p-3 text-xs text-muted-foreground flex flex-wrap gap-3">
      <span>
        Backend: <strong className="text-foreground">{usage.backend}</strong>
      </span>
      <span>
        Free units left: {usage.remainingFreeUnits.toFixed(2)} / {usage.freeUnitsMonth}
      </span>
      <span>
        Used this month: {usage.monthCostUnits.toFixed(4)} units (~$
        {(usage.monthCostUnits * usage.unitUsd).toFixed(4)})
      </span>
      {usage.queue && (
        <span>
          Queue: {usage.queue.available ? 'Redis' : 'local'} · depth {usage.queue.depth} · tenants{' '}
          {usage.queue.tenants}
          {usage.workerEnabled ? ' · worker on' : ''}
        </span>
      )}
      {usage.enforce ? (
        <span className="text-amber-300">Hard enforce on</span>
      ) : (
        <span>Soft quota (usage recorded)</span>
      )}
    </GlassCard>
  );
}

export default function DurableTasksPage() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<DurableTaskDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [newId, setNewId] = useState('');
  const [newHandler, setNewHandler] = useState('echo');
  const [newMachine, setNewMachine] = useState<DurableMachine>('small');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTasks(await durableTasksApi.listTasks());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onDefine = async () => {
    if (!newId.trim()) return;
    setBusyId('define');
    setError(null);
    try {
      await durableTasksApi.defineTask({
        id: newId.trim(),
        handler: newHandler.trim() || 'echo',
        machine: newMachine,
        description: `Cloud DurableTask (${newHandler})`,
      });
      setNewId('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyId(null);
    }
  };

  const onTrigger = async (taskId: string) => {
    setBusyId(taskId);
    setError(null);
    try {
      const { run } = await durableTasksApi.trigger(taskId, {
        source: 'app.thenewfuse.com',
        at: new Date().toISOString(),
      });
      navigate(`/runs/${run.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <OpsPageHeader
        eyebrow="Forge"
        title="Durable Tasks"
        subtitle="Code-first durable compute on the TNF cloud stack (Runs · Tasks · Schedules)"
      />

      <div className="flex flex-wrap gap-3 text-sm">
        <Link className="text-sky-400 hover:underline" to="/runs">
          Runs
        </Link>
        <span className="text-muted-foreground">·</span>
        <Link className="text-sky-400 hover:underline" to="/schedules">
          Schedules
        </Link>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">Separate from workspace /tasks (ledger)</span>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-950/40 px-3 py-2 text-sm text-rose-100">
          {error}
        </div>
      )}

      <UsageBanner />

      <GlassCard className="p-4 space-y-3">
        <h2 className="text-sm font-semibold">Define task</h2>
        <div className="flex flex-wrap gap-2 items-end">
          <div>
            <label className="text-xs text-muted-foreground">ID</label>
            <PremiumInput
              value={newId}
              onChange={(e) => setNewId(e.target.value)}
              placeholder="my-task"
              className="w-48"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Handler</label>
            <PremiumInput
              value={newHandler}
              onChange={(e) => setNewHandler(e.target.value)}
              placeholder="echo | fail | fail-once"
              className="w-40"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Machine</label>
            <select
              className="block rounded-md border border-border bg-background px-2 py-2 text-sm"
              value={newMachine}
              onChange={(e) => setNewMachine(e.target.value as DurableMachine)}
            >
              <option value="small">small (1×)</option>
              <option value="medium">medium (2×)</option>
              <option value="large">large (4×)</option>
            </select>
          </div>
          <PremiumButton onClick={() => void onDefine()} disabled={busyId === 'define'}>
            {busyId === 'define' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Save
          </PremiumButton>
        </div>
      </GlassCard>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading tasks…
        </div>
      ) : (
        <div className="grid gap-3">
          {tasks.map((t) => (
            <GlassCard key={t.id} className="p-4 flex flex-wrap items-center gap-3 justify-between">
              <div>
                <div className="font-semibold flex items-center gap-2">
                  {t.id}
                  <Badge variant="secondary">v{t.version}</Badge>
                  <Badge variant="outline">{t.machine}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  handler={t.handler} · queue={t.queue.name} · concurrency=
                  {t.queue.concurrencyLimit}
                  {t.description ? ` · ${t.description}` : ''}
                </p>
              </div>
              <PremiumButton
                onClick={() => void onTrigger(t.id)}
                disabled={busyId === t.id}
                size="sm"
              >
                {busyId === t.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Trigger
              </PremiumButton>
            </GlassCard>
          ))}
          {!tasks.length && (
            <p className="text-sm text-muted-foreground">No tasks yet — define one above.</p>
          )}
        </div>
      )}
    </div>
  );
}
