"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuditTrace = createAuditTrace;
exports.extractAuditTrace = extractAuditTrace;
exports.mergeAuditTrace = mergeAuditTrace;
exports.attachAuditTrace = attachAuditTrace;
const crypto_1 = require("crypto");
function asString(value) {
    if (typeof value !== 'string')
        return null;
    const normalized = value.trim();
    return normalized || null;
}
function createAuditTrace(input) {
    return {
        traceId: asString(input.traceId) || (0, crypto_1.randomUUID)(),
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
function extractAuditTrace(value) {
    if (!value || typeof value !== 'object')
        return null;
    const candidate = value;
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
function mergeAuditTrace(...sources) {
    const merged = {};
    for (const source of sources) {
        if (!source)
            continue;
        Object.assign(merged, Object.fromEntries(Object.entries(source).filter(([, value]) => value != null && value !== '')));
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
function attachAuditTrace(metadata, input) {
    const current = extractAuditTrace(metadata?.audit);
    const audit = mergeAuditTrace(current, input) || createAuditTrace(input);
    return {
        ...(metadata || {}),
        audit,
    };
}
//# sourceMappingURL=audit.js.map