import {
  TimelineBranch,
  TimelineWorkflow,
  WorkflowStep,
  TimelineService,
} from '../types.js';
interface UseTimelineProps {
  timelineService: TimelineService;
  initialBranchId?: string;
}
export declare const useTimeline: ({
  timelineService,
  initialBranchId,
}: UseTimelineProps) => {
  events: TimelineEvent[];
  branches: TimelineBranch[];
  workflows: TimelineWorkflow[];
  loading: boolean;
  error: Error;
  currentBranchId: string;
  createBranch: (
    name: string,
    startEventId: string,
    parentBranchId?: string,
  ) => Promise<TimelineBranch>;
  mergeBranch: (
    branchId: string,
    targetEventId: string,
    mergedFromEvents: string[],
  ) => Promise<void>;
  createWorkflow: (
    name: string,
    description: string,
    eventId: string,
    steps: Omit<WorkflowStep, "id" | "workflowId">[],
  ) => Promise<TimelineWorkflow>;
  executeWorkflowStep: (
    workflowId: string,
    stepId: string,
    result: unknown,
  ) => Promise<void>;
  switchBranch: (branchId: string) => void;
  refresh: () => Promise<void>;
};
export {};
