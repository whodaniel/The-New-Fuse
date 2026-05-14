import { Button, Card, Input, Label, Textarea } from '@/components/ui';
import TimelineView from '@/features/timeline/components/TimelineView';
import { useTimeline } from '@/features/timeline/hooks/useTimeline';
import { useAuth } from '@/providers/AuthProvider';
import {
  bootstrapPersonalTimeline,
  createTimelineEvent,
  deleteTimelineEvent,
  getGithubNarrativeGraph,
  importGithubTimelineNarrative,
  listTimelineEvents,
  updateTimelineEvent,
  type GithubNarrativeGraphResult,
  type TimelineEvent,
} from '@/services/unifiedLedgerApi';
import { format } from 'date-fns';
import { Calendar, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';

type FormState = {
  title: string;
  description: string;
  point: number;
  when: string;
  category: string;
  sourcesText: string;
};

const TIMELINE_CATEGORY_OPTIONS = [
  'Identity',
  'Family',
  'Relationships',
  'Health & Wellness',
  'Education',
  'Career',
  'Business & Projects',
  'Finance',
  'Creativity',
  'Spirituality',
  'Travel',
  'Home',
  'Community',
  'Challenges',
  'Breakthroughs',
  'Legacy',
  'Personal',
] as const;

function toFormDateTime(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function clampPoint(value: unknown): number {
  const num = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(num)) return 50;
  return Math.min(100, Math.max(0, Math.round(num)));
}

function readPayload(event: TimelineEvent): {
  title: string;
  description: string;
  point: number;
  category: string;
} {
  const payload = (event.payload || {}) as Record<string, unknown>;
  return {
    title: String(payload.title || payload.note || 'Untitled event'),
    description: String(payload.description || ''),
    point: clampPoint(payload.point),
    category: String(payload.category || payload.segment || 'Personal'),
  };
}

function parseSourcesText(sourcesText: string): string[] {
  return Array.from(
    new Set(
      sourcesText
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
    )
  );
}

function readSources(event: TimelineEvent): string[] {
  const payload = (event.payload || {}) as Record<string, unknown>;
  const fromEvidenceRefs = Array.isArray(payload.evidenceRefs)
    ? payload.evidenceRefs.filter((value): value is string => typeof value === 'string')
    : [];
  const fromSources = Array.isArray(payload.sources)
    ? payload.sources.filter((value): value is string => typeof value === 'string')
    : [];
  const fromSourceField = typeof payload.source === 'string' ? [payload.source] : [];

  return Array.from(new Set([...fromEvidenceRefs, ...fromSources, ...fromSourceField]));
}

function readProject(event: TimelineEvent): string | null {
  const payload = (event.payload || {}) as Record<string, unknown>;
  if (typeof payload.project === 'string' && payload.project.trim().length > 0) {
    return payload.project;
  }
  if (typeof payload.timelineTrack === 'string' && payload.timelineTrack.trim().length > 0) {
    return payload.timelineTrack;
  }
  return null;
}

function readAssetRefs(event: TimelineEvent): string[] {
  const payload = (event.payload || {}) as Record<string, unknown>;
  if (!Array.isArray(payload.assetRefs)) return [];
  return payload.assetRefs.filter((value): value is string => typeof value === 'string');
}

function readNarrativeConnections(event: TimelineEvent): Array<{
  from: string;
  to: string;
  connectionType: string;
  rationale?: string;
}> {
  const payload = (event.payload || {}) as Record<string, unknown>;
  if (!Array.isArray(payload.narrativeConnections)) return [];
  const connections: Array<{
    from: string;
    to: string;
    connectionType: string;
    rationale?: string;
  }> = [];
  for (const candidate of payload.narrativeConnections) {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) continue;
    const row = candidate as Record<string, unknown>;
    const from = typeof row.from === 'string' ? row.from.trim() : '';
    const to = typeof row.to === 'string' ? row.to.trim() : '';
    if (!from || !to) continue;
    const connectionType =
      typeof row.connectionType === 'string' && row.connectionType.trim().length > 0
        ? row.connectionType.trim()
        : 'related';
    const rationale =
      typeof row.rationale === 'string' && row.rationale.trim().length > 0
        ? row.rationale.trim()
        : undefined;
    connections.push({ from, to, connectionType, rationale });
  }
  return connections;
}

export default function TimelinePage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const { data: macroData, loading: macroLoading, updateRecord } = useTimeline();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(false);
  const [syncingGithub, setSyncingGithub] = useState(false);
  const [graphLoading, setGraphLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedMacroRecord, setSelectedMacroRecord] = useState<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [narrativeGraph, setNarrativeGraph] = useState<GithubNarrativeGraphResult | null>(null);

  const [createForm, setCreateForm] = useState<FormState>({
    title: '',
    description: '',
    point: 50,
    when: toFormDateTime(new Date().toISOString()),
    category: 'Identity',
    sourcesText: '',
  });

  const [editForm, setEditForm] = useState<FormState>({
    title: '',
    description: '',
    point: 50,
    when: '',
    category: 'Identity',
    sourcesText: '',
  });

  const userId = useMemo(() => user?.id || null, [user?.id]);
  const ownerScopeId = useMemo(() => {
    const requested = searchParams.get('ownerId');
    if (requested && requested.trim().length > 0) return requested.trim();
    return user?.id || null;
  }, [searchParams, user?.id]);
  const isDelegatedView = useMemo(
    () => Boolean(userId && ownerScopeId && userId !== ownerScopeId),
    [ownerScopeId, userId]
  );

  const sortedEvents = useMemo(
    () =>
      [...events].sort((a, b) => {
        const ap = readPayload(a).point;
        const bp = readPayload(b).point;
        if (ap !== bp) return ap - bp;
        return a.timestamp.localeCompare(b.timestamp);
      }),
    [events]
  );

  const selectableCategories = useMemo(() => {
    const fromEvents = new Set(sortedEvents.map((event) => readPayload(event).category));
    for (const category of TIMELINE_CATEGORY_OPTIONS) {
      fromEvents.add(category);
    }
    return Array.from(fromEvents);
  }, [sortedEvents]);

  const availableCategories = useMemo(() => {
    return ['All', ...selectableCategories];
  }, [selectableCategories]);

  const filteredEvents = useMemo(
    () =>
      categoryFilter === 'All'
        ? sortedEvents
        : sortedEvents.filter((event) => readPayload(event).category === categoryFilter),
    [sortedEvents, categoryFilter]
  );

  const selectedEvent = useMemo(
    () => filteredEvents.find((e) => e.id === selectedId) || null,
    [filteredEvents, selectedId]
  );
  const selectedConnections = useMemo(
    () => (selectedEvent ? readNarrativeConnections(selectedEvent) : []),
    [selectedEvent]
  );

  const runBootstrap = async (auto = false) => {
    if (!userId) return;
    if (isDelegatedView) {
      if (!auto) toast.error('Delegated timeline view is read-only');
      return;
    }
    setBootstrapping(true);
    try {
      const result = await bootstrapPersonalTimeline();
      setEvents(result.events || []);
      if (result.events?.length) {
        setSelectedId((prev) => prev || result.events[0]?.id || null);
      }
      if (!auto) {
        toast.success(result.message || 'Personal timeline generated');
      } else if (result.createdCount > 0) {
        toast.success(`Generated ${result.createdCount} private timeline segments`);
      }
    } catch {
      if (!auto) {
        toast.error('Failed to generate your personal timeline');
      }
    } finally {
      setBootstrapping(false);
    }
  };

  const load = async () => {
    if (!userId) {
      setEvents([]);
      setSelectedId(null);
      setNarrativeGraph(null);
      setLoading(false);
      setGraphLoading(false);
      return;
    }
    setLoading(true);
    setGraphLoading(true);

    try {
      const rows = await listTimelineEvents(ownerScopeId ? { ownerId: ownerScopeId } : undefined);
      setEvents(rows);
      if (rows.length && !selectedId) {
        setSelectedId(rows[0].id);
      } else if (rows.length === 0) {
        await runBootstrap(true);
      }
    } catch {
      toast.error('Failed to load your timeline');
      setEvents([]);
      setSelectedId(null);
    } finally {
      setLoading(false);
    }

    try {
      const graph = await getGithubNarrativeGraph(
        ownerScopeId ? { ownerId: ownerScopeId } : undefined
      );
      setNarrativeGraph(graph);
    } catch {
      setNarrativeGraph(null);
      toast.error('Timeline graph unavailable');
    } finally {
      setGraphLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [ownerScopeId, userId]);

  const createItem = async () => {
    if (!userId) {
      toast.error('Please sign in to create timeline items');
      return;
    }
    if (isDelegatedView) {
      toast.error('Delegated timeline view is read-only');
      return;
    }
    if (!createForm.title.trim()) {
      toast.error('Title is required');
      return;
    }

    setSaving(true);
    try {
      const sources = parseSourcesText(createForm.sourcesText);
      const created = await createTimelineEvent({
        userId,
        actor: userId,
        eventType: 'historical_event',
        timestamp: createForm.when
          ? new Date(createForm.when).toISOString()
          : new Date().toISOString(),
        payload: {
          title: createForm.title.trim(),
          description: createForm.description.trim(),
          point: createForm.point,
          category: createForm.category,
          segment: createForm.category,
          evidenceRefs: sources,
          sources,
          source: 'personal-timeline',
        },
      });
      toast.success('Timeline point added');
      setCreateForm({
        title: '',
        description: '',
        point: createForm.point,
        when: toFormDateTime(new Date().toISOString()),
        category: createForm.category,
        sourcesText: '',
      });
      setSelectedId(created.id);
      await load();
    } catch {
      toast.error('Failed to add timeline point');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (event: TimelineEvent) => {
    const payload = readPayload(event);
    setEditingId(event.id);
    setEditForm({
      title: payload.title,
      description: payload.description,
      point: payload.point,
      when: toFormDateTime(event.timestamp),
      category: payload.category,
      sourcesText: readSources(event).join('\n'),
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    if (!userId) {
      toast.error('Please sign in to update timeline items');
      return;
    }
    if (isDelegatedView) {
      toast.error('Delegated timeline view is read-only');
      return;
    }
    if (!editForm.title.trim()) {
      toast.error('Title is required');
      return;
    }

    setSaving(true);
    try {
      const sources = parseSourcesText(editForm.sourcesText);
      const updated = await updateTimelineEvent(editingId, {
        userId,
        actor: userId,
        timestamp: editForm.when ? new Date(editForm.when).toISOString() : undefined,
        payload: {
          title: editForm.title.trim(),
          description: editForm.description.trim(),
          point: editForm.point,
          category: editForm.category,
          segment: editForm.category,
          evidenceRefs: sources,
          sources,
          source: 'personal-timeline',
        },
      });

      if (!updated) {
        toast.error('You can only edit your own timeline items');
        return;
      }

      toast.success('Timeline point updated');
      setEditingId(null);
      await load();
    } catch {
      toast.error('Failed to update timeline point');
    } finally {
      setSaving(false);
    }
  };

  const removeItem = async (id: string) => {
    if (!userId) {
      toast.error('Please sign in to delete timeline items');
      return;
    }
    if (isDelegatedView) {
      toast.error('Delegated timeline view is read-only');
      return;
    }
    setSaving(true);
    try {
      const ok = await deleteTimelineEvent(id);
      if (!ok) {
        toast.error('You can only delete your own timeline items');
        return;
      }
      toast.success('Timeline point deleted');
      if (selectedId === id) setSelectedId(null);
      if (editingId === id) setEditingId(null);
      await load();
    } catch {
      toast.error('Failed to delete timeline point');
    } finally {
      setSaving(false);
    }
  };

  const syncGithubHistory = async () => {
    if (!userId) {
      toast.error('Please sign in to sync GitHub timeline history');
      return;
    }
    if (isDelegatedView) {
      toast.error('Delegated timeline view is read-only');
      return;
    }

    setSyncingGithub(true);
    try {
      const result = await importGithubTimelineNarrative({});
      await load();
      toast.success(
        result.importedCount > 0
          ? `Imported ${result.importedCount} GitHub timeline events (${result.matchedConnectionCount} edge matches)`
          : 'GitHub timeline is already up to date'
      );
    } catch {
      toast.error('Failed to sync GitHub timeline history');
    } finally {
      setSyncingGithub(false);
    }
  };

  return (
    <div className="dark min-h-screen bg-[#020617] text-slate-100 p-4 lg:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-amber-400 text-xs uppercase tracking-[0.2em] font-semibold">
              Mission Control
            </p>
            <h1 className="text-4xl md:text-5xl font-black mt-2 tracking-tight">
              Unified Timeline
            </h1>
            <div className="flex flex-wrap gap-4 mt-4">
              <div className="bg-slate-900/80 border border-slate-800 px-4 py-2 rounded-lg">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
                  Personal Milestones
                </p>
                <p className="text-xl font-black text-amber-500">{events.length}</p>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 px-4 py-2 rounded-lg">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
                  Active Macro Tasks
                </p>
                <p className="text-xl font-black text-sky-500">
                  {macroData?.plans
                    ?.flatMap((p: any) => p.records || [])
                    .filter((r: any) => r.kind === 'task').length || 0}
                </p>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 px-4 py-2 rounded-lg">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
                  Narrative Nodes
                </p>
                <p className="text-xl font-black text-emerald-500">
                  {narrativeGraph?.nodeCount || 0}
                </p>
              </div>
            </div>
            {isDelegatedView ? (
              <p className="text-xs text-amber-300 mt-2">
                Delegated owner scope active (`ownerId`): read-only mode.
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={syncGithubHistory}
              disabled={syncingGithub || saving || bootstrapping || !userId || isDelegatedView}
              variant="outline"
              className="border-sky-500/60 text-sky-300 hover:bg-sky-500/10"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${syncingGithub ? 'animate-spin' : ''}`} />
              {syncingGithub ? 'Syncing GitHub...' : 'Sync GitHub History'}
            </Button>
            <Button
              onClick={() => runBootstrap(false)}
              disabled={bootstrapping || saving || !userId || isDelegatedView}
              variant="outline"
              className="border-amber-500/60 text-amber-300 hover:bg-amber-500/10"
            >
              <Plus className={`w-4 h-4 mr-2 ${bootstrapping ? 'animate-pulse' : ''}`} />
              {bootstrapping ? 'Generating...' : 'Generate Story Segments'}
            </Button>
            <Button
              onClick={load}
              disabled={loading}
              className="bg-amber-500 hover:bg-amber-600 text-black"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </header>

        <Card className="bg-slate-900/40 border-slate-800 p-6 rounded-md overflow-hidden relative">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-500 border border-sky-500/20">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">Macro Horizon</h3>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mt-0.5">
                  Project Workspace & Global Roadmap
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-sky-500/10 border border-sky-500/20 rounded text-[10px] font-bold text-sky-400 uppercase tracking-tighter">
                Live Sync Active
              </div>
            </div>
          </div>

          <div className="h-[450px] w-full">
            {macroLoading ? (
              <div className="h-full w-full flex flex-col items-center justify-center space-y-4 bg-slate-950/40 rounded-lg border border-slate-800/50">
                <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-slate-400 font-medium">
                  Synchronizing with Macro Ledger...
                </p>
              </div>
            ) : (
              <TimelineView
                plans={macroData?.plans || []}
                onRecordClick={(record) => setSelectedMacroRecord(record)}
                onRecordUpdate={(id, patch) => updateRecord(id, patch)}
              />
            )}
          </div>
        </Card>

        {selectedMacroRecord && (
          <Card className="bg-slate-900/60 border-sky-500/30 p-6 rounded-md animate-in slide-in-from-top-4 duration-300">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]"
                  style={{ backgroundColor: selectedMacroRecord.color || '#38bdf8' }}
                />
                <div>
                  <h4 className="text-lg font-bold text-white uppercase tracking-wider">
                    {selectedMacroRecord.title}
                  </h4>
                  <p className="text-xs text-slate-400">
                    ID: {selectedMacroRecord.id} • Kind:{' '}
                    <span className="text-sky-400 font-bold uppercase">
                      {selectedMacroRecord.kind}
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMacroRecord(null)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Status
                </label>
                <div className="text-sm text-slate-200 bg-slate-950 px-3 py-2 rounded border border-slate-800">
                  {selectedMacroRecord.status || 'No Status'}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Time Window
                </label>
                <div className="text-sm text-slate-200 bg-slate-950 px-3 py-2 rounded border border-slate-800">
                  {selectedMacroRecord.startTime
                    ? format(new Date(selectedMacroRecord.startTime), 'MMM d, yyyy')
                    : 'No Start'}
                  {' — '}
                  {selectedMacroRecord.endTime
                    ? format(new Date(selectedMacroRecord.endTime), 'MMM d, yyyy')
                    : 'No End'}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Assignee
                </label>
                <div className="text-sm text-slate-200 bg-slate-950 px-3 py-2 rounded border border-slate-800">
                  {selectedMacroRecord.assignee || 'Unassigned'}
                </div>
              </div>
            </div>
          </Card>
        )}

        <Card
          data-testid="timeline-rail-card"
          className="bg-slate-900/40 border-slate-800 p-6 rounded-md space-y-6"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col">
              <h3 className="text-xl font-bold text-white tracking-tight">Personal Narrative</h3>
              <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mt-0.5">
                Milestones, Identity & Life Events
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-slate-400">Filter By Category</Label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-9 rounded-md border border-slate-700 bg-slate-950 px-2 text-sm text-slate-200 outline-none focus:border-amber-500/50"
              >
                {availableCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="relative px-2 py-10 overflow-x-auto">
            <div className="min-w-[680px]">
              <div className="h-[2px] bg-slate-700/50 relative">
                {filteredEvents.map((event) => {
                  const payload = readPayload(event);
                  const active = selectedId === event.id;
                  return (
                    <button
                      key={event.id}
                      type="button"
                      data-testid={`timeline-node-${event.id}`}
                      onClick={() => setSelectedId(event.id)}
                      className="absolute -top-3 -translate-x-1/2 group z-10"
                      style={{ left: `${payload.point}%` }}
                      title={payload.title}
                    >
                      <span
                        className={`block w-6 h-6 rounded-full border-2 transition-all ${
                          active
                            ? 'bg-amber-500 border-amber-200 scale-125 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                            : 'bg-slate-800 border-slate-600 group-hover:border-amber-400 group-hover:scale-110'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {selectedEvent ? (
            <div
              data-testid="timeline-selected-card"
              className="rounded-md border border-slate-700 bg-slate-950/40 p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between animate-in fade-in slide-in-from-left-2 duration-300"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h2
                    data-testid="timeline-selected-title"
                    className="text-xl font-bold text-white"
                  >
                    {readPayload(selectedEvent).title}
                  </h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold uppercase tracking-wider">
                    {readPayload(selectedEvent).category}
                  </span>
                </div>
                <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
                  {readPayload(selectedEvent).description ||
                    'No additional context provided for this milestone.'}
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">
                  <p className="text-xs text-slate-400">
                    <span className="text-slate-500">Position:</span>{' '}
                    {readPayload(selectedEvent).point}%
                  </p>
                  <p className="text-xs text-slate-400">
                    <span className="text-slate-500">Timestamp:</span>{' '}
                    {format(new Date(selectedEvent.timestamp), 'PPP p')}
                  </p>
                  {readProject(selectedEvent) ? (
                    <p className="text-xs text-emerald-400">
                      <span className="text-slate-500">Project:</span> {readProject(selectedEvent)}
                    </p>
                  ) : null}
                </div>

                {readSources(selectedEvent).length > 0 ? (
                  <div className="mt-4 pt-4 border-t border-slate-800/50">
                    <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold">
                      Evidence & Sources
                    </p>
                    <ul className="mt-2 space-y-1">
                      {readSources(selectedEvent).map((source) => (
                        <li
                          key={source}
                          className="text-xs text-sky-400/80 hover:text-sky-300 transition-colors break-all flex items-center gap-2"
                        >
                          <div className="w-1 h-1 rounded-full bg-sky-500/40" />
                          {source}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {readAssetRefs(selectedEvent).length > 0 ? (
                  <p className="text-[10px] text-fuchsia-400 mt-3 font-bold uppercase tracking-wider">
                    Linked Assets: {readAssetRefs(selectedEvent).length}
                  </p>
                ) : null}

                {selectedConnections.length > 0 ? (
                  <div className="mt-4 pt-4 border-t border-slate-800/50">
                    <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold">
                      Narrative Links
                    </p>
                    <ul className="mt-2 space-y-2">
                      {selectedConnections.slice(0, 8).map((connection, index) => (
                        <li
                          key={`${connection.from}-${connection.to}-${index}`}
                          className="text-xs bg-slate-900/40 p-2 rounded border border-slate-800/40"
                        >
                          <p className="text-emerald-400 font-medium">
                            {connection.from} <span className="text-slate-500">→</span>{' '}
                            {connection.to}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-500 uppercase">
                              {connection.connectionType}
                            </span>
                            {connection.rationale ? (
                              <span className="text-slate-400 italic">
                                — {connection.rationale}
                              </span>
                            ) : null}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
              <div className="flex md:flex-col items-stretch gap-2">
                <Button
                  data-testid="timeline-edit-selected"
                  variant="outline"
                  className="border-slate-800 bg-slate-900/50 hover:bg-slate-800"
                  onClick={() => startEdit(selectedEvent)}
                  disabled={isDelegatedView}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit Event
                </Button>
                <Button
                  data-testid="timeline-delete-selected"
                  variant="outline"
                  className="border-red-500/20 text-red-400 hover:bg-red-950/30 hover:border-red-500/40"
                  onClick={() => removeItem(selectedEvent.id)}
                  disabled={isDelegatedView}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-500">
                <Calendar className="w-6 h-6" />
              </div>
              <p className="text-slate-400 text-sm">
                No milestone selected. Click a node on the timeline to view details.
              </p>
            </div>
          )}
          <div className="flex gap-4 border-t border-slate-800/50 pt-6">
            <div className="flex-1 rounded-md border border-slate-800 bg-slate-950/60 px-4 py-3 text-xs text-slate-400">
              {graphLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-amber-500/50 border-t-transparent rounded-full animate-spin" />
                  <span>Loading narrative graph intelligence...</span>
                </div>
              ) : narrativeGraph ? (
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  <p>
                    Nodes:{' '}
                    <span className="text-amber-400 font-mono font-bold">
                      {narrativeGraph.nodeCount}
                    </span>
                  </p>
                  <p>
                    Edges:{' '}
                    <span className="text-amber-400 font-mono font-bold">
                      {narrativeGraph.edgeCount}
                    </span>
                  </p>
                  <p>
                    Total Events:{' '}
                    <span className="text-amber-400 font-mono font-bold">
                      {narrativeGraph.eventCount}
                    </span>
                  </p>
                  <p className="ml-auto italic opacity-70">Narrative Intelligence Engine Active</p>
                </div>
              ) : (
                <span>Narrative graph unavailable for this scope.</span>
              )}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card
            data-testid="timeline-create-card"
            className="bg-slate-900/50 border-slate-800 p-6 rounded-md space-y-5"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Plus className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white">Record New Milestone</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Title</Label>
                <Input
                  data-testid="timeline-create-title"
                  value={createForm.title}
                  onChange={(e) => setCreateForm((s) => ({ ...s, title: e.target.value }))}
                  placeholder="e.g. Project Launch"
                  className="bg-slate-950 border-slate-700 text-slate-200 focus:ring-amber-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Narrative Description</Label>
                <Textarea
                  data-testid="timeline-create-description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm((s) => ({ ...s, description: e.target.value }))}
                  placeholder="Describe the significance of this event..."
                  className="bg-slate-950 border-slate-700 min-h-[100px] text-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Sources & Evidence (one per line)</Label>
                <Textarea
                  value={createForm.sourcesText}
                  onChange={(e) => setCreateForm((s) => ({ ...s, sourcesText: e.target.value }))}
                  placeholder="URLs or citations..."
                  className="bg-slate-950 border-slate-700 min-h-[90px] text-slate-200"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Category</Label>
                  <select
                    value={createForm.category}
                    onChange={(e) => setCreateForm((s) => ({ ...s, category: e.target.value }))}
                    className="h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-200 outline-none focus:border-amber-500/50"
                  >
                    {selectableCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Date & Time</Label>
                  <Input
                    data-testid="timeline-create-when"
                    type="datetime-local"
                    value={createForm.when}
                    onChange={(e) => setCreateForm((s) => ({ ...s, when: e.target.value }))}
                    className="bg-slate-950 border-slate-700 text-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <Label className="text-slate-300 text-xs font-bold uppercase tracking-wider">
                    Timeline Position
                  </Label>
                  <span className="text-amber-400 font-mono font-bold text-sm">
                    {createForm.point}%
                  </span>
                </div>
                <input
                  data-testid="timeline-create-point"
                  type="range"
                  min={0}
                  max={100}
                  value={createForm.point}
                  onChange={(e) => setCreateForm((s) => ({ ...s, point: Number(e.target.value) }))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>

            <Button
              data-testid="timeline-create-submit"
              onClick={createItem}
              disabled={saving || isDelegatedView}
              className="bg-amber-500 hover:bg-amber-600 text-black w-full font-bold shadow-lg shadow-amber-500/10 h-11"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add to Timeline
            </Button>
          </Card>

          <Card
            data-testid="timeline-edit-card"
            className="bg-slate-900/50 border-slate-800 p-6 rounded-md space-y-5"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-sky-500/10 flex items-center justify-center text-sky-500">
                <Pencil className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white">Edit Selection</h3>
            </div>

            {!editingId ? (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                <Pencil className="w-10 h-10 text-slate-600 mb-4" />
                <p className="text-slate-400 text-sm max-w-[240px]">
                  Select an event on the timeline and click{' '}
                  <span className="text-slate-200 font-bold">Edit</span> to populate this form.
                </p>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="space-y-2">
                  <Label className="text-slate-300">Title</Label>
                  <Input
                    data-testid="timeline-edit-title"
                    value={editForm.title}
                    onChange={(e) => setEditForm((s) => ({ ...s, title: e.target.value }))}
                    className="bg-slate-950 border-slate-700 text-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Description</Label>
                  <Textarea
                    data-testid="timeline-edit-description"
                    value={editForm.description}
                    onChange={(e) => setEditForm((s) => ({ ...s, description: e.target.value }))}
                    className="bg-slate-950 border-slate-700 min-h-[100px] text-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Sources</Label>
                  <Textarea
                    value={editForm.sourcesText}
                    onChange={(e) => setEditForm((s) => ({ ...s, sourcesText: e.target.value }))}
                    className="bg-slate-950 border-slate-700 min-h-[90px] text-slate-200"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Category</Label>
                    <select
                      value={editForm.category}
                      onChange={(e) => setEditForm((s) => ({ ...s, category: e.target.value }))}
                      className="h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-200 outline-none focus:border-sky-500/50"
                    >
                      {selectableCategories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Date & Time</Label>
                    <Input
                      data-testid="timeline-edit-when"
                      type="datetime-local"
                      value={editForm.when}
                      onChange={(e) => setEditForm((s) => ({ ...s, when: e.target.value }))}
                      className="bg-slate-950 border-slate-700 text-slate-200"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-slate-300 text-xs font-bold uppercase tracking-wider">
                      Position
                    </Label>
                    <span className="text-sky-400 font-mono font-bold text-sm">
                      {editForm.point}%
                    </span>
                  </div>
                  <input
                    data-testid="timeline-edit-point"
                    type="range"
                    min={0}
                    max={100}
                    value={editForm.point}
                    onChange={(e) => setEditForm((s) => ({ ...s, point: Number(e.target.value) }))}
                    className="w-full accent-sky-500 cursor-pointer"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    data-testid="timeline-edit-save"
                    onClick={saveEdit}
                    disabled={saving || isDelegatedView}
                    className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold flex-1 h-11"
                  >
                    Update Record
                  </Button>
                  <Button
                    data-testid="timeline-edit-cancel"
                    variant="outline"
                    className="border-slate-700 bg-slate-900/50 hover:bg-slate-800 h-11 px-6"
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
