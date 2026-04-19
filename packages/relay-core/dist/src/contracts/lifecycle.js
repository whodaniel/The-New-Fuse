const AGENT_STATUS_ALIASES = {
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
const WORKFLOW_DEFINITION_STATUS_ALIASES = {
    draft: 'draft',
    active: 'published',
    published: 'published',
    paused: 'paused',
    archived: 'archived',
};
const WORKFLOW_EXECUTION_STATUS_ALIASES = {
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
const RELAY_CONNECTION_STATUS_ALIASES = {
    active: 'active',
    idle: 'idle',
    offline: 'offline',
    stalled: 'idle',
};
export function normalizeAgentLifecycleStatus(input) {
    return AGENT_STATUS_ALIASES[String(input || '').trim().toLowerCase()] || null;
}
export function normalizeWorkflowDefinitionStatus(input) {
    return WORKFLOW_DEFINITION_STATUS_ALIASES[String(input || '').trim().toLowerCase()] || null;
}
export function normalizeWorkflowExecutionStatus(input) {
    return WORKFLOW_EXECUTION_STATUS_ALIASES[String(input || '').trim().toLowerCase()] || null;
}
export function normalizeRelayConnectionStatus(input) {
    return RELAY_CONNECTION_STATUS_ALIASES[String(input || '').trim().toLowerCase()] || null;
}
export function toWorkflowDefinitionStatusTarget(input, target) {
    const normalized = normalizeWorkflowDefinitionStatus(input);
    if (!normalized)
        return null;
    if (target === 'normalized' || target === 'api') {
        return normalized;
    }
    return normalized.toUpperCase();
}
export function toWorkflowExecutionStatusTarget(input, target) {
    const normalized = normalizeWorkflowExecutionStatus(input);
    if (!normalized)
        return null;
    if (target === 'normalized' || target === 'api') {
        return normalized;
    }
    return normalized.toUpperCase();
}
//# sourceMappingURL=lifecycle.js.map