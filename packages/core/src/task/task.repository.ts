import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

// Conflict 1 Resolution: Use imports from 'Incoming'
import { Task } from './task.entity';
import { TaskStatus } from '../types/types'; // Assuming this path is correct for the refactor

@Injectable()
export class TaskRepository {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
  ) {}

  async create(data: Partial<Task>): Promise<Task> {
    const task = this.taskRepo.create(data);
    return this.taskRepo.save(task);
  }

  async update(id: string, data: Partial<Task>): Promise<Task> {
    await this.taskRepo.update(id, data);
    const updated = await this.taskRepo.findOne({ where: { id } });
    if (!updated) {
      throw new Error(`Task with id ${id} not found`);
    }
    return updated;
  }

  async findById(id: string): Promise<Task | null> {
    return this.taskRepo.findOne({ where: { id } });
  }

  // Conflict 2 Resolution: Keep all useful methods from both branches

  // From 'Current'
  async findByUserId(userId: string): Promise<Task[]> {
    return this.taskRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  // From 'Current'
  async findByStatus(status: TaskStatus): Promise<Task[]> {
    return this.taskRepo.find({
      where: { status },
      order: { createdAt: 'DESC' },
    });
  }

  // From 'Incoming'
  async findAll(): Promise<Task[]> {
    return this.taskRepo.find();
  }

  // From 'Incoming' (better return type)
  async delete(id: string): Promise<boolean> {
    const result = await this.taskRepo.delete(id);
    return !!result.affected;
  }
}