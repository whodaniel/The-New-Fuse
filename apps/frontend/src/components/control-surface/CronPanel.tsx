import { GlassCard } from '@/components/ui';
import { useAuthorization } from '@/hooks/useAuthorization';
import { Clock3, Play, Timer } from 'lucide-react';
import React, { useState } from 'react';
import { ZoneBadge } from './ZoneBadge';
import {
  runSystemProcessNow,
  useLocalRuntimeSummary,
  useSystemProcesses,
  type LocalCronJob,
  type SystemProcess,
} from './useLocalRuntime';

const relativeTime = (iso: string | null): string => {
  if (!iso) return 'unscheduled';
  const deltaMs = Date.parse(iso) - Date.now();
  if (Number.isNaN(deltaMs)) return 'unscheduled';
  if (deltaMs <= 0) return 'due now';
  const minutes = Math.round(deltaMs / 60000);
  if (minutes < 1) return 'in <1m';
  if (minutes < 60) return `in ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `in ${hours}h ${minutes % 60}m`;
  return `in ${Math.floor(hours / 24)}d`;
};

const statusDotClass = (status: string): string => {
  if (status === 'healthy' || status === 'running') return 'bg-emerald-400';
  if (status === 'error') return 'bg-red-400';
  if (status === 'paused' || status === 'manual') return 'bg-slate-500';
  return 'bg-blue-400';
};

const PersonalCronRow: React.FC<{ job: LocalCronJob }> = ({ job }) => (
  <div className="flex items-center gap-2 rounded-md border border-white/10 bg-black/20 px-3 py-2">
    <Timer className="h-3.5 w-3.5 shrink-0 text-amber-300/80" />
    <div className="min-w-0">
      <p className="truncate text-sm text-white" title={job.command}>
        {job.label}
      </p>
      <p className="text-xs text-slate-400">
        {job.scheduleHuman}
        <span className="mx-1.5 text-slate-600">·</span>
        <code className="text-[10px] text-slate-500">{job.schedule}</code>
      </p>
    </div>
    <span className="ml-auto shrink-0 rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-200">
      {relativeTime(job.nextRunAt)}
    </span>
  </div>
);

const SystemProcessRow: React.FC<{
  process: SystemProcess;
  onRun: (id: string) => void;
  running: boolean;
}> = ({ process, onRun, running }) => (
  <div className="flex items-center gap-2 rounded-md border border-white/10 bg-black/20 px-3 py-2">
    <span
      className={`h-2 w-2 shrink-0 rounded-full ${statusDotClass(process.runtime.status)}`}
      title={process.runtime.status}
    />
    <div className="min-w-0">
      <p className="truncate text-sm text-white" title={process.description}>
        {process.title}
      </p>
      <p className="truncate text-xs text-slate-400">{process.procedural.nextRunHint}</p>
    </div>
    <span className="ml-auto shrink-0 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] text-cyan-200">
      {process.procedural.enabled ? relativeTime(process.procedural.nextRunAt) : 'paused'}
    </span>
    {process.controls.canRunNow && (
      <button
        type="button"
        onClick={() => onRun(process.id)}
        disabled={running}
        title="Run now"
        className="shrink-0 rounded-md border border-white/15 p-1.5 text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-200 disabled:opacity-40"
      >
        <Play className="h-3 w-3" />
      </button>
    )}
  </div>
);

export const CronPanel: React.FC<{ limit?: number }> = ({ limit = 5 }) => {
  const { isAdmin } = useAuthorization();
  const summary = useLocalRuntimeSummary();
  const system = useSystemProcesses({ enabled: isAdmin });
  const [runningId, setRunningId] = useState<string | null>(null);
  const [runMessage, setRunMessage] = useState<string | null>(null);

  const cron = summary.data?.cron;
  const personalJobs: LocalCronJob[] = cron?.available === true ? cron.jobs : [];
  const sortedPersonal = [...personalJobs].sort((a, b) =>
    (a.nextRunAt ?? '9999').localeCompare(b.nextRunAt ?? '9999')
  );

  const systemProcesses = (system.data?.processes ?? [])
    .filter((process) => process.procedural.enabled)
    .sort((a, b) =>
      (a.procedural.nextRunAt ?? '9999').localeCompare(b.procedural.nextRunAt ?? '9999')
    );

  const handleRun = async (processId: string) => {
    setRunningId(processId);
    setRunMessage(null);
    try {
      await runSystemProcessNow(processId);
      setRunMessage(`Triggered ${processId}`);
      void system.refetch();
    } catch (error) {
      setRunMessage(error instanceof Error ? error.message : 'Run failed');
    } finally {
      setRunningId(null);
    }
  };

  return (
    <GlassCard className="p-4" title="Scheduled Jobs" icon={Clock3} gradient="cyan">
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <ZoneBadge zone="personal" detail="your crontab" />
            <span className="text-xs text-slate-500">
              {cron?.available === true ? `${personalJobs.length} jobs` : 'offline'}
            </span>
          </div>
          {summary.isLoading ? (
            <p className="text-sm text-slate-400">Loading schedule...</p>
          ) : cron?.available !== true ? (
            <p className="text-sm text-slate-400">
              Local crontab unavailable — connect from your machine to see personal jobs.
            </p>
          ) : sortedPersonal.length === 0 ? (
            <p className="text-sm text-slate-400">No personal cron jobs scheduled.</p>
          ) : (
            <div className="space-y-2">
              {sortedPersonal.slice(0, limit).map((job) => (
                <PersonalCronRow key={job.id} job={job} />
              ))}
              {sortedPersonal.length > limit && (
                <p className="text-xs text-slate-500">+{sortedPersonal.length - limit} more</p>
              )}
            </div>
          )}
        </div>

        {isAdmin && (
          <div className="border-t border-white/10 pt-3">
            <div className="flex items-center justify-between mb-2">
              <ZoneBadge zone="system" detail="platform processes" />
              <span className="text-xs text-slate-500">
                {system.data ? `${system.data.summary.enabled} enabled` : ''}
              </span>
            </div>
            {system.isLoading ? (
              <p className="text-sm text-slate-400">Loading system processes...</p>
            ) : system.isError || !system.data ? (
              <p className="text-sm text-slate-400">System process registry unavailable.</p>
            ) : systemProcesses.length === 0 ? (
              <p className="text-sm text-slate-400">No enabled system processes.</p>
            ) : (
              <div className="space-y-2">
                {systemProcesses.slice(0, limit).map((process) => (
                  <SystemProcessRow
                    key={process.id}
                    process={process}
                    onRun={handleRun}
                    running={runningId === process.id}
                  />
                ))}
                {systemProcesses.length > limit && (
                  <p className="text-xs text-slate-500">
                    +{systemProcesses.length - limit} more in Admin
                  </p>
                )}
              </div>
            )}
            {runMessage && <p className="mt-2 text-xs text-cyan-200">{runMessage}</p>}
          </div>
        )}
      </div>
    </GlassCard>
  );
};

export default CronPanel;
