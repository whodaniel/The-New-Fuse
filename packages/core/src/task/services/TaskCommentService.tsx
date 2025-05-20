import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskComment } from '../entities/TaskComment.js';
import { CreateCommentDto, UpdateCommentDto } from '../dto/comment.dto.js';
import { TaskActivityService } from './TaskActivityService.js';
import { TaskActivityType } from '../entities/TaskActivity.js';
import { User } from '../../user/entities/User.js';
import { Task } from '../entities/Task.js';
import { NotificationService } from '../../notification/NotificationService.js';
import { MentionParser } from '../../shared/utils/MentionParser.js';

@Injectable()
export class TaskCommentService {
  constructor(
    @InjectRepository(TaskComment)
    private commentRepository: Repository<TaskComment>,
    private taskActivityService: TaskActivityService,
    private notificationService: NotificationService,
    private mentionParser: MentionParser
  ) {}

  async createComment(
    task: Task,
    author: User,
    createCommentDto: CreateCommentDto
  ): Promise<TaskComment> {
    const comment = this.commentRepository.create({
      ...createCommentDto,
      task,
      taskId: task.id,
      author,
      authorId: author.id
    });

    const savedComment = await this.commentRepository.save(comment);

    // Log activity
    await this.taskActivityService.logActivity(
      task,
      author,
      TaskActivityType.COMMENT_ADDED,
      { commentId: savedComment.id }
    );

    // Process mentions and notify users
    const mentions = this.mentionParser.extractMentions(createCommentDto.content);
    await this.notificationService.notifyTaskComment(task, savedComment, mentions);

    return savedComment;
  }

  async updateComment(
    task: Task,
    author: User,
    updateCommentDto: UpdateCommentDto
  ): Promise<TaskComment> {
    const comment = await this.findCommentById(updateCommentDto.id);

    // Check if user has permission to edit the comment
    if (comment.authorId !== author.id) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    Object.assign(comment, updateCommentDto);
    const updatedComment = await this.commentRepository.save(comment);

    // Log activity
    await this.taskActivityService.logActivity(
      task,
      author,
      TaskActivityType.COMMENT_UPDATED,
      { commentId: updatedComment.id }
    );

    // Process new mentions
    const newMentions = this.mentionParser.extractMentions(updateCommentDto.content);
    if (newMentions.length > 0) {
      await this.notificationService.notifyMentionedUsers(
        task,
        newMentions,
        updatedComment
      );
    }

    return updatedComment;
  }

  async deleteComment(id: string, user: User): Promise<TaskComment> {
    const comment = await this.findCommentById(id);

    // Check if user has permission to delete the comment
    if (comment.authorId !== user.id) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.taskActivityService.logActivity(
      comment.task,
      user,
      TaskActivityType.COMMENT_DELETED,
      { commentId: comment.id }
    );

    await this.commentRepository.remove(comment);

    return comment;
  }

  private async findCommentById(id: string): Promise<TaskComment> {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: ['task', 'author']
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID "${id}" not found`);
    }

    return comment;
  }

  async findCommentsByTaskId(taskId: string): Promise<TaskComment[]> {
    return this.commentRepository.find({
      where: { taskId },
      relations: ['author'],
      order: { createdAt: 'ASC' }
    });
  }
}
