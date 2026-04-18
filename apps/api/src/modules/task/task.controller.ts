import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { NewTask } from '@the-new-fuse/database';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../decorators/current-user.decorator.js';
import { UnifiedLedgerService } from '../unified-ledger/unified-ledger.service.js';
import {
  CreateTaskDto,
  CreateTaskExecutionLogDto,
  ListTasksQueryDto,
  UpdateTaskStatusDto,
} from './dto/task.dto.js';
import { TaskService } from './task.service.js';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TaskController {
  constructor(
    private readonly taskService: TaskService,
    private readonly unifiedLedgerService: UnifiedLedgerService
  ) {}

  private requireUserId(user: { id?: string; sub?: string } | undefined): string {
    const userId = user?.id || user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Missing authenticated user');
    }
    return userId;
  }

  @Get()
  async listTasks(@CurrentUser() user: { id?: string; sub?: string }, @Query() query: ListTasksQueryDto) {
    const userId = this.requireUserId(user);

    const { tasks, total } = await this.taskService.listTasks(userId, {
      status: query.status,
      page: query.page,
      limit: query.limit,
    });

    return {
      tasks,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit),
      },
    };
  }

  @Post()
  async createTask(@CurrentUser() user: { id?: string; sub?: string }, @Body() dto: CreateTaskDto) {
    const userId = this.requireUserId(user);

    const taskInput: NewTask = {
      type: dto.type,
      title: dto.title,
      description: dto.description,
      status: dto.status ?? 'PENDING',
      priority: dto.priority ?? 'MEDIUM',
      data: dto.data,
      metadata: dto.metadata,
      pipelineId: dto.pipelineId,
      assignedToId: dto.assignedToId,
      userId,
    };

    return this.taskService.createTask(taskInput);
  }

  @Get(':taskId')
  async getTask(@CurrentUser() user: { id?: string; sub?: string }, @Param('taskId') taskId: string) {
    const userId = this.requireUserId(user);

    const task = await this.taskService.getTaskByIdForUser(taskId, userId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  @Patch(':taskId/status')
  async updateTaskStatus(
    @CurrentUser() user: { id?: string; sub?: string },
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskStatusDto
  ) {
    const userId = this.requireUserId(user);

    const existing = await this.taskService.getTaskByIdForUser(taskId, userId);
    if (!existing) {
      throw new NotFoundException('Task not found');
    }

    const updated = await this.taskService.updateTaskStatus(taskId, dto.status);
    if (!updated) {
      throw new NotFoundException('Task not found');
    }

    return updated;
  }

  @Get(':taskId/execution-logs')
  async getExecutionLogs(
    @CurrentUser() user: { id?: string; sub?: string },
    @Param('taskId') taskId: string
  ) {
    const userId = this.requireUserId(user);

    const task = await this.taskService.getTaskByIdForUser(taskId, userId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const logs = await this.taskService.getExecutionLogs(taskId);
    return {
      taskId,
      logs,
      count: logs.length,
    };
  }

  @Post(':taskId/execution-logs')
  async createExecutionLog(
    @CurrentUser() user: { id?: string; sub?: string },
    @Param('taskId') taskId: string,
    @Body() dto: CreateTaskExecutionLogDto
  ) {
    const userId = this.requireUserId(user);

    const task = await this.taskService.getTaskByIdForUser(taskId, userId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const logEntry = await this.taskService.appendExecutionLog(taskId, dto);

    await this.unifiedLedgerService.createTimelineEvent({
      eventType: 'historical_event',
      actor: dto.actor,
      payload: {
        category: 'task_execution_log',
        taskId,
        level: dto.level,
        source: dto.source,
        stage: dto.stage,
        message: dto.message,
        metadata: dto.metadata ?? {},
        logId: logEntry.id,
      },
    });

    const logs = await this.taskService.getExecutionLogs(taskId);

    return {
      taskId,
      logs,
      count: logs.length,
    };
  }
}
