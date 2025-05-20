import { EntityRepository, Repository } from 'typeorm';
import { Task, TaskStatus, TaskPriority } from '../entities/Task.js';

interface FindTasksOptions {
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedTo?: string;
  tags?: string[];
  dueBefore?: Date;
}

@EntityRepository(Task)
export class TaskRepository extends Repository<Task> {
  async findTasks(options: FindTasksOptions): Promise<Task[]> {
    const query = this.createQueryBuilder('task');
    
    if (options.status) {
      query.andWhere('task.status = :status', { status: options.status });
    }

    if (options.priority) {
      query.andWhere('task.priority = :priority', { priority: options.priority });
    }
    
    if (options.assignedTo) {
      query.andWhere('task.assignedTo = :assignedTo', { assignedTo: options.assignedTo });
    }
    
    if (options.tags && options.tags.length) {
      query.andWhere('task.tags && :tags', { tags: options.tags });
    }
    
    if (options.dueBefore) {
      query.andWhere('task.dueDate <= :dueBefore', { dueBefore: options.dueBefore });
    }
    
    return query.getMany();
  }

  async findByMetadata(metadata: Record<string, unknown>): Promise<Task[]> {
    return this.createQueryBuilder('task')
      .where('task.metadata @> :metadata', { metadata })
      .getMany();
  }
}