import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/providers/AuthProvider';
import {
  addGoalMilestone,
  createGoal,
  createTimelineEvent,
  listGoals,
  listTimelineEvents,
  type GoalRecord,
  type TimelineEvent,
} from '@/services/unifiedLedgerApi';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function GoalsPage() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<GoalRecord[]>([]);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [eventNote, setEventNote] = useState('');
  const [eventAt, setEventAt] = useState('');
  const [milestoneGoalId, setMilestoneGoalId] = useState('');
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneDueAt, setMilestoneDueAt] = useState('');
  const owner = user?.id || 'ui-user';

  const load = async () => {
    try {
      const [goalRows, timelineRows] = await Promise.all([
        listGoals(owner),
        listTimelineEvents({ userId: owner }),
      ]);
      setGoals(goalRows);
      setEvents(timelineRows.filter((e) => !!e.goalId));
    } catch {
      toast.error('Failed to load goals');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onCreate = async () => {
    if (!title.trim()) return;
    try {
      await createGoal({ title, description, owner });
      setTitle('');
      setDescription('');
      await load();
      toast.success('Goal created');
    } catch {
      toast.error('Failed to create goal');
    }
  };

  const onAddHistoricalEvent = async () => {
    if (!selectedGoalId || !eventNote.trim()) return;
    try {
      await createTimelineEvent({
        goalId: selectedGoalId,
        eventType: 'historical_event',
        actor: owner,
        userId: owner,
        timestamp: eventAt ? new Date(eventAt).toISOString() : undefined,
        payload: { note: eventNote, source: 'goals-page' },
      });
      setEventNote('');
      setEventAt('');
      await load();
      toast.success('Historical event recorded');
    } catch {
      toast.error('Failed to record historical event');
    }
  };

  const onAddMilestone = async () => {
    if (!milestoneGoalId || !milestoneTitle.trim()) return;
    try {
      await addGoalMilestone(milestoneGoalId, {
        owner,
        title: milestoneTitle,
        dueAt: milestoneDueAt ? new Date(milestoneDueAt).toISOString() : undefined,
      });
      setMilestoneTitle('');
      setMilestoneDueAt('');
      await load();
      toast.success('Milestone added');
    } catch {
      toast.error('Failed to add milestone');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Goals</h1>
          <p className="text-muted-foreground">
            Primary planning goals connected to task/suggestion records.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/tasks">Tasks</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/plans">Plans</Link>
          </Button>
        </div>
      </div>

      <Card className="p-4 space-y-3">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Goal title" />
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Goal description"
        />
        <Button onClick={onCreate}>Create Goal</Button>
      </Card>

      <Card className="p-4 space-y-3">
        <h2 className="text-lg font-semibold">Historical Chronology Entry</h2>
        <select
          className="h-10 w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
          value={selectedGoalId}
          onChange={(e) => setSelectedGoalId(e.target.value)}
        >
          <option value="">Select goal...</option>
          {goals.map((g) => (
            <option key={g.id} value={g.id}>
              {g.title}
            </option>
          ))}
        </select>
        <Input type="datetime-local" value={eventAt} onChange={(e) => setEventAt(e.target.value)} />
        <Textarea
          value={eventNote}
          onChange={(e) => setEventNote(e.target.value)}
          rows={3}
          placeholder="Historical event note"
        />
        <Button onClick={onAddHistoricalEvent}>Record Event</Button>
      </Card>

      <Card className="p-4 space-y-3">
        <h2 className="text-lg font-semibold">Goal Milestone</h2>
        <select
          className="h-10 w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
          value={milestoneGoalId}
          onChange={(e) => setMilestoneGoalId(e.target.value)}
        >
          <option value="">Select goal...</option>
          {goals.map((g) => (
            <option key={g.id} value={g.id}>
              {g.title}
            </option>
          ))}
        </select>
        <Input
          value={milestoneTitle}
          onChange={(e) => setMilestoneTitle(e.target.value)}
          placeholder="Milestone title"
        />
        <Input
          type="datetime-local"
          value={milestoneDueAt}
          onChange={(e) => setMilestoneDueAt(e.target.value)}
        />
        <Button onClick={onAddMilestone}>Add Milestone</Button>
      </Card>

      <div className="space-y-3">
        {goals.map((g) => (
          <Card key={g.id} className="p-4">
            <Link
              to={`/goals/${g.id}`}
              className="font-semibold underline-offset-2 hover:underline"
            >
              {g.title}
            </Link>
            <div className="text-sm text-muted-foreground">{g.description}</div>
            <div className="text-xs text-muted-foreground mt-2">
              status: {g.status} | linked records: {g.linkedRecordIds.length} | milestones:{' '}
              {g.milestones.length}
            </div>
            <div className="mt-2 space-y-1">
              {events
                .filter((e) => e.goalId === g.id)
                .slice(0, 3)
                .map((e) => (
                  <div
                    key={e.id}
                    className="text-xs text-muted-foreground border rounded px-2 py-1"
                  >
                    {new Date(e.timestamp).toLocaleString()} |{' '}
                    {String((e.payload || {}).note || e.eventType)}
                  </div>
                ))}
            </div>
          </Card>
        ))}
        {goals.length === 0 ? <p className="text-sm text-muted-foreground">No goals yet.</p> : null}
      </div>
    </div>
  );
}
