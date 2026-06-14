import { DatabaseService } from '@the-new-fuse/database';
import { AnalyzerAgentService } from '../../agents/analyzer.service';
import { UnifiedLedgerService } from './unified-ledger.service';
import { UnifiedRecordKind, UnifiedRecordStatus, UnifiedWorkHorizon, UnifiedWorkLane } from './unified-ledger.types';
type AuthUser = {
    id?: string;
    sub?: string;
    user_id?: string;
    userId?: string;
    tenantId?: string;
    workspaceId?: string;
    activeWorkspaceId?: string;
    currentWorkspaceId?: string;
    context?: Record<string, unknown>;
    scope?: Record<string, unknown>;
    email?: string | null;
    name?: string | null;
    role?: string | null;
    roles?: unknown;
    permissions?: unknown;
};
export declare class UnifiedLedgerController {
    private readonly ledger;
    private readonly db;
    private readonly analyzer?;
    private readonly logger;
    constructor(ledger: UnifiedLedgerService, db: DatabaseService, analyzer?: AnalyzerAgentService | undefined);
    private requireUserId;
    private resolveTenantId;
    private resolveTenantIdHint;
    private resolveWorkspaceId;
    private resolveAuthenticatedWorkspaceId;
    private buildScope;
    private scopeArgs;
    private withScope;
    private assertWorkspaceWriteAccess;
    private tenantOnlyScope;
    private resolveWriteScope;
    private mapIssueSeverityToPriority;
    private normalizeSuggestionKey;
    private ingestAnalyzerSuggestions;
    list(user: AuthUser, kind?: UnifiedRecordKind, status?: UnifiedRecordStatus, lane?: UnifiedWorkLane, horizon?: UnifiedWorkHorizon, q?: string, workspaceId?: string): Promise<import("./unified-ledger.types").UnifiedTaskRecord[]>;
    get(user: AuthUser, id: string, workspaceId?: string): Promise<import("./unified-ledger.types").UnifiedTaskRecord | null>;
    connections(user: AuthUser, id: string, workspaceId?: string): Promise<{
        goals: import("./unified-ledger.types").GoalRecord[];
        plans: import("./unified-ledger.types").ProjectPlanRecord[];
    }>;
    create(user: AuthUser, body: any): Promise<import("./unified-ledger.types").UnifiedTaskRecord>;
    patch(user: AuthUser, id: string, body: any): Promise<import("./unified-ledger.types").UnifiedTaskRecord | null>;
    vote(user: AuthUser, id: string, body: {
        direction: 'up' | 'down';
        workspaceId?: string;
    }): Promise<import("./unified-ledger.types").UnifiedTaskRecord | null>;
    feedback(user: AuthUser, id: string, body: any): Promise<import("./unified-ledger.types").UnifiedTaskRecord | null>;
    link(user: AuthUser, id: string, body: any): Promise<import("./unified-ledger.types").UnifiedTaskRecord | null>;
    ingest(_user: {
        id?: string;
        sub?: string;
    }, body: any): Promise<import("./unified-ledger.types").UnifiedTaskRecord>;
    grid(user: AuthUser, workspaceId?: string): Promise<{
        total: number;
        byKind: Record<string, number>;
        byStatus: Record<string, number>;
        averageProgressPercent: number;
        averageRhythmBpm: number;
    }>;
    timeline(user: AuthUser, ownerId?: string, recordId?: string, goalId?: string, planId?: string, eventType?: string, actor?: string, dateFrom?: string, dateTo?: string, timelineTrack?: string, workspaceId?: string): Promise<import("./unified-ledger.types").TimelineEvent[]>;
    timelineEvent(user: AuthUser, id: string, workspaceId?: string): Promise<import("./unified-ledger.types").TimelineEvent | null>;
    createTimelineEvent(user: AuthUser, body: any): Promise<import("./unified-ledger.types").TimelineEvent>;
    patchTimelineEvent(user: AuthUser, id: string, body: any): Promise<import("./unified-ledger.types").TimelineEvent | null>;
    deleteTimelineEvent(user: AuthUser, id: string, workspaceId?: string): Promise<boolean>;
    bootstrapPersonalTimeline(user: AuthUser): Promise<{
        message: string;
        createdCount: number;
        totalCount: number;
        events: import("./unified-ledger.types").TimelineEvent[];
    }>;
    importGithubNarrativeTimeline(user: {
        id?: string;
        sub?: string;
    }, body?: {
        reportPath?: string;
        report?: unknown;
        replaceExisting?: boolean;
        actor?: string;
    }): Promise<{
        message: string;
        importedCount: number;
        skippedCount: number;
        removedCount: number;
        trackSummaries: Array<{
            timelineId: string;
            total: number;
            imported: number;
            skipped: number;
        }>;
        connectionCount: number;
        matchedConnectionCount: number;
        totalCount: number;
        generatedAt: string | null;
    }>;
    githubNarrativeGraph(user: AuthUser, ownerId?: string, timelineTrack?: string, workspaceId?: string): Promise<{
        ownerUserId: string | null;
        eventCount: number;
        nodeCount: number;
        edgeCount: number;
        generatedAt: string | null;
        nodes: Array<{
            id: string;
            label: string;
            kind: "repo" | "reference";
            tracks: string[];
            projects: string[];
            eventCount: number;
        }>;
        edges: Array<{
            from: string;
            to: string;
            connectionType: string;
            weight: number;
            rationale?: string;
            strength: string;
        }>;
    }>;
    createGoal(user: AuthUser, body: any): Promise<import("./unified-ledger.types").GoalRecord>;
    listGoals(user: AuthUser, workspaceId?: string): Promise<import("./unified-ledger.types").GoalRecord[]>;
    getGoal(user: AuthUser, id: string, workspaceId?: string): Promise<import("./unified-ledger.types").GoalRecord | null>;
    linkGoalRecord(user: AuthUser, id: string, body: {
        recordId: string;
        actor?: string;
        owner?: string;
    }): Promise<import("./unified-ledger.types").GoalRecord | null>;
    addMilestone(user: AuthUser, id: string, body: any): Promise<import("./unified-ledger.types").GoalRecord | null>;
    updateMilestone(user: AuthUser, id: string, milestoneId: string, body: any): Promise<import("./unified-ledger.types").GoalRecord | null>;
    deleteMilestone(user: AuthUser, id: string, milestoneId: string, workspaceId?: string): Promise<import("./unified-ledger.types").GoalRecord | null>;
    createPlan(user: AuthUser, body: any): Promise<import("./unified-ledger.types").ProjectPlanRecord>;
    listPlans(user: AuthUser, workspaceId?: string): Promise<import("./unified-ledger.types").ProjectPlanRecord[]>;
    getPlan(user: AuthUser, id: string, workspaceId?: string): Promise<import("./unified-ledger.types").ProjectPlanRecord | null>;
    linkPlan(user: AuthUser, id: string, body: {
        owner?: string;
        goalId?: string;
        recordId?: string;
        actor?: string;
    }): Promise<import("./unified-ledger.types").ProjectPlanRecord | null>;
    listTasks(user: AuthUser, status?: UnifiedRecordStatus, lane?: UnifiedWorkLane, horizon?: UnifiedWorkHorizon, q?: string, workspaceId?: string): Promise<import("./unified-ledger.types").UnifiedTaskRecord[]>;
    getTask(user: AuthUser, id: string, workspaceId?: string): Promise<import("./unified-ledger.types").UnifiedTaskRecord | null>;
    createTask(user: AuthUser, body: any): Promise<import("./unified-ledger.types").UnifiedTaskRecord>;
    patchTask(user: AuthUser, id: string, body: any): Promise<import("./unified-ledger.types").UnifiedTaskRecord | null>;
    listSuggestions(user: AuthUser, status?: UnifiedRecordStatus, lane?: UnifiedWorkLane, horizon?: UnifiedWorkHorizon, q?: string, workspaceId?: string): Promise<import("./unified-ledger.types").UnifiedTaskRecord[]>;
    getSuggestion(user: AuthUser, id: string, workspaceId?: string): Promise<import("./unified-ledger.types").UnifiedTaskRecord | null>;
    createSuggestion(user: AuthUser, body: any): Promise<import("./unified-ledger.types").UnifiedTaskRecord>;
    patchSuggestion(user: AuthUser, id: string, body: any): Promise<import("./unified-ledger.types").UnifiedTaskRecord | null>;
    voteSuggestion(user: AuthUser, id: string, body: {
        direction: 'up' | 'down';
        workspaceId?: string;
    }): Promise<import("./unified-ledger.types").UnifiedTaskRecord | null>;
}
export {};
//# sourceMappingURL=unified-ledger.controller.d.ts.map