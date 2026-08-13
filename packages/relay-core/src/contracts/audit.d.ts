// @ts-nocheck
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
export declare function createAuditTrace(input: Partial<TnfAuditTrace> & Pick<TnfAuditTrace, 'source' | 'actor'>): TnfAuditTrace;
export declare function extractAuditTrace(value: unknown): TnfAuditTrace | null;
export declare function mergeAuditTrace(...sources: Array<Partial<TnfAuditTrace> | null | undefined>): TnfAuditTrace | null;
export declare function attachAuditTrace(metadata: Record<string, unknown> | undefined, input: Partial<TnfAuditTrace> & Pick<TnfAuditTrace, 'source' | 'actor'>): Record<string, unknown>;
//# sourceMappingURL=audit.d.ts.map