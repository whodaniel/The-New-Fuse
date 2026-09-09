import OpsPageHeader from '@/components/ops/OpsPageHeader';
import { Badge, GlassCard, PremiumButton, PremiumInput } from '@/components/ui';
import {
  durableTasksApi,
  type DurableSchedule,
  type DurableTaskDef,
} from '@/services/durableTasksApi';
import { Loader2, Plus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<DurableSchedule[]>([]);
  const [tasks, setTasks] = useState<DurableTaskDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [id, setId] = useState('');
  const [taskId, setTaskId] = useState('echo');
  const [everySec, setEverySec] = useState('60');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, t] = await Promise.all([
        durableTasksApi.listSchedules(),
        durableTasksApi.listTasks(),
      ]);
      setSchedules(s);
      setTasks(t);
      setTaskId((prev) => (t.some((x) => x.id === prev) ? prev : t[0]?.id || 'echo'));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onAdd = async () => {
    if (!id.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await durableTasksApi.addSchedule({
        id: id.trim(),
        taskId,
        everyMs: Math.max(1, Number(everySec) || 60) * 1000,
        payload: { source: 'schedule', scheduleId: id.trim() },
      });
      setId('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (scheduleId: string, enabled: boolean) => {
    setBusy(true);
    try {
      await durableTasksApi.setScheduleEnabled(scheduleId, enabled);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <OpsPageHeader
        eyebrow="Forge"
        title="Durable Schedules"
        subtitle="Interval triggers for cloud DurableTasks (TNF-native, not crontab shell ledger)"
      />

      <div className="flex gap-3 text-sm">
        <Link className="text-sky-400 hover:underline" to="/durable-tasks">
          Tasks
        </Link>
        <Link className="text-sky-400 hover:underline" to="/runs">
          Runs
        </Link>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-950/40 px-3 py-2 text-sm text-rose-100">
          {error}
        </div>
      )}

      <GlassCard className="p-4 space-y-3">
        <h2 className="text-sm font-semibold">Add schedule</h2>
        <div className="flex flex-wrap gap-2 items-end">
          <div>
            <label className="text-xs text-muted-foreground">Schedule ID</label>
            <PremiumInput value={id} onChange={(e) => setId(e.target.value)} className="w-44" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Task</label>
            <select
              className="block rounded-md border border-border bg-background px-2 py-2 text-sm"
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
            >
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.id}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Every (seconds)</label>
            <PremiumInput
              value={everySec}
              onChange={(e) => setEverySec(e.target.value)}
              className="w-28"
            />
          </div>
          <PremiumButton onClick={() => void onAdd()} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add
          </PremiumButton>
        </div>
      </GlassCard>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : (
        <div className="space-y-2">
          {schedules.map((s) => (
            <GlassCard key={s.id} className="p-4 flex flex-wrap justify-between gap-3 items-center">
              <div>
                <div className="font-semibold flex items-center gap-2">
                  {s.id}
                  <Badge variant={s.enabled ? 'default' : 'secondary'}>
                    {s.enabled ? 'enabled' : 'paused'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  task={s.taskId} · every {Math.round(s.everyMs / 1000)}s
                  {s.lastFiredAt ? ` · last ${s.lastFiredAt}` : ' · never fired'}
                </p>
              </div>
              <PremiumButton
                size="sm"
                variant="secondary"
                disabled={busy}
                onClick={() => void toggle(s.id, !s.enabled)}
              >
                {s.enabled ? 'Pause' : 'Enable'}
              </PremiumButton>
            </GlassCard>
          ))}
          {!schedules.length && <p className="text-sm text-muted-foreground">No schedules yet.</p>}
        </div>
      )}
    </div>
  );
}
