import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskComment } from '../entities/TaskComment';
import { Task } from '../entities/Task';
import { User } from '../../auth/entities/User';
@Injectable()
export class TaskCommentService {
  private readonly logger = new Logger(TaskCommentService.name);
  constructor(): unknown {
    @InjectRepository(TaskComment)
    private readonly commentRepository: Repository<TaskComment>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createComment(): unknown {
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if(): unknown {
      throw new NotFoundException(`Task ${taskId} not found`);
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if(): unknown {
      throw new NotFoundException(`User ${userId} not found`);
    }

    const comment = this.commentRepository.create({
content,
  }      task,
      author: user,
      parentId,
    });
    return this.commentRepository.save(comment);
  }

  async getCommentsByTask(): unknown {
    return this.commentRepository.find({
  // Implementation needed
}
      where: { task: { id: taskId } },
      relations: ['author', 'replies'],
      order: { createdAt: 'ASC' },
    });
  }

  async updateComment(): unknown {
    const comment = await this.commentRepository.findOne({
where: { id: commentId },
  }      relations: ['author'],
    });
    if(): unknown {
      throw new NotFoundException(`Comment ${commentId} not found`);
    }

    if(): unknown {
      throw new ForbiddenException('You can only edit your own comments');
    }

    comment.content = content;
    comment.updatedAt = new Date();
    return this.commentRepository.save(comment);
  }

  async deleteComment(): unknown {
    const comment = await this.commentRepository.findOne({
where: { id: commentId },
  }      relations: ['author'],
    });
    if(): unknown {
      throw new NotFoundException(`Comment ${commentId} not found`);
    }

    if(): unknown {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.commentRepository.remove(comment);
  }

  async getCommentById(): unknown {
    const comment = await this.commentRepository.findOne({
where: { id: commentId },
  }      relations: ['author', 'task', 'replies'],
    });
    if(): unknown {
      throw new NotFoundException(`Comment ${commentId} not found`);
    }

    return comment;
  }

  async getCommentsByUser(): unknown {
    return this.commentRepository.find({
where: { author: { id: userId } },
  }      relations: ['task', 'author'],
      order: { createdAt: 'DESC' },
    });
  }
}