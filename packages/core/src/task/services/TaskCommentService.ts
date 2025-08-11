import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskComment } from '../entities/TaskComment';
import { Task } from '../entities/Task';
import { User } from '../../auth/entities/User';
@Injectable()
export class TaskCommentService {
  // Implementation needed
}
  private readonly logger = new Logger(TaskCommentService.name);
  constructor(
    @InjectRepository(TaskComment)
    private readonly commentRepository: Repository<TaskComment>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createComment(
    taskId: string,
    userId: string,
    content: string,
    parentId?: string,
  ): Promise<TaskComment> {
  // Implementation needed
}
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task) {
  // Implementation needed
}
      throw new NotFoundException(`Task ${taskId} not found`);
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
  // Implementation needed
}
      throw new NotFoundException(`User ${userId} not found`);
    }

    const comment = this.commentRepository.create({
  // Implementation needed
}
      content,
      task,
      author: user,
      parentId,
    });
    return this.commentRepository.save(comment);
  }

  async getCommentsByTask(taskId: string): Promise<TaskComment[]> {
  // Implementation needed
}
    return this.commentRepository.find({
  // Implementation needed
}
      where: { task: { id: taskId } },
      relations: ['author', 'replies'],
      order: { createdAt: 'ASC' },
    });
  }

  async updateComment(
    commentId: string,
    userId: string,
    content: string,
  ): Promise<TaskComment> {
  // Implementation needed
}
    const comment = await this.commentRepository.findOne({
  // Implementation needed
}
      where: { id: commentId },
      relations: ['author'],
    });
    if (!comment) {
  // Implementation needed
}
      throw new NotFoundException(`Comment ${commentId} not found`);
    }

    if (comment.author.id !== userId) {
  // Implementation needed
}
      throw new ForbiddenException('You can only edit your own comments');
    }

    comment.content = content;
    comment.updatedAt = new Date();
    return this.commentRepository.save(comment);
  }

  async deleteComment(commentId: string, userId: string): Promise<void> {
  // Implementation needed
}
    const comment = await this.commentRepository.findOne({
  // Implementation needed
}
      where: { id: commentId },
      relations: ['author'],
    });
    if (!comment) {
  // Implementation needed
}
      throw new NotFoundException(`Comment ${commentId} not found`);
    }

    if (comment.author.id !== userId) {
  // Implementation needed
}
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.commentRepository.remove(comment);
  }

  async getCommentById(commentId: string): Promise<TaskComment> {
  // Implementation needed
}
    const comment = await this.commentRepository.findOne({
  // Implementation needed
}
      where: { id: commentId },
      relations: ['author', 'task', 'replies'],
    });
    if (!comment) {
  // Implementation needed
}
      throw new NotFoundException(`Comment ${commentId} not found`);
    }

    return comment;
  }

  async getCommentsByUser(userId: string): Promise<TaskComment[]> {
  // Implementation needed
}
    return this.commentRepository.find({
  // Implementation needed
}
      where: { author: { id: userId } },
      relations: ['task', 'author'],
      order: { createdAt: 'DESC' },
    });
  }
}