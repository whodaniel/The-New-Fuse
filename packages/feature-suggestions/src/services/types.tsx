import { 
  FeatureSuggestion, 
  TodoItem, 
  SuggestionStatus, 
  SuggestionPriority 
} from '../types.js';
import { 
  TimelineEvent, 
  TimelineBranch, 
  TimelineWorkflow, 
  WorkflowStep 
} from '../types/timeline.js';

/**
 * Interface for the suggestion service that handles feature suggestions and todos
 */
export interface SuggestionService {
  /**
   * Get suggestions by status
   * @param status The status to filter by
   * @returns A promise that resolves to an array of feature suggestions
   */
  getSuggestionsByStatus(status: SuggestionStatus): Promise<FeatureSuggestion[]>;
  
  /**
   * Get popular suggestions
   * @returns A promise that resolves to an array of feature suggestions
   */
  getPopularSuggestions(): Promise<FeatureSuggestion[]>;
  
  /**
   * Get all todos
   * @returns A promise that resolves to an array of todo items
   */
  getAllTodos(): Promise<TodoItem[]>;
  
  /**
   * Update the status of a suggestion
   * @param id The ID of the suggestion to update
   * @param status The new status
   * @returns A promise that resolves to the updated suggestion
   */
  updateSuggestionStatus(id: string, status: SuggestionStatus): Promise<FeatureSuggestion>;
  
  /**
   * Update the status of a todo
   * @param id The ID of the todo to update
   * @param status The new status
   * @returns A promise that resolves to the updated todo
   */
  updateTodoStatus(id: string, status: string): Promise<TodoItem>;
  
  /**
   * Submit a new suggestion
   * @param suggestion The suggestion to submit
   * @returns A promise that resolves to the created suggestion
   */
  submitSuggestion(suggestion: {
    title: string;
    description: string;
    submittedBy: string;
    priority: SuggestionPriority;
    tags: string[];
    status: SuggestionStatus;
  }): Promise<FeatureSuggestion>;
  
  /**
   * Vote for a suggestion
   * @param suggestionId The ID of the suggestion to vote for
   * @param userId The ID of the user voting
   * @returns A promise that resolves when the vote is recorded
   */
  voteSuggestion(suggestionId: string, userId: string): Promise<void>;
  
  /**
   * Convert a suggestion to a feature
   * @param suggestionId The ID of the suggestion to convert
   * @returns A promise that resolves to the converted suggestion
   */
  convertToFeature(suggestionId: string): Promise<FeatureSuggestion>;
  
  /**
   * Add a todo to a suggestion
   * @param todo The todo to add
   * @returns A promise that resolves to the created todo
   */
  addTodo(todo: {
    title: string;
    description: string;
    priority: SuggestionPriority;
    suggestionId: string;
    assignedTo?: string;
    dueDate?: Date;
  }): Promise<TodoItem>;
  
  /**
   * Add a comment to a suggestion
   * @param comment The comment to add
   * @returns A promise that resolves to the created comment
   */
  addComment(comment: {
    suggestionId: string;
    content: string;
    authorId: string;
  }): Promise<Comment>;
}

/**
 * Interface for the timeline service that handles timeline events, branches, and workflows
 */
export interface TimelineService {
  /**
   * Get timeline events for a branch
   * @param branchId The ID of the branch
   * @returns A promise that resolves to an array of timeline events
   */
  getEventTimeline(branchId: string): Promise<TimelineEvent[]>;
  
  /**
   * Get the branch hierarchy
   * @param branchId The ID of the branch
   * @returns A promise that resolves to an array of timeline branches
   */
  getBranchHierarchy(branchId: string): Promise<TimelineBranch[]>;
  
  /**
   * Get workflows for a branch
   * @param eventId The ID of the event
   * @returns A promise that resolves to an array of timeline workflows
   */
  getWorkflowsByEvent(eventId: string): Promise<TimelineWorkflow[]>;
  
  /**
   * Create a new branch
   * @param branch The branch to create
   * @returns A promise that resolves to the created branch
   */
  createBranch(branchData: {
    name: string;
    startEventId: string;
    parentBranchId?: string;
  }): Promise<TimelineBranch>;
  
  /**
   * Merge a branch
   * @param merge The merge details
   * @returns A promise that resolves when the merge is complete
   */
  mergeBranch(mergeData: {
    branchId: string;
    targetEventId: string;
    mergedFromEvents: string[];
  }): Promise<void>;
  
  /**
   * Create a new workflow
   * @param workflow The workflow to create
   * @returns A promise that resolves to the created workflow
   */
  createWorkflow(workflowData: {
    name: string;
    description: string;
    eventId: string;
    steps: Omit<WorkflowStep, 'id' | 'workflowId'>[];
  }): Promise<TimelineWorkflow>;
  
  /**
   * Execute a workflow step
   * @param workflowId The ID of the workflow
   * @param stepId The ID of the step
   * @param result The result of the step execution
   * @returns A promise that resolves to the next step or null if there is no next step
   */
  executeWorkflowStep(
    workflowId: string,
    stepId: string,
    result: unknown
  ): Promise<void>;
}
