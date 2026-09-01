import { TimelineEvent, TimelineBranch, TimelineWorkflow } from '../types/timeline.js';

/**
 * Service for managing timeline events, branches, and workflows
 */
export interface TimelineService {
  /**
   * Get all timeline events
   */
  getEvents(): Promise<TimelineEvent[]>;
  
  /**
   * Get a timeline event by ID
   */
  getEventById(id: string): Promise<TimelineEvent | null>;
  
  /**
   * Create a new timeline event
   */
  createEvent(event: Partial<TimelineEvent>): Promise<TimelineEvent>;
  
  /**
   * Update a timeline event
   */
  updateEvent(id: string, data: Partial<TimelineEvent>): Promise<TimelineEvent>;
  
  /**
   * Delete a timeline event
   */
  deleteEvent(id: string): Promise<void>;
  
  /**
   * Get all timeline branches
   */
  getBranches(): Promise<TimelineBranch[]>;
  
  /**
   * Get a timeline branch by ID
   */
  getBranchById(id: string): Promise<TimelineBranch | null>;
  
  /**
   * Create a new timeline branch
   */
  createBranch(branch: Partial<TimelineBranch>): Promise<TimelineBranch>;
  
  /**
   * Update a timeline branch
   */
  updateBranch(id: string, data: Partial<TimelineBranch>): Promise<TimelineBranch>;
  
  /**
   * Delete a timeline branch
   */
  deleteBranch(id: string): Promise<void>;
  
  /**
   * Get all timeline workflows
   */
  getWorkflows(): Promise<TimelineWorkflow[]>;
  
  /**
   * Get a timeline workflow by ID
   */
  getWorkflowById(id: string): Promise<TimelineWorkflow | null>;
  
  /**
   * Create a new timeline workflow
   */
  createWorkflow(workflow: Partial<TimelineWorkflow>): Promise<TimelineWorkflow>;
  
  /**
   * Update a timeline workflow
   */
  updateWorkflow(id: string, data: Partial<TimelineWorkflow>): Promise<TimelineWorkflow>;
  
  /**
   * Delete a timeline workflow
   */
  deleteWorkflow(id: string): Promise<void>;
  
  /**
   * Merge a branch into another branch
   */
  mergeBranch(fromBranchId: string, toBranchId: string): Promise<void>;
  
  /**
   * Execute a workflow step
   */
  executeWorkflowStep(workflowId: string, stepId: string): Promise<void>;
}
