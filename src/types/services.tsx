import {
  TimelineEvent,
  TimelineBranch,
  TimelineWorkflow,
  WorkflowStep,
} from './timeline.js';
import { FeatureSuggestion, SuggestionStatus } from './features.js';

export interface TimelineService {
  getEventTimeline(
    branchId: string,
    includeDetails?: boolean,
  ): Promise<TimelineEvent[]>;
  getBranchHierarchy(branchId: string): Promise<TimelineBranch[]>;
  getWorkflowsByEvent(eventId: string): Promise<TimelineWorkflow[]>;
  createBranch(
    name: string,
    startEventId: string,
    parentBranchId?: string,
  ): Promise<TimelineBranch>;
  mergeBranch(
    branchId: string,
    targetEventId: string,
    mergedFromEvents: string[],
  ): Promise<void>;
  createWorkflow(params: {
    name: string;
    description: string;
    eventId: string;
    steps: Omit<WorkflowStep, "id" | "workflowId">[];
  }): Promise<TimelineWorkflow>;
  executeWorkflowStep(
    workflowId: string,
    stepId: string,
    result: unknown,
  ): Promise<void>;
}

export interface SuggestionService {
  getSuggestionsByStatus(
    status: SuggestionStatus,
  ): Promise<FeatureSuggestion[]>;
  getAllTodos(): Promise<TodoItem[]>;
  updateSuggestionStatus(id: string, status: SuggestionStatus): Promise<void>;
  createSuggestion(
    suggestion: Omit<FeatureSuggestion, "id">,
  ): Promise<FeatureSuggestion>;
}
