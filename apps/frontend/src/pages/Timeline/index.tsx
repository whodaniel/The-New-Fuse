import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/providers/AuthProvider';
import {
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

type FormState = {
  title: string;
  description: string;
  point: number;
  when: string;
};

const ANON_TIMELINE_KEY = 'tnf_personal_timeline_user';

function getAnonymousUserId(): string {
  if (typeof window === 'undefined') return 'anon_server';
  const existing = localStorage.getItem(ANON_TIMELINE_KEY);
  if (existing) return existing;
  const next = `anon_${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(ANON_TIMELINE_KEY, next);
  return next;
}

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

function readPayload(event: TimelineEvent): { title: string; description: string; point: number } {
  const payload = (event.payload || {}) as Record<string, unknown>;
  return {
    title: String(payload.title || payload.note || 'Untitled event'),
    description: String(payload.description || ''),
    point: clampPoint(payload.point),
  };
}

export default function TimelinePage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState<FormState>({
    title: '',
    description: '',
    point: 50,
    when: toFormDateTime(new Date().toISOString()),
  });

  const [editForm, setEditForm] = useState<FormState>({
    title: '',
    description: '',
    point: 50,
    when: '',
  });

  const userId = useMemo(() => user?.id || getAnonymousUserId(), [user?.id]);

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

  const selectedEvent = useMemo(
    () => sortedEvents.find((e) => e.id === selectedId) || null,
    [sortedEvents, selectedId]
  );

  const load = async () => {
    setLoading(true);
    try {
      const rows = await listTimelineEvents({ userId });
      setEvents(rows);
      if (rows.length && !selectedId) {
        setSelectedId(rows[0].id);
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
    if (!createForm.title.trim()) {
      toast.error('Title is required');
      return;
    }

    setSaving(true);
    try {
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
          source: 'personal-timeline',
        },
      });
      toast.success('Timeline point added');
      setCreateForm({
        title: '',
        description: '',
        point: createForm.point,
        when: toFormDateTime(new Date().toISOString()),
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
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    if (!editForm.title.trim()) {
      toast.error('Title is required');
      return;
    }

    setSaving(true);
    try {
      const updated = await updateTimelineEvent(editingId, {
        userId,
        actor: userId,
        timestamp: editForm.when ? new Date(editForm.when).toISOString() : undefined,
        payload: {
          title: editForm.title.trim(),
          description: editForm.description.trim(),
          point: editForm.point,
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
    setSaving(true);
    try {
      const ok = await deleteTimelineEvent(id, userId);
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
    <div className="min-h-screen bg-[#020617] text-slate-100 p-6 lg:p-10">
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
          <Button
            onClick={load}
            disabled={loading}
            className="bg-amber-500 hover:bg-amber-600 text-black"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </header>

        <Card className="bg-slate-900/50 border-slate-800 p-6 rounded-2xl space-y-5">
          <div className="flex items-center gap-2 text-slate-300 text-sm">
            <Calendar className="w-4 h-4" />
            Traditional horizontal timeline slider with node dots
          </div>

          <div className="relative px-2 py-8 overflow-x-auto">
            <div className="min-w-[680px]">
              <div className="h-[2px] bg-slate-700 relative">
                {sortedEvents.map((event) => {
                  const payload = readPayload(event);
                  const active = selectedId === event.id;
                  return (
                    <button
                      key={event.id}
                      type="button"
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
            <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold">{readPayload(selectedEvent).title}</h2>
                <p className="text-slate-300 text-sm mt-1">
                  {readPayload(selectedEvent).description || 'No details added yet.'}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Point {readPayload(selectedEvent).point} •{' '}
                  {format(new Date(selectedEvent.timestamp), 'PPP p')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="border-slate-700"
                  onClick={() => startEdit(selectedEvent)}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
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

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="bg-slate-900/50 border-slate-800 p-6 rounded-2xl space-y-4">
            <h3 className="text-xl font-bold">Add Timeline Point</h3>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={createForm.title}
                onChange={(e) => setCreateForm((s) => ({ ...s, title: e.target.value }))}
                placeholder="Launch MVP"
                className="bg-slate-950 border-slate-700"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={createForm.description}
                onChange={(e) => setCreateForm((s) => ({ ...s, description: e.target.value }))}
                placeholder="What happened at this point?"
                className="bg-slate-950 border-slate-700 min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Timeline Position: {createForm.point}</Label>
              <input
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
                type="datetime-local"
                value={createForm.when}
                onChange={(e) => setCreateForm((s) => ({ ...s, when: e.target.value }))}
                className="bg-slate-950 border-slate-700"
              />
            </div>
            <Button
              onClick={createItem}
              disabled={saving}
              className="bg-amber-500 hover:bg-amber-600 text-black w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Point
            </Button>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 p-6 rounded-2xl space-y-4">
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
                    value={editForm.title}
                    onChange={(e) => setEditForm((s) => ({ ...s, title: e.target.value }))}
                    className="bg-slate-950 border-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm((s) => ({ ...s, description: e.target.value }))}
                    className="bg-slate-950 border-slate-700 min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Timeline Position: {editForm.point}</Label>
                  <input
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
                    type="datetime-local"
                    value={editForm.when}
                    onChange={(e) => setEditForm((s) => ({ ...s, when: e.target.value }))}
                    className="bg-slate-950 border-slate-700"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={saveEdit}
                    disabled={saving}
                    className="bg-emerald-500 hover:bg-emerald-600 text-black flex-1"
                  >
                    Save Changes
                  </Button>
                  <Button
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
