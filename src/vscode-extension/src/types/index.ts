// Core type definitions for The New Fuse

export * from './llm';
export * from './mcp';
export * from './agent-communication';
export * from './ai-coder';
export * from './webview';

// Types for Feature Suggestions and Kanban functionality
export enum SuggestionStatus {
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  IMPLEMENTED = 'implemented',
  PLANNED = 'planned'
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  BLOCKED = 'blocked'
}

export enum SuggestionPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface FeatureSuggestion {
  id: string;
  title: string;
  description: string;
  status: SuggestionStatus;
  priority: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  submittedBy?: string;
  votes?: number;
}

export interface TodoItem {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: string;
  createdAt: Date;
  updatedAt: Date;
  suggestionId?: string;
  assignedTo?: string;
  dueDate?: Date;
}

export interface SuggestionService {
  getSuggestionsByStatus(status: SuggestionStatus | null): Promise<FeatureSuggestion[]>;
  getAllTodos(): Promise<TodoItem[]>;
  updateSuggestionStatus(id: string, status: SuggestionStatus): Promise<FeatureSuggestion>;
  updateTodoStatus(id: string, status: TaskStatus): Promise<TodoItem>;
  convertToFeature(suggestionId: string): Promise<FeatureSuggestion>;
  deleteSuggestion?(id: string): Promise<{ id: string }>;
  deleteTodo?(id: string): Promise<{ id: string }>;
  duplicateSuggestion?(id: string): Promise<FeatureSuggestion>;
  duplicateTodo?(id: string): Promise<TodoItem>;
}
