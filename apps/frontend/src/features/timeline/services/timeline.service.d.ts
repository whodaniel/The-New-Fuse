import { TimelineService as ITimelineService } from '../../../types/services';
import { TimelineEvent, TimelineBranch, TimelineWorkflow } from '../../../types/timeline';
export declare class TimelineService implements ITimelineService {
    getEventTimeline(branchId: string, includeDetails?: boolean): Promise<TimelineEvent[]>;
    getBranchHierarchy(branchId: string): Promise<TimelineBranch[]>;
    getWorkflowsByEvent(eventId: string): Promise<TimelineWorkflow[]>;
    createBranch(name: string, startEventId: string, parentBranchId?: string): Promise<TimelineBranch>;
    mergeBranch(branchId: string, targetEventId: string, mergedFromEvents: string[]): Promise<void>;
    createWorkflow(params: {
        name: string;
        description: string;
        eventId: string;
        steps: any[];
    }): Promise<TimelineWorkflow>;
    executeWorkflowStep(workflowId: string, stepId: string, result: any): Promise<void>;
}
