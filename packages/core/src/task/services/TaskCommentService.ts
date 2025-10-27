import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../task.entity';

// This is a temporary service. Replace with a real one.

@Injectable()
export class TaskCommentService {
  private readonly logger = new Logger(TaskCommentService.name);
  private comments = new Map<string, any>();

  constructor() {}

  async createComment(taskId: string, userId: string, content: string, parentId?: string): Promise<any> {
    this.logger.log(`Create comment for task ${taskId} by user ${userId}`);
    const comment = {
      id: this.comments.size + 1,
      taskId,
      userId,
      content,
      parentId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.comments.set(comment.id.toString(), comment);
    return comment;
  }

  async getCommentsByTask(taskId: string): Promise<any[]> {
    this.logger.log(`Get comments for task ${taskId}`);
    return Array.from(this.comments.values()).filter(c => c.taskId === taskId);
  }

  async updateComment(commentId: string, userId: string, content: string): Promise<any> {
    this.logger.log(`Update comment ${commentId} by user ${userId}`);
    const comment = this.comments.get(commentId);
    if (!comment) {
      throw new NotFoundException(`Comment ${commentId} not found`);
    }
    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }
    comment.content = content;
    comment.updatedAt = new Date();
    return comment;
  }

  async deleteComment(commentId: string, userId: string): Promise<void> {
    this.logger.log(`Delete comment ${commentId} by user ${userId}`);
    const comment = this.comments.get(commentId);
    if (!comment) {
      throw new NotFoundException(`Comment ${commentId} not found`);
    }
    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }
    this.comments.delete(commentId);
  }
}
