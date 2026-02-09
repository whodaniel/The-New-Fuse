// Feature suggestion related types
export enum SuggestionStatus {
  NEW = 'new',
  ACCEPTED = 'accepted',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  DEFERRED = 'deferred',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review'
}

export interface FeatureSuggestion {
  id: string;
  title: string;
  description: string;
  status: SuggestionStatus;
  votes: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  tags?: string[];
  priority?: string;
}

export interface SuggestionVote {
  id: string;
  suggestionId: string;
  userId: string;
  createdAt: Date;
}

export interface FeatureConversion {
  id: string;
  suggestionId: string;
  taskId: string;
  convertedAt: Date;
  convertedBy: string;
}

export interface TodoItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  assignedTo?: string;
  priority?: string;
}

// Service interfaces
export interface SuggestionService {
  getSuggestions(): Promise<FeatureSuggestion[]>;
  getSuggestion(id: string): Promise<FeatureSuggestion>;
  getSuggestionsByStatus(status: SuggestionStatus): Promise<FeatureSuggestion[]>;
  createSuggestion(suggestion: Omit<FeatureSuggestion, 'id' | 'createdAt' | 'updatedAt' | 'votes'>): Promise<FeatureSuggestion>;
  updateSuggestion(id: string, suggestion: Partial<FeatureSuggestion>): Promise<FeatureSuggestion>;
  updateSuggestionStatus(id: string, status: SuggestionStatus): Promise<FeatureSuggestion>;
  deleteSuggestion(id: string): Promise<any>;
  voteForSuggestion(suggestionId: string): Promise<void>;
  convertToFeature(suggestionId: string): Promise<FeatureSuggestion>;
  convertToTask(suggestionId: string): Promise<FeatureConversion>;
  getAllTodos(): Promise<TodoItem[]>;
  updateTodoStatus(id: string, status: any): Promise<TodoItem>;
  deleteTodo(id: string): Promise<any>;
  duplicateSuggestion(id: string): Promise<FeatureSuggestion>;
  duplicateTodo(id: string): Promise<TodoItem>;
}