import { HarnessStatusPanel } from '@/components/control-surface';
import { GlassCard } from '@/components/ui/premium/GlassCard';
import { PremiumButton } from '@/components/ui/premium/PremiumButton';
import {
  fetchBrowserStatus,
  formatBrowserTaskForChat,
  interactBrowser,
  runBrowserTask,
  snapshotElements,
  type BrowserSession,
  type BrowserTaskResult,
} from '@/services/browserAgent.service';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  ExternalLink,
  Globe,
  Loader2,
  MousePointer2,
  RefreshCw,
  Square,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const EXAMPLES = [
  'Open https://thenewfuse.com and snapshot the page',
  'Open https://duckduckgo.com',
  'Reload the current page',
];

export const ComputerUsePage: React.FC = () => {
  const [session, setSession] = useState<BrowserSession | null>(null);
  const [task, setTask] = useState('');
  const [loading, setLoading] = useState(false);
  const [busyOp, setBusyOp] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<BrowserTaskResult | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const refreshStatus = useCallback(async () => {
    const next = await fetchBrowserStatus();
    setSession(next);
    return next;
  }, []);

  useEffect(() => {
    void refreshStatus();
    const id = setInterval(() => {
      void refreshStatus();
    }, 8000);
    return () => clearInterval(id);
  }, [refreshStatus]);

  const screenshot = lastResult?.screenshotDataUrl || session?.screenshotDataUrl;
  const snapshot = lastResult?.snapshot ?? session?.snapshot;
  const elements = useMemo(() => snapshotElements(snapshot), [snapshot]);
  const controlling = Boolean(session?.controlling || lastResult?.ok);
  const available = session?.available ?? false;
  const url = lastResult?.url || session?.url;
  const title = lastResult?.title || session?.title;

  const appendLog = (line: string) => {
    setLog((prev) => [`${new Date().toLocaleTimeString()} ${line}`, ...prev].slice(0, 24));
  };

  const runTask = async () => {
    if (!task.trim()) return;
    setLoading(true);
    appendLog(`Task → ${task.trim()}`);
    try {
      const result = await runBrowserTask(task.trim());
      setLastResult(result);
      if (result.session) setSession(result.session);
      toast.success(result.ok ? 'Browser task completed' : 'Browser task finished with errors');
      appendLog(result.ok ? 'Task complete' : 'Task finished with errors');
    } catch (err: any) {
      toast.error(err?.message || 'Browser task failed');
      appendLog(`Error: ${err?.message || 'failed'}`);
    } finally {
      setLoading(false);
      void refreshStatus();
    }
  };

  const runOp = async (
    operation: Parameters<typeof interactBrowser>[0]['operation'],
    target?: string
  ) => {
    setBusyOp(operation);
    appendLog(`${operation}${target ? ` ${target}` : ''}`);
    try {
      const payload = await interactBrowser({
        operation,
        target,
        headed: operation === 'open',
      });
      const data = payload.data as { dataUrl?: string } | undefined;
      if (operation === 'screenshot' && data?.dataUrl) {
        setLastResult((prev) => ({
          ok: true,
          url: url ?? null,
          title: title ?? null,
          steps: [{ step: 'screenshot', ok: true }],
          snapshot: prev?.snapshot ?? session?.snapshot ?? null,
          screenshotDataUrl: data.dataUrl,
        }));
      }
      await refreshStatus();
    } catch (err: any) {
      toast.error(err?.message || `${operation} failed`);
    } finally {
      setBusyOp(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6 animate-in fade-in">
      {controlling && (
        <div className="flex items-center justify-between rounded-lg border border-amber-400/40 bg-amber-500/15 px-4 py-2 text-sm text-amber-100">
          <span className="inline-flex items-center gap-2 font-medium">
            <MousePointer2 className="w-4 h-4" />
            Agent controlling browser
            {title ? ` — ${title}` : ''}
            {url ? ` · ${url}` : ''}
          </span>
          <PremiumButton
            variant="outline"
            size="sm"
            onClick={() => void runOp('close')}
            disabled={busyOp === 'close'}
          >
            <Square className="w-3.5 h-3.5 mr-1" />
            Take over
          </PremiumButton>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="w-7 h-7 text-blue-400" />
            Computer Use
          </h1>
          <p className="text-muted-foreground mt-1">
            Chat-native agent browser. Ask in the composer — TNF boots agent-browser, navigates, and
            snapshots without a separate CLI step.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 h-10 rounded-md border-2 border-white/20 text-white text-sm hover:bg-white/10"
          >
            <ExternalLink className="w-4 h-4" />
            Mission Control
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="space-y-4">
          <GlassCard className="p-6 space-y-4" hover={false}>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Agent task</h2>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  available ? 'bg-green-500/20 text-green-300' : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                {session === null
                  ? 'Checking…'
                  : available
                    ? 'agent-browser available'
                    : 'agent-browser not on API host'}
              </span>
            </div>
            <textarea
              className="w-full min-h-[110px] rounded-lg border border-white/10 bg-black/20 p-3 text-sm"
              placeholder="e.g. Open https://thenewfuse.com and snapshot the page"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  void runTask();
                }
              }}
            />
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  className="text-xs px-2 py-1 rounded-full border border-white/10 text-muted-foreground hover:text-white hover:border-white/30"
                  onClick={() => setTask(example)}
                >
                  {example}
                </button>
              ))}
            </div>
            <PremiumButton onClick={runTask} disabled={loading || !task.trim()} loading={loading}>
              Run browser task
            </PremiumButton>
            {lastResult && (
              <pre className="text-xs whitespace-pre-wrap rounded-lg bg-black/30 p-3 border border-white/5">
                {formatBrowserTaskForChat(lastResult)}
              </pre>
            )}
          </GlassCard>

          <GlassCard className="p-4 space-y-3" hover={false}>
            <h3 className="text-sm font-semibold">Manual controls</h3>
            <div className="flex flex-wrap gap-2">
              <PremiumButton
                variant="outline"
                size="sm"
                onClick={() => void runOp('back')}
                disabled={!!busyOp}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </PremiumButton>
              <PremiumButton
                variant="outline"
                size="sm"
                onClick={() => void runOp('forward')}
                disabled={!!busyOp}
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </PremiumButton>
              <PremiumButton
                variant="outline"
                size="sm"
                onClick={() => void runOp('reload')}
                disabled={!!busyOp}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </PremiumButton>
              <PremiumButton
                variant="outline"
                size="sm"
                onClick={() => void runOp('screenshot')}
                disabled={!!busyOp}
              >
                <Camera className="w-3.5 h-3.5 mr-1" />
                Screenshot
              </PremiumButton>
            </div>
            {log.length > 0 && (
              <ul className="text-xs text-muted-foreground space-y-1 max-h-32 overflow-auto font-mono">
                {log.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            )}
          </GlassCard>

          <HarnessStatusPanel />
        </div>

        <div className="space-y-4">
          <GlassCard className="p-0 overflow-hidden" hover={false}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Live preview
                </div>
                <div className="text-sm truncate">{url || 'No session yet'}</div>
              </div>
              {busyOp && <Loader2 className="w-4 h-4 animate-spin text-blue-400" />}
            </div>
            <div className="min-h-[320px] bg-black/40 flex items-center justify-center">
              {screenshot ? (
                <img
                  src={screenshot}
                  alt="Controlled Chromium screenshot"
                  className="w-full h-auto"
                />
              ) : (
                <p className="text-sm text-muted-foreground p-8 text-center max-w-sm">
                  Run a task to boot the headed Chromium session. This pane shows the latest
                  screenshot from agent-browser.
                </p>
              )}
            </div>
          </GlassCard>

          <GlassCard className="p-4 space-y-2" hover={false}>
            <h3 className="text-sm font-semibold">Discovered elements</h3>
            {elements.length === 0 ? (
              <p className="text-xs text-muted-foreground">No snapshot yet.</p>
            ) : (
              <ul className="text-xs space-y-1 max-h-48 overflow-auto">
                {elements.map((el) => (
                  <li
                    key={el.handleId}
                    className="flex items-center justify-between gap-2 border-b border-white/5 py-1"
                  >
                    <span className="font-mono text-blue-300">{el.handleId}</span>
                    <span className="truncate text-muted-foreground">
                      {el.tag}
                      {el.text ? ` · ${el.text}` : ''}
                    </span>
                    <button
                      type="button"
                      className="text-blue-400 hover:underline"
                      onClick={() => void runOp('click', el.handleId)}
                    >
                      Click
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default ComputerUsePage;
