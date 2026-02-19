import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  addGoalMilestone,
  deleteGoalMilestone,
  getGoal,
  listRecords,
  listTimelineEvents,
  updateGoalMilestone,
  type GoalRecord,
  type LedgerRecord,
  type TimelineEvent,
} from '@/services/unifiedLedgerApi';

export default function GoalDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const [goal, setGoal] = useState<GoalRecord | null>(null);
  const [records, setRecords] = useState<LedgerRecord[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [title, setTitle] = useState('');
  const [dueAt, setDueAt] = useState('');

  const load = async () => {
    if (!id) return;
    try {
      const [goalRow, allRecords, events] = await Promise.all([
        getGoal(id),
        listRecords(),
        listTimelineEvents({ goalId: id }),
      ]);
      setGoal(goalRow);
      setTimeline(events);
      const linkedIds = new Set(goalRow?.linkedRecordIds || []);
      setRecords(allRecords.filter((r) => linkedIds.has(r.id)));
    } catch {
      toast.error('Failed to load goal detail');
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const graphRows = useMemo(
    () =>
      records.map((r) => ({
        id: `${id}->${r.id}`,
        left: goal?.title || 'Goal',
        right: `${r.kind}: ${r.title}`,
      })),
    [records, goal, id]
  );

  const onAddMilestone = async () => {
    if (!id || !title.trim()) return;
    try {
      await addGoalMilestone(id, {
        title,
        dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
      });
      setTitle('');
      setDueAt('');
      await load();
      toast.success('Milestone added');
    } catch {
      toast.error('Failed to add milestone');
    }
  };

  const onSetMilestoneStatus = async (
    milestoneId: string,
    status: 'pending' | 'in_progress' | 'completed' | 'blocked'
  ) => {
    if (!id) return;
    try {
      await updateGoalMilestone(id, milestoneId, { status });
      await load();
      toast.success(`Milestone set to ${status}`);
    } catch {
      toast.error('Failed to update milestone');
    }
  };

  const onDeleteMilestone = async (milestoneId: string) => {
    if (!id) return;
    try {
      await deleteGoalMilestone(id, milestoneId);
      await load();
      toast.success('Milestone removed');
    } catch {
      toast.error('Failed to remove milestone');
    }
  };

  if (!goal) {
    return <div className="max-w-6xl mx-auto">Loading goal...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{goal.title}</h1>
          <p className="text-muted-foreground">{goal.description}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/goals">Back to Goals</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/timeline">Timeline</Link>
          </Button>
        </div>
      </div>

      <Card className="p-4 space-y-2">
        <h2 className="text-lg font-semibold">Linked Record Graph</h2>
        {graphRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No linked records.</p>
        ) : (
          graphRows.map((row) => (
            <div key={row.id} className="grid grid-cols-[1fr_auto_1fr] gap-2 text-sm border rounded px-3 py-2">
              <div>{row.left}</div>
              <div className="text-muted-foreground">-&gt;</div>
              <div>{row.right}</div>
            </div>
          ))
        )}
      </Card>

      <Card className="p-4 space-y-3">
        <h2 className="text-lg font-semibold">Milestones</h2>
        <div className="grid md:grid-cols-[1fr_220px_auto] gap-2">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Milestone title" />
          <Input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
          <Button onClick={onAddMilestone}>Add</Button>
        </div>
        <div className="space-y-2">
          {goal.milestones.map((m) => (
            <div key={m.id} className="border rounded p-3 space-y-2">
              <div className="text-sm font-medium">{m.title}</div>
              <div className="text-xs text-muted-foreground">
                status: {m.status} | due: {m.dueAt ? new Date(m.dueAt).toLocaleString() : 'none'}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => onSetMilestoneStatus(m.id, 'in_progress')}>
                  In Progress
                </Button>
                <Button size="sm" variant="outline" onClick={() => onSetMilestoneStatus(m.id, 'completed')}>
                  Complete
                </Button>
                <Button size="sm" variant="outline" onClick={() => onSetMilestoneStatus(m.id, 'blocked')}>
                  Block
                </Button>
                <Button size="sm" variant="destructive" onClick={() => onDeleteMilestone(m.id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
          {goal.milestones.length === 0 ? (
            <p className="text-sm text-muted-foreground">No milestones yet.</p>
          ) : null}
        </div>
      </Card>

      <Card className="p-4 space-y-2">
        <h2 className="text-lg font-semibold">Timeline</h2>
        {timeline.length === 0 ? <p className="text-sm text-muted-foreground">No timeline events.</p> : null}
        {timeline.map((event) => (
          <div key={event.id} className="text-sm border rounded px-3 py-2">
            <div className="flex justify-between">
              <span className="font-medium">{event.eventType}</span>
              <span className="text-muted-foreground">{new Date(event.timestamp).toLocaleString()}</span>
            </div>
            <div className="text-xs text-muted-foreground">actor: {event.actor}</div>
          </div>
        ))}
      </Card>
    </div>
  );
}
