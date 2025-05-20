// Common interfaces
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Module specific types
export interface ModuleConfig {
  enabled: boolean;
  options?: Record<string, unknown>;
}

// Service interfaces
export interface BaseService<T extends BaseEntity> {
  findById(id: string): Promise<T | null>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

// Redux store types
export interface RootState {
  auth: AuthState;
  chat: ChatState;
  core: CoreState;
  // Add other module states as needed
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: Error | null;
}

export interface ChatState {
  messages: Message[];
  loading: boolean;
  error: Error | null;
}

export interface CoreState {
  theme: string;
  language: string;
  notifications: Notification[];
}

// Entity interfaces
export interface User extends BaseEntity {
  email: string;
  name?: string;
  role: string;
}

export interface Message extends BaseEntity {
  content: string;
  sender: string;
  timestamp: Date;
}

export interface Notification extends BaseEntity {
  type: string;
  message: string;
  read: boolean;
}

// Express request with authentication
import { Request } from "express";
export interface AuthenticatedRequest extends Request {
  user: User;
}

// Export auth and Redis types once
export * from './auth.js';
export * from './redis/redis.js';
