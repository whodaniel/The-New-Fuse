import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Task } from './TaskTypes';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);
  private tasks: Task[] = [];

  constructor() {}

  async createTask(taskData: Partial<Task>): Promise<Task> {
    const task: Task = {
      id: uuidv4(),
      status: 'PENDING',
      ...taskData,
    } as Task;
    this.tasks.push(task);
    this.logger.log(`Task created: ${task.id}`);
    return task;
  }

  async getTask(taskId: string): Promise<Task | undefined> {
    return this.tasks.find((task) => task.id === taskId);
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task | undefined> {
    const taskIndex = this.tasks.findIndex((task) => task.id === taskId);
    if (taskIndex === -1) {
      return undefined;
    }
    const updatedTask = { ...this.tasks[taskIndex], ...updates };
    this.tasks[taskIndex] = updatedTask;
    this.logger.log(`Task updated: ${taskId}`);
    return updatedTask;
  }

  async deleteTask(taskId: string): Promise<boolean> {
    const taskIndex = this.tasks.findIndex((task) => task.id === taskId);
    if (taskIndex === -1) {
      return false;
    }
    this.tasks.splice(taskIndex, 1);
    this.logger.log(`Task deleted: ${taskId}`);
    return true;
  }
}
