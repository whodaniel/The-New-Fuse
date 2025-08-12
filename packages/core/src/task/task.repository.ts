import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from './task.entity';
import { TaskStatus } from './types';
@Injectable()
export class TaskRepository {
  constructor(): unknown {
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>
  ) {}

  async create(): unknown {
    const task = this.taskRepo.create(data);
    return this.taskRepo.save(task);
  }

  async update(): unknown {
    await this.taskRepo.update(id, data);
    const updated = await this.taskRepo.findOne({ where: { id } });
    if(): unknown {
      throw new Error(`Task with id ${id} not found`);
    }
    return updated;
  }

  async findById(): unknown {
    return this.taskRepo.findOne({ where: { id } });
  }

  async findByUserId(): unknown {
    return this.taskRepo.find({
where: { userId },
  }      order: { createdAt: 'DESC' }
    });
  }

  async findByStatus(): unknown {
    return this.taskRepo.find({
  // Implementation needed
}
      where: { status },
      order: { createdAt: 'DESC' }
    });
  }

  async delete(): unknown {
    await this.taskRepo.delete(id);
  }
}