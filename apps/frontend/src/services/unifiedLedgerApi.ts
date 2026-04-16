export type LedgerStatus =
  | 'submitted'
  | 'queued'
  | 'in_progress'
  | 'under_review'
  | 'completed'
  | 'failed'
  | 'rejected'
  | 'archived';

export interface LedgerRecord {
  id: string;
  kind: 'task' | 'suggestion' | 'review' | 'insight';
  title: string;
  description: string;
  status: LedgerStatus;
  priority: 'low' | 'medium' | 'high' | 'critical' | 'urgent';
  owner: string;
  assignee?: string;
  tags: string[];
  votes: { up: number; down: number };
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
  fractal?: {
    progressPercent?: number;
    rhythmBpm?: number;
  };
}

export interface TimelineEvent {
  id: string;
  userId?: string;
  recordId?: string;
  goalId?: string;
  planId?: string;
  eventType: string;
  actor: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

export interface TaskExecutionLogEntry {
  id: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  actor: string;
  source: string;
  stage?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface GoalRecord {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  owner: string;
  linkedRecordIds: string[];
  milestones: Array<{
    id: string;
    title: string;
    dueAt?: string;
    status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectPlanRecord {
  id: string;
  name: string;
  objective: string;
  owner: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  linkedGoalIds: string[];
  linkedRecordIds: string[];
  cadence: {
    cycleDays: number;
    reviewBpm: number;
    progressPercent: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface RecordConnections {
  goals: GoalRecord[];
  plans: ProjectPlanRecord[];
}



const JSON_HEADERS = { 'Content-Type': 'application/json' };

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') {
    return {};
  }

  const token =
    localStorage.getItem('auth_token') ||
    localStorage.getItem('accessToken') ||
    localStorage.getItem('token');

  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const authHeaders = getAuthHeaders();
  const mergedHeaders = {
    ...authHeaders,
    ...(init?.headers as Record<string, string> | undefined),
  };

  return fetch(input, {
    ...init,
    headers: mergedHeaders,
    credentials: 'include',
  });
}

async function parse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed with ${res.status}`);
  }
  return res.json();
}

export async function listTasks(): Promise<LedgerRecord[]> {
  return parse<LedgerRecord[]>(await apiFetch('/api/unified-ledger/tasks'));
}

export async function listRecords(params?: {
  kind?: LedgerRecord['kind'];
  status?: LedgerStatus;
  q?: string;
}): Promise<LedgerRecord[]> {
  const search = new URLSearchParams();
  if (params?.kind) search.set('kind', params.kind);
  if (params?.status) search.set('status', params.status);
  if (params?.q) search.set('q', params.q);
  const suffix = search.toString() ? `?${search.toString()}` : '';
  return parse<LedgerRecord[]>(await apiFetch(`/api/unified-ledger/records${suffix}`));
}

export async function getRecordConnections(
  recordId: string,
  owner?: string
): Promise<RecordConnections> {
  const suffix = owner ? `?owner=${encodeURIComponent(owner)}` : '';
  return parse<RecordConnections>(
    await apiFetch(`/api/unified-ledger/records/${recordId}/connections${suffix}`)
  );
}

export async function getTask(id: string): Promise<LedgerRecord | null> {
  return parse<LedgerRecord | null>(await apiFetch(`/api/unified-ledger/tasks/${id}`));
}

export async function createTask(input: Partial<LedgerRecord>): Promise<LedgerRecord> {
  return parse<LedgerRecord>(
    await apiFetch('/api/unified-ledger/tasks', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(input),
    })
  );
}

export async function updateTask(id: string, patch: Partial<LedgerRecord>): Promise<LedgerRecord> {
  return parse<LedgerRecord>(
    await apiFetch(`/api/unified-ledger/tasks/${id}`, {
      method: 'PATCH',
      headers: JSON_HEADERS,
      body: JSON.stringify(patch),
    })
  );
}



export async function listSuggestions(): Promise<LedgerRecord[]> {
  return parse<LedgerRecord[]>(await apiFetch('/api/suggestions'));
}

export async function getSuggestion(id: string): Promise<LedgerRecord | null> {
  return parse<LedgerRecord | null>(await apiFetch(`/api/suggestions/${id}`));
}

export async function createSuggestion(input: Partial<LedgerRecord>): Promise<LedgerRecord> {
  return parse<LedgerRecord>(
    await apiFetch('/api/suggestions', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(input),
    })
  );
}

export async function voteSuggestion(
  id: string,
  direction: 'up' | 'down'
): Promise<LedgerRecord | null> {
  return parse<LedgerRecord | null>(
    await apiFetch(`/api/suggestions/${id}/vote`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ direction }),
    })
  );
}

export async function listTimelineEvents(params?: {
  userId?: string;
  recordId?: string;
  goalId?: string;
  planId?: string;
  eventType?: string;
  actor?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<TimelineEvent[]> {
  const search = new URLSearchParams();
  if (params?.userId) search.set('userId', params.userId);
  if (params?.recordId) search.set('recordId', params.recordId);
  if (params?.goalId) search.set('goalId', params.goalId);
  if (params?.planId) search.set('planId', params.planId);
  if (params?.eventType) search.set('eventType', params.eventType);
  if (params?.actor) search.set('actor', params.actor);
  if (params?.dateFrom) search.set('dateFrom', params.dateFrom);
  if (params?.dateTo) search.set('dateTo', params.dateTo);
  const suffix = search.toString() ? `?${search.toString()}` : '';
  return parse<TimelineEvent[]>(await apiFetch(`/api/timeline/events${suffix}`));
}

export async function getTimelineEvent(id: string, userId?: string): Promise<TimelineEvent | null> {
  void userId;
  return parse<TimelineEvent | null>(await apiFetch(`/api/timeline/events/${id}`));
}

export async function createTimelineEvent(input: {
  userId?: string;
  recordId?: string;
  goalId?: string;
  planId?: string;
  eventType?: string;
  actor?: string;
  timestamp?: string;
  payload?: Record<string, unknown>;
}): Promise<TimelineEvent> {
  return parse<TimelineEvent>(
    await apiFetch('/api/timeline/events', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(input),
    })
  );
}

export async function updateTimelineEvent(
  id: string,
  input: { userId?: string; actor?: string; timestamp?: string; payload?: Record<string, unknown> }
): Promise<TimelineEvent | null> {
  return parse<TimelineEvent | null>(
    await apiFetch(`/api/timeline/events/${id}`, {
      method: 'PATCH',
      headers: JSON_HEADERS,
      body: JSON.stringify(input),
    })
  );
}

export async function deleteTimelineEvent(id: string, userId?: string): Promise<boolean> {
  void userId;
  return parse<boolean>(
    await apiFetch(`/api/timeline/events/${id}`, {
      method: 'DELETE',
    })
  );
}

export async function bootstrapPersonalTimeline(): Promise<{
  message: string;
  createdCount: number;
  totalCount: number;
  events: TimelineEvent[];
}> {
  return parse<{
    message: string;
    createdCount: number;
    totalCount: number;
    events: TimelineEvent[];
  }>(
    await apiFetch('/api/timeline/personal/bootstrap', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({}),
    })
  );
}

export async function createGoal(input: {
  title: string;
  description: string;
  owner?: string;
  linkedRecordIds?: string[];
}): Promise<GoalRecord> {
  return parse<GoalRecord>(
    await apiFetch('/api/goals', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(input),
    })
  );
}

export async function listGoals(owner?: string): Promise<GoalRecord[]> {
  const suffix = owner ? `?owner=${encodeURIComponent(owner)}` : '';
  return parse<GoalRecord[]>(await apiFetch(`/api/goals${suffix}`));
}

export async function getGoal(id: string, owner?: string): Promise<GoalRecord | null> {
  const suffix = owner ? `?owner=${encodeURIComponent(owner)}` : '';
  return parse<GoalRecord | null>(await apiFetch(`/api/goals/${id}${suffix}`));
}

export async function linkGoalToRecord(
  goalId: string,
  recordId: string,
  actor = 'ui-user',
  owner?: string
): Promise<GoalRecord | null> {
  return parse<GoalRecord | null>(
    await apiFetch(`/api/goals/${goalId}/link-record`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ recordId, actor, owner }),
    })
  );
}

export async function addGoalMilestone(
  goalId: string,
  input: {
    owner?: string;
    title: string;
    dueAt?: string;
    status?: 'pending' | 'in_progress' | 'completed' | 'blocked';
  }
): Promise<GoalRecord | null> {
  return parse<GoalRecord | null>(
    await apiFetch(`/api/goals/${goalId}/milestones`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(input),
    })
  );
}

export async function updateGoalMilestone(
  goalId: string,
  milestoneId: string,
  input: {
    owner?: string;
    title?: string;
    dueAt?: string;
    status?: 'pending' | 'in_progress' | 'completed' | 'blocked';
  }
): Promise<GoalRecord | null> {
  return parse<GoalRecord | null>(
    await apiFetch(`/api/goals/${goalId}/milestones/${milestoneId}`, {
      method: 'PATCH',
      headers: JSON_HEADERS,
      body: JSON.stringify(input),
    })
  );
}

export async function deleteGoalMilestone(
  goalId: string,
  milestoneId: string,
  owner?: string
): Promise<GoalRecord | null> {
  const suffix = owner ? `?owner=${encodeURIComponent(owner)}` : '';
  return parse<GoalRecord | null>(
    await apiFetch(`/api/goals/${goalId}/milestones/${milestoneId}${suffix}`, {
      method: 'DELETE',
    })
  );
}

export async function createPlan(input: {
  name: string;
  objective: string;
  owner?: string;
  linkedGoalIds?: string[];
  linkedRecordIds?: string[];
  cadence?: { cycleDays?: number; reviewBpm?: number; progressPercent?: number };
}): Promise<ProjectPlanRecord> {
  return parse<ProjectPlanRecord>(
    await apiFetch('/api/plans', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(input),
    })
  );
}

export async function listPlans(owner?: string): Promise<ProjectPlanRecord[]> {
  const suffix = owner ? `?owner=${encodeURIComponent(owner)}` : '';
  return parse<ProjectPlanRecord[]>(await apiFetch(`/api/plans${suffix}`));
}

export async function getPlan(id: string, owner?: string): Promise<ProjectPlanRecord | null> {
  const suffix = owner ? `?owner=${encodeURIComponent(owner)}` : '';
  return parse<ProjectPlanRecord | null>(await apiFetch(`/api/plans/${id}${suffix}`));
}

export async function linkPlan(
  planId: string,
  input: { owner?: string; goalId?: string; recordId?: string; actor?: string }
): Promise<ProjectPlanRecord | null> {
  return parse<ProjectPlanRecord | null>(
    await apiFetch(`/api/plans/${planId}/link`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(input),
    })
  );
}

export async function addFeedbackIteration(
  recordId: string,
  input: {
    hypothesis: string;
    evidence: string[];
    confidence: number;
    accepted: boolean;
    notes?: string;
  }
): Promise<LedgerRecord | null> {
  return parse<LedgerRecord | null>(
    await apiFetch(`/api/unified-ledger/records/${recordId}/feedback`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(input),
    })
  );
}

export async function getTaskExecutionLogs(
  taskId: string
): Promise<{ taskId: string; logs: TaskExecutionLogEntry[]; count: number }> {
  return parse<{ taskId: string; logs: TaskExecutionLogEntry[]; count: number }>(
    await apiFetch(`/api/tasks/${taskId}/execution-logs`)
  );
}

export async function appendTaskExecutionLog(
  taskId: string,
  input: {
    level: 'info' | 'warn' | 'error';
    message: string;
    actor: string;
    source: string;
    stage?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<{ taskId: string; logs: TaskExecutionLogEntry[]; count: number }> {
  return parse<{ taskId: string; logs: TaskExecutionLogEntry[]; count: number }>(
    await apiFetch(`/api/tasks/${taskId}/execution-logs`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(input),
    })
  );
}


