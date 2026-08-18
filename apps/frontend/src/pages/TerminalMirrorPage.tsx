import { TerminalMirror, ZoneBadge, type MirrorWindow } from '@/components/control-surface';
import { windowLabel } from '@/components/control-surface/TerminalMirror/TerminalWindowCard';
import { GlassCard } from '@/components/ui';
import { ArrowLeft, GitBranch, MonitorPlay } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const DetailRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex items-start justify-between gap-3 border-b border-white/5 py-1.5 text-sm">
    <span className="shrink-0 text-slate-400">{label}</span>
    <span className="min-w-0 truncate text-right text-slate-100">{value ?? '—'}</span>
  </div>
);

export const TerminalMirrorPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(960);
  const [selected, setSelected] = useState<MirrorWindow | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      const next = Math.floor(entries[0]?.contentRect.width ?? 960);
      if (next > 0) setWidth(next);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="space-y-4 p-6">
      <GlassCard className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <MonitorPlay className="h-5 w-5 text-emerald-300" />
              <h1 className="text-xl font-bold text-white">Terminal Mirror</h1>
              <ZoneBadge zone="personal" detail="your desktop, live" />
            </div>
            <p className="mt-1 text-sm text-slate-300">
              Miniature live replica of your local terminal windows as they are arranged on screen.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/visualizations/terminals"
              className="inline-flex items-center gap-1.5 rounded-md border border-white/15 px-3 py-1.5 text-xs text-slate-300 hover:border-white/30 hover:text-white"
            >
              <GitBranch className="h-3.5 w-3.5" /> Topology graph
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-md border border-white/15 px-3 py-1.5 text-xs text-slate-300 hover:border-white/30 hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Mission Control
            </Link>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <GlassCard className="p-4">
          <div ref={containerRef}>
            <TerminalMirror
              width={width}
              height={Math.round((width * 10) / 16)}
              refetchInterval={5000}
              onWindowSelect={setSelected}
            />
          </div>
        </GlassCard>

        <GlassCard className="p-4" title="Window Detail">
          {!selected ? (
            <p className="text-sm text-slate-400">
              Click a window chip to inspect its agent, tty, and activity.
            </p>
          ) : (
            <div>
              <p className="mb-2 truncate text-sm font-semibold text-white">
                {windowLabel(selected)}
              </p>
              <DetailRow label="Agent" value={selected.agentId} />
              <DetailRow label="Title" value={selected.title} />
              <DetailRow label="TTY" value={selected.tty} />
              <DetailRow label="State" value={selected.busy ? 'busy' : 'idle'} />
              <DetailRow label="Session" value={selected.sessionStatus} />
              <DetailRow
                label="Last activity"
                value={
                  selected.lastActivityAt
                    ? new Date(selected.lastActivityAt).toLocaleTimeString()
                    : null
                }
              />
              <DetailRow label="CWD" value={selected.cwd} />
              <DetailRow label="Command" value={selected.foregroundCommand} />
              <DetailRow
                label="Position"
                value={
                  selected.bounds
                    ? `${selected.bounds.x},${selected.bounds.y} · ${selected.bounds.width}×${selected.bounds.height}`
                    : 'off-screen'
                }
              />
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
};

export default TerminalMirrorPage;
