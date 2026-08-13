import { randomUUID } from 'crypto';

export interface TnfAuditTrace {
  traceId: string;
  source: string;
  actor: string;
  recordedAt: string;
  taskId?: string | null;
  workflowId?: string | null;
  channelId?: string | null;
  sessionId?: string | null;
  scheduleId?: string | null;
  scheduleRunId?: string | null;
  correlationId?: string | null;
  parentId?: string | null;
  canonicalEntityId?: string | null;
  operationalHandle?: string | null;
  runtimeSessionId?: string | null;
}

function asString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized || null;
}

export function createAuditTrace(
  input: Partial<TnfAuditTrace> & Pick<TnfAuditTrace, 'source' | 'actor'>
): TnfAuditTrace {
  return {
    traceId: asString(input.traceId) || randomUUID(),
    source: String(input.source),
    actor: String(input.actor),
    recordedAt: asString(input.recordedAt) || new Date().toISOString(),
    taskId: asString(input.taskId),
    workflowId: asString(input.workflowId),
    channelId: asString(input.channelId),
    sessionId: asString(input.sessionId),
    scheduleId: asString(input.scheduleId),
    scheduleRunId: asString(input.scheduleRunId),
    correlationId: asString(input.correlationId),
    parentId: asString(input.parentId),
    canonicalEntityId: asString(input.canonicalEntityId),
    operationalHandle: asString(input.operationalHandle),
    runtimeSessionId: asString(input.runtimeSessionId),
  };
}

export function extractAuditTrace(value: unknown): TnfAuditTrace | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Record<string, unknown>;
  const traceId = asString(candidate.traceId);
  const source = asString(candidate.source);
  const actor = asString(candidate.actor);
  if (!traceId || !source || !actor) {
    return null;
  }
  return createAuditTrace({
    traceId,
    source,
    actor,
    recordedAt: asString(candidate.recordedAt) || undefined,
    taskId: asString(candidate.taskId) || undefined,
    workflowId: asString(candidate.workflowId) || undefined,
    channelId: asString(candidate.channelId) || undefined,
    sessionId: asString(candidate.sessionId) || undefined,
    scheduleId: asString(candidate.scheduleId) || undefined,
    scheduleRunId: asString(candidate.scheduleRunId) || undefined,
    correlationId: asString(candidate.correlationId) || undefined,
    parentId: asString(candidate.parentId) || undefined,
    canonicalEntityId: asString(candidate.canonicalEntityId) || undefined,
    operationalHandle: asString(candidate.operationalHandle) || undefined,
    runtimeSessionId: asString(candidate.runtimeSessionId) || undefined,
  });
}

export function mergeAuditTrace(
  ...sources: Array<Partial<TnfAuditTrace> | null | undefined>
): TnfAuditTrace | null {
  const merged: Partial<TnfAuditTrace> = {};
  for (const source of sources) {
    if (!source) continue;
    Object.assign(merged, Object.fromEntries(
      Object.entries(source).filter(([, value]) => value != null && value !== '')
    ));
  }
  const actor = asString(merged.actor);
  const source = asString(merged.source);
  if (!actor || !source) {
    return null;
  }
  return createAuditTrace({
    ...merged,
    actor,
    source,
  });
}

export function attachAuditTrace(
  metadata: Record<string, unknown> | undefined,
  input: Partial<TnfAuditTrace> & Pick<TnfAuditTrace, 'source' | 'actor'>
): Record<string, unknown> {
  const current = extractAuditTrace(metadata?.audit);
  const audit = mergeAuditTrace(current, input) || createAuditTrace(input);
  return {
    ...(metadata || {}),
    audit,
  };
}
