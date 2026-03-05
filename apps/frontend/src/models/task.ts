import { TaskPriority, TaskStatus } from './enums';

export interface TaskTimeTracking {
  duration?: number;
  startTime: string | Date;
  endTime?: string | Date;
}

export interface TaskModel {
  dueDate?: string | Date;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  departmentId?: string;
  tags: string[];
}

export interface TaskFilters {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assigneeId?: string[];
  departmentId?: string[];
  tags?: string[];
}

export class TaskUtils {
  static isOverdue(task: TaskModel): boolean {
    if (!task.dueDate) return false;
    return new Date() > new Date(task.dueDate);
  }
  static calculateProgress(task: TaskModel): number {
    const statusWeights = {
      [TaskStatus.PENDING]: 0,
      [TaskStatus.IN_PROGRESS]: 50,
      [TaskStatus.COMPLETED]: 100,
      [TaskStatus.FAILED]: 0,
      [TaskStatus.CANCELLED]: 0,
    };
    return statusWeights[task.status] ?? 0;
  }
  static getPriorityLevel(task: TaskModel): number {
    const priorityWeights = {
      [TaskPriority.LOW]: 1,
      [TaskPriority.MEDIUM]: 2,
      [TaskPriority.HIGH]: 3,
      [TaskPriority.CRITICAL]: 4,
    };
    return priorityWeights[task.priority] ?? 0;
  }
  static calculateTimeSpent(timeTrackings: TaskTimeTracking[]): number {
    return timeTrackings.reduce((total, tracking) => {
      if (tracking.duration) {
        return total + tracking.duration;
      }
      if (tracking.endTime) {
        return (
          total + (new Date(tracking.endTime).getTime() - new Date(tracking.startTime).getTime())
        );
      }
      return total;
    }, 0);
  }
  static sortTasks<T extends TaskModel, K extends keyof T>(
    tasks: T[],
    sortBy: K,
    order: 'asc' | 'desc'
  ): T[] {
    return [...tasks].sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }
  static filterTasks(tasks: TaskModel[], filters: TaskFilters): TaskModel[] {
    return tasks.filter((task) => {
      if (filters.status && !filters.status.includes(task.status)) return false;
      if (filters.priority && !filters.priority.includes(task.priority)) return false;
      if (filters.assigneeId && task.assigneeId && !filters.assigneeId.includes(task.assigneeId))
        return false;
      if (
        filters.departmentId &&
        task.departmentId &&
        !filters.departmentId.includes(task.departmentId)
      )
        return false;
      if (filters.tags && !filters.tags.some((tag) => task.tags.includes(tag))) return false;
      return true;
    });
  }
}
