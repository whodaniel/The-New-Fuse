/**
 * Types module for the hooks package
 * Defines all necessary types used by hooks
 */

import { createContext } from 'react';

// Feature and suggestion related enums
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

// Task related enums
export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  BLOCKED = 'blocked'
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum TaskType {
  FEATURE = 'feature',
  BUG = 'bug',
  IMPROVEMENT = 'improvement',
  DOCUMENTATION = 'documentation',
  OTHER = 'other'
}

// Feature suggestion related interfaces
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
  status: TaskStatus;
}

// Mock SuggestionService interface
export interface SuggestionService {
  getSuggestions(): Promise<FeatureSuggestion[]>;
  getSuggestion(id: string): Promise<FeatureSuggestion>;
  getSuggestionsByStatus(status: SuggestionStatus): Promise<FeatureSuggestion[]>;
  createSuggestion(suggestion: Partial<FeatureSuggestion>): Promise<FeatureSuggestion>;
  updateSuggestion(id: string, suggestion: Partial<FeatureSuggestion>): Promise<FeatureSuggestion>;
  updateSuggestionStatus(id: string, status: SuggestionStatus): Promise<FeatureSuggestion>;
  deleteSuggestion(id: string): Promise<any>;
  voteForSuggestion(suggestionId: string): Promise<void>;
  convertToFeature(suggestionId: string): Promise<FeatureSuggestion>;
  convertToTask(suggestionId: string): Promise<FeatureConversion>;
  getAllTodos(): Promise<TodoItem[]>;
  updateTodoStatus(id: string, status: TaskStatus): Promise<TodoItem>;
  deleteTodo(id: string): Promise<any>;
  duplicateSuggestion(id: string): Promise<FeatureSuggestion>;
  duplicateTodo(id: string): Promise<TodoItem>;
}

// Context related interfaces
export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

export interface AuthContextProps {
  isAuthenticated: boolean;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
}

export interface ApiClientContextProps {
  client: any;
  baseUrl: string;
  setToken: (token: string) => void;
  clearToken: () => void;
}

export interface WebSocketMessage {
  type: string;
  payload: any;
}

export interface WebSocketContextProps {
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  send: (message: WebSocketMessage) => void;
  subscribe: (eventType: string, callback: (payload: any) => void) => () => void;
}

export interface FeatureFlags {
  [key: string]: boolean;
}

export interface FeatureToggleContextProps {
  flags: FeatureFlags;
  isEnabled: (flagName: string) => boolean;
  setFlag: (flagName: string, value: boolean) => void;
}

export interface SuggestionActionsContextProps {
  voteSuggestion: (id: string) => Promise<void>;
  convertToFeature: (id: string) => Promise<void>;
  addComment: (id: string, comment: string) => Promise<void>;
}

// Create context instances
export const AuthContext = createContext<AuthContextProps | null>(null);
export const ApiClientContext = createContext<ApiClientContextProps | null>(null);
export const WebSocketContext = createContext<WebSocketContextProps | null>(null);
export const FeatureToggleContext = createContext<FeatureToggleContextProps | null>(null);
export const SuggestionActionsContext = createContext<SuggestionActionsContextProps | null>(null);