import { FeatureSuggestion, TodoItem } from '../types.js';
import { FeatureProgress } from '@the-new-fuse/feature-tracker';

// Re-export SuggestionStatus enum for use throughout the application
export enum SuggestionStatus {
    NEW = 'NEW',
    UNDER_REVIEW = 'UNDER_REVIEW',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    IMPLEMENTED = 'IMPLEMENTED',
    SUBMITTED = 'SUBMITTED',
    PENDING = 'PENDING',
    CONVERTED = 'CONVERTED'
}

export type TimelineEventType = 'SUGGESTION' | 'TODO' | 'FEATURE' | 'WORKFLOW_STEP' | 'AGENT' | 'NOTE' | 'VIRTUAL' | 'COMMENT';

export interface TimelineItem {
  id: string;
}

export interface TimelineNote {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  author: string;
  color?: string;
  tags?: string[];
}

export interface TimelineRange {
  id: string;
  startDate: Date;
  endDate: Date;
  label: string;
  color?: string;
  type: 'milestone' | 'phase' | 'sprint';
}

export interface TimelineEvent {
  id: string;
  parentId?: string;
  type: TimelineEventType;
  timestamp: string;
  mergedFrom?: string[];
  data: {
    title: string;
    description?: string;
    status?: string;
    progress?: FeatureProgress;
    [key: string]: unknown;
  };
}

export interface TimelineBranch {
  id: string;
  name: string;
  status: BranchStatus;
  parentBranchId?: string;
  startEventId: string;
  events: string[];
  mergedIntoEvent?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimelineWorkflow {
  id: string;
  eventId: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  currentStepId?: string;
  steps: WorkflowStep[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStep {
  id: string;
  workflowId: string;
  title: string;
  description: string;
  status: WorkflowStatus;
  order: number;
  result?: unknown;
  completedAt?: string;
}

export type BranchStatus = 'ACTIVE' | 'MERGED' | 'ABANDONED';

export type WorkflowStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export interface TimelinePosition {
  x: number;
  y: number;
}
