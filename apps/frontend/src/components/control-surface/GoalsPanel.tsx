import { GlassCard } from '@/components/ui';
import { listGoals, type GoalRecord } from '@/services/unifiedLedgerApi';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Cloud, HardDrive, Target } from 'lucide-react';
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ZoneBadge } from './ZoneBadge';
import { useLocalRuntimeSummary, type LocalGoal } from './useLocalRuntime';

type MergedGoal = {
  key: string;
  title: string;
  status: string;
  priority: string | null;
  progress: number;
  origin: 'local' | 'cloud';
  active: boolean;
};

const STATUS_ORDER: Record<string, number> = {
  active: 0,
  paused: 1,
  draft: 2,
  completed: 3,
  archived: 4,
  abandoned: 4,
};

const priorityClass = (priority: string | null): string => {
  if (priority === 'critical' || priority === 'urgent') return 'text-red-300 border-red-400/40';
  if (priority === 'high') return 'text-orange-300 border-orange-400/40';
  return 'text-slate-400 border-white/15';
};

const progressBarColor = (progress: number): string => {
  if (progress >= 80) return 'bg-emerald-400';
  if (progress >= 40) return 'bg-blue-400';
  return 'bg-amber-400';
};

const cloudProgress = (goal: GoalRecord): number => {
  if (goal.milestones.length === 0) return goal.status === 'completed' ? 100 : 0;
  const done = goal.milestones.filter((m) => m.status === 'completed').length;
  return Math.round((done / goal.milestones.length) * 100);
};

export const GoalsPanel: React.FC<{ limit?: number }> = ({ limit = 6 }) => {
  const summary = useLocalRuntimeSummary();
  const cloud = useQuery<GoalRecord[]>({
    queryKey: ['cloud-goals'],
    queryFn: () => listGoals(),
    refetchInterval: 60000,
    retry: 1,
  });

  const localGoals: LocalGoal[] =
    summary.data?.goals.available === true ? summary.data.goals.goals : [];
  const activeGoalId =
    summary.data?.goals.available === true ? summary.data.goals.activeGoalId : null;

  const merged = useMemo<MergedGoal[]>(() => {
    const rows: MergedGoal[] = localGoals.map((goal) => ({
      key: `local-${goal.id}`,
      title: goal.title,
      status: goal.status,
      priority: goal.priority,
      progress: Math.max(0, Math.min(100, goal.progress)),
      origin: 'local',
      active: goal.id === activeGoalId,
    }));
    const localTitles = new Set(localGoals.map((goal) => goal.title.trim().toLowerCase()));
    for (const goal of cloud.data ?? []) {
      if (localTitles.has(goal.title.trim().toLowerCase())) continue;
      rows.push({
        key: `cloud-${goal.id}`,
        title: goal.title,
        status: goal.status,
        priority: null,
        progress: cloudProgress(goal),
        origin: 'cloud',
        active: false,
      });
    }
    rows.sort(
      (a, b) =>
        Number(b.active) - Number(a.active) ||
        (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9) ||
        b.progress - a.progress
    );
    return rows;
  }, [localGoals, activeGoalId, cloud.data]);

  const visible = merged.slice(0, limit);
  const loading = summary.isLoading && cloud.isLoading;

  return (
    <GlassCard className="p-4" title="Your Goals" icon={Target} gradient="orange">
      <div className="flex items-center justify-between mb-3">
        <ZoneBadge zone="personal" />
        <Link
          to="/goals"
          className="inline-flex items-center gap-1 text-xs text-blue-300 hover:text-blue-200"
        >
          All goals <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading goals...</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-slate-400">
          No goals yet. Create one from the{' '}
          <Link to="/goals" className="text-blue-300">
            Goals
          </Link>{' '}
          page or `tnf goals add`.
        </p>
      ) : (
        <div className="space-y-2.5">
          {visible.map((goal) => (
            <div
              key={goal.key}
              className={`rounded-md border px-3 py-2 ${
                goal.active
                  ? 'border-amber-400/40 bg-amber-500/[0.07]'
                  : 'border-white/10 bg-black/20'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {goal.origin === 'local' ? (
                  <HardDrive className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                ) : (
                  <Cloud className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                )}
                <span className="truncate text-sm text-white" title={goal.title}>
                  {goal.title}
                </span>
                {goal.active && (
                  <span className="shrink-0 rounded-full border border-amber-400/40 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-amber-200">
                    Focus
                  </span>
                )}
                {goal.priority && goal.priority !== 'medium' && (
                  <span
                    className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] uppercase tracking-wider ${priorityClass(goal.priority)}`}
                  >
                    {goal.priority}
                  </span>
                )}
                <span className="ml-auto shrink-0 text-xs text-slate-400">{goal.progress}%</span>
              </div>
              <div className="mt-1.5 h-1 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full ${progressBarColor(goal.progress)}`}
                  style={{ width: `${goal.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {merged.length > visible.length && (
        <p className="mt-2 text-xs text-slate-500">
          +{merged.length - visible.length} more on the Goals page
        </p>
      )}
    </GlassCard>
  );
};

export default GoalsPanel;
