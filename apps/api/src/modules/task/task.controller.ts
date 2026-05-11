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
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { UnifiedLedgerService } from '../unified-ledger/unified-ledger.service';
import {
  CreateTaskDto,
  CreateTaskExecutionLogDto,
  ListTasksQueryDto,
  UpdateTaskStatusDto,
} from './dto/task.dto';
import { TaskService } from './task.service';

type AuthUser = {
  id?: string;
  sub?: string;
  tenantId?: string;
};

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TaskController {
  constructor(
    private readonly taskService: TaskService,
    private readonly unifiedLedgerService: UnifiedLedgerService
  ) {}

  private requireUserId(user: AuthUser | undefined): string {
    const userId = user?.id || user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Missing authenticated user');
    }
    return userId;
  }

  private resolveTenantId(user: AuthUser | undefined): string | undefined {
    const tenantId = user?.tenantId;
    if (typeof tenantId !== 'string') return undefined;
    const normalized = tenantId.trim();
    return normalized.length > 0 ? normalized : undefined;
  }

  private scopeArgs(tenantId?: string): [] | [{ tenantId: string }] {
    if (!tenantId) return [];
    return [{ tenantId }];
  }

  @Get()
  async listTasks(@CurrentUser() user: AuthUser, @Query() query: ListTasksQueryDto) {
    const userId = this.requireUserId(user);
    const tenantId = this.resolveTenantId(user);

    const { tasks, total } = await this.taskService.listTasks(userId, {
      status: query.status,
      page: query.page,
      limit: query.limit,
      tenantId,
      workspaceId: query.workspaceId,
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
  async createTask(@CurrentUser() user: AuthUser, @Body() dto: CreateTaskDto) {
    const userId = this.requireUserId(user);
    const tenantId = this.resolveTenantId(user);

    const taskInput = {
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
      ...(tenantId ? { tenantId } : {}),
      ...(dto.workspaceId ? { workspaceId: dto.workspaceId } : {}),
    } as NewTask;

    return this.taskService.createTask(taskInput);
  }

  @Get(':taskId')
  async getTask(@CurrentUser() user: AuthUser, @Param('taskId') taskId: string) {
    const userId = this.requireUserId(user);
    const tenantId = this.resolveTenantId(user);

    const task = await this.taskService.getTaskByIdForUser(
      taskId,
      userId,
      ...this.scopeArgs(tenantId)
    );
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  @Patch(':taskId/status')
  async updateTaskStatus(
    @CurrentUser() user: AuthUser,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskStatusDto
  ) {
    const userId = this.requireUserId(user);
    const tenantId = this.resolveTenantId(user);

    const existing = await this.taskService.getTaskByIdForUser(
      taskId,
      userId,
      ...this.scopeArgs(tenantId)
    );
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
  async getExecutionLogs(@CurrentUser() user: AuthUser, @Param('taskId') taskId: string) {
    const userId = this.requireUserId(user);
    const tenantId = this.resolveTenantId(user);

    const task = await this.taskService.getTaskByIdForUser(
      taskId,
      userId,
      ...this.scopeArgs(tenantId)
    );
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
    @CurrentUser() user: AuthUser,
    @Param('taskId') taskId: string,
    @Body() dto: CreateTaskExecutionLogDto
  ) {
    const userId = this.requireUserId(user);
    const tenantId = this.resolveTenantId(user);

    const task = await this.taskService.getTaskByIdForUser(
      taskId,
      userId,
      ...this.scopeArgs(tenantId)
    );
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const logEntry = await this.taskService.appendExecutionLog(taskId, dto);
    const metadataWorkspaceId =
      typeof dto.metadata?.workspaceId === 'string' ? dto.metadata.workspaceId : undefined;

    const taskWorkspaceId =
      typeof (task as any)?.workspaceId === 'string' ? (task as any).workspaceId : undefined;
    await this.unifiedLedgerService.createTimelineEvent({
      userId,
      tenantId,
      workspaceId: taskWorkspaceId || metadataWorkspaceId,
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
