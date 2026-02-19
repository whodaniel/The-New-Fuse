import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import toast from 'react-hot-toast';
import {
  createTimelineEvent,
  listTimelineEvents,
  updateTimelineEvent,
  type TimelineEvent,
} from '@/services/unifiedLedgerApi';

export default function TimelinePage() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
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

  const load = async () => {
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
      toast.success('Timeline event created');
    } catch {
      toast.error('Failed to create timeline event');
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
      toast.success('Timeline event updated');
    } catch {
      toast.error('Failed to update timeline event');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Timeline</h1>
        <p className="text-muted-foreground">Chronological events across records, goals, and plans.</p>
      </div>

      <Card className="p-4 space-y-3">
        <h2 className="text-lg font-semibold">Filters</h2>
        <div className="grid md:grid-cols-3 gap-2">
          <Input value={recordId} onChange={(e) => setRecordId(e.target.value)} placeholder="recordId" />
          <Input value={goalId} onChange={(e) => setGoalId(e.target.value)} placeholder="goalId" />
          <Input value={planId} onChange={(e) => setPlanId(e.target.value)} placeholder="planId" />
          <Input value={eventType} onChange={(e) => setEventType(e.target.value)} placeholder="eventType" />
          <Input value={actor} onChange={(e) => setActor(e.target.value)} placeholder="actor" />
          <Input type="datetime-local" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <Input type="datetime-local" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        <Button onClick={load}>Apply Filters</Button>
      </Card>

      <Card className="p-4 space-y-3">
        <h2 className="text-lg font-semibold">Create Event</h2>
        <div className="grid md:grid-cols-3 gap-2">
          <Input value={newRecordId} onChange={(e) => setNewRecordId(e.target.value)} placeholder="recordId" />
          <Input value={newGoalId} onChange={(e) => setNewGoalId(e.target.value)} placeholder="goalId" />
          <Input value={newPlanId} onChange={(e) => setNewPlanId(e.target.value)} placeholder="planId" />
          <Input value={newActor} onChange={(e) => setNewActor(e.target.value)} placeholder="actor" />
          <Input type="datetime-local" value={newTimestamp} onChange={(e) => setNewTimestamp(e.target.value)} />
        </div>
        <Textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} rows={3} placeholder="event note" />
        <Button onClick={onCreate}>Create</Button>
      </Card>

      <Card className="p-4 space-y-2">
        <h2 className="text-lg font-semibold">Events</h2>
        {events.length === 0 ? <p className="text-sm text-muted-foreground">No events found.</p> : null}
        {events.map((event) => (
          <div key={event.id} className="border rounded p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <div className="font-medium">
                {event.eventType} ({event.id})
              </div>
              <div className="text-muted-foreground">{new Date(event.timestamp).toLocaleString()}</div>
            </div>
            <div className="text-xs text-muted-foreground">
              actor: {event.actor} | recordId: {event.recordId || '-'} | goalId: {event.goalId || '-'} | planId:{' '}
              {event.planId || '-'}
            </div>
            <div className="text-sm">{String((event.payload || {}).note || '')}</div>
            <Button size="sm" variant="outline" onClick={() => startEdit(event)}>
              Edit
            </Button>
          </div>
        ))}
      </Card>

      {editingEventId ? (
        <Card className="p-4 space-y-3">
          <h2 className="text-lg font-semibold">Edit Event</h2>
          <Input value={editActor} onChange={(e) => setEditActor(e.target.value)} placeholder="actor" />
          <Input type="datetime-local" value={editTimestamp} onChange={(e) => setEditTimestamp(e.target.value)} />
          <Textarea value={editNote} onChange={(e) => setEditNote(e.target.value)} rows={3} placeholder="event note" />
          <div className="flex gap-2">
            <Button onClick={onSaveEdit}>Save</Button>
            <Button variant="outline" onClick={() => setEditingEventId('')}>
              Cancel
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
