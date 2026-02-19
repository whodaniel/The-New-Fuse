import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, MessageSquare, ThumbsDown, ThumbsUp } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  addFeedbackIteration,
  createGoal,
  createPlan,
  getRecordConnections,
  getSuggestion,
  linkGoalToRecord,
  linkPlan,
  listGoals,
  listPlans,
  listTimelineEvents,
  voteSuggestion,
  type GoalRecord,
  type LedgerRecord,
  type ProjectPlanRecord,
  type TimelineEvent,
} from '@/services/unifiedLedgerApi';

const SuggestionDetail: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [row, setRow] = useState<LedgerRecord | null>(null);
  const [comment, setComment] = useState('');
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [goals, setGoals] = useState<GoalRecord[]>([]);
  const [plans, setPlans] = useState<ProjectPlanRecord[]>([]);
  const [connectedGoals, setConnectedGoals] = useState<GoalRecord[]>([]);
  const [connectedPlans, setConnectedPlans] = useState<ProjectPlanRecord[]>([]);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [planName, setPlanName] = useState('');
  const [planObjective, setPlanObjective] = useState('');
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');

  const load = async () => {
    try {
      const [suggestion, events, allGoals, allPlans, connections] = await Promise.all([
        getSuggestion(id),
        listTimelineEvents({ recordId: id }),
        listGoals(),
        listPlans(),
        getRecordConnections(id),
      ]);
      setRow(suggestion);
      setTimeline(events);
      setGoals(allGoals);
      setPlans(allPlans);
      setConnectedGoals(connections.goals || []);
      setConnectedPlans(connections.plans || []);
    } catch {
      toast.error('Failed to load suggestion');
    }
  };

  useEffect(() => {
    if (id) load();
  }, [id]);

  const onVote = async (direction: 'up' | 'down') => {
    try {
      await voteSuggestion(id, direction);
      await load();
    } catch {
      toast.error('Vote failed');
    }
  };

  const onCreateGoal = async () => {
    if (!row || !goalTitle.trim()) return;
    try {
      await createGoal({
        title: goalTitle,
        description: goalDescription || `Goal derived from suggestion ${row.id}`,
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
        objective: planObjective || `Plan derived from suggestion ${row.id}`,
        owner: 'ui-user',
        linkedRecordIds: [row.id],
        linkedGoalIds: selectedGoalId ? [selectedGoalId] : [],
      });
      setPlanName('');
      setPlanObjective('');
      await load();
      toast.success('Project plan created');
    } catch {
      toast.error('Failed to create plan');
    }
  };

  const onLinkExistingGoal = async () => {
    if (!row || !selectedGoalId) return;
    try {
      await linkGoalToRecord(selectedGoalId, row.id);
      await load();
      toast.success('Goal linked to this suggestion');
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
    return <div className="max-w-5xl mx-auto">Loading suggestion...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/suggestions')} className="mr-4">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Suggestion Detail</h1>
          <p className="text-muted-foreground">Unified ledger record {row.id}</p>
        </div>
      </div>

      <Card className="p-6 mb-6">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h2 className="text-2xl font-bold">{row.title}</h2>
            <p className="mt-2 text-muted-foreground whitespace-pre-line">{row.description}</p>
            <div className="flex gap-2 mt-4">
              <Badge>{row.status}</Badge>
              <Badge variant="outline">Priority: {row.priority}</Badge>
            </div>
          </div>
          <div className="text-sm text-right">
            <div>Up: {row.votes.up}</div>
            <div>Down: {row.votes.down}</div>
            <div>Net: {row.votes.up - row.votes.down}</div>
          </div>
        </div>

        <div className="flex gap-4 mt-4">
          <button className="flex items-center text-green-600" onClick={() => onVote('up')}>
            <ThumbsUp className="h-4 w-4 mr-1" /> Upvote
          </button>
          <button className="flex items-center text-red-600" onClick={() => onVote('down')}>
            <ThumbsDown className="h-4 w-4 mr-1" /> Downvote
          </button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-3">Discussion</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Comment capture can be persisted as iterative feedback entries.
        </p>
        <div className="space-y-3">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            placeholder="Add comment..."
          />
          <Button
            onClick={async () => {
              if (!row || !comment.trim()) return;
              try {
                await addFeedbackIteration(row.id, {
                  hypothesis: `Comment on suggestion ${row.id}`,
                  evidence: [comment],
                  confidence: 0.7,
                  accepted: true,
                  notes: 'Captured from suggestion detail discussion',
                });
                setComment('');
                await load();
                toast.success('Comment persisted as feedback iteration.');
              } catch {
                toast.error('Failed to persist comment.');
              }
            }}
          >
            <MessageSquare className="h-4 w-4 mr-2" /> Add Comment
          </Button>
        </div>
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
            <Input
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              placeholder="New goal title"
            />
            <Textarea
              rows={3}
              value={goalDescription}
              onChange={(e) => setGoalDescription(e.target.value)}
              placeholder="Goal description"
            />
            <Button onClick={onCreateGoal}>Create Goal</Button>
          </div>
          <div className="space-y-2">
            <Input
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder="New project plan name"
            />
            <Textarea
              rows={3}
              value={planObjective}
              onChange={(e) => setPlanObjective(e.target.value)}
              placeholder="Plan objective"
            />
            <Button onClick={onCreatePlan}>Create Plan</Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <select
              className="h-10 w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
              value={selectedGoalId}
              onChange={(e) => setSelectedGoalId(e.target.value)}
            >
              <option value="">Select existing goal...</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
            <Button variant="outline" onClick={onLinkExistingGoal}>
              Link Existing Goal
            </Button>
          </div>
          <div className="space-y-2">
            <select
              className="h-10 w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
            >
              <option value="">Select existing plan...</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <Button variant="outline" onClick={onLinkExistingPlan}>
              Link Existing Plan
            </Button>
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

export default SuggestionDetail;
