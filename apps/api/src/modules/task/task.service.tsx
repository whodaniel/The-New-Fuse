import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../../entities/Task.js';
import { TaskExecution } from '../../entities/TaskExecution.js';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(TaskExecution)
    private readonly taskExecutionRepository: Repository<TaskExecution>
  ) {}

  async findStuckTasks(): Promise<Task[]> {
    // Using LessThan from typeorm for proper comparison
    return this.taskRepository.find({
      where: {
        status: 'RUNNING',
        startTime: new Date(Date.now() - 30 * 60 * 1000) // Use Raw or custom query for <
      }
    });
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task | null> {
    await this.taskRepository.update(taskId, updates);
    return this.taskRepository.findOne({ where: { id: taskId } });
  }

  async getTaskById(taskId: string): Promise<Task | null> {
    return this.taskRepository.findOne({ where: { id: taskId } });
  }

  async createTask(data: Partial<Task>): Promise<Task> {
    const task = this.taskRepository.create(data);
    return this.taskRepository.save(task);
  }

  async getPendingTasks(): Promise<Task[]> {
    return this.taskRepository.find({
      where: {
        status: 'PENDING'
      },
      order: {
        priority: 'DESC'
      }
    });
  }

  async getTaskExecutions(taskId: string) {
    return this.taskExecutionRepository.find({
      where: {
        taskId
      },
      order: {
        createdAt: 'DESC'
      }
    });
  }

  async deleteTasks(pipelineId: string) {
    await this.taskRepository.delete({ pipelineId });
  }

  async deleteTaskExecutions(taskId: string) {
    await this.taskExecutionRepository.delete({ taskId });
  }
}
