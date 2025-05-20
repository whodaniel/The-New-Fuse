export enum TaskPriority {
  CRITICAL = 4,
  HIGH = 3,
  MEDIUM = 2,
  LOW = 1,
  NONE = 0
}

export type TaskPriorityLabel = 'critical' | 'high' | 'medium' | 'low' | 'none';

export const TaskPriorityMap: Record<TaskPriority, TaskPriorityLabel> = {
  [TaskPriority.CRITICAL]: 'critical',
  [TaskPriority.HIGH]: 'high',
  [TaskPriority.MEDIUM]: 'medium',
  [TaskPriority.LOW]: 'low',
  [TaskPriority.NONE]: 'none'
};
