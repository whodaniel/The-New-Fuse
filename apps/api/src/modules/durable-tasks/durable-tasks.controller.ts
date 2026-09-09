import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { DurableTasksService } from './durable-tasks.service';

type AuthUser = { id?: string; sub?: string };

@ApiTags('durable-tasks')
@Controller('durable-tasks')
@UseGuards(JwtAuthGuard)
export class DurableTasksController {
  constructor(private readonly durableTasks: DurableTasksService) {}

  private requireUserId(user: AuthUser | undefined): string {
    const userId = user?.id || user?.sub;
    if (!userId) throw new UnauthorizedException('Missing authenticated user');
    return userId;
  }

  @Post('bootstrap')
  @ApiOperation({ summary: 'Ensure starter DurableTask definitions for this user' })
  async bootstrap(@CurrentUser() user: AuthUser) {
    return { tasks: await this.durableTasks.bootstrap(this.requireUserId(user)) };
  }

  @Get('usage')
  @ApiOperation({ summary: 'Durable compute usage summary for the current month' })
  async usage(@CurrentUser() user: AuthUser) {
    return this.durableTasks.usageSummary(this.requireUserId(user));
  }

  @Get('tasks')
  @ApiOperation({ summary: 'List DurableTask definitions (auto-bootstraps if empty)' })
  async listTasks(@CurrentUser() user: AuthUser) {
    return { tasks: await this.durableTasks.listTasks(this.requireUserId(user)) };
  }

  @Post('tasks')
  @ApiOperation({ summary: 'Define or version a DurableTask' })
  async defineTask(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      id: string;
      handler?: string;
      description?: string;
      queueName?: string;
      concurrencyLimit?: number;
      machine?: 'small' | 'medium' | 'large';
    }
  ) {
    return { task: await this.durableTasks.defineTask(this.requireUserId(user), body) };
  }

  @Post('tasks/:taskId/trigger')
  @ApiOperation({ summary: 'Enqueue a DurableTask run (cost-gated)' })
  async trigger(
    @CurrentUser() user: AuthUser,
    @Param('taskId') taskId: string,
    @Body() body: { payload?: Record<string, unknown>; projectId?: string; drain?: boolean }
  ) {
    const userId = this.requireUserId(user);
    const result = await this.durableTasks.trigger(
      userId,
      taskId,
      body?.payload || {},
      body?.projectId
    );
    if (body?.drain !== false) {
      await this.durableTasks.drain(userId, 5);
      const run = await this.durableTasks.getRun(userId, result.run.id);
      return { ...result, run };
    }
    return result;
  }

  @Get('runs')
  @ApiOperation({ summary: 'List DurableTask runs' })
  async listRuns(
    @CurrentUser() user: AuthUser,
    @Query('taskId') taskId?: string,
    @Query('status') status?: string
  ) {
    return { runs: await this.durableTasks.listRuns(this.requireUserId(user), { taskId, status }) };
  }

  @Get('runs/:runId')
  @ApiOperation({ summary: 'Get a DurableTask run' })
  async getRun(@CurrentUser() user: AuthUser, @Param('runId') runId: string) {
    return { run: await this.durableTasks.getRun(this.requireUserId(user), runId) };
  }

  @Post('runs/:runId/cancel')
  async cancel(@CurrentUser() user: AuthUser, @Param('runId') runId: string) {
    return { run: await this.durableTasks.cancelRun(this.requireUserId(user), runId) };
  }

  @Post('runs/:runId/replay')
  async replay(@CurrentUser() user: AuthUser, @Param('runId') runId: string) {
    const userId = this.requireUserId(user);
    const result = await this.durableTasks.replayRun(userId, runId);
    await this.durableTasks.drain(userId, 5);
    return result;
  }

  @Get('runs/:runId/events')
  async events(
    @CurrentUser() user: AuthUser,
    @Param('runId') runId: string,
    @Query('since') since?: string
  ) {
    return {
      events: await this.durableTasks.listEvents(
        this.requireUserId(user),
        runId,
        Number(since) || 0
      ),
    };
  }

  @Post('drain')
  @ApiOperation({ summary: 'Process queued runs for this user (cloud worker tick)' })
  async drain(@CurrentUser() user: AuthUser, @Body() body?: { max?: number }) {
    const advanced = await this.durableTasks.drain(this.requireUserId(user), body?.max ?? 20);
    return { advanced };
  }

  @Get('schedules')
  async listSchedules(@CurrentUser() user: AuthUser) {
    return { schedules: await this.durableTasks.listSchedules(this.requireUserId(user)) };
  }

  @Post('schedules')
  async addSchedule(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      id: string;
      taskId: string;
      everyMs: number;
      payload?: Record<string, unknown>;
      enabled?: boolean;
    }
  ) {
    return { schedule: await this.durableTasks.addSchedule(this.requireUserId(user), body) };
  }

  @Patch('schedules/:id')
  async patchSchedule(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { enabled: boolean }
  ) {
    return {
      schedule: await this.durableTasks.setScheduleEnabled(
        this.requireUserId(user),
        id,
        Boolean(body.enabled)
      ),
    };
  }
}
