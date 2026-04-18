import { Button, Card } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import {
  getPlan,
  linkPlan,
  listGoals,
  listRecords,
  listTimelineEvents,
  type GoalRecord,
  type LedgerRecord,
  type ProjectPlanRecord,
  type TimelineEvent,
} from '@/services/unifiedLedgerApi';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useParams } from 'react-router-dom';

export default function PlanDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [plan, setPlan] = useState<ProjectPlanRecord | null>(null);
  const [goals, setGoals] = useState<GoalRecord[]>([]);
  const [allRecords, setAllRecords] = useState<LedgerRecord[]>([]);
  const [records, setRecords] = useState<LedgerRecord[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [selectedRecordId, setSelectedRecordId] = useState('');
  const owner = user?.id || 'ui-user';

  const load = async () => {
    if (!id) return;
    try {
      const [planRow, allGoals, allRecords, events] = await Promise.all([
        getPlan(id, owner),
        listGoals(owner),
        listRecords(),
        listTimelineEvents({ planId: id, userId: owner }),
      ]);
      setPlan(planRow);
      setGoals(allGoals);
      setAllRecords(allRecords);
      setTimeline(events);
      const linkedIds = new Set(planRow?.linkedRecordIds || []);
      setRecords(allRecords.filter((r) => linkedIds.has(r.id)));
    } catch {
      toast.error('Failed to load plan detail');
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const linkedGoals = useMemo(() => {
    const linked = new Set(plan?.linkedGoalIds || []);
    return goals.filter((g) => linked.has(g.id));
  }, [goals, plan]);

  const onLink = async () => {
    if (!id || (!selectedGoalId && !selectedRecordId)) return;
    try {
      await linkPlan(id, {
        owner,
        goalId: selectedGoalId || undefined,
        recordId: selectedRecordId || undefined,
        actor: owner,
      });
      await load();
      toast.success('Plan linkage updated');
    } catch {
      toast.error('Failed to link plan');
    }
  };

  if (!plan) return <div className="max-w-6xl mx-auto">Loading plan...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{plan.name}</h1>
          <p className="text-muted-foreground">{plan.objective}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/plans">Back to Plans</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/timeline">Timeline</Link>
          </Button>
        </div>
      </div>

      <Card className="p-4 space-y-2">
        <h2 className="text-lg font-semibold">Plan Graph</h2>
        <div className="space-y-2">
          {linkedGoals.map((g) => (
            <div
              key={`goal-${g.id}`}
              className="grid grid-cols-[1fr_auto_1fr] gap-2 text-sm border rounded px-3 py-2"
            >
              <div>{plan.name}</div>
              <div className="text-muted-foreground">-&gt;</div>
              <div>Goal: {g.title}</div>
            </div>
          ))}
          {records.map((r) => (
            <div
              key={`record-${r.id}`}
              className="grid grid-cols-[1fr_auto_1fr] gap-2 text-sm border rounded px-3 py-2"
            >
              <div>{plan.name}</div>
              <div className="text-muted-foreground">-&gt;</div>
              <div>
                {r.kind}: {r.title}
              </div>
            </div>
          ))}
          {linkedGoals.length === 0 && records.length === 0 ? (
            <p className="text-sm text-muted-foreground">No links yet.</p>
          ) : null}
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <h2 className="text-lg font-semibold">Add Link</h2>
        <div className="grid md:grid-cols-2 gap-2">
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
          <select
            className="h-10 w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
            value={selectedRecordId}
            onChange={(e) => setSelectedRecordId(e.target.value)}
          >
            <option value="">Select record...</option>
            {allRecords.map((r) => (
              <option key={r.id} value={r.id}>
                {r.kind}: {r.title}
              </option>
            ))}
          </select>
        </div>
        <Button onClick={onLink}>Link To Plan</Button>
      </Card>

      <Card className="p-4 space-y-2">
        <h2 className="text-lg font-semibold">Timeline</h2>
        {timeline.length === 0 ? (
          <p className="text-sm text-muted-foreground">No timeline events.</p>
        ) : null}
        {timeline.map((event) => (
          <div key={event.id} className="text-sm border rounded px-3 py-2">
            <div className="flex justify-between">
              <span className="font-medium">{event.eventType}</span>
              <span className="text-muted-foreground">
                {new Date(event.timestamp).toLocaleString()}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">actor: {event.actor}</div>
          </div>
        ))}
      </Card>
    </div>
  );
}
