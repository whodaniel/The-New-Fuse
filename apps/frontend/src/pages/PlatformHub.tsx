import {
  Activity,
  Brain,
  Check,
  ChevronRight,
  Clock,
  Copy,
  RefreshCw,
  Search,
  Terminal,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { GoogleAiSourceModule } from '../components/personal-intelligence/GoogleAiSourceModule';
import { SourceIngestPanel } from '../components/personal-intelligence/SourceIngestPanel';
import type {
  PersonalIntelItem,
  PersonalIntelSourceId,
  SourceModuleStatus,
  UnifiedPersonalIntelPayload,
} from '../components/personal-intelligence/types';
import { EMPTY_UNIFIED } from '../components/personal-intelligence/types';

/** Optional unified index (preferred when present). */
const UNIFIED_INDEX_URL = '/local-intel/personal_intelligence_index.json';
/** Google AI is one module mirror — not the hub identity. */
const GOOGLE_AI_MIRROR_URL = '/local-intel/google_ai_session_concordance.json';

const GOOGLE_MIRROR_SETUP =
  'tnf google-ai sync && cp ~/.tnf/personal-intelligence/google_ai_session_concordance.json apps/frontend/public/local-intel/';

const POLICY_SOURCES: SourceModuleStatus[] = [
  {
    id: 'google_ai',
    name: 'Google Gemini / Antigravity',
    kind: 'session_bridge',
    description: 'Optional session bridge for Google AI / Antigravity conversations.',
    status: 'not_mirrored',
    cliHint: 'tnf google-ai sync',
    mirrorPath: '~/.tnf/personal-intelligence/google_ai_session_concordance.json',
  },
  {
    id: 'apple_notes',
    name: 'Apple Notes',
    kind: 'notes',
    description: 'Distilled notes intelligence from the operator-local Apple Notes corpus.',
    status: 'policy_ready',
    cliHint: '~/.tnf/personal-intelligence/apple_notes_intelligence_distillation.md',
  },
  {
    id: 'google_drive',
    name: 'Google Drive',
    kind: 'storage_location',
    description: 'Consented Drive location pointers (metadata only — not a drive mirror).',
    status: 'policy_ready',
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    kind: 'storage_location',
    description: 'Bring-your-own Dropbox location registry entry.',
    status: 'policy_ready',
  },
  {
    id: 'onedrive',
    name: 'OneDrive',
    kind: 'storage_location',
    description: 'Bring-your-own OneDrive / Microsoft 365 location registry entry.',
    status: 'policy_ready',
  },
  {
    id: 'local_device',
    name: 'Local device',
    kind: 'local',
    description: 'Approved local path hints and device-local working sets.',
    status: 'policy_ready',
  },
  {
    id: 'private_github',
    name: 'Private GitHub',
    kind: 'cli',
    description: 'Private repo locations for personal or client artifacts.',
    status: 'policy_ready',
  },
  {
    id: 'cli_import',
    name: 'CLI / file import',
    kind: 'cli',
    description: 'Operator CLI and file drops into ~/.tnf/personal-intelligence/.',
    status: 'policy_ready',
    cliHint: 'tnf remember retain · local-intel mirrors',
  },
];

async function readJsonOrHtmlGuard(res: Response): Promise<unknown> {
  const contentType = (res.headers.get('content-type') || '').toLowerCase();
  const raw = await res.text();
  const trimmed = raw.trim();
  if (
    contentType.includes('text/html') ||
    trimmed.startsWith('<!DOCTYPE') ||
    trimmed.startsWith('<html')
  ) {
    throw new Error('SPA_FALLBACK');
  }
  if (!res.ok) throw new Error(`HTTP_${res.status}`);
  return JSON.parse(raw);
}

function mapGoogleSessions(payload: {
  generatedAt?: string;
  sessions?: Array<Record<string, unknown>>;
}): PersonalIntelItem[] {
  const sessions = Array.isArray(payload.sessions) ? payload.sessions : [];
  return sessions.map((s) => {
    const sessionId = String(s.sessionId || s.id || '');
    const conversationId = String(s.conversationId || '');
    const workspace = String(s.workspace || '');
    return {
      id: sessionId || conversationId,
      source: 'google_ai' as const,
      sourceLabel: 'Google AI',
      title: String(s.title || 'Untitled session'),
      subtitle: conversationId || undefined,
      activityAt: String(s.lastActive || ''),
      metricLabel: 'steps',
      metricValue: Number(s.stepCount || 0),
      workspace,
      project: String(s.project || ''),
      resumeHint: conversationId
        ? `cd ${workspace.replace(/\["file:\/\//g, '').replace(/"\]/g, '') || '.'} && agy resume ${conversationId}`
        : undefined,
      raw: s,
    };
  });
}

function mergeSourceStatuses(
  base: SourceModuleStatus[],
  googleCount: number | null
): SourceModuleStatus[] {
  return base.map((s) => {
    if (s.id !== 'google_ai') return s;
    if (googleCount === null) return s;
    return {
      ...s,
      status: googleCount >= 0 ? 'mirrored' : 'not_mirrored',
      itemCount: googleCount >= 0 ? googleCount : undefined,
    };
  });
}

export default function PlatformHub() {
  const [data, setData] = useState<UnifiedPersonalIntelPayload>(EMPTY_UNIFIED);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSourceId, setActiveSourceId] = useState<string | 'all'>('all');
  const [selectedItem, setSelectedItem] = useState<PersonalIntelItem | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [googleMirrorPresent, setGoogleMirrorPresent] = useState(false);

  const loadUnified = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setLoadError(null);
    try {
      let items: PersonalIntelItem[] = [];
      let generatedAt = '';
      let googleCount: number | null = null;

      // Prefer a unified index when operators publish one.
      try {
        const unifiedRes = await fetch(`${UNIFIED_INDEX_URL}?t=${Date.now()}`, {
          cache: 'no-store',
        });
        const unified = (await readJsonOrHtmlGuard(unifiedRes)) as UnifiedPersonalIntelPayload;
        if (Array.isArray(unified.items) && unified.items.length) {
          setData({
            generatedAt: unified.generatedAt || '',
            totalItems: unified.totalItems ?? unified.items.length,
            sources: unified.sources?.length
              ? unified.sources
              : mergeSourceStatuses(POLICY_SOURCES, null),
            items: unified.items,
          });
          setGoogleMirrorPresent(
            unified.items.some((i) => i.source === 'google_ai') ||
              (unified.sources || []).some((s) => s.id === 'google_ai' && s.status === 'mirrored')
          );
          return true;
        }
      } catch {
        // Fall through to per-module mirrors.
      }

      try {
        const googleRes = await fetch(`${GOOGLE_AI_MIRROR_URL}?t=${Date.now()}`, {
          cache: 'no-store',
        });
        const googlePayload = (await readJsonOrHtmlGuard(googleRes)) as {
          generatedAt?: string;
          sessions?: Array<Record<string, unknown>>;
        };
        const mapped = mapGoogleSessions(googlePayload);
        items = items.concat(mapped);
        generatedAt = googlePayload.generatedAt || generatedAt;
        googleCount = mapped.length;
        setGoogleMirrorPresent(true);
      } catch {
        googleCount = null;
        setGoogleMirrorPresent(false);
      }

      const sources = mergeSourceStatuses(POLICY_SOURCES, googleCount);
      setData({
        generatedAt,
        totalItems: items.length,
        sources,
        items,
      });

      if (!items.length) {
        setLoadError(
          'No Personal Intelligence mirrors are published to this app build yet. Operator-local sources live under ~/.tnf/personal-intelligence/ and can be mirrored into apps/frontend/public/local-intel/ for local preview. Production must not expose private personal corpora as public static files without an auth’d path.'
        );
        return false;
      }
      return true;
    } catch (err) {
      setData({
        ...EMPTY_UNIFIED,
        sources: POLICY_SOURCES,
      });
      setLoadError((err as Error).message || 'Personal Intelligence unavailable');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUnified();
  }, [loadUnified]);

  const handleCopy = (text: string, id: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleReload = async () => {
    setSyncNotice('Reloading Personal Intelligence mirrors…');
    const ok = await loadUnified();
    setSyncNotice(
      ok
        ? 'Mirrors refreshed into the unified Personal Intelligence view.'
        : 'No mirrors found — use bring-your-own source modules / CLI to ingest.'
    );
    setTimeout(() => setSyncNotice(null), 8000);
  };

  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return data.items.filter((item) => {
      if (activeSourceId !== 'all' && item.source !== activeSourceId) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.sourceLabel.toLowerCase().includes(q) ||
        (item.workspace || '').toLowerCase().includes(q) ||
        (item.project || '').toLowerCase().includes(q) ||
        (item.subtitle || '').toLowerCase().includes(q)
      );
    });
  }, [data.items, searchQuery, activeSourceId]);

  const googleItems = useMemo(
    () => data.items.filter((i) => i.source === 'google_ai'),
    [data.items]
  );

  const sourceCounts = useMemo(() => {
    const counts = new Map<PersonalIntelSourceId, number>();
    for (const item of data.items) {
      counts.set(item.source, (counts.get(item.source) || 0) + 1);
    }
    return counts;
  }, [data.items]);

  const sourcesForPanel = useMemo(
    () =>
      data.sources.length
        ? data.sources.map((s) =>
            sourceCounts.has(s.id)
              ? { ...s, itemCount: sourceCounts.get(s.id), status: 'mirrored' as const }
              : s
          )
        : POLICY_SOURCES,
    [data.sources, sourceCounts]
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8 space-y-8">
      <div className="relative overflow-hidden rounded-2xl border border-sky-500/30 bg-gradient-to-br from-slate-900 via-slate-900/90 to-sky-950/40 p-6 md:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-sky-400/40 bg-sky-500/10 text-xs font-semibold text-sky-300">
              <Brain className="w-3.5 h-3.5 text-sky-400" />
              <span>Personal Intelligence</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-emerald-300 font-mono">
                {isLoading ? 'LOADING…' : data.totalItems ? 'MULTI-SOURCE' : 'AWAITING MIRRORS'}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              Your data, many doors, one orchestration surface
            </h1>
            <p className="text-slate-300 text-sm md:text-base max-w-3xl leading-relaxed">
              Bring personal context from notes, drives, local devices, private repos, CLI imports,
              and optional session bridges. TNF unifies consented sources for multi-agent work — no
              single vendor owns this hub.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void handleReload()}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm transition-all shadow-lg shadow-sky-600/30 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Refreshing…' : 'Reload mirrors'}</span>
            </button>
            <button
              type="button"
              onClick={() =>
                handleCopy('ls ~/.tnf/personal-intelligence && tnf google-ai status', 'cli-status')
              }
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-sm font-medium"
            >
              {copiedText === 'cli-status' ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Terminal className="w-4 h-4 text-indigo-400" />
              )}
              <span>{copiedText === 'cli-status' ? 'Copied!' : 'Copy local status cmds'}</span>
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
            <Activity className="w-4 h-4 text-sky-400" />
            <span>{syncNotice}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-sky-500/20 bg-slate-900/60 p-5">
          <div className="text-xs uppercase tracking-wider text-slate-400">Unified items</div>
          <div className="mt-2 text-3xl font-black text-white">
            {data.totalItems.toLocaleString()}
          </div>
        </div>
        <div className="rounded-xl border border-indigo-500/20 bg-slate-900/60 p-5">
          <div className="text-xs uppercase tracking-wider text-slate-400">Source modules</div>
          <div className="mt-2 text-3xl font-black text-white">{sourcesForPanel.length}</div>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-slate-900/60 p-5">
          <div className="text-xs uppercase tracking-wider text-slate-400">Index generated</div>
          <div className="mt-2 text-sm font-mono text-emerald-300">
            {data.generatedAt ? data.generatedAt.slice(0, 19) : '—'}
          </div>
        </div>
      </div>

      <SourceIngestPanel
        sources={sourcesForPanel}
        activeSourceId={activeSourceId}
        onSelect={setActiveSourceId}
      />

      {(activeSourceId === 'all' || activeSourceId === 'google_ai') && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            Module · Google Gemini / Antigravity
          </h2>
          <GoogleAiSourceModule
            items={googleItems}
            mirrorPresent={googleMirrorPresent}
            mirrorHint={GOOGLE_MIRROR_SETUP}
            copiedText={copiedText}
            onCopy={handleCopy}
            onInspect={setSelectedItem}
          />
        </section>
      )}

      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            Unified explorer ({filteredItems.length})
          </h2>
          <div className="relative flex-1 md:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search across all mirrored sources…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-sky-500 focus:outline-none text-sm text-slate-100 placeholder-slate-500"
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Source</th>
                  <th className="px-4 py-3.5">Title</th>
                  <th className="px-4 py-3.5">Metric</th>
                  <th className="px-4 py-3.5">Last activity</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredItems.slice(0, 100).map((item) => (
                  <tr
                    key={`${item.source}:${item.id}`}
                    className="hover:bg-sky-950/20 cursor-pointer"
                    onClick={() => setSelectedItem(item)}
                  >
                    <td className="px-4 py-3.5 text-xs font-mono text-sky-400">
                      {item.sourceLabel}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-slate-200 line-clamp-1">{item.title}</div>
                      <div className="text-[11px] text-slate-500 font-mono truncate max-w-[280px]">
                        {item.id}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-400">
                      {item.metricValue != null
                        ? `${item.metricValue}${item.metricLabel ? ` ${item.metricLabel}` : ''}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{(item.activityAt || '').slice(0, 19) || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItem(item);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-sky-600 text-xs text-slate-200"
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
          {filteredItems.length === 0 && (
            <div className="p-10 text-center text-slate-400 text-sm">
              No mirrored items for this filter. Select a source module or publish a local-intel
              mirror.
            </div>
          )}
        </div>
      </section>

      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl rounded-2xl border border-sky-500/30 bg-slate-900 p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30 mb-2">
                  {selectedItem.sourceLabel}
                </div>
                <h3 className="text-xl font-bold text-white">{selectedItem.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-500 font-medium">Item ID</span>
                <div className="font-mono text-sky-300 break-all">{selectedItem.id}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-500 font-medium">Activity</span>
                <div className="text-slate-300">{selectedItem.activityAt || '—'}</div>
              </div>
            </div>

            {selectedItem.workspace && (
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1 text-xs">
                <span className="text-slate-500 font-medium">Workspace</span>
                <div className="font-mono text-slate-300 break-all">
                  {selectedItem.workspace.replace(/\["file:\/\//g, '').replace(/"\]/g, '')}
                </div>
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-3">
              {selectedItem.resumeHint && (
                <button
                  type="button"
                  onClick={() => handleCopy(selectedItem.resumeHint!, 'modal-resume')}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white"
                >
                  {copiedText === 'modal-resume' ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  Copy resume command
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
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
