import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  addFeedbackIteration,
  createGoal,
  createPlan,
  getRecordConnections,
  getTask,
  linkGoalToRecord,
  linkPlan,
  listGoals,
  listPlans,
  listTimelineEvents,
  updateTask,
  type GoalRecord,
  type LedgerRecord,
  type ProjectPlanRecord,
  type TimelineEvent,
} from '@/services/unifiedLedgerApi';

const TaskDetail: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [row, setRow] = useState<LedgerRecord | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [goals, setGoals] = useState<GoalRecord[]>([]);
  const [plans, setPlans] = useState<ProjectPlanRecord[]>([]);
  const [connectedGoals, setConnectedGoals] = useState<GoalRecord[]>([]);
  const [connectedPlans, setConnectedPlans] = useState<ProjectPlanRecord[]>([]);
  const [note, setNote] = useState('');
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [planName, setPlanName] = useState('');
  const [planObjective, setPlanObjective] = useState('');
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');

  const load = async () => {
    try {
      const [task, events, allGoals, allPlans, connections] = await Promise.all([
        getTask(id),
        listTimelineEvents({ recordId: id }),
        listGoals(),
        listPlans(),
        getRecordConnections(id),
      ]);
      setRow(task);
      setTimeline(events);
      setGoals(allGoals);
      setPlans(allPlans);
      setConnectedGoals(connections.goals || []);
      setConnectedPlans(connections.plans || []);
    } catch {
      toast.error('Failed to load task');
    }
  };

  useEffect(() => {
    if (id) load();
  }, [id]);

  const updateStatus = async (status: LedgerRecord['status']) => {
    try {
      await updateTask(id, { status, metadata: { actor: 'ui-user' } });
      await load();
      toast.success(`Task status set to ${status}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const saveNote = async () => {
    if (!note.trim()) return;
    try {
      await addFeedbackIteration(id, {
        hypothesis: `Execution note for task ${id}`,
        evidence: [note],
        confidence: 0.75,
        accepted: true,
        notes: 'Captured from task detail note panel',
      });
      setNote('');
      await load();
      toast.success('Note saved as feedback iteration');
    } catch {
      toast.error('Failed to save note');
    }
  };

  const onCreateGoal = async () => {
    if (!row || !goalTitle.trim()) return;
    try {
      await createGoal({
        title: goalTitle,
        description: goalDescription || `Goal derived from task ${row.id}`,
        owner: 'ui-user',
        linkedRecordIds: [row.id],
      });
      setGoalTitle('');
      setGoalDescription('');
      await load();
      toast.success('Goal created and linked');
    } catch {
      toast.error('Failed to create goal');
    }
  };

  const onCreatePlan = async () => {
    if (!row || !planName.trim()) return;
    try {
      await createPlan({
        name: planName,
        objective: planObjective || `Plan derived from task ${row.id}`,
        owner: 'ui-user',
        linkedRecordIds: [row.id],
        linkedGoalIds: selectedGoalId ? [selectedGoalId] : [],
      });
      setPlanName('');
      setPlanObjective('');
      await load();
      toast.success('Plan created');
    } catch {
      toast.error('Failed to create plan');
    }
  };

  const onLinkExistingGoal = async () => {
    if (!row || !selectedGoalId) return;
    try {
      await linkGoalToRecord(selectedGoalId, row.id);
      await load();
      toast.success('Goal linked');
    } catch {
      toast.error('Failed to link goal');
    }
  };

  const onLinkExistingPlan = async () => {
    if (!row || !selectedPlanId) return;
    try {
      await linkPlan(selectedPlanId, { recordId: row.id, goalId: selectedGoalId || undefined });
      await load();
      toast.success('Plan linked');
    } catch {
      toast.error('Failed to link plan');
    }
  };

  if (!row) {
    return <div className="max-w-5xl mx-auto">Loading task...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/tasks')} className="mr-4">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Task Detail</h1>
          <p className="text-muted-foreground">Unified record {row.id}</p>
        </div>
      </div>

      <Card className="p-6 mb-6">
        <h2 className="text-2xl font-bold">{row.title}</h2>
        <p className="mt-2 text-muted-foreground whitespace-pre-line">{row.description}</p>
        <div className="flex gap-2 mt-4">
          <Badge>{row.status}</Badge>
          <Badge variant="outline">Priority: {row.priority}</Badge>
        </div>
        <div className="flex gap-2 mt-4">
          <Button size="sm" variant="outline" onClick={() => updateStatus('in_progress')}>
            Mark In Progress
          </Button>
          <Button size="sm" variant="outline" onClick={() => updateStatus('under_review')}>
            Send To Review
          </Button>
          <Button size="sm" onClick={() => updateStatus('completed')}>
            Complete
          </Button>
        </div>
      </Card>

      <Card className="p-6 mb-6">
        <h3 className="text-lg font-semibold mb-3">Task Notes</h3>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} placeholder="Add execution note" />
        <Button className="mt-3" onClick={saveNote}>
          <MessageSquare className="h-4 w-4 mr-2" /> Save Note
        </Button>
      </Card>

      <Card className="p-6 mt-6">
        <h3 className="text-lg font-semibold mb-3">Goals and Project Plans</h3>
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-sm font-medium mb-2">Connected Goals</div>
            <div className="space-y-1">
              {connectedGoals.length === 0 ? (
                <p className="text-sm text-muted-foreground">No goals linked.</p>
              ) : (
                connectedGoals.map((g) => (
                  <div key={g.id} className="text-sm border rounded px-2 py-1">
                    {g.title}
                  </div>
                ))
              )}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium mb-2">Connected Plans</div>
            <div className="space-y-1">
              {connectedPlans.length === 0 ? (
                <p className="text-sm text-muted-foreground">No plans linked.</p>
              ) : (
                connectedPlans.map((p) => (
                  <div key={p.id} className="text-sm border rounded px-2 py-1">
                    {p.name}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Input value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} placeholder="New goal title" />
            <Textarea rows={3} value={goalDescription} onChange={(e) => setGoalDescription(e.target.value)} placeholder="Goal description" />
            <Button onClick={onCreateGoal}>Create Goal</Button>
          </div>
          <div className="space-y-2">
            <Input value={planName} onChange={(e) => setPlanName(e.target.value)} placeholder="New project plan name" />
            <Textarea rows={3} value={planObjective} onChange={(e) => setPlanObjective(e.target.value)} placeholder="Plan objective" />
            <Button onClick={onCreatePlan}>Create Plan</Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <select className="h-10 w-full px-3 py-2 rounded-md border border-input bg-background text-sm" value={selectedGoalId} onChange={(e) => setSelectedGoalId(e.target.value)}>
              <option value="">Select existing goal...</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>{g.title}</option>
              ))}
            </select>
            <Button variant="outline" onClick={onLinkExistingGoal}>Link Existing Goal</Button>
          </div>
          <div className="space-y-2">
            <select className="h-10 w-full px-3 py-2 rounded-md border border-input bg-background text-sm" value={selectedPlanId} onChange={(e) => setSelectedPlanId(e.target.value)}>
              <option value="">Select existing plan...</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <Button variant="outline" onClick={onLinkExistingPlan}>Link Existing Plan</Button>
          </div>
        </div>
      </Card>

      <Card className="p-6 mt-6">
        <h3 className="text-lg font-semibold mb-3">Timeline</h3>
        <div className="space-y-2 max-h-80 overflow-auto">
          {timeline.length === 0 ? <p className="text-sm text-muted-foreground">No events yet.</p> : null}
          {timeline.map((event) => (
            <div key={event.id} className="border rounded p-2 text-sm">
              <div className="flex justify-between gap-2">
                <span className="font-medium">{event.eventType}</span>
                <span className="text-muted-foreground">{new Date(event.timestamp).toLocaleString()}</span>
              </div>
              <div className="text-muted-foreground">actor: {event.actor}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default TaskDetail;
