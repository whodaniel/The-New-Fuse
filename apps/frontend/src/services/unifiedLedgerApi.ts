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

export interface GithubTimelineImportResult {
  message: string;
  importedCount: number;
  skippedCount: number;
  removedCount: number;
  trackSummaries: Array<{ timelineId: string; total: number; imported: number; skipped: number }>;
  connectionCount: number;
  matchedConnectionCount: number;
  totalCount: number;
  generatedAt: string | null;
}

export interface GithubNarrativeGraphNode {
  id: string;
  label: string;
  kind: 'repo' | 'reference';
  tracks: string[];
  projects: string[];
  eventCount: number;
}

export interface GithubNarrativeGraphEdge {
  from: string;
  to: string;
  connectionType: string;
  weight: number;
  rationale?: string;
  strength: string;
}

export interface GithubNarrativeGraphResult {
  ownerUserId: string | null;
  eventCount: number;
  nodeCount: number;
  edgeCount: number;
  generatedAt: string | null;
  nodes: GithubNarrativeGraphNode[];
  edges: GithubNarrativeGraphEdge[];
}

export interface RecordConnections {
  goals: GoalRecord[];
  plans: ProjectPlanRecord[];
}

const JSON_HEADERS = { 'Content-Type': 'application/json' };
const TIMELINE_API_BASES = ['/api/unified-ledger/timeline', '/api/timeline'] as const;
const RECORD_API_BASES = [
  '/api/unified-ledger/records',
  '/api/unified-ledger/unified-ledger/records',
] as const;
const GOAL_API_BASES = ['/api/unified-ledger/goals', '/api/goals'] as const;
const PLAN_API_BASES = ['/api/unified-ledger/plans', '/api/plans'] as const;

function shouldFallbackRoute(status: number): boolean {
  return status === 404 || status === 405 || status === 502 || status === 503 || status === 504;
}

async function apiFetchWithFallback(pathCandidates: readonly string[], init?: RequestInit): Promise<Response> {
  if (pathCandidates.length === 0) {
    throw new Error('No API path candidates provided');
  }

  const [primaryPath, ...fallbackPaths] = pathCandidates;
  const primaryResponse = await apiFetch(primaryPath, init);
  if (primaryResponse.ok || !shouldFallbackRoute(primaryResponse.status)) {
    return primaryResponse;
  }

  for (const fallbackPath of fallbackPaths) {
    const fallbackResponse = await apiFetch(fallbackPath, init);
    if (fallbackResponse.ok || !shouldFallbackRoute(fallbackResponse.status)) {
      return fallbackResponse;
    }
  }

  return primaryResponse;
}

async function timelineApiFetch(path: string, init?: RequestInit): Promise<Response> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const candidates = TIMELINE_API_BASES.map((base) => `${base}${normalizedPath}`);
  return apiFetchWithFallback(candidates, init);
}

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') {
    return {};
  }

  const token =
    localStorage.getItem('auth_token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('accessToken') ||
    localStorage.getItem('token') ||
    localStorage.getItem('AUTH_TOKEN') ||
    sessionStorage.getItem('auth_token') ||
    sessionStorage.getItem('authToken') ||
    sessionStorage.getItem('accessToken') ||
    sessionStorage.getItem('token') ||
    sessionStorage.getItem('AUTH_TOKEN');

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

function unwrapEnvelope<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const candidate = (payload as Record<string, unknown>).data;
    if (candidate !== undefined) {
      return candidate as T;
    }
  }
  return payload as T;
}

function unwrapArrayPayload<T>(payload: unknown, keys: string[] = []): T[] {
  if (Array.isArray(payload)) return payload as T[];

  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const record = payload as Record<string, unknown>;

    for (const key of keys) {
      const candidate = record[key];
      if (Array.isArray(candidate)) return candidate as T[];
    }

    const data = record.data;
    if (Array.isArray(data)) return data as T[];
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      for (const key of keys) {
        const candidate = (data as Record<string, unknown>)[key];
        if (Array.isArray(candidate)) return candidate as T[];
      }
    }
  }

  return [];
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
  const candidates = RECORD_API_BASES.map((base) => `${base}${suffix}`);
  return parse<LedgerRecord[]>(await apiFetchWithFallback(candidates));
}

export async function getRecordConnections(
  recordId: string,
  owner?: string
): Promise<RecordConnections> {
  const suffix = owner ? `?owner=${encodeURIComponent(owner)}` : '';
  const candidates = RECORD_API_BASES.map((base) => `${base}/${recordId}/connections${suffix}`);
  return parse<RecordConnections>(
    await apiFetchWithFallback(candidates)
  );
}

export async function updateRecord(
  id: string,
  patch: Partial<LedgerRecord> & Record<string, unknown>
): Promise<LedgerRecord | null> {
  const candidates = RECORD_API_BASES.map((base) => `${base}/${id}`);
  return parse<LedgerRecord | null>(
    await apiFetchWithFallback(candidates, {
      method: 'PATCH',
      headers: JSON_HEADERS,
      body: JSON.stringify(patch),
    })
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
  return parse<LedgerRecord[]>(await apiFetch('/api/unified-ledger/suggestions'));
}

export async function getSuggestion(id: string): Promise<LedgerRecord | null> {
  return parse<LedgerRecord | null>(await apiFetch(`/api/unified-ledger/suggestions/${id}`));
}

export async function createSuggestion(input: Partial<LedgerRecord>): Promise<LedgerRecord> {
  return parse<LedgerRecord>(
    await apiFetch('/api/unified-ledger/suggestions', {
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
    await apiFetch(`/api/unified-ledger/suggestions/${id}/vote`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ direction }),
    })
  );
}

export async function listTimelineEvents(params?: {
  ownerId?: string;
  userId?: string;
  recordId?: string;
  goalId?: string;
  planId?: string;
  eventType?: string;
  actor?: string;
  dateFrom?: string;
  dateTo?: string;
  timelineTrack?: string;
}): Promise<TimelineEvent[]> {
  const search = new URLSearchParams();
  if (params?.ownerId) search.set('ownerId', params.ownerId);
  if (params?.userId) search.set('userId', params.userId);
  if (params?.recordId) search.set('recordId', params.recordId);
  if (params?.goalId) search.set('goalId', params.goalId);
  if (params?.planId) search.set('planId', params.planId);
  if (params?.eventType) search.set('eventType', params.eventType);
  if (params?.actor) search.set('actor', params.actor);
  if (params?.dateFrom) search.set('dateFrom', params.dateFrom);
  if (params?.dateTo) search.set('dateTo', params.dateTo);
  if (params?.timelineTrack) search.set('timelineTrack', params.timelineTrack);
  const suffix = search.toString() ? `?${search.toString()}` : '';
  const payload = await parse<unknown>(await timelineApiFetch(`/events${suffix}`));
  return unwrapArrayPayload<TimelineEvent>(payload, ['events', 'items']);
}

export async function getTimelineEvent(id: string, userId?: string): Promise<TimelineEvent | null> {
  void userId;
  const payload = await parse<unknown>(await timelineApiFetch(`/events/${id}`));
  return unwrapEnvelope<TimelineEvent | null>(payload);
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
  const payload = await parse<unknown>(
    await timelineApiFetch('/events', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(input),
    })
  );
  return unwrapEnvelope<TimelineEvent>(payload);
}

export async function updateTimelineEvent(
  id: string,
  input: { userId?: string; actor?: string; timestamp?: string; payload?: Record<string, unknown> }
): Promise<TimelineEvent | null> {
  const payload = await parse<unknown>(
    await timelineApiFetch(`/events/${id}`, {
      method: 'PATCH',
      headers: JSON_HEADERS,
      body: JSON.stringify(input),
    })
  );
  return unwrapEnvelope<TimelineEvent | null>(payload);
}

export async function deleteTimelineEvent(id: string, userId?: string): Promise<boolean> {
  void userId;
  return parse<boolean>(
    await timelineApiFetch(`/events/${id}`, {
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
    await timelineApiFetch('/personal/bootstrap', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({}),
    })
  );
}

export async function importGithubTimelineNarrative(input?: {
  reportPath?: string;
  report?: unknown;
  replaceExisting?: boolean;
  actor?: string;
}): Promise<GithubTimelineImportResult> {
  return parse<GithubTimelineImportResult>(
    await timelineApiFetch('/github/import', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(input || {}),
    })
  );
}

export async function getGithubNarrativeGraph(params?: {
  ownerId?: string;
  timelineTrack?: string;
}): Promise<GithubNarrativeGraphResult> {
  const search = new URLSearchParams();
  if (params?.ownerId) search.set('ownerId', params.ownerId);
  if (params?.timelineTrack) search.set('timelineTrack', params.timelineTrack);
  const suffix = search.toString() ? `?${search.toString()}` : '';
  const payload = await parse<unknown>(await timelineApiFetch(`/github/graph${suffix}`));
  return unwrapEnvelope<GithubNarrativeGraphResult>(payload);
}

export async function createGoal(input: {
  title: string;
  description: string;
  owner?: string;
  linkedRecordIds?: string[];
}): Promise<GoalRecord> {
  const candidates = GOAL_API_BASES.map((base) => base);
  return parse<GoalRecord>(
    await apiFetchWithFallback(candidates, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(input),
    })
  );
}

export async function listGoals(owner?: string): Promise<GoalRecord[]> {
  const suffix = owner ? `?owner=${encodeURIComponent(owner)}` : '';
  const candidates = GOAL_API_BASES.map((base) => `${base}${suffix}`);
  return parse<GoalRecord[]>(await apiFetchWithFallback(candidates));
}

export async function getGoal(id: string, owner?: string): Promise<GoalRecord | null> {
  const suffix = owner ? `?owner=${encodeURIComponent(owner)}` : '';
  const candidates = GOAL_API_BASES.map((base) => `${base}/${id}${suffix}`);
  return parse<GoalRecord | null>(await apiFetchWithFallback(candidates));
}

export async function linkGoalToRecord(
  goalId: string,
  recordId: string,
  actor = 'ui-user',
  owner?: string
): Promise<GoalRecord | null> {
  const candidates = GOAL_API_BASES.map((base) => `${base}/${goalId}/link-record`);
  return parse<GoalRecord | null>(
    await apiFetchWithFallback(candidates, {
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
  const candidates = GOAL_API_BASES.map((base) => `${base}/${goalId}/milestones`);
  return parse<GoalRecord | null>(
    await apiFetchWithFallback(candidates, {
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
  const candidates = GOAL_API_BASES.map((base) => `${base}/${goalId}/milestones/${milestoneId}`);
  return parse<GoalRecord | null>(
    await apiFetchWithFallback(candidates, {
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
  const candidates = GOAL_API_BASES.map(
    (base) => `${base}/${goalId}/milestones/${milestoneId}${suffix}`
  );
  return parse<GoalRecord | null>(
    await apiFetchWithFallback(candidates, {
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
  const candidates = PLAN_API_BASES.map((base) => base);
  return parse<ProjectPlanRecord>(
    await apiFetchWithFallback(candidates, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(input),
    })
  );
}

export async function listPlans(owner?: string): Promise<ProjectPlanRecord[]> {
  const suffix = owner ? `?owner=${encodeURIComponent(owner)}` : '';
  const candidates = PLAN_API_BASES.map((base) => `${base}${suffix}`);
  return parse<ProjectPlanRecord[]>(await apiFetchWithFallback(candidates));
}

export async function getPlan(id: string, owner?: string): Promise<ProjectPlanRecord | null> {
  const suffix = owner ? `?owner=${encodeURIComponent(owner)}` : '';
  const candidates = PLAN_API_BASES.map((base) => `${base}/${id}${suffix}`);
  return parse<ProjectPlanRecord | null>(await apiFetchWithFallback(candidates));
}

export async function linkPlan(
  planId: string,
  input: { owner?: string; goalId?: string; recordId?: string; actor?: string }
): Promise<ProjectPlanRecord | null> {
  const candidates = PLAN_API_BASES.map((base) => `${base}/${planId}/link`);
  return parse<ProjectPlanRecord | null>(
    await apiFetchWithFallback(candidates, {
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
