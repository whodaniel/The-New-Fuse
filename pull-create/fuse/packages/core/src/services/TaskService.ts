import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high';
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);
  private tasks: Map<string, Task> = new Map();

  constructor(private eventEmitter: EventEmitter2) {}

  async createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    // Mock implementation
    const task: Task = {
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...taskData,
    };
    this.tasks.set(task.id, task);
    this.eventEmitter.emit('task.created', task);
    return task;
  }

  async getTask(id: string): Promise<Task | null> {
    // Mock implementation
    return this.tasks.get(id) || null;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
    // Mock implementation
    const task = this.tasks.get(id);
    if (!task) return null;
    const updatedTask = { ...task, ...updates, updatedAt: new Date() };
    this.tasks.set(id, updatedTask);
    this.eventEmitter.emit('task.updated', updatedTask);
    return updatedTask;
  }

  async deleteTask(id: string): Promise<boolean> {
    // Mock implementation
    const deleted = this.tasks.delete(id);
    if (deleted) {
      this.eventEmitter.emit('task.deleted', { id });
    }
    return deleted;
  }

  async getTasks(filters?: { status?: string; assignedTo?: string }): Promise<Task[]> {
    // Mock implementation
    let tasks = Array.from(this.tasks.values());
    if (filters?.status) {
      tasks = tasks.filter((task) => task.status === filters.status);
    }
    if (filters?.assignedTo) {
      tasks = tasks.filter((task) => task.assignedTo === filters.assignedTo);
    }
    return tasks;
  }

  async completeTask(id: string): Promise<Task | null> {
    // Mock implementation
    return this.updateTask(id, { status: 'completed', completedAt: new Date() });
  }

  async assignTask(id: string, assignedTo: string): Promise<Task | null> {
    // Mock implementation
    return this.updateTask(id, { assignedTo });
  }

  async getTaskStats(): Promise<any> {
    // Mock implementation
    const tasks = Array.from(this.tasks.values());
    return {
      total: tasks.length,
      pending: tasks.filter((t) => t.status === 'pending').length,
      in_progress: tasks.filter((t) => t.status === 'in_progress').length,
      completed: tasks.filter((t) => t.status === 'completed').length,
      failed: tasks.filter((t) => t.status === 'failed').length,
    };
  }
}
