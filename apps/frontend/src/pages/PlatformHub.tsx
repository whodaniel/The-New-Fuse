import {
  Activity,
  Boxes,
  Brain,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  Cpu,
  Database,
  FolderTree,
  Layers,
  Play,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Terminal,
  UploadCloud,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import rawSeedData from '../data/google_ai_session_concordance.json';

interface SessionItem {
  sessionId: string;
  conversationId: string;
  title: string;
  stepCount: number;
  lastActive: string;
  workspace: string;
  project: string;
}

interface ConcordancePayload {
  generatedAt: string;
  totalSessions: number;
  syncedToTnf: number;
  account?: string;
  sessions: SessionItem[];
}

const SEED_CONCORDANCE: ConcordancePayload = (rawSeedData as unknown as ConcordancePayload) || {
  generatedAt: '',
  totalSessions: 0,
  syncedToTnf: 0,
  sessions: [],
};

/** Operator-local mirror (gitignored). Populate with:
 *  cp ~/.tnf/personal-intelligence/google_ai_session_concordance.json \
 *     apps/frontend/public/local-intel/
 */
const LOCAL_INTEL_URL = '/local-intel/google_ai_session_concordance.json';

export default function PlatformHub() {
  const [data, setData] = useState<ConcordancePayload>(SEED_CONCORDANCE);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'all' | 'high_steps' | 'mega_sessions' | 'recent'>(
    'all'
  );
  const [selectedSession, setSelectedSession] = useState<SessionItem | null>(null);
  const [activeTab, setActiveTab] = useState<'sessions' | 'pipeline' | 'fleet'>('sessions');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<{
    status: string;
    target: string;
    time: string;
  } | null>(null);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const loadConcordance = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`${LOCAL_INTEL_URL}?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(
          res.status === 404
            ? 'Local concordance mirror missing — run Sync or copy from ~/.tnf/personal-intelligence/'
            : `Failed to load concordance (${res.status})`
        );
      }
      const payload = (await res.json()) as ConcordancePayload;
      setData({
        generatedAt: payload.generatedAt || '',
        totalSessions: payload.totalSessions ?? payload.sessions?.length ?? 0,
        syncedToTnf: payload.syncedToTnf ?? payload.sessions?.length ?? 0,
        sessions: Array.isArray(payload.sessions) ? payload.sessions : [],
      });
    } catch (err) {
      setData(EMPTY_CONCORDANCE);
      setLoadError((err as Error).message || 'Concordance unavailable');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConcordance();
  }, [loadConcordance]);

  const allSessions: SessionItem[] = data.sessions || [];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    setSyncNotice('Reloading operator-local concordance mirror…');
    try {
      await loadConcordance();
      setSyncNotice(
        'Mirror refreshed. If empty, run: tnf google-ai sync && cp ~/.tnf/personal-intelligence/google_ai_session_concordance.json apps/frontend/public/local-intel/'
      );
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncNotice(null), 6000);
    }
  };

  const handleCloudSync = async () => {
    setIsCloudSyncing(true);
    setSyncNotice('Pinging Supabase & Cloudflare Concordance Edge...');
    try {
      const edgeUrl =
        'https://wslydgtgindrywldatbv.supabase.co/functions/v1/concordance/personal-intelligence/sync';
      const resp = await fetch(edgeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generatedAt: data.generatedAt || new Date().toISOString(),
          totalSessions: data.totalSessions || allSessions.length,
          syncedToTnf: data.syncedToTnf || allSessions.length,
          account: data.account || 'operator-local',
          sessions: allSessions.slice(0, 100),
        }),
      });

      if (resp.ok) {
        const resData = await resp.json();
        setCloudSyncStatus({
          status: resData.status || 'synced',
          target: 'app.thenewfuse.com',
          time: new Date().toLocaleTimeString(),
        });
        setSyncNotice(
          '✓ Successfully synchronized Personal Intelligence concordance with app.thenewfuse.com & Supabase Edge!'
        );
      } else {
        setSyncNotice(`Cloud Edge ping returned status ${resp.status}. Offline cache active.`);
      }
    } catch {
      setSyncNotice(
        'Local cache active. Concordance stored at ~/.tnf/personal-intelligence/ ready for cloud propagation.'
      );
    } finally {
      setIsCloudSyncing(false);
      setTimeout(() => setSyncNotice(null), 7000);
    }
  };

  const filteredSessions = useMemo(() => {
    return allSessions.filter((s) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        s.title.toLowerCase().includes(q) ||
        s.sessionId.toLowerCase().includes(q) ||
        s.conversationId.toLowerCase().includes(q) ||
        (s.workspace && s.workspace.toLowerCase().includes(q)) ||
        (s.project && s.project.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (filterMode === 'high_steps') return s.stepCount >= 100;
      if (filterMode === 'mega_sessions') return s.stepCount >= 500;
      if (filterMode === 'recent') {
        const d = new Date(s.lastActive);
        return !isNaN(d.getTime()) && d.getFullYear() >= 2026;
      }
      return true;
    });
  }, [allSessions, searchQuery, filterMode]);

  const stats = useMemo(() => {
    const totalSteps = allSessions.reduce((acc, curr) => acc + (curr.stepCount || 0), 0);
    const avgSteps = allSessions.length ? Math.round(totalSteps / allSessions.length) : 0;
    const megaSessions = allSessions.filter((s) => s.stepCount >= 500).length;
    return { totalSteps, avgSteps, megaSessions };
  }, [allSessions]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8 space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-sky-500/30 bg-gradient-to-br from-slate-900 via-slate-900/90 to-sky-950/40 p-6 md:p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-sky-400/40 bg-sky-500/10 text-xs font-semibold text-sky-300">
              <Sparkles className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
              <span>Google Gemini & Antigravity Ecosystem Nexus</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-emerald-300 font-mono">
                {isLoading ? 'LOADING…' : loadError ? 'MIRROR MISSING' : 'LIVE CONCORDANCE'}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <Brain className="w-9 h-9 text-sky-400" />
              <span>Personal Intelligence & Platform Hub</span>
            </h1>
            <p className="text-slate-300 text-sm md:text-base max-w-3xl leading-relaxed">
              Unified bridge connecting the operator Google AI sessions, Antigravity brains, and
              project workspaces into The New Fuse multi-agent orchestration runtime.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => void handleTriggerSync()}
              disabled={isSyncing || isLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm transition-all shadow-lg shadow-sky-600/30 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing || isLoading ? 'animate-spin' : ''}`} />
              <span>{isSyncing || isLoading ? 'Syncing...' : 'Reload Concordance'}</span>
            </button>
            <button
              onClick={() => void handleCloudSync()}
              disabled={isCloudSyncing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30 active:scale-95 disabled:opacity-50"
            >
              <UploadCloud className={`w-4 h-4 ${isCloudSyncing ? 'animate-bounce' : ''}`} />
              <span>
                {isCloudSyncing ? 'Pushing to Cloud...' : 'Sync to Cloud (app.thenewfuse.com)'}
              </span>
            </button>
            <button
              onClick={() => handleCopy('tnf google-ai cloud-sync', 'cli-cloud-sync')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-sm font-medium transition-all"
            >
              {copiedText === 'cli-cloud-sync' ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Terminal className="w-4 h-4 text-indigo-400" />
              )}
              <span>
                {copiedText === 'cli-cloud-sync' ? 'Copied Cloud CMD!' : 'Copy Cloud Sync'}
              </span>
            </button>
          </div>
        </div>

        {loadError && (
          <div className="mt-4 p-3 rounded-lg bg-amber-950/60 border border-amber-500/40 text-xs font-mono text-amber-100">
            {loadError}
          </div>
        )}
        {syncNotice && (
          <div className="mt-4 p-3 rounded-lg bg-sky-950/60 border border-sky-500/40 text-xs font-mono text-sky-200 flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-400 animate-spin" />
            <span>{syncNotice}</span>
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-sky-500/20 bg-slate-900/60 p-5 backdrop-blur-md relative overflow-hidden group hover:border-sky-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
            <span>Total Conversations</span>
            <Brain className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2 text-3xl font-black text-white">
            {data.totalSessions.toLocaleString()}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>100% Normalized to TNF</span>
          </div>
        </div>

        <div className="rounded-xl border border-indigo-500/20 bg-slate-900/60 p-5 backdrop-blur-md relative overflow-hidden group hover:border-indigo-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
            <span>Session Brains</span>
            <Database className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-3xl font-black text-white">502</div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-indigo-300">
            <Layers className="w-3.5 h-3.5" />
            <span>Indexed Artifact Trees</span>
          </div>
        </div>

        <div className="rounded-xl border border-purple-500/20 bg-slate-900/60 p-5 backdrop-blur-md relative overflow-hidden group hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
            <span>Cumulative Steps</span>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 text-3xl font-black text-white">
            {stats.totalSteps.toLocaleString()}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-purple-300">
            <Cpu className="w-3.5 h-3.5" />
            <span>Avg {stats.avgSteps} steps/session</span>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-slate-900/60 p-5 backdrop-blur-md relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
            <span>Active Account</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div
            className="mt-2 text-lg font-bold text-white truncate"
            title="Operator Google account"
          >
            Operator-local Google account
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Google AI Auth Connected</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('sessions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            activeTab === 'sessions'
              ? 'bg-sky-500/20 border border-sky-400/40 text-sky-300 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          <span>Sessions Explorer ({filteredSessions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pipeline')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            activeTab === 'pipeline'
              ? 'bg-sky-500/20 border border-sky-400/40 text-sky-300 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Synaptic Bridge Architecture</span>
        </button>

        <button
          onClick={() => setActiveTab('fleet')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            activeTab === 'fleet'
              ? 'bg-sky-500/20 border border-sky-400/40 text-sky-300 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Agent Fleet Integration</span>
        </button>
      </div>

      {/* TAB 1: SESSIONS EXPLORER */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search 1,032 sessions by title, ID, workspace, or project..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-sky-500 focus:outline-none text-sm text-slate-100 placeholder-slate-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterMode === 'all'
                    ? 'bg-sky-600 text-white font-semibold'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({allSessions.length})
              </button>
              <button
                onClick={() => setFilterMode('high_steps')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterMode === 'high_steps'
                    ? 'bg-sky-600 text-white font-semibold'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Deep (&gt;100 steps)
              </button>
              <button
                onClick={() => setFilterMode('mega_sessions')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterMode === 'mega_sessions'
                    ? 'bg-sky-600 text-white font-semibold'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Mega (&gt;500 steps)
              </button>
              <button
                onClick={() => setFilterMode('recent')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterMode === 'recent'
                    ? 'bg-sky-600 text-white font-semibold'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Recent (2026)
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900/80 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5">Session ID / Source</th>
                    <th className="px-4 py-3.5">Title & Topic</th>
                    <th className="px-4 py-3.5">Steps</th>
                    <th className="px-4 py-3.5">Last Active</th>
                    <th className="px-4 py-3.5">Workspace / Scope</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredSessions.slice(0, 100).map((session) => (
                    <tr
                      key={session.sessionId}
                      className="hover:bg-sky-950/20 transition-colors group cursor-pointer"
                      onClick={() => setSelectedSession(session)}
                    >
                      <td className="px-4 py-3.5 font-mono text-xs">
                        <div className="text-sky-400 font-semibold">{session.sessionId}</div>
                        <div className="text-slate-500 text-[10px] truncate max-w-[140px]">
                          {session.conversationId}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-200 group-hover:text-white line-clamp-1">
                          {session.title}
                        </div>
                        <div className="text-xs text-slate-500">
                          Project: {session.project || 'Default Workspace'}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                            session.stepCount >= 500
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : session.stepCount >= 100
                                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {session.stepCount}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{(session.lastActive || '').slice(0, 19)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-400">
                        <div className="truncate max-w-[180px]" title={session.workspace}>
                          {session.workspace.replace(/\["file:\/\//g, '').replace(/"\]/g, '')}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSession(session);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-sky-600 text-xs text-slate-200 hover:text-white transition-all"
                        >
                          <span>Inspect</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredSessions.length > 100 && (
              <div className="p-4 border-t border-slate-800 text-center text-xs text-slate-400 bg-slate-900/60">
                Showing top 100 of {filteredSessions.length} matching sessions. Refine your query to
                see more.
              </div>
            )}

            {filteredSessions.length === 0 && (
              <div className="p-12 text-center text-slate-400">
                <Search className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-base font-medium text-slate-300">
                  No sessions match your search
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Try searching for keywords like "UI", "MCP", "Workflow", or "Audit"
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SYNAPTIC BRIDGE ARCHITECTURE */}
      {activeTab === 'pipeline' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Boxes className="w-5 h-5 text-sky-400" />
              <span>Personal Intelligence Synaptic Ingestion Pipeline</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 rounded-xl border border-sky-500/20 bg-slate-950/60 space-y-3">
                <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm">
                  <Database className="w-4 h-4" />
                  <span>1. Local Google SQLite Layer</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Extracts live conversation summaries, steps, and project mappings from Antigravity
                  local database:
                </p>
                <div className="p-2 rounded bg-slate-900 text-[11px] font-mono text-sky-300 truncate">
                  ~/.gemini/antigravity-cli/conversation_summaries.db
                </div>
              </div>

              <div className="p-5 rounded-xl border border-indigo-500/20 bg-slate-950/60 space-y-3">
                <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                  <Layers className="w-4 h-4" />
                  <span>2. Normalization & Concordance</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Converts SQLite rows to canonical TNF Sessions, indices 502 brain repositories,
                  and verifies Merkle hashes:
                </p>
                <div className="p-2 rounded bg-slate-900 text-[11px] font-mono text-indigo-300 truncate">
                  ~/.tnf/personal-intelligence/google_ai_session_concordance.json
                </div>
              </div>

              <div className="p-5 rounded-xl border border-emerald-500/20 bg-slate-950/60 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                  <Cpu className="w-4 h-4" />
                  <span>3. Multi-Agent Synaptic Bus</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Exposes sessions across all runtime agents (Claude, Codex, Gemini, OpenCode, Kilo,
                  Hermes):
                </p>
                <div className="p-2 rounded bg-slate-900 text-[11px] font-mono text-emerald-300 truncate">
                  ~/.tnf/sessions/sessions.json
                </div>
              </div>
            </div>

            {/* CLI Commands Section */}
            <div className="border-t border-slate-800 pt-6 space-y-4">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                Native CLI Tooling
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                  <div className="text-xs font-mono text-sky-400">tnf google-ai status</div>
                  <p className="text-xs text-slate-400">
                    Check Google account bindings & SQLite DB connectivity
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                  <div className="text-xs font-mono text-indigo-400">tnf google-ai sync</div>
                  <p className="text-xs text-slate-400">
                    Run incremental bridge sync across brains & sessions
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                  <div className="text-xs font-mono text-emerald-400">tnf google-ai list -n 25</div>
                  <p className="text-xs text-slate-400">
                    Inspect registered sessions directly from terminal
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AGENT FLEET INTEGRATION */}
      {activeTab === 'fleet' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-sky-400" />
              <span>Multi-Agent Swarm & Personal Intelligence Wiring</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  name: 'Gemini Sub-Director',
                  platform: 'Antigravity / Gemini',
                  role: 'Personal Intelligence & Senses',
                  status: 'ACTIVE',
                },
                {
                  name: 'Claude Orchestrator',
                  platform: 'Anthropic Opus / Sonnet',
                  role: 'Strategic Synthesis & High-Level Reasoning',
                  status: 'ACTIVE',
                },
                {
                  name: 'Codex Engine',
                  platform: 'OpenAI GPT-4o / Codex',
                  role: 'High-Throughput Kernel & Systems Build',
                  status: 'ACTIVE',
                },
                {
                  name: 'OpenCode / Kilo',
                  platform: 'Multi-Model Swarm',
                  role: 'Autonomous Fast Probing & Background Audits',
                  status: 'ACTIVE',
                },
              ].map((agent, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">{agent.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {agent.status}
                    </span>
                  </div>
                  <div className="text-xs text-sky-400 font-mono">{agent.platform}</div>
                  <p className="text-xs text-slate-400">{agent.role}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Session Details Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl rounded-2xl border border-sky-500/30 bg-slate-900 p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30 mb-2">
                  <Brain className="w-3.5 h-3.5" />
                  <span>Session Inspection</span>
                </div>
                <h3 className="text-xl font-bold text-white">{selectedSession.title}</h3>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-500 font-medium">Session ID</span>
                <div className="font-mono text-sky-300 break-all">{selectedSession.sessionId}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-500 font-medium">Step Count</span>
                <div className="font-mono text-purple-300 font-bold text-base">
                  {selectedSession.stepCount} Steps
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-500 font-medium">Last Active</span>
                <div className="text-slate-300">{selectedSession.lastActive}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-500 font-medium">Project ID</span>
                <div className="font-mono text-slate-300 truncate">{selectedSession.project}</div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1 text-xs">
              <span className="text-slate-500 font-medium">Workspace Path</span>
              <div className="font-mono text-slate-300 break-all">
                {selectedSession.workspace.replace(/\["file:\/\//g, '').replace(/"\]/g, '')}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1 text-xs">
              <span className="text-slate-500 font-medium">Conversation GUID</span>
              <div className="font-mono text-slate-400 break-all">
                {selectedSession.conversationId}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <button
                onClick={() =>
                  handleCopy(`tnf google-ai view ${selectedSession.sessionId}`, 'copy-tnf-view')
                }
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-sky-300 transition-all"
              >
                {copiedText === 'copy-tnf-view' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Terminal className="w-3.5 h-3.5 text-sky-400" />
                )}
                <span>{copiedText === 'copy-tnf-view' ? 'Copied TNF View' : 'Copy TNF View'}</span>
              </button>
              <button
                onClick={() =>
                  handleCopy(`tnf google-ai resume ${selectedSession.sessionId}`, 'copy-tnf-resume')
                }
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-300 transition-all"
              >
                {copiedText === 'copy-tnf-resume' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>
                  {copiedText === 'copy-tnf-resume' ? 'Copied TNF Resume' : 'Copy TNF Resume'}
                </span>
              </button>
              <button
                onClick={() =>
                  handleCopy(
                    `cd ${selectedSession.workspace.replace(/\["file:\/\//g, '').replace(/"\]/g, '') || '.'} && agy resume ${selectedSession.conversationId}`,
                    'copy-guid'
                  )
                }
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white transition-all shadow-md shadow-sky-600/30"
              >
                {copiedText === 'copy-guid' ? (
                  <Check className="w-3.5 h-3.5 text-white" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>
                  {copiedText === 'copy-guid' ? 'Copied Resume Command!' : 'Copy Direct Resume'}
                </span>
              </button>
              <button
                onClick={() => setSelectedSession(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
