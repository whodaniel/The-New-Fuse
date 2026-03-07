import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/providers/AuthProvider';
import {
  createPlan,
  createTimelineEvent,
  linkPlan,
  listGoals,
  listPlans,
  listTimelineEvents,
  type GoalRecord,
  type ProjectPlanRecord,
  type TimelineEvent,
} from '@/services/unifiedLedgerApi';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function PlansPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<ProjectPlanRecord[]>([]);
  const [goals, setGoals] = useState<GoalRecord[]>([]);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [name, setName] = useState('');
  const [objective, setObjective] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [eventNote, setEventNote] = useState('');
  const [eventAt, setEventAt] = useState('');
  const [linkPlanId, setLinkPlanId] = useState('');
  const [linkGoalId, setLinkGoalId] = useState('');
  const owner = user?.id || 'ui-user';

  const load = async () => {
    try {
      const [planRows, goalRows, timelineRows] = await Promise.all([
        listPlans(owner),
        listGoals(owner),
        listTimelineEvents({ userId: owner }),
      ]);
      setPlans(planRows);
      setGoals(goalRows);
      setEvents(timelineRows.filter((e) => !!e.planId));
    } catch {
      toast.error('Failed to load plans');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onCreate = async () => {
    if (!name.trim()) return;
    try {
      await createPlan({ name, objective, owner });
      setName('');
      setObjective('');
      await load();
      toast.success('Plan created');
    } catch {
      toast.error('Failed to create plan');
    }
  };

  const onAddHistoricalEvent = async () => {
    if (!selectedPlanId || !eventNote.trim()) return;
    try {
      await createTimelineEvent({
        planId: selectedPlanId,
        eventType: 'historical_event',
        actor: owner,
        userId: owner,
        timestamp: eventAt ? new Date(eventAt).toISOString() : undefined,
        payload: { note: eventNote, source: 'plans-page' },
      });
      setEventNote('');
      setEventAt('');
      await load();
      toast.success('Historical event recorded');
    } catch {
      toast.error('Failed to record historical event');
    }
  };

  const onLinkPlanToGoal = async () => {
    if (!linkPlanId || !linkGoalId) return;
    try {
      await linkPlan(linkPlanId, { owner, goalId: linkGoalId, actor: owner });
      await load();
      toast.success('Plan linked to goal');
    } catch {
      toast.error('Failed to link plan to goal');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Project Plans</h1>
          <p className="text-muted-foreground">
            Primary project plans linked to goals and records.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/tasks">Tasks</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/goals">Goals</Link>
          </Button>
        </div>
      </div>

      <Card className="p-4 space-y-3">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Plan name" />
        <Textarea
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          rows={3}
          placeholder="Plan objective"
        />
        <Button onClick={onCreate}>Create Plan</Button>
      </Card>

      <Card className="p-4 space-y-3">
        <h2 className="text-lg font-semibold">Historical Chronology Entry</h2>
        <select
          className="h-10 w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
          value={selectedPlanId}
          onChange={(e) => setSelectedPlanId(e.target.value)}
        >
          <option value="">Select plan...</option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
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
        <h2 className="text-lg font-semibold">Link Plan to Goal</h2>
        <select
          className="h-10 w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
          value={linkPlanId}
          onChange={(e) => setLinkPlanId(e.target.value)}
        >
          <option value="">Select plan...</option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          className="h-10 w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
          value={linkGoalId}
          onChange={(e) => setLinkGoalId(e.target.value)}
        >
          <option value="">Select goal...</option>
          {goals.map((g) => (
            <option key={g.id} value={g.id}>
              {g.title}
            </option>
          ))}
        </select>
        <Button onClick={onLinkPlanToGoal}>Link</Button>
      </Card>

      <div className="space-y-3">
        {plans.map((p) => (
          <Card key={p.id} className="p-4">
            <Link
              to={`/plans/${p.id}`}
              className="font-semibold underline-offset-2 hover:underline"
            >
              {p.name}
            </Link>
            <div className="text-sm text-muted-foreground">{p.objective}</div>
            <div className="text-xs text-muted-foreground mt-2">
              status: {p.status} | linked goals: {p.linkedGoalIds.length} | linked records:{' '}
              {p.linkedRecordIds.length}
            </div>
            <div className="mt-2 space-y-1">
              {events
                .filter((e) => e.planId === p.id)
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
        {plans.length === 0 ? <p className="text-sm text-muted-foreground">No plans yet.</p> : null}
      </div>
    </div>
  );
}
