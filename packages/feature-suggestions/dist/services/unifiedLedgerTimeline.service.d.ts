import { TimelineService } from './types.js';
import { TimelineBranch, TimelineEvent, TimelineWorkflow, WorkflowStep } from '../types/timeline.js';
/**
 * Timeline adapter backed by the unified ledger API.
 * This provides a bridge so existing feature-suggestions timeline hooks can
 * operate on the centralized chronology source.
 */
export declare class UnifiedLedgerTimelineService implements TimelineService {
    private readonly baseUrl;
    constructor(baseUrl?: string);
    private postTimelineEvent;
    getEventTimeline(branchId: string): Promise<TimelineEvent[]>;
    getBranchHierarchy(branchId: string): Promise<TimelineBranch[]>;
    getWorkflowsByEvent(eventId: string): Promise<TimelineWorkflow[]>;
    createBranch(branchData: {
        name: string;
        startEventId: string;
        parentBranchId?: string | undefined;
    }): Promise<TimelineBranch>;
    mergeBranch(_mergeData: {
        branchId: string;
        targetEventId: string;
        mergedFromEvents: string[];
    }): Promise<void>;
    createWorkflow(workflowData: {
        name: string;
        description: string;
        eventId: string;
        steps: Omit<WorkflowStep, 'id' | 'workflowId'>[];
    }): Promise<TimelineWorkflow>;
    executeWorkflowStep(_workflowId: string, _stepId: string, _result: unknown): Promise<void>;
}
//# sourceMappingURL=unifiedLedgerTimeline.service.d.ts.map