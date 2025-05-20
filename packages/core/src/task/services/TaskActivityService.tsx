import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskActivity, TaskActivityType } from '../entities/TaskActivity.js';
import { Task } from '../entities/Task.js';
import { User } from '../../user/entities/User.js';

@Injectable()
export class TaskActivityService {
  constructor(
    @InjectRepository(TaskActivity)
    private taskActivityRepository: Repository<TaskActivity>,
  ) {}

  async logActivity(
    task: Task,
    user: User | null, // Allow null if system generates activity
    type: TaskActivityType,
    details?: Record<string, any>, // Corrected: Record<string, any> or a specific interface
  ): Promise<TaskActivity> {
    const activity = this.taskActivityRepository.create({
      task,
      taskId: task.id,
      user, // user can be null
      userId: user ? user.id : null, // Corrected: handle null user
      type,
      details: details || {}, // Ensure details is an object
    });
    return this.taskActivityRepository.save(activity);
  }

  async getActivitiesForTask(taskId: string): Promise<TaskActivity[]> {
    return this.taskActivityRepository.find({
      where: { taskId },
      relations: ['user'], // Assuming you want to load the user relation
      order: { createdAt: 'DESC' }, // Corrected: 'DESC' for descending order
    });
  }

  // Example of a more complex details object, ensure all properties are correctly defined
  async logComplexActivity(
    task: Task,
    user: User,
    type: TaskActivityType,
    // details: { commentId: string, previousStatus: string, newStatus: string } // Example
    details: { commentId?: string; previousStatus?: string; newStatus?: string; [key: string]: any }, // More flexible
  ): Promise<TaskActivity> {
    const activity = this.taskActivityRepository.create({
      task,
      taskId: task.id,
      user,
      userId: user.id,
      type,
      details, // details should be a valid object
    });
    return this.taskActivityRepository.save(activity);
  }
}