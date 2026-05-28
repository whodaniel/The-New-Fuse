import { hasSupabaseConfig, supabase } from '@/lib/supabase';

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
const CONFIGURED_API_URL = String(import.meta.env.VITE_API_URL || '')
  .trim()
  .replace(/\/+$/, '');
const CONFIGURED_API_ORIGIN = CONFIGURED_API_URL.replace(/\/api(?:\/v\d+)?$/i, '');

function buildApiBaseCandidates(relativeBases: readonly string[]): string[] {
  const candidates: string[] = [];
  for (const base of relativeBases) {
    const normalized = base.startsWith('/') ? base : `/${base}`;
    if (CONFIGURED_API_ORIGIN) {
      candidates.push(`${CONFIGURED_API_ORIGIN}${normalized}`);
    }
    candidates.push(normalized);
  }
  return Array.from(new Set(candidates));
}

const TIMELINE_API_BASES = buildApiBaseCandidates([
  '/api/unified-ledger/timeline',
  '/api/unified-ledger/unified-ledger/timeline',
  '/api/timeline',
  '/api/v1/unified-ledger/timeline',
  '/api/v1/timeline',
] as const);
const RECORD_API_BASES = buildApiBaseCandidates([
  '/api/unified-ledger/records',
  '/api/unified-ledger/unified-ledger/records',
  '/api/v1/unified-ledger/records',
  '/api/v1/unified-ledger/unified-ledger/records',
] as const);
const GOAL_API_BASES = buildApiBaseCandidates(['/api/unified-ledger/goals', '/api/goals'] as const);
const PLAN_API_BASES = buildApiBaseCandidates(['/api/unified-ledger/plans', '/api/plans'] as const);
const SUGGESTION_API_BASES = buildApiBaseCandidates([
  '/api/unified-ledger/suggestions',
  '/api/unified-ledger/unified-ledger/suggestions',
  '/api/suggestions',
  '/api/v1/unified-ledger/suggestions',
  '/api/v1/unified-ledger/unified-ledger/suggestions',
  '/api/v1/suggestions',
] as const);

function shouldFallbackRoute(status: number): boolean {
  return status === 404 || status === 405 || status === 502 || status === 503 || status === 504;
}

function isJsonLikeResponse(response: Response): boolean {
  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  if (!contentType) {
    return true;
  }
  return (
    contentType.includes('application/json') ||
    contentType.includes('+json') ||
    contentType.includes('text/json')
  );
}

async function apiFetchWithFallback(
  pathCandidates: readonly string[],
  init?: RequestInit
): Promise<Response> {
  if (pathCandidates.length === 0) {
    throw new Error('No API path candidates provided');
  }

  let lastResponse: Response | null = null;
  let lastError: Error | null = null;
  for (const candidatePath of pathCandidates) {
    try {
      const response = await apiFetch(candidatePath, init);
      lastResponse = response;
      const fallbackByStatus = shouldFallbackRoute(response.status);
      const fallbackByContentType = response.ok && !isJsonLikeResponse(response);
      if (!fallbackByStatus && !fallbackByContentType) {
        return response;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  if (lastError && !lastResponse) {
    throw lastError;
  }

  if (!lastResponse) {
    throw new Error('No API response from candidates');
  }
  return lastResponse;
}

async function timelineApiFetch(path: string, init?: RequestInit): Promise<Response> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const candidates = TIMELINE_API_BASES.map((base) => `${base}${normalizedPath}`);
  return apiFetchWithFallback(candidates, init);
}

export class ApiResponseError extends Error {
  status: number;
  body: string;

  constructor(status: number, body: string, fallbackMessage: string) {
    const compactBody = body.replace(/\s+/g, ' ').trim();
    super(compactBody || fallbackMessage);
    this.name = 'ApiResponseError';
    this.status = status;
    this.body = body;
  }
}

export function getApiErrorMessage(error: unknown, fallback = 'Request failed'): string {
  if (error instanceof ApiResponseError) {
    const raw = (error.body || error.message || '').replace(/\s+/g, ' ').trim();
    if (!raw) return `${fallback} (${error.status})`;
    if (raw.length > 180) return `${fallback} (${error.status})`;
    return `${fallback}: ${raw}`;
  }

  if (error instanceof Error) {
    const raw = error.message.replace(/\s+/g, ' ').trim();
    if (!raw || raw.length > 180) return fallback;
    return `${fallback}: ${raw}`;
  }

  return fallback;
}

function getStoredAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return (
    localStorage.getItem('auth_token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('accessToken') ||
    localStorage.getItem('token') ||
    localStorage.getItem('AUTH_TOKEN') ||
    sessionStorage.getItem('auth_token') ||
    sessionStorage.getItem('authToken') ||
    sessionStorage.getItem('accessToken') ||
    sessionStorage.getItem('token') ||
    sessionStorage.getItem('AUTH_TOKEN')
  );
}

async function getAuthTokenCandidates(): Promise<string[]> {
  const tokens: string[] = [];
  if (!hasSupabaseConfig || !supabase) {
    const storedToken = getStoredAuthToken();
    return storedToken ? [storedToken] : [];
  }

  try {
    const { data, error } = await supabase.auth.getSession();
    if (!error && data?.session?.access_token) {
      tokens.push(data.session.access_token);
    }
  } catch {
    // Fall through to stored token and unauthenticated request so caller can handle response status.
  }

  const storedToken = getStoredAuthToken();
  if (storedToken) {
    tokens.push(storedToken);
  }

  return Array.from(new Set(tokens));
}

async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const baseHeaders = new Headers(init?.headers);
  if (baseHeaders.has('Authorization')) {
    return fetch(input, {
      ...init,
      headers: baseHeaders,
      credentials: 'include',
    });
  }

  const tokenCandidates = await getAuthTokenCandidates();
  const authOptions = tokenCandidates.length > 0 ? tokenCandidates : [null];

  let lastResponse: Response | null = null;
  for (let i = 0; i < authOptions.length; i += 1) {
    const token = authOptions[i];
    const headers = new Headers(baseHeaders);
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(input, {
      ...init,
      headers,
      credentials: 'include',
    });
    lastResponse = response;

    const canRetryAuth = i < authOptions.length - 1;
    if ((response.status === 401 || response.status === 403) && canRetryAuth) {
      continue;
    }
    return response;
  }

  return (
    lastResponse ||
    fetch(input, {
      ...init,
      headers: baseHeaders,
      credentials: 'include',
    })
  );
}

async function parse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new ApiResponseError(res.status, text, `Request failed with ${res.status}`);
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

const LOCAL_TIMELINE_STORAGE_KEY = 'tnf.local.timeline.v1';

type LocalTimelineSnapshot = {
  events: TimelineEvent[];
};

function hasRouteUnavailableSignal(input: string): boolean {
  const normalized = input.toLowerCase();
  return (
    /cannot\s+(get|post|patch|delete)/i.test(normalized) ||
    /method\s+not\s+allowed/i.test(normalized) ||
    /route\s+not\s+found/i.test(normalized) ||
    /service\s+unavailable/i.test(normalized) ||
    /bad\s+gateway/i.test(normalized) ||
    /gateway\s+timeout/i.test(normalized) ||
    /unexpected\s+token\s*</i.test(normalized)
  );
}

function isTimelineFallbackEligible(error: unknown): boolean {
  if (error instanceof ApiResponseError) {
    if ([404, 405, 502, 503, 504].includes(error.status)) {
      return true;
    }
    return hasRouteUnavailableSignal(`${error.body || ''} ${error.message || ''}`);
  }

  if (error instanceof SyntaxError) {
    return hasRouteUnavailableSignal(error.message || '');
  }

  if (error instanceof Error) {
    const message = error.message || '';
    if (hasRouteUnavailableSignal(message)) {
      return true;
    }
    const normalized = message.toLowerCase();
    return (
      normalized.includes('failed to fetch') ||
      normalized.includes('networkerror') ||
      normalized.includes('load failed')
    );
  }

  return false;
}

function readLocalTimelineSnapshot(): LocalTimelineSnapshot {
  if (typeof window === 'undefined') {
    return { events: [] };
  }

  try {
    const raw = localStorage.getItem(LOCAL_TIMELINE_STORAGE_KEY);
    if (!raw) return { events: [] };
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { events: [] };
    }
    const eventCandidates = (parsed as Record<string, unknown>).events;
    if (!Array.isArray(eventCandidates)) return { events: [] };
    const events = eventCandidates
      .filter((value): value is TimelineEvent => {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
        const row = value as Record<string, unknown>;
        return (
          typeof row.id === 'string' &&
          typeof row.eventType === 'string' &&
          typeof row.actor === 'string' &&
          typeof row.timestamp === 'string'
        );
      })
      .map((value) => ({
        ...value,
        payload:
          value.payload && typeof value.payload === 'object' && !Array.isArray(value.payload)
            ? value.payload
            : {},
      }));
    return { events };
  } catch {
    return { events: [] };
  }
}

function writeLocalTimelineSnapshot(snapshot: LocalTimelineSnapshot): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_TIMELINE_STORAGE_KEY, JSON.stringify(snapshot));
}

function resolveTimelineOwnerId(params?: { ownerId?: string; userId?: string }): string | null {
  const ownerId = params?.ownerId?.trim();
  if (ownerId) return ownerId;
  const userId = params?.userId?.trim();
  if (userId) return userId;
  return null;
}

function filterLocalTimelineEvents(
  rows: TimelineEvent[],
  params?: {
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
  }
): TimelineEvent[] {
  const ownerId = resolveTimelineOwnerId(params);
  const from = params?.dateFrom || '';
  const to = params?.dateTo || '';
  const timelineTrack = params?.timelineTrack?.toLowerCase() || '';

  return rows
    .filter((event) => (ownerId ? event.userId === ownerId : true))
    .filter((event) => (params?.recordId ? event.recordId === params.recordId : true))
    .filter((event) => (params?.goalId ? event.goalId === params.goalId : true))
    .filter((event) => (params?.planId ? event.planId === params.planId : true))
    .filter((event) => (params?.eventType ? event.eventType === params.eventType : true))
    .filter((event) => (params?.actor ? event.actor === params.actor : true))
    .filter((event) => (from ? event.timestamp >= from : true))
    .filter((event) => (to ? event.timestamp <= to : true))
    .filter((event) => {
      if (!timelineTrack) return true;
      const payload = (event.payload || {}) as Record<string, unknown>;
      const track = String(payload.timelineTrack || payload.segment || '').toLowerCase();
      return track === timelineTrack;
    })
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

function generateLocalTimelineEventId(): string {
  return `evt_local_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function parseJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const raw = atob(padded);
    const decoded = JSON.parse(raw) as unknown;
    if (!decoded || typeof decoded !== 'object' || Array.isArray(decoded)) return null;
    return decoded as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function inferCurrentUserId(): Promise<string | null> {
  if (hasSupabaseConfig && supabase) {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user?.id) {
        return data.user.id;
      }
    } catch {
      // Fall through to token inspection.
    }
  }

  const tokens = await getAuthTokenCandidates();
  for (const token of tokens) {
    const payload = parseJwtPayload(token);
    const sub = typeof payload?.sub === 'string' ? payload.sub : null;
    if (sub && sub.trim().length > 0) {
      return sub.trim();
    }
    const userId = typeof payload?.user_id === 'string' ? payload.user_id : null;
    if (userId && userId.trim().length > 0) {
      return userId.trim();
    }
  }

  return null;
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
  return parse<RecordConnections>(await apiFetchWithFallback(candidates));
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
  return parse<LedgerRecord[]>(
    await apiFetchWithFallback([...SUGGESTION_API_BASES].map((base) => `${base}`))
  );
}

export async function getSuggestion(id: string): Promise<LedgerRecord | null> {
  const candidates = SUGGESTION_API_BASES.map((base) => `${base}/${id}`);
  return parse<LedgerRecord | null>(await apiFetchWithFallback(candidates));
}

export async function createSuggestion(input: Partial<LedgerRecord>): Promise<LedgerRecord> {
  const candidates = [...SUGGESTION_API_BASES].map((base) => `${base}`);
  return parse<LedgerRecord>(
    await apiFetchWithFallback(candidates, {
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
  const candidates = SUGGESTION_API_BASES.map((base) => `${base}/${id}/vote`);
  return parse<LedgerRecord | null>(
    await apiFetchWithFallback(candidates, {
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
  try {
    const payload = await parse<unknown>(await timelineApiFetch(`/events${suffix}`));
    return unwrapArrayPayload<TimelineEvent>(payload, ['events', 'items']);
  } catch (error) {
    if (!isTimelineFallbackEligible(error)) {
      throw error;
    }
    return filterLocalTimelineEvents(readLocalTimelineSnapshot().events, params);
  }
}

export async function getTimelineEvent(id: string, userId?: string): Promise<TimelineEvent | null> {
  try {
    void userId;
    const payload = await parse<unknown>(await timelineApiFetch(`/events/${id}`));
    return unwrapEnvelope<TimelineEvent | null>(payload);
  } catch (error) {
    if (!isTimelineFallbackEligible(error)) {
      throw error;
    }
    return readLocalTimelineSnapshot().events.find((event) => event.id === id) || null;
  }
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
  try {
    const payload = await parse<unknown>(
      await timelineApiFetch('/events', {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify(input),
      })
    );
    return unwrapEnvelope<TimelineEvent>(payload);
  } catch (error) {
    if (!isTimelineFallbackEligible(error)) {
      throw error;
    }

    const snapshot = readLocalTimelineSnapshot();
    const fallbackUserId = input.userId || (await inferCurrentUserId()) || undefined;
    const event: TimelineEvent = {
      id: generateLocalTimelineEventId(),
      userId: fallbackUserId,
      recordId: input.recordId,
      goalId: input.goalId,
      planId: input.planId,
      eventType: input.eventType || 'historical_event',
      actor: input.actor || fallbackUserId || 'ui-user',
      timestamp: input.timestamp || new Date().toISOString(),
      payload:
        input.payload && typeof input.payload === 'object' && !Array.isArray(input.payload)
          ? input.payload
          : {},
    };

    snapshot.events.push(event);
    writeLocalTimelineSnapshot(snapshot);
    return event;
  }
}

export async function updateTimelineEvent(
  id: string,
  input: { userId?: string; actor?: string; timestamp?: string; payload?: Record<string, unknown> }
): Promise<TimelineEvent | null> {
  try {
    const payload = await parse<unknown>(
      await timelineApiFetch(`/events/${id}`, {
        method: 'PATCH',
        headers: JSON_HEADERS,
        body: JSON.stringify(input),
      })
    );
    return unwrapEnvelope<TimelineEvent | null>(payload);
  } catch (error) {
    if (!isTimelineFallbackEligible(error)) {
      throw error;
    }

    const snapshot = readLocalTimelineSnapshot();
    const idx = snapshot.events.findIndex((event) => event.id === id);
    if (idx < 0) return null;

    const current = snapshot.events[idx];
    if (input.userId && current.userId && current.userId !== input.userId) {
      return null;
    }

    const updated: TimelineEvent = {
      ...current,
      actor: input.actor || current.actor,
      timestamp: input.timestamp || current.timestamp,
      payload: input.payload ? { ...current.payload, ...input.payload } : current.payload,
    };

    snapshot.events[idx] = updated;
    writeLocalTimelineSnapshot(snapshot);
    return updated;
  }
}

export async function deleteTimelineEvent(id: string, userId?: string): Promise<boolean> {
  try {
    void userId;
    return parse<boolean>(
      await timelineApiFetch(`/events/${id}`, {
        method: 'DELETE',
      })
    );
  } catch (error) {
    if (!isTimelineFallbackEligible(error)) {
      throw error;
    }

    const snapshot = readLocalTimelineSnapshot();
    const idx = snapshot.events.findIndex((event) => event.id === id);
    if (idx < 0) return false;
    if (userId && snapshot.events[idx].userId && snapshot.events[idx].userId !== userId) {
      return false;
    }
    snapshot.events.splice(idx, 1);
    writeLocalTimelineSnapshot(snapshot);
    return true;
  }
}

export async function bootstrapPersonalTimeline(): Promise<{
  message: string;
  createdCount: number;
  totalCount: number;
  events: TimelineEvent[];
}> {
  try {
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
  } catch (error) {
    if (!isTimelineFallbackEligible(error)) {
      throw error;
    }

    const userId = await inferCurrentUserId();
    const snapshot = readLocalTimelineSnapshot();
    const existingEvents = filterLocalTimelineEvents(
      snapshot.events,
      userId ? { ownerId: userId } : undefined
    );

    if (!userId) {
      return {
        message: 'Timeline API unavailable and authenticated user context is missing',
        createdCount: 0,
        totalCount: existingEvents.length,
        events: existingEvents,
      };
    }

    if (existingEvents.length === 0) {
      const genesisEvent: TimelineEvent = {
        id: `evt_local_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        eventType: 'historical_event',
        timestamp: new Date().toISOString(),
        actor: userId,
        userId: userId,
        payload: {
          title: 'Genesis Block (Local Fallback)',
          description:
            'The timeline service is currently unreachable due to degraded backend infrastructure. This is a local placeholder to initialize your timeline offline.',
          segment: 'Genesis',
          confidence: 'high',
          isPrivate: true,
          source: 'personal-timeline-bootstrap-local-fallback',
        },
      };
      const newSnapshot = { events: [genesisEvent] };
      writeLocalTimelineSnapshot(newSnapshot);

      return {
        message: 'Timeline service degraded. Generated local fallback timeline.',
        createdCount: 1,
        totalCount: 1,
        events: [genesisEvent],
      };
    }

    const existingKeys = new Set(
      existingEvents
        .map((event) => ((event.payload || {}) as Record<string, unknown>).storyKey)
        .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
        .map((value) => value.trim())
    );
    const existingTitles = new Set(
      existingEvents
        .map((event) => ((event.payload || {}) as Record<string, unknown>).title)
        .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
        .map((value) => value.trim().toLowerCase())
    );

    const now = Date.now();
    const blueprint = [
      {
        key: 'identity-foundation',
        title: 'Identity Foundation',
        description: 'Early identity anchors and formative personal narrative context.',
        point: 8,
        category: 'Identity',
        yearsAgo: 18,
      },
      {
        key: 'education-development',
        title: 'Education & Development',
        description: 'Learning period that shaped capabilities, values, and long-term direction.',
        point: 22,
        category: 'Education',
        yearsAgo: 12,
      },
      {
        key: 'career-inflection',
        title: 'Career Inflection Point',
        description: 'A directional shift that redefined execution priorities and goals.',
        point: 45,
        category: 'Career',
        yearsAgo: 7,
      },
      {
        key: 'project-acceleration',
        title: 'Project Acceleration',
        description: 'Execution pace increased across key projects and personal systems.',
        point: 66,
        category: 'Business & Projects',
        yearsAgo: 3,
      },
      {
        key: 'current-strategic-horizon',
        title: 'Current Strategic Horizon',
        description: 'Current timeline arc with active priorities and next-stage planning.',
        point: 86,
        category: 'Legacy',
        yearsAgo: 1,
      },
    ] as const;

    const created: TimelineEvent[] = [];
    for (let index = 0; index < blueprint.length; index += 1) {
      const row = blueprint[index];
      if (existingKeys.has(row.key) || existingTitles.has(row.title.toLowerCase())) {
        continue;
      }
      const event: TimelineEvent = {
        id: generateLocalTimelineEventId(),
        userId,
        eventType: 'historical_event',
        actor: userId,
        timestamp: new Date(
          now - row.yearsAgo * 365 * 24 * 60 * 60 * 1000 + index * 60_000
        ).toISOString(),
        payload: {
          title: row.title,
          description: row.description,
          point: row.point,
          category: row.category,
          segment: row.category,
          source: 'local-bootstrap-fallback',
          storyKey: row.key,
          isPrivate: true,
        },
      };
      created.push(event);
      snapshot.events.push(event);
    }

    if (created.length > 0) {
      writeLocalTimelineSnapshot(snapshot);
    }

    const events = filterLocalTimelineEvents(snapshot.events, { ownerId: userId });
    return {
      message:
        created.length > 0
          ? `Generated ${created.length} local personal timeline segments`
          : 'Personal timeline segments already exist',
      createdCount: created.length,
      totalCount: events.length,
      events,
    };
  }
}

export async function importGithubTimelineNarrative(input?: {
  reportPath?: string;
  report?: unknown;
  replaceExisting?: boolean;
  actor?: string;
}): Promise<GithubTimelineImportResult> {
  try {
    return parse<GithubTimelineImportResult>(
      await timelineApiFetch('/github/import', {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify(input || {}),
      })
    );
  } catch (error) {
    if (!isTimelineFallbackEligible(error)) {
      throw error;
    }
    const userId = await inferCurrentUserId();
    const events = filterLocalTimelineEvents(
      readLocalTimelineSnapshot().events,
      userId ? { ownerId: userId } : undefined
    );
    return {
      message:
        'GitHub import is unavailable in this deployment. This advanced action can be configured later.',
      importedCount: 0,
      skippedCount: 0,
      removedCount: 0,
      trackSummaries: [],
      connectionCount: 0,
      matchedConnectionCount: 0,
      totalCount: events.length,
      generatedAt: null,
    };
  }
}

export async function getGithubNarrativeGraph(params?: {
  ownerId?: string;
  timelineTrack?: string;
}): Promise<GithubNarrativeGraphResult> {
  const search = new URLSearchParams();
  if (params?.ownerId) search.set('ownerId', params.ownerId);
  if (params?.timelineTrack) search.set('timelineTrack', params.timelineTrack);
  const suffix = search.toString() ? `?${search.toString()}` : '';
  try {
    const payload = await parse<unknown>(await timelineApiFetch(`/github/graph${suffix}`));
    return unwrapEnvelope<GithubNarrativeGraphResult>(payload);
  } catch (error) {
    if (!isTimelineFallbackEligible(error)) {
      throw error;
    }

    const events = filterLocalTimelineEvents(readLocalTimelineSnapshot().events, {
      ownerId: params?.ownerId,
      timelineTrack: params?.timelineTrack,
    });
    const nodeMap = new Map<string, GithubNarrativeGraphNode>();
    const edgeMap = new Map<string, GithubNarrativeGraphEdge>();

    for (const event of events) {
      const payload = (event.payload || {}) as Record<string, unknown>;
      const track = typeof payload.timelineTrack === 'string' ? payload.timelineTrack : '';
      const project = typeof payload.project === 'string' ? payload.project : '';

      const refs = Array.from(
        new Set(
          [
            ...(Array.isArray(payload.narrativeNodeRefs) ? payload.narrativeNodeRefs : []),
            ...(Array.isArray(payload.evidenceRefs) ? payload.evidenceRefs : []),
          ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
        )
      );

      for (const ref of refs) {
        const current = nodeMap.get(ref) || {
          id: ref,
          label: ref,
          kind: /^[a-z0-9_.-]+\/[a-z0-9_.-]+$/i.test(ref) ? 'repo' : 'reference',
          tracks: [],
          projects: [],
          eventCount: 0,
        };
        current.eventCount += 1;
        if (track && !current.tracks.includes(track)) current.tracks.push(track);
        if (project && !current.projects.includes(project)) current.projects.push(project);
        nodeMap.set(ref, current);
      }

      const connections = Array.isArray(payload.narrativeConnections)
        ? payload.narrativeConnections
        : [];
      for (const candidate of connections) {
        if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) continue;
        const row = candidate as Record<string, unknown>;
        const from = typeof row.from === 'string' ? row.from.trim() : '';
        const to = typeof row.to === 'string' ? row.to.trim() : '';
        if (!from || !to) continue;
        const connectionType =
          typeof row.connectionType === 'string' && row.connectionType.trim().length > 0
            ? row.connectionType.trim()
            : 'related';
        const strength =
          typeof row.strength === 'string' && row.strength.trim().length > 0
            ? row.strength.trim()
            : 'moderate';
        const rationale =
          typeof row.rationale === 'string' && row.rationale.trim().length > 0
            ? row.rationale.trim()
            : undefined;
        const key = `${from}|${to}|${connectionType}`;
        const current = edgeMap.get(key);
        if (current) {
          current.weight += 1;
          if (!current.rationale && rationale) current.rationale = rationale;
          continue;
        }
        edgeMap.set(key, {
          from,
          to,
          connectionType,
          weight: 1,
          rationale,
          strength,
        });
      }
    }

    return {
      ownerUserId: params?.ownerId || null,
      eventCount: events.length,
      nodeCount: nodeMap.size,
      edgeCount: edgeMap.size,
      generatedAt: null,
      nodes: Array.from(nodeMap.values()).sort((a, b) => a.id.localeCompare(b.id)),
      edges: Array.from(edgeMap.values()).sort((a, b) => {
        if (a.from !== b.from) return a.from.localeCompare(b.from);
        if (a.to !== b.to) return a.to.localeCompare(b.to);
        return a.connectionType.localeCompare(b.connectionType);
      }),
    };
  }
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
