import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/providers/AuthProvider';
import {
  appendTaskExecutionLog,
  createGoal,
  createPlan,
  getRecordConnections,
  getTask,
  getTaskExecutionLogs,
  linkGoalToRecord,
  linkPlan,
  listGoals,
  listPlans,
  listTimelineEvents,
  listTaskExecutionLogs,
  updateTask,
  type GoalRecord,
  type LedgerRecord,
  type ProjectPlanRecord,
  type TaskExecutionLogEntry,
  type TimelineEvent,
} from '@/services/unifiedLedgerApi';
import { ChevronLeft, MessageSquare } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';

const TaskDetail: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [row, setRow] = useState<LedgerRecord | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [executionLogs, setExecutionLogs] = useState<TaskExecutionLogEntry[]>([]);
  const [goals, setGoals] = useState<GoalRecord[]>([]);
  const [plans, setPlans] = useState<ProjectPlanRecord[]>([]);
  const [connectedGoals, setConnectedGoals] = useState<GoalRecord[]>([]);
  const [connectedPlans, setConnectedPlans] = useState<ProjectPlanRecord[]>([]);
  const [note, setNote] = useState('');
  const initialLogLevel = (() => {
    const value = searchParams.get('logLevel');
    return value === 'info' || value === 'warn' || value === 'error' ? value : 'all';
  })();
  const initialLogSource = searchParams.get('logSource') || 'all';
  const initialLogStage = searchParams.get('logStage') || 'all';
  const initialLogQuery = searchParams.get('logQuery') || '';
  const initialActivePreset = (() => {
    const value = searchParams.get('logPreset');
    if (
      value === 'all' ||
      value === 'errors' ||
      value === 'router' ||
      value === 'dispatch' ||
      value === 'worker_execution' ||
      value === 'custom'
    ) {
      return value as LogPreset;
    }
    const hasCustomFilters =
      initialLogLevel !== 'all' ||
      initialLogSource !== 'all' ||
      initialLogStage !== 'all' ||
      initialLogQuery.trim().length > 0;
    return hasCustomFilters ? 'custom' : 'all';
  })();
  const [activeLogPreset, setActiveLogPreset] = useState<LogPreset>(initialActivePreset);
  const [logLevelFilter, setLogLevelFilter] = useState<'all' | 'info' | 'warn' | 'error'>(
    initialLogLevel
  );
  const [logSourceFilter, setLogSourceFilter] = useState(initialLogSource);
  const [logStageFilter, setLogStageFilter] = useState(initialLogStage);
  const [logQuery, setLogQuery] = useState(initialLogQuery);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [planName, setPlanName] = useState('');
  const [planObjective, setPlanObjective] = useState('');
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const owner = user?.id || 'ui-user';

  const load = async () => {
    try {
      const [task, events, allGoals, allPlans, connections, executionLogResponse] =
        await Promise.all([
          getTask(id),
          listTimelineEvents({ recordId: id }),
          listGoals(owner),
          listPlans(owner),
          getRecordConnections(id, owner),
          getTaskExecutionLogs(id).catch(() => ({ taskId: id, logs: [], count: 0 })),
        ]);
      setRow(task);
      setTimeline(events);
      setGoals(allGoals);
      setPlans(allPlans);
      setConnectedGoals(connections.goals || []);
      setConnectedPlans(connections.plans || []);
      setExecutionLogs(executionLogResponse.logs || []);
    } catch {
      toast.error('Failed to load task');
    }
  };

  useEffect(() => {
    if (id) load();
  }, [id]);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);

    if (activeLogPreset !== 'all') next.set('logPreset', activeLogPreset);
    else next.delete('logPreset');

    if (logLevelFilter !== 'all') next.set('logLevel', logLevelFilter);
    else next.delete('logLevel');

    if (logSourceFilter !== 'all') next.set('logSource', logSourceFilter);
    else next.delete('logSource');

    if (logStageFilter !== 'all') next.set('logStage', logStageFilter);
    else next.delete('logStage');

    const trimmedQuery = logQuery.trim();
    if (trimmedQuery) next.set('logQuery', trimmedQuery);
    else next.delete('logQuery');

    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [
    activeLogPreset,
    logLevelFilter,
    logSourceFilter,
    logStageFilter,
    logQuery,
    searchParams,
    setSearchParams,
  ]);

  const updateStatus = async (status: LedgerRecord['status']) => {
    try {
      await updateTask(id, { status, metadata: { actor: owner } });
      await load();
      toast.success(`Task status set to ${status}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const saveNote = async () => {
    if (!note.trim()) return;
    try {
      await appendTaskExecutionLog(id, {
        level: 'info',
        message: note,
        actor: owner,
        source: 'task-detail-ui',
        stage: 'note_capture',
        metadata: {
          panel: 'task_detail',
        },
      });
      setNote('');
      await load();
      toast.success('Note saved to execution log');
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
        owner,
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
        owner,
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
      await linkGoalToRecord(selectedGoalId, row.id, owner, owner);
      await load();
      toast.success('Goal linked');
    } catch {
      toast.error('Failed to link goal');
    }
  };

  const onLinkExistingPlan = async () => {
    if (!row || !selectedPlanId) return;
    try {
      await linkPlan(selectedPlanId, {
        owner,
        recordId: row.id,
        goalId: selectedGoalId || undefined,
        actor: owner,
      });
      await load();
      toast.success('Plan linked');
    } catch {
      toast.error('Failed to link plan');
    }
  };

  const applyLogPreset = (
    preset: 'all' | 'errors' | 'router' | 'dispatch' | 'worker_execution'
  ) => {
    setActiveLogPreset(preset);
    if (preset === 'all') {
      setLogLevelFilter('all');
      setLogSourceFilter('all');
      setLogStageFilter('all');
      setLogQuery('');
      return;
    }
    if (preset === 'errors') {
      setLogLevelFilter('error');
      setLogSourceFilter('all');
      setLogStageFilter('all');
      setLogQuery('');
      return;
    }
    if (preset === 'router') {
      setLogLevelFilter('all');
      setLogSourceFilter('workflow-engine.router');
      setLogStageFilter('all');
      setLogQuery('');
      return;
    }
    if (preset === 'dispatch') {
      setLogLevelFilter('all');
      setLogSourceFilter('all');
      setLogStageFilter('dispatch');
      setLogQuery('');
      return;
    }
    setLogLevelFilter('all');
    setLogSourceFilter('workflow-worker');
    setLogStageFilter('execute_node');
    setLogQuery('');
  };

  const onChangeLogLevelFilter = (value: 'all' | 'info' | 'warn' | 'error') => {
    setActiveLogPreset('custom');
    setLogLevelFilter(value);
  };

  const onChangeLogSourceFilter = (value: string) => {
    setActiveLogPreset('custom');
    setLogSourceFilter(value);
  };

  const onChangeLogStageFilter = (value: string) => {
    setActiveLogPreset('custom');
    setLogStageFilter(value);
  };

  const onChangeLogQuery = (value: string) => {
    setActiveLogPreset('custom');
    setLogQuery(value);
  };

  if (!row) {
    return <div className="max-w-5xl mx-auto">Loading task...</div>;
  }

  const availableSources = Array.from(
    new Set(executionLogs.map((log) => log.source).filter(Boolean))
  );
  const availableStages = Array.from(
    new Set(executionLogs.map((log) => log.stage).filter((stage): stage is string => Boolean(stage)))
  );
  const filteredExecutionLogs = executionLogs.filter((log) => {
    if (logLevelFilter !== 'all' && log.level !== logLevelFilter) return false;
    if (logSourceFilter !== 'all' && log.source !== logSourceFilter) return false;
    if (logStageFilter !== 'all' && (log.stage || 'none') !== logStageFilter) return false;
    if (logQuery.trim()) {
      const q = logQuery.trim().toLowerCase();
      const haystack = `${log.message} ${log.actor} ${log.source} ${log.stage || ''}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/tasks')} className="mr-4">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Task Detail</h1>
          <p className="text-muted-foreground">Unified record {row.id}</p>
        </div>
      </div>

      <Card className="p-4 mb-6">
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

      <Card className="p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3">Task Notes</h3>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          placeholder="Add execution note"
        />
        <Button className="mt-3" onClick={saveNote}>
          <MessageSquare className="h-4 w-4 mr-2" /> Save Note
        </Button>
        <div className="mt-4 space-y-2 max-h-52 overflow-auto">
          {executionLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No execution logs yet.</p>
          ) : (
            executionLogs.map((entry) => (
              <div key={entry.id} className="border rounded p-2 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="font-medium">{entry.level.toUpperCase()}</span>
                  <span className="text-muted-foreground">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="mt-1">{entry.message}</p>
                <div className="text-muted-foreground">
                  actor: {entry.actor} | source: {entry.source}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card className="p-4 mt-6">
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

      <Card className="p-4 mt-6">
        <h3 className="text-lg font-semibold mb-3">Timeline</h3>
        <div className="space-y-2 max-h-80 overflow-auto">
          {timeline.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events yet.</p>
          ) : null}
          {timeline.map((event) => (
            <div key={event.id} className="border rounded p-2 text-sm">
              <div className="flex justify-between gap-2">
                <span className="font-medium">{event.eventType}</span>
                <span className="text-muted-foreground">
                  {new Date(event.timestamp).toLocaleString()}
                </span>
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
