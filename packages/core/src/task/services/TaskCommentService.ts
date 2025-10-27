import { Injectable, Logger } from '@nestjs/common';

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class TaskCommentService {
  private readonly logger = new Logger(TaskCommentService.name);
  private comments: Map<string, TaskComment[]> = new Map();

  async createComment(taskId: string, userId: string, content: string): Promise<TaskComment> {
    const comment: TaskComment = {
      id: `comment-${Date.now()}`,
      taskId,
      userId,
      content,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const taskComments = this.comments.get(taskId) || [];
    taskComments.push(comment);
    this.comments.set(taskId, taskComments);

    return comment;
  }

  async getCommentsByTaskId(taskId: string): Promise<TaskComment[]> {
    return this.comments.get(taskId) || [];
  }

  async updateComment(commentId: string, content: string): Promise<TaskComment | null> {
    for (const [taskId, comments] of this.comments.entries()) {
      const comment = comments.find(c => c.id === commentId);
      if (comment) {
        comment.content = content;
        comment.updatedAt = new Date();
        return comment;
      }
    }
    return null;
  }

  async deleteComment(commentId: string): Promise<boolean> {
    for (const [taskId, comments] of this.comments.entries()) {
      const index = comments.findIndex(c => c.id === commentId);
      if (index !== -1) {
        comments.splice(index, 1);
        return true;
      }
    }
    return false;
  }
}
