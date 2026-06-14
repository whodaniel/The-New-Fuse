import { UnifiedLedgerService } from './unified-ledger.service.js';
import { UnifiedRecordKind, UnifiedRecordStatus } from './unified-ledger.types.js';
export declare class UnifiedLedgerController {
    private readonly ledger;
    constructor(ledger: UnifiedLedgerService);
    list(kind?: UnifiedRecordKind, status?: UnifiedRecordStatus, q?: string): Promise<import("./unified-ledger.types.js").UnifiedTaskRecord[]>;
    get(id: string): Promise<import("./unified-ledger.types.js").UnifiedTaskRecord>;
    connections(id: string): Promise<{
        goals: import("./unified-ledger.types.js").GoalRecord[];
        plans: import("./unified-ledger.types.js").ProjectPlanRecord[];
    }>;
    create(body: any): Promise<import("./unified-ledger.types.js").UnifiedTaskRecord>;
    patch(id: string, body: any): Promise<import("./unified-ledger.types.js").UnifiedTaskRecord>;
    vote(id: string, body: {
        direction: 'up' | 'down';
    }): Promise<import("./unified-ledger.types.js").UnifiedTaskRecord>;
    feedback(id: string, body: any): Promise<import("./unified-ledger.types.js").UnifiedTaskRecord>;
    link(id: string, body: any): Promise<import("./unified-ledger.types.js").UnifiedTaskRecord>;
    ingest(body: any): Promise<import("./unified-ledger.types.js").UnifiedTaskRecord>;
    grid(): Promise<{
        total: number;
        byKind: Record<string, number>;
        byStatus: Record<string, number>;
        averageProgressPercent: number;
        averageRhythmBpm: number;
    }>;
    macro(): Promise<any>;
    timeline(recordId?: string, goalId?: string, planId?: string, eventType?: string, actor?: string, dateFrom?: string, dateTo?: string): Promise<import("./unified-ledger.types.js").TimelineEvent[]>;
    timelineEvent(id: string): Promise<import("./unified-ledger.types.js").TimelineEvent>;
    createTimelineEvent(body: any): Promise<import("./unified-ledger.types.js").TimelineEvent>;
    patchTimelineEvent(id: string, body: any): Promise<import("./unified-ledger.types.js").TimelineEvent>;
    createGoal(body: any): Promise<import("./unified-ledger.types.js").GoalRecord>;
    listGoals(): Promise<import("./unified-ledger.types.js").GoalRecord[]>;
    getGoal(id: string): Promise<import("./unified-ledger.types.js").GoalRecord>;
    linkGoalRecord(id: string, body: {
        recordId: string;
        actor?: string;
    }): Promise<import("./unified-ledger.types.js").GoalRecord>;
    addMilestone(id: string, body: any): Promise<import("./unified-ledger.types.js").GoalRecord>;
    updateMilestone(id: string, milestoneId: string, body: any): Promise<import("./unified-ledger.types.js").GoalRecord>;
    deleteMilestone(id: string, milestoneId: string): Promise<import("./unified-ledger.types.js").GoalRecord>;
    createPlan(body: any): Promise<import("./unified-ledger.types.js").ProjectPlanRecord>;
    listPlans(): Promise<import("./unified-ledger.types.js").ProjectPlanRecord[]>;
    getPlan(id: string): Promise<import("./unified-ledger.types.js").ProjectPlanRecord>;
    linkPlan(id: string, body: {
        goalId?: string;
        recordId?: string;
        actor?: string;
    }): Promise<import("./unified-ledger.types.js").ProjectPlanRecord>;
    listTasks(status?: UnifiedRecordStatus, q?: string): Promise<import("./unified-ledger.types.js").UnifiedTaskRecord[]>;
    getTask(id: string): Promise<import("./unified-ledger.types.js").UnifiedTaskRecord>;
    createTask(body: any): Promise<import("./unified-ledger.types.js").UnifiedTaskRecord>;
    patchTask(id: string, body: any): Promise<import("./unified-ledger.types.js").UnifiedTaskRecord>;
    listSuggestions(status?: UnifiedRecordStatus, q?: string): Promise<import("./unified-ledger.types.js").UnifiedTaskRecord[]>;
    getSuggestion(id: string): Promise<import("./unified-ledger.types.js").UnifiedTaskRecord>;
    createSuggestion(body: any): Promise<import("./unified-ledger.types.js").UnifiedTaskRecord>;
    patchSuggestion(id: string, body: any): Promise<import("./unified-ledger.types.js").UnifiedTaskRecord>;
    voteSuggestion(id: string, body: {
        direction: 'up' | 'down';
    }): Promise<import("./unified-ledger.types.js").UnifiedTaskRecord>;
}
//# sourceMappingURL=unified-ledger.controller.d.ts.map