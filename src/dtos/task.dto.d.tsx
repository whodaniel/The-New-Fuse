import { TaskStatus, TaskPriority, TaskType } from "@the-new-fuse/types";
export declare class CreateTaskDto {
  title: string;
  description?: string;
  priority?: TaskPriority;
  type?: TaskType;
  dueDate?: Date;
  assigneeId?: string;
  dependencies?: string[];
  metadata?: Record<string, any>;
  tags?: string[];
}
export declare class UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  type?: TaskType;
  dueDate?: Date | null;
  assigneeId?: string | null;
  completedAt?: Date | null;
}
export declare class TaskResponseDto {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  dueDate?: Date;
  assigneeId?: string;
  dependencies: string[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}
