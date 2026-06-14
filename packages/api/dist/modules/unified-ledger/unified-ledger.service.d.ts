import { OnModuleInit } from '@nestjs/common';
import { FeedbackIteration, FunctionalLink, GoalRecord, ProjectPlanRecord, TimelineEvent, UnifiedRecordKind, UnifiedRecordStatus, UnifiedTaskRecord } from './unified-ledger.types.js';
type CreateRecordInput = Partial<UnifiedTaskRecord> & Pick<UnifiedTaskRecord, 'title' | 'description'>;
export declare class UnifiedLedgerService implements OnModuleInit {
    private readonly logger;
    private readonly storePath;
    private store;
    private initialized;
    private ws;
    onModuleInit(): Promise<void>;
    private initRelayConnection;
    private broadcast;
    listRecords(filters?: {
        kind?: UnifiedRecordKind;
        status?: UnifiedRecordStatus;
        q?: string;
    }): Promise<UnifiedTaskRecord[]>;
    getRecord(id: string): Promise<UnifiedTaskRecord | null>;
    createRecord(input: CreateRecordInput): Promise<UnifiedTaskRecord>;
    updateRecord(id: string, patch: Partial<UnifiedTaskRecord>): Promise<UnifiedTaskRecord | null>;
    voteRecord(id: string, direction: 'up' | 'down'): Promise<UnifiedTaskRecord | null>;
    addFunctionalLink(id: string, link: Omit<FunctionalLink, 'createdAt'>): Promise<UnifiedTaskRecord | null>;
    addFeedbackIteration(id: string, input: Omit<FeedbackIteration, 'id' | 'createdAt' | 'iteration'> & {
        iteration?: number;
    }): Promise<UnifiedTaskRecord | null>;
    ingestOrchestrationEvent(payload: Record<string, unknown>): Promise<UnifiedTaskRecord>;
    getGrid(): Promise<{
        total: number;
        byKind: Record<string, number>;
        byStatus: Record<string, number>;
        averageProgressPercent: number;
        averageRhythmBpm: number;
    }>;
    listTimelineEvents(params?: {
        recordId?: string;
        goalId?: string;
        planId?: string;
        eventType?: string;
        actor?: string;
        dateFrom?: string;
        dateTo?: string;
    }): Promise<TimelineEvent[]>;
    getTimelineEvent(id: string): Promise<TimelineEvent | null>;
    createTimelineEvent(input: {
        recordId?: string;
        goalId?: string;
        planId?: string;
        eventType?: TimelineEvent['eventType'];
        actor?: string;
        timestamp?: string;
        payload?: Record<string, unknown>;
    }): Promise<TimelineEvent>;
    updateTimelineEvent(id: string, patch: {
        actor?: string;
        timestamp?: string;
        payload?: Record<string, unknown>;
    }): Promise<TimelineEvent | null>;
    createGoal(input: {
        title: string;
        description: string;
        owner?: string;
        linkedRecordIds?: string[];
    }): Promise<GoalRecord>;
    listGoals(): Promise<GoalRecord[]>;
    getGoal(goalId: string): Promise<GoalRecord | null>;
    linkGoalToRecord(goalId: string, recordId: string, actor?: string): Promise<GoalRecord | null>;
    addGoalMilestone(goalId: string, input: {
        title: string;
        dueAt?: string;
        status?: 'pending' | 'in_progress' | 'completed' | 'blocked';
    }): Promise<GoalRecord | null>;
    updateGoalMilestone(goalId: string, milestoneId: string, patch: {
        title?: string;
        dueAt?: string;
        status?: 'pending' | 'in_progress' | 'completed' | 'blocked';
    }): Promise<GoalRecord | null>;
    removeGoalMilestone(goalId: string, milestoneId: string): Promise<GoalRecord | null>;
    createPlan(input: {
        name: string;
        objective: string;
        owner?: string;
        linkedGoalIds?: string[];
        linkedRecordIds?: string[];
        cadence?: {
            cycleDays?: number;
            reviewBpm?: number;
            progressPercent?: number;
        };
    }): Promise<ProjectPlanRecord>;
    listPlans(): Promise<ProjectPlanRecord[]>;
    getPlan(planId: string): Promise<ProjectPlanRecord | null>;
    getRecordConnections(recordId: string): Promise<{
        goals: GoalRecord[];
        plans: ProjectPlanRecord[];
    }>;
    linkPlan(planId: string, input: {
        goalId?: string;
        recordId?: string;
        actor?: string;
    }): Promise<ProjectPlanRecord | null>;
    getMacroView(): Promise<any>;
    private ensureLoaded;
    private persist;
    private makeId;
    private pushEvent;
    private normalizeStatus;
    private normalizePriority;
    private normalizeTimestamp;
    private validateEventType;
    private validateTimelineRefs;
    private findDuplicateTimelineEvent;
}
export {};
//# sourceMappingURL=unified-ledger.service.d.ts.map