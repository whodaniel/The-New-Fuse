import { invoke } from '@tauri-apps/api/core';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PageShell from '../components/layout/PageShell';
import { useRoute } from '../components/route-context';
import apiService from '../services/api';

/**
 * Mission Control — instant view of personal goals, scheduled cron jobs, and a
 * live spatial mirror of local terminal agent windows. Desktop-exclusive: chip
 * click focuses the real Terminal window via osascript.
 */

interface LocalGoal {
  id: string;
  title: string;
  status: string;
  priority?: string;
  progress?: number;
  active?: boolean;
}

interface LocalCronJob {
  id: string;
  schedule: string;
  command: string;
  label: string;
  scheduleHuman: string;
  nextRunAt: string | null;
  enabled: boolean;
}

interface MirrorBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface MirrorDisplay extends MirrorBounds {
  id: number;
  main?: boolean;
}

interface MirrorWindow {
  windowId: number;
  agentId?: string | null;
  tty?: string | null;
  title?: string | null;
  busy?: boolean;
  agentLike?: boolean;
  bounds?: MirrorBounds | null;
  zOrder?: number | null;
  sessionStatus?: string | null;
}

interface MirrorPayload {
  available: boolean;
  reason?: string;
  stale?: boolean;
  ageSeconds?: number;
  generatedAt?: string;
  displays?: MirrorDisplay[];
  windows?: MirrorWindow[];
}

interface SummaryPayload {
  goals: { available: boolean; reason?: string; goals?: LocalGoal[]; activeGoalId?: string | null };
  cron: { available: boolean; reason?: string; jobs?: LocalCronJob[] };
  terminalMirror: {
    available: boolean;
    reason?: string;
    windowCount?: number;
    busyCount?: number;
    agentCount?: number;
    stale?: boolean;
  };
  generatedAt?: string;
}

const FALLBACK_DISPLAY: MirrorDisplay = { id: 0, x: 0, y: 0, width: 1440, height: 900 };

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const delta = new Date(iso).getTime() - Date.now();
  if (Number.isNaN(delta)) return '';
  if (delta <= 30_000) return 'due now';
  const mins = Math.round(delta / 60_000);
  if (mins < 60) return `in ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `in ${hours}h ${mins % 60}m`;
  return `in ${Math.floor(hours / 24)}d`;
}

function goalBarColor(progress: number): string {
  if (progress >= 80) return '#10b981';
  if (progress >= 40) return '#60a5fa';
  return '#f59e0b';
}

function windowLabel(win: MirrorWindow): string {
  return win.agentId || win.title || win.tty || `window ${win.windowId}`;
}

function computeLayout(displays: MirrorDisplay[], cW: number, cH: number) {
  const list = displays.length > 0 ? displays : [FALLBACK_DISPLAY];
  const minX = Math.min(...list.map((d) => d.x));
  const minY = Math.min(...list.map((d) => d.y));
  const maxX = Math.max(...list.map((d) => d.x + d.width));
  const maxY = Math.max(...list.map((d) => d.y + d.height));
  const worldW = Math.max(1, maxX - minX);
  const worldH = Math.max(1, maxY - minY);
  const scale = Math.min(cW / worldW, cH / worldH);
  const offsetX = (cW - worldW * scale) / 2;
  const offsetY = (cH - worldH * scale) / 2;
  return { minX, minY, scale, offsetX, offsetY, displays: list };
}

const MissionControl: React.FC = () => {
  const { navigate } = useRoute();
  const [summary, setSummary] = useState<SummaryPayload | null>(null);
  const [mirror, setMirror] = useState<MirrorPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [focusMsg, setFocusMsg] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 640, height: 360 });

  const refreshSummary = useCallback(async () => {
    const result = await apiService.getLocalRuntimeSummary();
    if (result.success && result.data) {
      setSummary(result.data as SummaryPayload);
      setError(null);
    } else if (!result.success) {
      setError(result.error || 'Local runtime unavailable');
    }
  }, []);

  const refreshMirror = useCallback(async () => {
    const result = await apiService.getLocalRuntimeTerminalMirror();
    if (result.success && result.data) {
      setMirror(result.data as MirrorPayload);
    }
  }, []);

  useEffect(() => {
    refreshSummary();
    refreshMirror();
    const summaryTimer = setInterval(refreshSummary, 15_000);
    const mirrorTimer = setInterval(refreshMirror, 5_000);
    return () => {
      clearInterval(summaryTimer);
      clearInterval(mirrorTimer);
    };
  }, [refreshSummary, refreshMirror]);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 640;
      setCanvasSize({ width, height: Math.max(220, Math.round((width * 9) / 16)) });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const focusWindow = useCallback(async (win: MirrorWindow) => {
    setSelectedId(win.windowId);
    const label = windowLabel(win);
    setFocusMsg(`Focusing ${label}…`);
    try {
      const script = `tell application "Terminal"
  activate
  set index of window id ${Number(win.windowId)} to 1
end tell`;
      await invoke<string>('execute_command', {
        command: `osascript -e ${JSON.stringify(script)}`,
      });
      setFocusMsg(`Focused ${label}`);
    } catch (e) {
      setFocusMsg(`Focus failed: ${e}`);
    }
  }, []);

  const goals = useMemo(() => {
    const list = summary?.goals?.available ? (summary.goals.goals ?? []) : [];
    const order: Record<string, number> = {
      active: 0,
      paused: 1,
      draft: 2,
      completed: 3,
      archived: 4,
      abandoned: 4,
    };
    return [...list]
      .sort((a, b) => {
        const activeDelta =
          Number(b.id === summary?.goals?.activeGoalId) -
          Number(a.id === summary?.goals?.activeGoalId);
        if (activeDelta !== 0) return activeDelta;
        const statusDelta = (order[a.status] ?? 2) - (order[b.status] ?? 2);
        if (statusDelta !== 0) return statusDelta;
        return (b.progress ?? 0) - (a.progress ?? 0);
      })
      .slice(0, 6);
  }, [summary]);

  const cronJobs = useMemo(() => {
    const list = summary?.cron?.available ? (summary.cron.jobs ?? []) : [];
    return [...list].sort((a, b) => {
      const aNext = a.nextRunAt ? new Date(a.nextRunAt).getTime() : Number.MAX_SAFE_INTEGER;
      const bNext = b.nextRunAt ? new Date(b.nextRunAt).getTime() : Number.MAX_SAFE_INTEGER;
      return aNext - bNext;
    });
  }, [summary]);

  const layout = useMemo(
    () => computeLayout(mirror?.displays ?? [], canvasSize.width, canvasSize.height),
    [mirror?.displays, canvasSize]
  );

  const positioned = useMemo(() => {
    const windows = (mirror?.windows ?? []).filter((w) => w.bounds);
    return [...windows].sort((a, b) => (b.zOrder ?? 0) - (a.zOrder ?? 0));
  }, [mirror?.windows]);

  const offscreen = useMemo(
    () => (mirror?.windows ?? []).filter((w) => !w.bounds),
    [mirror?.windows]
  );

  const busyCount = (mirror?.windows ?? []).filter((w) => w.busy).length;

  return (
    <PageShell
      title="Mission Control"
      subtitle="Your goals, scheduled jobs, and live terminal mirror — at a glance"
      actions={
        <button
          type="button"
          className="secondary-button"
          onClick={() => {
            refreshSummary();
            refreshMirror();
          }}
        >
          Refresh
        </button>
      }
    >
      <div className="mission-control">
        {error ? (
          <div className="mc-offline">
            <strong>Local runtime offline.</strong> {error}
          </div>
        ) : null}

        <div className="mc-grid">
          {/* Goals — PERSONAL */}
          <section className="mc-card mc-personal">
            <header className="mc-card-header">
              <h2>Goals</h2>
              <span className="mc-zone mc-zone-personal">PERSONAL</span>
            </header>
            {goals.length === 0 ? (
              <p className="mc-empty">
                {summary?.goals?.available === false
                  ? summary.goals.reason || 'Local goals unavailable'
                  : 'No goals yet — create one with `tnf goals add`.'}
              </p>
            ) : (
              <ul className="mc-goal-list">
                {goals.map((goal) => {
                  const progress = Math.max(0, Math.min(100, goal.progress ?? 0));
                  const isFocus = goal.id === summary?.goals?.activeGoalId;
                  return (
                    <li key={goal.id} className="mc-goal">
                      <div className="mc-goal-top">
                        <span className="mc-goal-title">{goal.title}</span>
                        {isFocus ? <span className="mc-chip mc-chip-focus">Focus</span> : null}
                        {goal.priority === 'critical' || goal.priority === 'urgent' ? (
                          <span className="mc-chip mc-chip-urgent">{goal.priority}</span>
                        ) : null}
                        <span className="mc-goal-status">{goal.status}</span>
                      </div>
                      <div className="mc-progress-track">
                        <div
                          className="mc-progress-fill"
                          style={{ width: `${progress}%`, background: goalBarColor(progress) }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Cron — PERSONAL */}
          <section className="mc-card mc-personal">
            <header className="mc-card-header">
              <h2>Scheduled Jobs</h2>
              <span className="mc-zone mc-zone-personal">PERSONAL</span>
            </header>
            {cronJobs.length === 0 ? (
              <p className="mc-empty">
                {summary?.cron?.available === false
                  ? summary.cron.reason || 'Crontab unavailable'
                  : 'No cron jobs scheduled.'}
              </p>
            ) : (
              <ul className="mc-cron-list">
                {cronJobs.map((job) => (
                  <li key={job.id} className="mc-cron">
                    <div className="mc-cron-main">
                      <span className="mc-cron-label">{job.label}</span>
                      <span className="mc-cron-human">{job.scheduleHuman}</span>
                    </div>
                    <div className="mc-cron-side">
                      <code className="mc-cron-code">{job.schedule}</code>
                      {job.nextRunAt ? (
                        <span className="mc-chip mc-chip-next">{relativeTime(job.nextRunAt)}</span>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Terminal Mirror — spatial */}
        <section className="mc-card mc-personal mc-mirror-card">
          <header className="mc-card-header">
            <h2>Terminal Mirror</h2>
            <span className="mc-zone mc-zone-personal">PERSONAL · your desktop, live</span>
            <span className="mc-mirror-meta">
              {mirror?.available
                ? `${positioned.length + offscreen.length} windows · ${busyCount} busy${mirror.stale ? ' · STALE' : ''}`
                : 'offline'}
            </span>
            <button
              type="button"
              className="ghost-button"
              onClick={() => navigate('/terminal')}
              style={{ marginLeft: 'auto' }}
            >
              Swarm Terminal →
            </button>
          </header>

          {focusMsg ? <div className="mc-focus-msg">{focusMsg}</div> : null}

          <div ref={canvasRef} className="mc-canvas" style={{ height: canvasSize.height }}>
            {!mirror?.available ? (
              <div className="mc-canvas-offline">
                Local mirror offline{mirror?.reason ? ` — ${mirror.reason}` : ''}
              </div>
            ) : (
              <>
                {layout.displays.map((display) => (
                  <div
                    key={display.id}
                    className="mc-display"
                    style={{
                      left: layout.offsetX + (display.x - layout.minX) * layout.scale,
                      top: layout.offsetY + (display.y - layout.minY) * layout.scale,
                      width: display.width * layout.scale,
                      height: display.height * layout.scale,
                    }}
                  >
                    {display.main ? <span className="mc-display-tag">main</span> : null}
                  </div>
                ))}
                {positioned.map((win, index) => {
                  const bounds = win.bounds as MirrorBounds;
                  const color = win.busy ? '#f59e0b' : win.agentLike ? '#34d399' : '#60a5fa';
                  return (
                    <button
                      key={win.windowId}
                      type="button"
                      className={`mc-window ${selectedId === win.windowId ? 'selected' : ''}`}
                      title={`${windowLabel(win)} — click to focus the real window`}
                      onClick={() => focusWindow(win)}
                      style={{
                        left: layout.offsetX + (bounds.x - layout.minX) * layout.scale,
                        top: layout.offsetY + (bounds.y - layout.minY) * layout.scale,
                        width: Math.max(28, bounds.width * layout.scale),
                        height: Math.max(18, bounds.height * layout.scale),
                        zIndex: positioned.length - index,
                        borderColor: color,
                      }}
                    >
                      <span className="mc-window-label" style={{ color }}>
                        {win.busy ? <span className="mc-busy-dot" /> : null}
                        {windowLabel(win)}
                      </span>
                      {win.tty ? <span className="mc-window-tty">{win.tty}</span> : null}
                    </button>
                  );
                })}
              </>
            )}
          </div>

          {offscreen.length > 0 ? (
            <div className="mc-offscreen">
              {offscreen.slice(0, 4).map((win) => (
                <button
                  key={win.windowId}
                  type="button"
                  className="mc-chip mc-chip-offscreen"
                  onClick={() => focusWindow(win)}
                >
                  {windowLabel(win)}
                </button>
              ))}
              {offscreen.length > 4 ? (
                <span className="mc-chip">+{offscreen.length - 4} more</span>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>

      <style>{`
        .mission-control {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .mc-offline {
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid rgba(239, 68, 68, 0.35);
          background: rgba(239, 68, 68, 0.08);
          color: #fca5a5;
          font-size: 13px;
        }

        .mc-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }

        @media (min-width: 900px) {
          .mc-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        .mc-card {
          border-radius: 14px;
          border: 1px solid var(--tnf-border, rgba(255, 255, 255, 0.08));
          background: var(--tnf-surface, rgba(255, 255, 255, 0.02));
          padding: 16px;
        }

        .mc-personal {
          border-color: rgba(251, 191, 36, 0.25);
          background: rgba(245, 158, 11, 0.04);
        }

        .mc-card-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }

        .mc-card-header h2 {
          font-size: 15px;
          font-weight: 700;
          margin: 0;
          color: var(--tnf-text-primary, #f8fafc);
        }

        .mc-zone {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          padding: 2px 8px;
          border-radius: 999px;
        }

        .mc-zone-personal {
          color: #fcd34d;
          background: rgba(245, 158, 11, 0.15);
          border: 1px solid rgba(251, 191, 36, 0.35);
        }

        .mc-empty {
          font-size: 13px;
          color: var(--tnf-text-muted, #64748b);
        }

        .mc-goal-list,
        .mc-cron-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .mc-goal-top {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }

        .mc-goal-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--tnf-text-primary, #f8fafc);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .mc-goal-status {
          margin-left: auto;
          font-size: 11px;
          color: var(--tnf-text-muted, #64748b);
          text-transform: capitalize;
        }

        .mc-chip {
          font-size: 10px;
          font-weight: 600;
          padding: 2px 7px;
          border-radius: 999px;
          border: 1px solid var(--tnf-border, rgba(255, 255, 255, 0.12));
          color: var(--tnf-text-muted, #94a3b8);
          background: transparent;
          white-space: nowrap;
        }

        .mc-chip-focus {
          color: #c4b5fd;
          border-color: rgba(139, 92, 246, 0.4);
          background: rgba(139, 92, 246, 0.15);
        }

        .mc-chip-urgent {
          color: #fca5a5;
          border-color: rgba(239, 68, 68, 0.4);
          background: rgba(239, 68, 68, 0.12);
          text-transform: capitalize;
        }

        .mc-chip-next {
          color: #67e8f9;
          border-color: rgba(6, 182, 212, 0.35);
          background: rgba(6, 182, 212, 0.1);
        }

        .mc-chip-offscreen {
          cursor: pointer;
        }

        .mc-progress-track {
          height: 6px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.06);
          overflow: hidden;
        }

        .mc-progress-fill {
          height: 100%;
          border-radius: 999px;
          transition: width 0.4s ease;
        }

        .mc-cron {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 8px 10px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.02);
        }

        .mc-cron-main {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .mc-cron-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--tnf-text-primary, #f8fafc);
        }

        .mc-cron-human {
          font-size: 11px;
          color: var(--tnf-text-muted, #64748b);
        }

        .mc-cron-side {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .mc-cron-code {
          font-size: 11px;
          color: var(--tnf-text-muted, #94a3b8);
          background: rgba(255, 255, 255, 0.04);
          padding: 2px 6px;
          border-radius: 6px;
        }

        .mc-mirror-meta {
          font-size: 11px;
          color: var(--tnf-text-muted, #64748b);
        }

        .mc-focus-msg {
          font-size: 12px;
          color: #67e8f9;
          margin-bottom: 8px;
        }

        .mc-canvas {
          position: relative;
          width: 100%;
          border-radius: 12px;
          background: rgba(2, 6, 23, 0.6);
          border: 1px solid var(--tnf-border, rgba(255, 255, 255, 0.08));
          overflow: hidden;
        }

        .mc-canvas-offline {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          color: var(--tnf-text-muted, #64748b);
        }

        .mc-display {
          position: absolute;
          border: 1px dashed rgba(148, 163, 184, 0.3);
          border-radius: 6px;
          background: rgba(148, 163, 184, 0.03);
        }

        .mc-display-tag {
          position: absolute;
          top: 4px;
          right: 6px;
          font-size: 9px;
          letter-spacing: 0.08em;
          color: rgba(148, 163, 184, 0.5);
          text-transform: uppercase;
        }

        .mc-window {
          position: absolute;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: flex-start;
          gap: 1px;
          padding: 3px 6px;
          border-radius: 5px;
          border: 1px solid;
          background: rgba(15, 23, 42, 0.9);
          cursor: pointer;
          overflow: hidden;
          text-align: left;
          transition: transform 0.15s ease;
        }

        .mc-window:hover {
          transform: scale(1.03);
        }

        .mc-window.selected {
          box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.6);
        }

        .mc-window-label {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          font-weight: 600;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .mc-window-tty {
          font-size: 9px;
          color: var(--tnf-text-muted, #64748b);
        }

        .mc-busy-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #f59e0b;
          animation: mc-pulse 1.2s ease-in-out infinite;
          flex-shrink: 0;
        }

        @keyframes mc-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .mc-offscreen {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
          margin-top: 10px;
        }
      `}</style>
    </PageShell>
  );
};

export default MissionControl;
