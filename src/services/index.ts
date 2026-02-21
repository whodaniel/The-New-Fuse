// Re-export all service interfaces
export interface BaseService<T> {
  findAll(): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}

// Export specific service implementations
export { default as UserService } from './user.service.js';
export { default as TaskService } from './task.service.js';
export { default as WorkflowService } from './workflow.service.js';
export { default as AgentService } from './agent.service.js';
export { default as FeatureService } from './feature.service.js';
