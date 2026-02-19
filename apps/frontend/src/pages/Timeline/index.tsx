import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  createTimelineEvent,
  listTimelineEvents,
  updateTimelineEvent,
  type TimelineEvent,
} from '@/services/unifiedLedgerApi';
import { formatDistanceToNow } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  Calendar,
  Clock,
  Edit3,
  Filter,
  Loader2,
  Plus,
  User,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

// Validation types
interface ValidationErrors {
  recordId?: string;
  goalId?: string;
  planId?: string;
  actor?: string;
  note?: string;
  timestamp?: string;
}

interface OptimisticEvent extends TimelineEvent {
  _optimistic?: boolean;
  _pending?: boolean;
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  historical_event: 'bg-blue-500',
  milestone_completed: 'bg-emerald-500',
  status_change: 'bg-amber-500',
  comment: 'bg-violet-500',
  link_created: 'bg-cyan-500',
  link_removed: 'bg-rose-500',
};

export default function TimelinePage() {
  const [events, setEvents] = useState<OptimisticEvent[]>([]);
  const [recordId, setRecordId] = useState('');
  const [goalId, setGoalId] = useState('');
  const [planId, setPlanId] = useState('');
  const [eventType, setEventType] = useState('');
  const [actor, setActor] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [newRecordId, setNewRecordId] = useState('');
  const [newGoalId, setNewGoalId] = useState('');
  const [newPlanId, setNewPlanId] = useState('');
  const [newTimestamp, setNewTimestamp] = useState('');
  const [newActor, setNewActor] = useState('ui-user');
  const [newNote, setNewNote] = useState('');

  const [editingEventId, setEditingEventId] = useState('');
  const [editActor, setEditActor] = useState('');
  const [editTimestamp, setEditTimestamp] = useState('');
  const [editNote, setEditNote] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try {
      const rows = await listTimelineEvents({
        recordId: recordId || undefined,
        goalId: goalId || undefined,
        planId: planId || undefined,
        eventType: eventType || undefined,
        actor: actor || undefined,
        dateFrom: dateFrom ? new Date(dateFrom).toISOString() : undefined,
        dateTo: dateTo ? new Date(dateTo).toISOString() : undefined,
      });
      setEvents(rows);
    } catch {
      toast.error('Failed to load timeline');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onCreate = async () => {
    if (!newRecordId && !newGoalId && !newPlanId) {
      toast.error('Set recordId, goalId, or planId');
      return;
    }
    setIsCreating(true);
    try {
      await createTimelineEvent({
        recordId: newRecordId || undefined,
        goalId: newGoalId || undefined,
        planId: newPlanId || undefined,
        eventType: 'historical_event',
        actor: newActor || 'ui-user',
        timestamp: newTimestamp ? new Date(newTimestamp).toISOString() : undefined,
        payload: { note: newNote || 'manual event', source: 'timeline-page' },
      });
      setNewNote('');
      await load();
      toast.success('Event created successfully');
    } catch {
      toast.error('Failed to create event');
    } finally {
      setIsCreating(false);
    }
  };

  const startEdit = (event: TimelineEvent) => {
    setEditingEventId(event.id);
    setEditActor(event.actor);
    setEditTimestamp(new Date(event.timestamp).toISOString().slice(0, 16));
    setEditNote(String((event.payload || {}).note || ''));
  };

  const onSaveEdit = async () => {
    if (!editingEventId) return;
    try {
      await updateTimelineEvent(editingEventId, {
        actor: editActor || undefined,
        timestamp: editTimestamp ? new Date(editTimestamp).toISOString() : undefined,
        payload: { note: editNote },
      });
      setEditingEventId('');
      await load();
      toast.success('Event updated');
    } catch {
      toast.error('Failed to update event');
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 p-6 lg:p-12 font-sans selection:bg-amber-500/30">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header Section */}
        <header
          className="flex flex-col md:flex-row md:items-end justify-between gap-6"
          role="banner"
        >
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold uppercase tracking-wider"
            >
              <Activity className="w-3 h-3" />
              Unified Event Ledger
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl lg:text-7xl font-black tracking-tight bg-gradient-to-br from-white via-slate-200 to-slate-500 bg-clip-text text-transparent"
            >
              Timeline
            </motion.h1>
            <p className="text-slate-400 text-lg max-w-xl">
              Real-time audit log of agent actions, milestone achievements, and status changes
              across the ecosystem.
            </p>
          </div>
          <Button
            id="timeline-btn-refresh"
            data-testid="timeline-btn-refresh"
            data-action="refresh-ledger"
            aria-label="Refresh event ledger"
            title="Reload all timeline events"
            onClick={load}
            disabled={isLoading}
            className="bg-amber-500 hover:bg-amber-600 text-black font-bold h-12 px-6 rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Calendar className="w-4 h-4" />
            )}
            Refresh Ledger
          </Button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Sidebar Controls */}
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-8">
            {/* Filters Card */}
            <Card
              id="timeline-panel-filters"
              data-testid="timeline-panel-filters"
              role="region"
              aria-label="Timeline filters"
              className="bg-slate-900/40 border-slate-800 backdrop-blur-xl p-6 rounded-3xl space-y-6 shadow-2xl shadow-black/50 overflow-hidden relative group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-amber-500/10 transition-colors" />

              <div className="flex items-center gap-2 text-amber-500">
                <Filter className="w-5 h-5" />
                <h2 className="text-xl font-bold tracking-tight">Filters</h2>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="timeline-input-filter-record-id"
                    className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1"
                  >
                    Entity IDs
                  </Label>
                  <div className="grid grid-cols-1 gap-2">
                    <Input
                      id="timeline-input-filter-record-id"
                      data-testid="timeline-input-filter-record-id"
                      data-input="record-id"
                      aria-label="Filter by Record ID"
                      className="bg-slate-950/50 border-slate-800 focus:border-amber-500/50 h-10 px-4 rounded-xl text-sm"
                      value={recordId}
                      onChange={(e) => setRecordId(e.target.value)}
                      placeholder="Record ID"
                    />
                    <Input
                      id="timeline-input-filter-goal-id"
                      data-testid="timeline-input-filter-goal-id"
                      data-input="goal-id"
                      aria-label="Filter by Goal ID"
                      className="bg-slate-950/50 border-slate-800 focus:border-amber-500/50 h-10 px-4 rounded-xl text-sm"
                      value={goalId}
                      onChange={(e) => setGoalId(e.target.value)}
                      placeholder="Goal ID"
                    />
                    <Input
                      id="timeline-input-filter-plan-id"
                      data-testid="timeline-input-filter-plan-id"
                      data-input="plan-id"
                      aria-label="Filter by Plan ID"
                      className="bg-slate-950/50 border-slate-800 focus:border-amber-500/50 h-10 px-4 rounded-xl text-sm"
                      value={planId}
                      onChange={(e) => setPlanId(e.target.value)}
                      placeholder="Plan ID"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="timeline-input-filter-event-type"
                    className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1"
                  >
                    Attributes
                  </Label>
                  <div className="grid grid-cols-1 gap-2">
                    <Input
                      id="timeline-input-filter-event-type"
                      data-testid="timeline-input-filter-event-type"
                      data-input="event-type"
                      aria-label="Filter by Event Type"
                      className="bg-slate-950/50 border-slate-800 focus:border-amber-500/50 h-10 px-4 rounded-xl text-sm"
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value)}
                      placeholder="Event Type"
                    />
                    <Input
                      id="timeline-input-filter-actor"
                      data-testid="timeline-input-filter-actor"
                      data-input="actor"
                      aria-label="Filter by Actor"
                      className="bg-slate-950/50 border-slate-800 focus:border-amber-500/50 h-10 px-4 rounded-xl text-sm"
                      value={actor}
                      onChange={(e) => setActor(e.target.value)}
                      placeholder="Actor"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="timeline-input-filter-date-from"
                    className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1"
                  >
                    Time Range
                  </Label>
                  <div className="grid grid-cols-1 gap-2">
                    <Input
                      id="timeline-input-filter-date-from"
                      data-testid="timeline-input-filter-date-from"
                      data-input="date-from"
                      aria-label="Start date filter"
                      type="datetime-local"
                      className="bg-slate-950/50 border-slate-800 focus:border-amber-500/50 h-10 px-4 rounded-xl text-sm"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                    />
                    <Input
                      id="timeline-input-filter-date-to"
                      data-testid="timeline-input-filter-date-to"
                      data-input="date-to"
                      aria-label="End date filter"
                      type="datetime-local"
                      className="bg-slate-950/50 border-slate-800 focus:border-amber-500/50 h-10 px-4 rounded-xl text-sm"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Create Event Card */}
            <Card
              id="timeline-panel-create"
              data-testid="timeline-panel-create"
              role="region"
              aria-label="Inject manual event"
              className="bg-slate-900/40 border-slate-800 backdrop-blur-xl p-6 rounded-3xl space-y-6 shadow-2xl shadow-black/50 relative overflow-hidden group"
            >
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full -mr-16 -mb-16 group-hover:bg-indigo-500/10 transition-colors" />

              <div className="flex items-center gap-2 text-indigo-400">
                <Plus className="w-5 h-5" />
                <h2 className="text-xl font-bold tracking-tight">Manual Entry</h2>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-2">
                  <Input
                    id="timeline-input-create-record-id"
                    data-testid="timeline-input-create-record-id"
                    data-input="target-record-id"
                    aria-label="Target record ID for new event"
                    className="bg-slate-950/50 border-slate-800 focus:border-indigo-500/50 h-10 px-4 rounded-xl text-sm"
                    value={newRecordId}
                    onChange={(e) => setNewRecordId(e.target.value)}
                    placeholder="Target Record ID"
                  />
                  <Input
                    id="timeline-input-create-actor"
                    data-testid="timeline-input-create-actor"
                    data-input="new-event-actor"
                    aria-label="Actor for new event"
                    className="bg-slate-950/50 border-slate-800 focus:border-indigo-500/50 h-10 px-4 rounded-xl text-sm"
                    value={newActor}
                    onChange={(e) => setNewActor(e.target.value)}
                    placeholder="Actor"
                  />
                </div>
                <Textarea
                  id="timeline-textarea-create-note"
                  data-testid="timeline-textarea-create-note"
                  data-input="new-event-note"
                  aria-label="Note for new event"
                  className="bg-slate-950/50 border-slate-800 focus:border-indigo-500/50 rounded-2xl resize-none text-sm min-h-[100px]"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Record contextual notes here..."
                />
                <Button
                  id="timeline-btn-inject"
                  data-testid="timeline-btn-inject"
                  data-action="inject-event"
                  aria-label="Inject new event into timeline"
                  title="Create new manual timeline event"
                  onClick={onCreate}
                  disabled={isCreating}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-11 rounded-xl transition-all shadow-lg shadow-indigo-900/20"
                >
                  {isCreating ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <ArrowRight className="w-4 h-4 mr-2" />
                  )}
                  Inject Event
                </Button>
              </div>
            </Card>
          </aside>

          {/* Right Column: Timeline Feed */}
          <main
            className="lg:col-span-8 relative min-h-[600px]"
            role="main"
            aria-label="Timeline event feed"
          >
            {/* The Vertical Line */}
            <div className="absolute left-[31px] top-6 bottom-6 w-px bg-gradient-to-b from-amber-500/50 via-slate-800 to-indigo-500/50" />

            {events.length === 0 && !isLoading ? (
              <motion.div
                id="timeline-panel-empty"
                data-testid="timeline-panel-empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-32 text-slate-500 space-y-4"
              >
                <Clock className="w-16 h-16 opacity-20" />
                <p className="font-medium text-lg">The ledger is currently empty for this query.</p>
              </motion.div>
            ) : null}

            <div className="space-y-12">
              <AnimatePresence mode="popLayout">
                {events.map((event, idx) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05, duration: 0.3 }}
                    className="relative pl-16 group"
                  >
                    {/* Event Dot */}
                    <div
                      className={cn(
                        'absolute left-[20px] top-4 w-6 h-6 rounded-full border-4 border-[#020617] shadow-xl z-10 transition-transform group-hover:scale-125 duration-300',
                        EVENT_TYPE_COLORS[event.eventType] || 'bg-slate-500'
                      )}
                    />

                    {/* Content Card */}
                    <Card className="bg-slate-900/30 border-slate-800/50 backdrop-blur-md p-6 rounded-[2rem] hover:bg-slate-900/50 transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-black/60 relative overflow-hidden border-l-4 border-l-transparent hover:border-l-indigo-500/50">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <span
                              className={cn(
                                'px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-black/20',
                                EVENT_TYPE_COLORS[event.eventType] || 'bg-slate-500'
                              )}
                            >
                              {event.eventType.replace('_', ' ')}
                            </span>
                            <span className="text-xs font-mono text-slate-500 opacity-50">
                              #{event.id.slice(0, 8)}
                            </span>
                          </div>
                          <h3 className="text-slate-400 text-sm flex items-center gap-2">
                            <User className="w-3 h-3 text-amber-500/70" />
                            By <span className="font-bold text-slate-200">{event.actor}</span>
                          </h3>
                        </div>
                        <div className="text-right">
                          <time className="text-xs font-bold text-slate-500 block mb-1">
                            {new Date(event.timestamp).toLocaleString([], {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </time>
                          <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-tighter">
                            {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-950/40 rounded-2xl p-4 text-slate-300 text-base leading-relaxed border border-white/5">
                        {String((event.payload || {}).note || 'No description provided.')}
                      </div>

                      {/* Metadata Grid */}
                      <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {event.recordId && (
                          <div className="text-[10px] text-slate-500 bg-slate-950/30 px-2 py-1 rounded-lg">
                            RECORD:{' '}
                            <span className="text-slate-300 font-mono">{event.recordId}</span>
                          </div>
                        )}
                        {event.goalId && (
                          <div className="text-[10px] text-slate-500 bg-slate-950/30 px-2 py-1 rounded-lg">
                            GOAL: <span className="text-slate-300 font-mono">{event.goalId}</span>
                          </div>
                        )}
                        {event.planId && (
                          <div className="text-[10px] text-slate-500 bg-slate-950/30 px-2 py-1 rounded-lg">
                            PLAN: <span className="text-slate-300 font-mono">{event.planId}</span>
                          </div>
                        )}
                      </div>

                      <div className="absolute bottom-4 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          id={`timeline-btn-edit-${event.id}`}
                          data-testid={`timeline-btn-edit-${event.id}`}
                          data-action="edit-event"
                          aria-label={`Edit event ${event.id}`}
                          title="Modify this event trace"
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(event)}
                          className="h-8 rounded-lg hover:bg-amber-500/10 text-amber-500"
                        >
                          <Edit3 className="w-3 h-3 mr-2" />
                          Modify Trace
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>

      {/* Edit Overlay Modal */}
      <AnimatePresence>
        {editingEventId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
            aria-labelledby="timeline-modal-edit-title"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-lg"
            >
              <Card
                id="timeline-panel-edit-modal"
                data-testid="timeline-panel-edit-modal"
                className="bg-slate-900 border-slate-800 p-8 rounded-[2.5rem] shadow-2xl space-y-6"
              >
                <div className="flex justify-between items-center">
                  <h2
                    id="timeline-modal-edit-title"
                    className="text-2xl font-black tracking-tight text-white"
                  >
                    Modify Event Trace
                  </h2>
                  <Button
                    id="timeline-btn-edit-close"
                    data-testid="timeline-btn-edit-close"
                    data-action="close-edit-modal"
                    aria-label="Close edit modal"
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingEventId('')}
                    className="rounded-full hover:bg-white/5"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="timeline-input-edit-actor"
                      className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1"
                    >
                      Actor Identity
                    </Label>
                    <Input
                      id="timeline-input-edit-actor"
                      data-testid="timeline-input-edit-actor"
                      data-input="edit-actor"
                      aria-label="Edit actor identity"
                      className="bg-slate-950 border-slate-800 focus:border-amber-500 rounded-xl"
                      value={editActor}
                      onChange={(e) => setEditActor(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="timeline-input-edit-timestamp"
                      className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1"
                    >
                      Precision Timestamp
                    </Label>
                    <Input
                      id="timeline-input-edit-timestamp"
                      data-testid="timeline-input-edit-timestamp"
                      data-input="edit-timestamp"
                      aria-label="Edit event timestamp"
                      type="datetime-local"
                      className="bg-slate-950 border-slate-800 focus:border-amber-500 rounded-xl"
                      value={editTimestamp}
                      onChange={(e) => setEditTimestamp(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="timeline-textarea-edit-note"
                      className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1"
                    >
                      Update Content
                    </Label>
                    <Textarea
                      id="timeline-textarea-edit-note"
                      data-testid="timeline-textarea-edit-note"
                      data-input="edit-note"
                      aria-label="Edit event note content"
                      rows={4}
                      className="bg-slate-950 border-slate-800 focus:border-amber-500 rounded-2xl resize-none"
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    id="timeline-btn-edit-save"
                    data-testid="timeline-btn-edit-save"
                    data-action="save-event-edit"
                    aria-label="Save changes to event"
                    title="Persist changes to the event ledger"
                    onClick={onSaveEdit}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-bold h-12 rounded-xl"
                  >
                    Push Update
                  </Button>
                  <Button
                    id="timeline-btn-edit-cancel"
                    data-testid="timeline-btn-edit-cancel"
                    data-action="cancel-event-edit"
                    aria-label="Cancel changes"
                    title="Discard changes and close"
                    variant="outline"
                    onClick={() => setEditingEventId('')}
                    className="flex-1 border-slate-700 hover:bg-white/5 h-12 rounded-xl"
                  >
                    Discard Changes
                  </Button>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
