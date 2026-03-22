import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/providers/AuthProvider';
import {
  bootstrapPersonalTimeline,
  createTimelineEvent,
  deleteTimelineEvent,
  listTimelineEvents,
  updateTimelineEvent,
  type TimelineEvent,
} from '@/services/unifiedLedgerApi';
import { format } from 'date-fns';
import { Calendar, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

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

export default function TimelinePage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

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

  const runBootstrap = async (auto = false) => {
    if (!userId) return;
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
      return;
    }
    setLoading(true);
    try {
      const rows = await listTimelineEvents();
      setEvents(rows);
      if (rows.length && !selectedId) {
        setSelectedId(rows[0].id);
      } else if (rows.length === 0) {
        await runBootstrap(true);
      }
    } catch {
      toast.error('Failed to load your timeline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [userId]);

  const createItem = async () => {
    if (!userId) {
      toast.error('Please sign in to create timeline items');
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

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 p-4 lg:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-amber-400 text-xs uppercase tracking-[0.2em] font-semibold">
              Personal Space
            </p>
            <h1 className="text-4xl md:text-5xl font-black mt-2">My Timeline</h1>
            <p className="text-slate-400 mt-2">
              Add milestones to your own horizontal timeline, then edit or remove them anytime.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => runBootstrap(false)}
              disabled={bootstrapping || saving || !userId}
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

        <Card className="bg-slate-900/50 border-slate-800 p-4 rounded-md">
          <div className="flex flex-col gap-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Related Timeline Views
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              <Link
                to="/timeline"
                className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-200 hover:bg-amber-500/20"
              >
                Personal Timeline
              </Link>
              <Link
                to="/macro-timeline"
                className="rounded-md border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-sm font-semibold text-sky-200 hover:bg-sky-500/20"
              >
                Macro Timeline (Multi-Track)
              </Link>
              <Link
                to="/timeline/module"
                className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20"
              >
                Timeline Module Lab
              </Link>
              <Link
                to="/timeline-demo"
                className="rounded-md border border-fuchsia-500/40 bg-fuchsia-500/10 px-3 py-2 text-sm font-semibold text-fuchsia-200 hover:bg-fuchsia-500/20"
              >
                Timeline Demo
              </Link>
            </div>
          </div>
        </Card>

        <Card
          data-testid="timeline-rail-card"
          className="bg-slate-900/50 border-slate-800 p-4 rounded-md space-y-5"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 text-slate-300 text-sm">
              <Calendar className="w-4 h-4" />
              Traditional horizontal timeline slider with node dots
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-slate-400">Category</Label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-9 rounded-md border border-slate-700 bg-slate-950 px-2 text-sm"
              >
                {availableCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="relative px-2 py-8 overflow-x-auto">
            <div className="min-w-[680px]">
              <div className="h-[2px] bg-slate-700 relative">
                {filteredEvents.map((event) => {
                  const payload = readPayload(event);
                  const active = selectedId === event.id;
                  return (
                    <button
                      key={event.id}
                      type="button"
                      data-testid={`timeline-node-${event.id}`}
                      onClick={() => setSelectedId(event.id)}
                      className="absolute -top-3 -translate-x-1/2 group"
                      style={{ left: `${payload.point}%` }}
                      title={payload.title}
                    >
                      <span
                        className={`block w-6 h-6 rounded-full border-2 transition-all ${
                          active
                            ? 'bg-amber-500 border-amber-200 scale-110'
                            : 'bg-slate-800 border-slate-500 group-hover:border-amber-400'
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
              className="rounded-md border border-slate-700 bg-slate-950/60 p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <h2 data-testid="timeline-selected-title" className="text-lg font-semibold">
                  {readPayload(selectedEvent).title}
                </h2>
                <p className="text-slate-300 text-sm mt-1">
                  {readPayload(selectedEvent).description || 'No details added yet.'}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Point {readPayload(selectedEvent).point} •{' '}
                  {format(new Date(selectedEvent.timestamp), 'PPP p')}
                </p>
                <p className="text-xs text-amber-300 mt-1">
                  Category: {readPayload(selectedEvent).category}
                </p>
                {readSources(selectedEvent).length > 0 ? (
                  <div className="mt-2">
                    <p className="text-xs text-slate-400 uppercase tracking-[0.18em]">Sources</p>
                    <ul className="mt-1 space-y-1">
                      {readSources(selectedEvent).map((source) => (
                        <li key={source} className="text-xs text-sky-300 break-all">
                          {source}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  data-testid="timeline-edit-selected"
                  variant="outline"
                  className="border-slate-700"
                  onClick={() => startEdit(selectedEvent)}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  data-testid="timeline-delete-selected"
                  variant="outline"
                  className="border-red-500/40 text-red-300 hover:bg-red-900/20"
                  onClick={() => removeItem(selectedEvent.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-slate-400 text-sm">
              No selected point. Add one below to start your timeline.
            </p>
          )}
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Card
            data-testid="timeline-create-card"
            className="bg-slate-900/50 border-slate-800 p-4 rounded-md space-y-4"
          >
            <h3 className="text-xl font-bold">Add Timeline Point</h3>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                data-testid="timeline-create-title"
                value={createForm.title}
                onChange={(e) => setCreateForm((s) => ({ ...s, title: e.target.value }))}
                placeholder="Launch MVP"
                className="bg-slate-950 border-slate-700"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                data-testid="timeline-create-description"
                value={createForm.description}
                onChange={(e) => setCreateForm((s) => ({ ...s, description: e.target.value }))}
                placeholder="What happened at this point?"
                className="bg-slate-950 border-slate-700 min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Sources (one per line)</Label>
              <Textarea
                value={createForm.sourcesText}
                onChange={(e) => setCreateForm((s) => ({ ...s, sourcesText: e.target.value }))}
                placeholder="https://example.com/reference\nnotes: personal journal"
                className="bg-slate-950 border-slate-700 min-h-[90px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <select
                value={createForm.category}
                onChange={(e) => setCreateForm((s) => ({ ...s, category: e.target.value }))}
                className="h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm"
              >
                {selectableCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Timeline Position: {createForm.point}</Label>
              <input
                data-testid="timeline-create-point"
                type="range"
                min={0}
                max={100}
                value={createForm.point}
                onChange={(e) => setCreateForm((s) => ({ ...s, point: Number(e.target.value) }))}
                className="w-full accent-amber-500"
              />
            </div>
            <div className="space-y-2">
              <Label>Date & Time</Label>
              <Input
                data-testid="timeline-create-when"
                type="datetime-local"
                value={createForm.when}
                onChange={(e) => setCreateForm((s) => ({ ...s, when: e.target.value }))}
                className="bg-slate-950 border-slate-700"
              />
            </div>
            <Button
              data-testid="timeline-create-submit"
              onClick={createItem}
              disabled={saving}
              className="bg-amber-500 hover:bg-amber-600 text-black w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Point
            </Button>
          </Card>

          <Card
            data-testid="timeline-edit-card"
            className="bg-slate-900/50 border-slate-800 p-4 rounded-md space-y-4"
          >
            <h3 className="text-xl font-bold">Edit Selected Point</h3>
            {!editingId ? (
              <p className="text-slate-400 text-sm">
                Select a node and click <span className="text-slate-200">Edit</span> to modify it.
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    data-testid="timeline-edit-title"
                    value={editForm.title}
                    onChange={(e) => setEditForm((s) => ({ ...s, title: e.target.value }))}
                    className="bg-slate-950 border-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    data-testid="timeline-edit-description"
                    value={editForm.description}
                    onChange={(e) => setEditForm((s) => ({ ...s, description: e.target.value }))}
                    className="bg-slate-950 border-slate-700 min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sources (one per line)</Label>
                  <Textarea
                    value={editForm.sourcesText}
                    onChange={(e) => setEditForm((s) => ({ ...s, sourcesText: e.target.value }))}
                    className="bg-slate-950 border-slate-700 min-h-[90px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm((s) => ({ ...s, category: e.target.value }))}
                    className="h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm"
                  >
                    {selectableCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Timeline Position: {editForm.point}</Label>
                  <input
                    data-testid="timeline-edit-point"
                    type="range"
                    min={0}
                    max={100}
                    value={editForm.point}
                    onChange={(e) => setEditForm((s) => ({ ...s, point: Number(e.target.value) }))}
                    className="w-full accent-amber-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date & Time</Label>
                  <Input
                    data-testid="timeline-edit-when"
                    type="datetime-local"
                    value={editForm.when}
                    onChange={(e) => setEditForm((s) => ({ ...s, when: e.target.value }))}
                    className="bg-slate-950 border-slate-700"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    data-testid="timeline-edit-save"
                    onClick={saveEdit}
                    disabled={saving}
                    className="bg-emerald-500 hover:bg-emerald-600 text-black flex-1"
                  >
                    Save Changes
                  </Button>
                  <Button
                    data-testid="timeline-edit-cancel"
                    variant="outline"
                    className="border-slate-700"
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
