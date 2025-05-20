import { TimelineEvent, TimelineBranch, TimelineWorkflow } from '../types/timeline.js';
import { TimelineService } from '../services/timeline.service.js';
interface UseTimelineProps {
    timelineService: TimelineService;
    initialBranchId?: string;
}
export declare const useTimeline: ({ timelineService, initialBranchId }: UseTimelineProps) => {
    events: TimelineEvent[];
    branches: TimelineBranch[];
    workflows: TimelineWorkflow[];
    loading: boolean;
    error: Error | null;
    currentBranchId: string | undefined;
    createBranch: () => Promise<void>;
    mergeBranch: () => Promise<void>;
    createWorkflow: () => Promise<void>;
    executeWorkflowStep: () => Promise<void>;
    switchBranch: (branchId: string) => void;
    refresh: () => "" | Promise<void> | undefined;
};
export {};
