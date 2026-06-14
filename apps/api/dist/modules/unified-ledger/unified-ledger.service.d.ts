import { OnModuleInit } from '@nestjs/common';
import { DatabaseService } from '@the-new-fuse/database';
import { FeedbackIteration, FunctionalLink, GoalRecord, ProjectPlanRecord, TimelineEvent, UnifiedRecordKind, UnifiedRecordStatus, UnifiedTaskRecord, UnifiedWorkHorizon, UnifiedWorkLane } from './unified-ledger.types';
type CreateRecordInput = Partial<UnifiedTaskRecord> & Pick<UnifiedTaskRecord, 'title' | 'description'>;
type GithubNarrativeImportInput = {
    reportPath?: string;
    report?: unknown;
    replaceExisting?: boolean;
    actor?: string;
};
type LedgerScope = {
    tenantId?: string;
    workspaceId?: string;
};
export declare class UnifiedLedgerService implements OnModuleInit {
    private readonly db?;
    private readonly logger;
    private readonly defaultStorePath;
    private storePath;
    private store;
    private initialized;
    private cachedPrivateTimelineOwnerUserId;
    private cachedPrivateTimelineOwnerResolvedAt;
    constructor(db?: DatabaseService | undefined);
    onModuleInit(): Promise<void>;
    private normalizeScope;
    private isScopeMatch;
    listRecords(filters?: {
        owner?: string;
        tenantId?: string;
        workspaceId?: string;
        kind?: UnifiedRecordKind;
        status?: UnifiedRecordStatus;
        lane?: UnifiedWorkLane;
        horizon?: UnifiedWorkHorizon;
        q?: string;
    }): Promise<UnifiedTaskRecord[]>;
    getRecord(id: string, owner?: string, scope?: LedgerScope): Promise<UnifiedTaskRecord | null>;
    createRecord(input: CreateRecordInput): Promise<UnifiedTaskRecord>;
    updateRecord(id: string, patch: Partial<UnifiedTaskRecord>, owner?: string, scope?: LedgerScope): Promise<UnifiedTaskRecord | null>;
    voteRecord(id: string, direction: 'up' | 'down', owner?: string, scope?: LedgerScope): Promise<UnifiedTaskRecord | null>;
    addFunctionalLink(id: string, link: Omit<FunctionalLink, 'createdAt'>, owner?: string, scope?: LedgerScope): Promise<UnifiedTaskRecord | null>;
    addFeedbackIteration(id: string, input: Omit<FeedbackIteration, 'id' | 'createdAt' | 'iteration'> & {
        iteration?: number;
    }, owner?: string, scope?: LedgerScope): Promise<UnifiedTaskRecord | null>;
    ingestOrchestrationEvent(payload: Record<string, unknown>): Promise<UnifiedTaskRecord>;
    getGrid(owner?: string, scope?: LedgerScope): Promise<{
        total: number;
        byKind: Record<string, number>;
        byStatus: Record<string, number>;
        averageProgressPercent: number;
        averageRhythmBpm: number;
    }>;
    listTimelineEvents(params?: {
        userId?: string;
        viewerUserId?: string;
        tenantId?: string;
        workspaceId?: string;
        recordId?: string;
        goalId?: string;
        planId?: string;
        eventType?: string;
        actor?: string;
        dateFrom?: string;
        dateTo?: string;
        timelineTrack?: string;
    }): Promise<TimelineEvent[]>;
    getTimelineEvent(id: string, userId?: string, scope?: LedgerScope): Promise<TimelineEvent | null>;
    createTimelineEvent(input: {
        userId?: string;
        tenantId?: string;
        workspaceId?: string;
        recordId?: string;
        goalId?: string;
        planId?: string;
        eventType?: TimelineEvent['eventType'];
        actor?: string;
        timestamp?: string;
        payload?: Record<string, unknown>;
    }): Promise<TimelineEvent>;
    bootstrapPersonalTimeline(userId: string, context?: {
        email?: string;
        name?: string;
        role?: string;
        roles?: string[];
    }): Promise<{
        message: string;
        createdCount: number;
        totalCount: number;
        events: TimelineEvent[];
    }>;
    importGithubNarrativeTimeline(userId: string, input?: GithubNarrativeImportInput): Promise<{
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
    getGithubNarrativeGraph(params?: {
        userId?: string;
        viewerUserId?: string;
        timelineTrack?: string;
    }): Promise<{
        ownerUserId: string | null;
        eventCount: number;
        nodeCount: number;
        edgeCount: number;
        generatedAt: string | null;
        nodes: Array<{
            id: string;
            label: string;
            kind: 'repo' | 'reference';
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
    updateTimelineEvent(id: string, patch: {
        userId?: string;
        tenantId?: string;
        workspaceId?: string;
        actor?: string;
        timestamp?: string;
        payload?: Record<string, unknown>;
    }, scope?: LedgerScope): Promise<TimelineEvent | null>;
    deleteTimelineEvent(id: string, userId?: string, scope?: LedgerScope): Promise<boolean>;
    createGoal(input: {
        title: string;
        description: string;
        owner?: string;
        tenantId?: string;
        workspaceId?: string;
        linkedRecordIds?: string[];
    }): Promise<GoalRecord>;
    listGoals(filters?: {
        owner?: string;
        tenantId?: string;
        workspaceId?: string;
    }): Promise<GoalRecord[]>;
    getGoal(goalId: string, owner?: string, scope?: LedgerScope): Promise<GoalRecord | null>;
    linkGoalToRecord(goalId: string, recordId: string, actor?: string, owner?: string, scope?: LedgerScope): Promise<GoalRecord | null>;
    addGoalMilestone(goalId: string, input: {
        owner?: string;
        title: string;
        dueAt?: string;
        status?: 'pending' | 'in_progress' | 'completed' | 'blocked';
    }, scope?: LedgerScope): Promise<GoalRecord | null>;
    updateGoalMilestone(goalId: string, milestoneId: string, patch: {
        owner?: string;
        title?: string;
        dueAt?: string;
        status?: 'pending' | 'in_progress' | 'completed' | 'blocked';
    }, scope?: LedgerScope): Promise<GoalRecord | null>;
    removeGoalMilestone(goalId: string, milestoneId: string, owner?: string, scope?: LedgerScope): Promise<GoalRecord | null>;
    createPlan(input: {
        name: string;
        objective: string;
        owner?: string;
        tenantId?: string;
        workspaceId?: string;
        linkedGoalIds?: string[];
        linkedRecordIds?: string[];
        cadence?: {
            cycleDays?: number;
            reviewBpm?: number;
            progressPercent?: number;
        };
    }): Promise<ProjectPlanRecord>;
    listPlans(filters?: {
        owner?: string;
        tenantId?: string;
        workspaceId?: string;
    }): Promise<ProjectPlanRecord[]>;
    getPlan(planId: string, owner?: string, scope?: LedgerScope): Promise<ProjectPlanRecord | null>;
    getRecordConnections(recordId: string, owner?: string, scope?: LedgerScope): Promise<{
        goals: GoalRecord[];
        plans: ProjectPlanRecord[];
    }>;
    linkPlan(planId: string, input: {
        owner?: string;
        goalId?: string;
        recordId?: string;
        actor?: string;
    }, scope?: LedgerScope): Promise<ProjectPlanRecord | null>;
    private resolveTimelineAccess;
    private hasWorkspaceDelegatedTimelineAccess;
    private getPrivateTimelineAgentUserIds;
    private shouldReadLibrarianTimeline;
    private resolvePrivateTimelineOwnerUserId;
    private timelineTrackToProject;
    private timelineTrackToUiCategory;
    private loadGithubNarrativeReport;
    private resolveGithubNarrativePath;
    private normalizeTimelineId;
    private normalizeOptionalTimestamp;
    private normalizeGithubEventTimestamp;
    private buildGithubStoryKey;
    private extractGithubEvidenceRefs;
    private normalizeGithubNarrativeConnections;
    private normalizeGithubNarrativeConnection;
    private buildGithubConnectionIndex;
    private extractGithubNodeRefs;
    private matchGithubConnections;
    private normalizeGithubNodeId;
    private githubTimelineCategory;
    private githubTimelineProject;
    private safeJsonObject;
    private safeJsonStringArray;
    private extractStoryArchitectSourceRefs;
    private listPublicTimelineEvents;
    private mapLibrarianRowsToTimelineEvents;
    private listLibrarianTimelineEvents;
    private getLibrarianTimelineEventById;
    private ensureLoaded;
    private persist;
    private resolveStorePath;
    private ensureStoreDirectory;
    private isPermissionError;
    private makeId;
    private pushEvent;
    private normalizeStatus;
    private normalizePriority;
    private migrateRecord;
    private normalizeItinerary;
    private mergeItinerary;
    private normalizeLane;
    private normalizeHorizon;
    private normalizeCoordinationMode;
    private normalizeSignalSources;
    private normalizeTimestamp;
    private validateEventType;
    private validateTimelineRefs;
    private findDuplicateTimelineEvent;
    private buildPersonalTimelineBlueprint;
    private readLocalJourneySummary;
    private readAppleNotesBatchSummary;
    private readChronologicalReadthroughSummary;
}
export {};
//# sourceMappingURL=unified-ledger.service.d.ts.map