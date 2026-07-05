import { UnifiedLedgerService } from './unified-ledger.service';
import { UnifiedRecordKind, UnifiedRecordStatus } from './unified-ledger.types';
export declare class UnifiedLedgerController {
    private readonly ledger;
    constructor(ledger: UnifiedLedgerService);
    list(kind?: UnifiedRecordKind, status?: UnifiedRecordStatus, q?: string): Promise<any>;
    get(id: string): Promise<any>;
    connections(id: string): Promise<any>;
    create(body: any): Promise<any>;
    patch(id: string, body: any): Promise<any>;
    vote(id: string, body: {
        direction: 'up' | 'down';
    }): Promise<any>;
    feedback(id: string, body: any): Promise<any>;
    link(id: string, body: any): Promise<any>;
    ingest(body: any): Promise<any>;
    grid(): Promise<any>;
    macro(): Promise<any>;
    timeline(recordId?: string, goalId?: string, planId?: string, eventType?: string, actor?: string, dateFrom?: string, dateTo?: string): Promise<any>;
    timelineEvent(id: string): Promise<any>;
    createTimelineEvent(body: any): Promise<any>;
    patchTimelineEvent(id: string, body: any): Promise<any>;
    createGoal(body: any): Promise<any>;
    listGoals(): Promise<any>;
    getGoal(id: string): Promise<any>;
    linkGoalRecord(id: string, body: {
        recordId: string;
        actor?: string;
    }): Promise<any>;
    addMilestone(id: string, body: any): Promise<any>;
    updateMilestone(id: string, milestoneId: string, body: any): Promise<any>;
    deleteMilestone(id: string, milestoneId: string): Promise<any>;
    createPlan(body: any): Promise<any>;
    listPlans(): Promise<any>;
    getPlan(id: string): Promise<any>;
    linkPlan(id: string, body: {
        goalId?: string;
        recordId?: string;
        actor?: string;
    }): Promise<any>;
    listTasks(status?: UnifiedRecordStatus, q?: string): Promise<any>;
    getTask(id: string): Promise<any>;
    createTask(body: any): Promise<any>;
    patchTask(id: string, body: any): Promise<any>;
    listSuggestions(status?: UnifiedRecordStatus, q?: string): Promise<any>;
    getSuggestion(id: string): Promise<any>;
    createSuggestion(body: any): Promise<any>;
    patchSuggestion(id: string, body: any): Promise<any>;
    voteSuggestion(id: string, body: {
        direction: 'up' | 'down';
    }): Promise<any>;
}
//# sourceMappingURL=unified-ledger.controller.d.ts.map