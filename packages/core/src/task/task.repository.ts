import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from './task.entity';
import { TaskStatus } from './types';
@Injectable()
export class TaskRepository {
  // Implementation needed
}
  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>
  ) {}

  async create(data: Partial<Task>): Promise<Task> {
  // Implementation needed
}
    const task = this.taskRepo.create(data);
    return this.taskRepo.save(task);
  }

  async update(id: string, data: Partial<Task>): Promise<Task> {
  // Implementation needed
}
    await this.taskRepo.update(id, data);
    const updated = await this.taskRepo.findOne({ where: { id } });
    if (!updated) {
  // Implementation needed
}
      throw new Error(`Task with id ${id} not found`);
    }
    return updated;
  }

  async findById(id: string): Promise<Task | null> {
  // Implementation needed
}
    return this.taskRepo.findOne({ where: { id } });
  }

  async findByUserId(userId: string): Promise<Task[]> {
  // Implementation needed
}
    return this.taskRepo.find({
  // Implementation needed
}
      where: { userId },
      order: { createdAt: 'DESC' }
    });
  }

  async findByStatus(status: TaskStatus): Promise<Task[]> {
  // Implementation needed
}
    return this.taskRepo.find({
  // Implementation needed
}
      where: { status },
      order: { createdAt: 'DESC' }
    });
  }

  async delete(id: string): Promise<void> {
  // Implementation needed
}
    await this.taskRepo.delete(id);
  }
}