import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../decorators/current-user.decorator.js';
import { UnifiedLedgerService } from './unified-ledger.service.js';
import {
  UnifiedRecordKind,
  UnifiedRecordStatus,
  UnifiedWorkHorizon,
  UnifiedWorkLane,
} from './unified-ledger.types.js';

@Controller()
@UseGuards(JwtAuthGuard)
export class UnifiedLedgerController {
  constructor(private readonly ledger: UnifiedLedgerService) {}

  private requireUserId(user: { id?: string; sub?: string } | undefined): string {
    const userId = user?.id || user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Missing authenticated user');
    }
    return userId;
  }

  @Get('unified-ledger/records')
  async list(
    @CurrentUser() user: { id?: string; sub?: string },
    @Query('kind') kind?: UnifiedRecordKind,
    @Query('status') status?: UnifiedRecordStatus,
    @Query('lane') lane?: UnifiedWorkLane,
    @Query('horizon') horizon?: UnifiedWorkHorizon,
    @Query('q') q?: string
  ) {
    const userId = this.requireUserId(user);
    return this.ledger.listRecords({ owner: userId, kind, status, lane, horizon, q });
  }

  @Get('unified-ledger/records/:id')
  async get(@CurrentUser() user: { id?: string; sub?: string }, @Param('id') id: string) {
    const userId = this.requireUserId(user);
    return this.ledger.getRecord(id, userId);
  }

  @Get('unified-ledger/records/:id/connections')
  async connections(@CurrentUser() user: { id?: string; sub?: string }, @Param('id') id: string) {
    const userId = this.requireUserId(user);
    return this.ledger.getRecordConnections(id, userId);
  }

  @Post('unified-ledger/records')
  async create(@CurrentUser() user: { id?: string; sub?: string }, @Body() body: any) {
    const userId = this.requireUserId(user);
    return this.ledger.createRecord({ ...body, owner: userId, source: body.source || 'api' });
  }

  @Patch('unified-ledger/records/:id')
  async patch(
    @CurrentUser() user: { id?: string; sub?: string },
    @Param('id') id: string,
    @Body() body: any
  ) {
    const userId = this.requireUserId(user);
    return this.ledger.updateRecord(id, { ...body, owner: userId }, userId);
  }

  @Post('unified-ledger/records/:id/vote')
  async vote(
    @CurrentUser() user: { id?: string; sub?: string },
    @Param('id') id: string,
    @Body() body: { direction: 'up' | 'down' }
  ) {
    const userId = this.requireUserId(user);
    return this.ledger.voteRecord(id, body.direction, userId);
  }

  @Post('unified-ledger/records/:id/feedback')
  async feedback(
    @CurrentUser() user: { id?: string; sub?: string },
    @Param('id') id: string,
    @Body() body: any
  ) {
    const userId = this.requireUserId(user);
    return this.ledger.addFeedbackIteration(id, body, userId);
  }

  @Post('unified-ledger/records/:id/links')
  async link(
    @CurrentUser() user: { id?: string; sub?: string },
    @Param('id') id: string,
    @Body() body: any
  ) {
    const userId = this.requireUserId(user);
    return this.ledger.addFunctionalLink(id, body, userId);
  }

  @Post('unified-ledger/ingest/orchestration')
  async ingest(@CurrentUser() _user: { id?: string; sub?: string }, @Body() body: any) {
    return this.ledger.ingestOrchestrationEvent(body);
  }

  @Get('unified-ledger/grid')
  async grid(@CurrentUser() user: { id?: string; sub?: string }) {
    const userId = this.requireUserId(user);
    return this.ledger.getGrid(userId);
  }

  @Get('timeline/events')
  async timeline(
    @CurrentUser() user: { id?: string; sub?: string },
    @Query('recordId') recordId?: string,
    @Query('goalId') goalId?: string,
    @Query('planId') planId?: string,
    @Query('eventType') eventType?: string,
    @Query('actor') actor?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string
  ) {
    const userId = this.requireUserId(user);
    return this.ledger.listTimelineEvents({
      userId,
      recordId,
      goalId,
      planId,
      eventType,
      actor,
      dateFrom,
      dateTo,
    });
  }

  @Get('timeline/events/:id')
  async timelineEvent(@CurrentUser() user: { id?: string; sub?: string }, @Param('id') id: string) {
    const userId = this.requireUserId(user);
    return this.ledger.getTimelineEvent(id, userId);
  }

  @Post('timeline/events')
  async createTimelineEvent(@CurrentUser() user: { id?: string; sub?: string }, @Body() body: any) {
    const userId = this.requireUserId(user);
    return this.ledger.createTimelineEvent({ ...body, userId });
  }

  @Patch('timeline/events/:id')
  async patchTimelineEvent(
    @CurrentUser() user: { id?: string; sub?: string },
    @Param('id') id: string,
    @Body() body: any
  ) {
    const userId = this.requireUserId(user);
    return this.ledger.updateTimelineEvent(id, { ...body, userId });
  }

  @Delete('timeline/events/:id')
  async deleteTimelineEvent(
    @CurrentUser() user: { id?: string; sub?: string },
    @Param('id') id: string
  ) {
    const userId = this.requireUserId(user);
    return this.ledger.deleteTimelineEvent(id, userId);
  }

  @Post('timeline/personal/bootstrap')
  async bootstrapPersonalTimeline(
    @CurrentUser()
    user: {
      id?: string;
      sub?: string;
      email?: string;
      name?: string;
      role?: string;
      roles?: string[];
    }
  ) {
    const userId = this.requireUserId(user);
    return this.ledger.bootstrapPersonalTimeline(userId, {
      email: user.email,
      name: user.name,
      role: user.role,
      roles: user.roles,
    });
  }

  @Post('goals')
  async createGoal(@CurrentUser() user: { id?: string; sub?: string }, @Body() body: any) {
    const userId = this.requireUserId(user);
    return this.ledger.createGoal({ ...body, owner: userId });
  }

  @Get('goals')
  async listGoals(@CurrentUser() user: { id?: string; sub?: string }) {
    const userId = this.requireUserId(user);
    return this.ledger.listGoals({ owner: userId });
  }

  @Get('goals/:id')
  async getGoal(@CurrentUser() user: { id?: string; sub?: string }, @Param('id') id: string) {
    const userId = this.requireUserId(user);
    return this.ledger.getGoal(id, userId);
  }

  @Post('goals/:id/link-record')
  async linkGoalRecord(
    @CurrentUser() user: { id?: string; sub?: string },
    @Param('id') id: string,
    @Body() body: { recordId: string; actor?: string; owner?: string }
  ) {
    const userId = this.requireUserId(user);
    return this.ledger.linkGoalToRecord(id, body.recordId, body.actor || userId, userId);
  }

  @Post('goals/:id/milestones')
  async addMilestone(
    @CurrentUser() user: { id?: string; sub?: string },
    @Param('id') id: string,
    @Body() body: any
  ) {
    const userId = this.requireUserId(user);
    return this.ledger.addGoalMilestone(id, { ...body, owner: userId });
  }

  @Patch('goals/:id/milestones/:milestoneId')
  async updateMilestone(
    @CurrentUser() user: { id?: string; sub?: string },
    @Param('id') id: string,
    @Param('milestoneId') milestoneId: string,
    @Body() body: any
  ) {
    const userId = this.requireUserId(user);
    return this.ledger.updateGoalMilestone(id, milestoneId, { ...body, owner: userId });
  }

  @Delete('goals/:id/milestones/:milestoneId')
  async deleteMilestone(
    @CurrentUser() user: { id?: string; sub?: string },
    @Param('id') id: string,
    @Param('milestoneId') milestoneId: string
  ) {
    const userId = this.requireUserId(user);
    return this.ledger.removeGoalMilestone(id, milestoneId, userId);
  }

  @Post('plans')
  async createPlan(@CurrentUser() user: { id?: string; sub?: string }, @Body() body: any) {
    const userId = this.requireUserId(user);
    return this.ledger.createPlan({ ...body, owner: userId });
  }

  @Get('plans')
  async listPlans(@CurrentUser() user: { id?: string; sub?: string }) {
    const userId = this.requireUserId(user);
    return this.ledger.listPlans({ owner: userId });
  }

  @Get('plans/:id')
  async getPlan(@CurrentUser() user: { id?: string; sub?: string }, @Param('id') id: string) {
    const userId = this.requireUserId(user);
    return this.ledger.getPlan(id, userId);
  }

  @Post('plans/:id/link')
  async linkPlan(
    @CurrentUser() user: { id?: string; sub?: string },
    @Param('id') id: string,
    @Body() body: { owner?: string; goalId?: string; recordId?: string; actor?: string }
  ) {
    const userId = this.requireUserId(user);
    return this.ledger.linkPlan(id, { ...body, owner: userId, actor: body.actor || userId });
  }

  // Compatibility routes for existing frontend pages under unified-ledger namespace.
  @Get('unified-ledger/tasks')
  async listTasks(
    @CurrentUser() user: { id?: string; sub?: string },
    @Query('status') status?: UnifiedRecordStatus,
    @Query('lane') lane?: UnifiedWorkLane,
    @Query('horizon') horizon?: UnifiedWorkHorizon,
    @Query('q') q?: string
  ) {
    const userId = this.requireUserId(user);
    return this.ledger.listRecords({ owner: userId, kind: 'task', status, lane, horizon, q });
  }

  @Get('unified-ledger/tasks/:id')
  async getTask(@CurrentUser() user: { id?: string; sub?: string }, @Param('id') id: string) {
    const userId = this.requireUserId(user);
    return this.ledger.getRecord(id, userId);
  }

  @Post('unified-ledger/tasks')
  async createTask(@CurrentUser() user: { id?: string; sub?: string }, @Body() body: any) {
    const userId = this.requireUserId(user);
    return this.ledger.createRecord({
      ...body,
      kind: 'task',
      owner: userId,
      source: body.source || 'api',
    });
  }

  @Patch('unified-ledger/tasks/:id')
  async patchTask(
    @CurrentUser() user: { id?: string; sub?: string },
    @Param('id') id: string,
    @Body() body: any
  ) {
    const userId = this.requireUserId(user);
    return this.ledger.updateRecord(id, { ...body, owner: userId }, userId);
  }

  @Get('suggestions')
  async listSuggestions(
    @CurrentUser() user: { id?: string; sub?: string },
    @Query('status') status?: UnifiedRecordStatus,
    @Query('lane') lane?: UnifiedWorkLane,
    @Query('horizon') horizon?: UnifiedWorkHorizon,
    @Query('q') q?: string
  ) {
    const userId = this.requireUserId(user);
    return this.ledger.listRecords({
      owner: userId,
      kind: 'suggestion',
      status,
      lane,
      horizon,
      q,
    });
  }

  @Get('suggestions/:id')
  async getSuggestion(@CurrentUser() user: { id?: string; sub?: string }, @Param('id') id: string) {
    const userId = this.requireUserId(user);
    return this.ledger.getRecord(id, userId);
  }

  @Post('suggestions')
  async createSuggestion(@CurrentUser() user: { id?: string; sub?: string }, @Body() body: any) {
    const userId = this.requireUserId(user);
    return this.ledger.createRecord({
      ...body,
      kind: 'suggestion',
      owner: userId,
      source: body.source || 'api',
      status: body.status || 'submitted',
    });
  }

  @Patch('suggestions/:id')
  async patchSuggestion(
    @CurrentUser() user: { id?: string; sub?: string },
    @Param('id') id: string,
    @Body() body: any
  ) {
    const userId = this.requireUserId(user);
    return this.ledger.updateRecord(id, { ...body, owner: userId }, userId);
  }

  @Post('suggestions/:id/vote')
  async voteSuggestion(
    @CurrentUser() user: { id?: string; sub?: string },
    @Param('id') id: string,
    @Body() body: { direction: 'up' | 'down' }
  ) {
    const userId = this.requireUserId(user);
    return this.ledger.voteRecord(id, body.direction, userId);
  }
}
