export type TnfAgentLifecycleStatus =
  | 'active'
  | 'idle'
  | 'busy'
  | 'stalled'
  | 'offline'
  | 'inactive'
  | 'error';

export type TnfWorkflowDefinitionStatus = 'draft' | 'published' | 'paused' | 'archived';

export type TnfWorkflowExecutionStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'paused';

export type TnfRelayConnectionStatus = 'active' | 'idle' | 'offline';

const AGENT_STATUS_ALIASES: Record<string, TnfAgentLifecycleStatus> = {
  active: 'active',
  idle: 'idle',
  busy: 'busy',
  stalled: 'stalled',
  offline: 'offline',
  inactive: 'inactive',
  suspended: 'inactive',
  learning: 'busy',
  training: 'busy',
  error: 'error',
};

const WORKFLOW_DEFINITION_STATUS_ALIASES: Record<string, TnfWorkflowDefinitionStatus> = {
  draft: 'draft',
  active: 'published',
  published: 'published',
  paused: 'paused',
  archived: 'archived',
};

const WORKFLOW_EXECUTION_STATUS_ALIASES: Record<string, TnfWorkflowExecutionStatus> = {
  pending: 'pending',
  queued: 'pending',
  running: 'running',
  in_progress: 'running',
  completed: 'completed',
  succeeded: 'completed',
  failed: 'failed',
  error: 'failed',
  cancelled: 'cancelled',
  canceled: 'cancelled',
  paused: 'paused',
};

const RELAY_CONNECTION_STATUS_ALIASES: Record<string, TnfRelayConnectionStatus> = {
  active: 'active',
  idle: 'idle',
  offline: 'offline',
  stalled: 'idle',
};

export function normalizeAgentLifecycleStatus(input: string | null | undefined) {
  return AGENT_STATUS_ALIASES[String(input || '').trim().toLowerCase()] || null;
}

export function normalizeWorkflowDefinitionStatus(input: string | null | undefined) {
  return WORKFLOW_DEFINITION_STATUS_ALIASES[String(input || '').trim().toLowerCase()] || null;
}

export function normalizeWorkflowExecutionStatus(input: string | null | undefined) {
  return WORKFLOW_EXECUTION_STATUS_ALIASES[String(input || '').trim().toLowerCase()] || null;
}

export function normalizeRelayConnectionStatus(input: string | null | undefined) {
  return RELAY_CONNECTION_STATUS_ALIASES[String(input || '').trim().toLowerCase()] || null;
}

export function toWorkflowDefinitionStatusTarget(
  input: string | null | undefined,
  target: 'normalized' | 'api' | 'engine'
) {
  const normalized = normalizeWorkflowDefinitionStatus(input);
  if (!normalized) return null;
  if (target === 'normalized' || target === 'api') {
    return normalized;
  }
  return normalized.toUpperCase();
}

export function toWorkflowExecutionStatusTarget(
  input: string | null | undefined,
  target: 'normalized' | 'api' | 'engine'
) {
  const normalized = normalizeWorkflowExecutionStatus(input);
  if (!normalized) return null;
  if (target === 'normalized' || target === 'api') {
    return normalized;
  }
  return normalized.toUpperCase();
}
