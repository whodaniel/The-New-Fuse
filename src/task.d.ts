/**
 * Task-related type definitions
 */

import { TaskStatus, TaskType } from '../core/enums.js';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  type: TaskType;
  priority: number;
  assigneeId: string | null;
  creatorId: string;
  dueDate: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  metadata?: Record<string, unknown>;
}
