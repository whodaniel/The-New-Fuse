// Define missing types to avoid private name errors
export interface TimelineEvent {
  id: string;
  title: string;
  timestamp: Date;
  type: string;
  description?: string;
  branchId: string;
  metadata?: Record<string, any>;
}

export interface TimelineBranch {
  id: string;
  name: string;
  parentBranchId?: string;
  startEventId: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface TimelineWorkflow {
  id: string;
  name: string;
  description: string;
  eventId: string;
  status: string;
  steps: WorkflowStep[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowStep {
  id: string;
  workflowId: string;
  name: string;
  description?: string;
  type: string;
  order: number;
  status: string;
  result?: any;
  metadata?: Record<string, any>;
}

export enum SuggestionStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REJECTED = 'rejected'
}

export interface FeatureSuggestion {
  id: string;
  title: string;
  description: string;
  status: SuggestionStatus;
  createdBy: string;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface TodoItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: Date;
  priority: string;
  assignedTo?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

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
