import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { UnifiedLedgerService } from './unified-ledger.service.js';
import { UnifiedRecordKind, UnifiedRecordStatus } from './unified-ledger.types.js';

@Controller()
export class UnifiedLedgerController {
  constructor(private readonly ledger: UnifiedLedgerService) {}

  @Get('unified-ledger/records')
  async list(
    @Query('kind') kind?: UnifiedRecordKind,
    @Query('status') status?: UnifiedRecordStatus,
    @Query('q') q?: string
  ) {
    return this.ledger.listRecords({ kind, status, q });
  }

  @Get('unified-ledger/records/:id')
  async get(@Param('id') id: string) {
    return this.ledger.getRecord(id);
  }

  @Get('unified-ledger/records/:id/connections')
  async connections(@Param('id') id: string) {
    return this.ledger.getRecordConnections(id);
  }

  @Post('unified-ledger/records')
  async create(@Body() body: any) {
    return this.ledger.createRecord(body);
  }

  @Patch('unified-ledger/records/:id')
  async patch(@Param('id') id: string, @Body() body: any) {
    return this.ledger.updateRecord(id, body);
  }

  @Post('unified-ledger/records/:id/vote')
  async vote(@Param('id') id: string, @Body() body: { direction: 'up' | 'down' }) {
    return this.ledger.voteRecord(id, body.direction);
  }

  @Post('unified-ledger/records/:id/feedback')
  async feedback(@Param('id') id: string, @Body() body: any) {
    return this.ledger.addFeedbackIteration(id, body);
  }

  @Post('unified-ledger/records/:id/links')
  async link(@Param('id') id: string, @Body() body: any) {
    return this.ledger.addFunctionalLink(id, body);
  }

  @Post('unified-ledger/ingest/orchestration')
  async ingest(@Body() body: any) {
    return this.ledger.ingestOrchestrationEvent(body);
  }

  @Get('unified-ledger/grid')
  async grid() {
    return this.ledger.getGrid();
  }

  @Get('timeline/macro')
  async macro() {
    return this.ledger.getMacroView();
  }

  @Get('timeline/events')
  async timeline(
    @Query('recordId') recordId?: string,
    @Query('goalId') goalId?: string,
    @Query('planId') planId?: string,
    @Query('eventType') eventType?: string,
    @Query('actor') actor?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string
  ) {
    return this.ledger.listTimelineEvents({
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
  async timelineEvent(@Param('id') id: string) {
    return this.ledger.getTimelineEvent(id);
  }

  @Post('timeline/events')
  async createTimelineEvent(@Body() body: any) {
    return this.ledger.createTimelineEvent(body);
  }

  @Patch('timeline/events/:id')
  async patchTimelineEvent(@Param('id') id: string, @Body() body: any) {
    return this.ledger.updateTimelineEvent(id, body);
  }

  @Post('goals')
  async createGoal(@Body() body: any) {
    return this.ledger.createGoal(body);
  }

  @Get('goals')
  async listGoals() {
    return this.ledger.listGoals();
  }

  @Get('goals/:id')
  async getGoal(@Param('id') id: string) {
    return this.ledger.getGoal(id);
  }

  @Post('goals/:id/link-record')
  async linkGoalRecord(
    @Param('id') id: string,
    @Body() body: { recordId: string; actor?: string }
  ) {
    return this.ledger.linkGoalToRecord(id, body.recordId, body.actor);
  }

  @Post('goals/:id/milestones')
  async addMilestone(@Param('id') id: string, @Body() body: any) {
    return this.ledger.addGoalMilestone(id, body);
  }

  @Patch('goals/:id/milestones/:milestoneId')
  async updateMilestone(
    @Param('id') id: string,
    @Param('milestoneId') milestoneId: string,
    @Body() body: any
  ) {
    return this.ledger.updateGoalMilestone(id, milestoneId, body);
  }

  @Delete('goals/:id/milestones/:milestoneId')
  async deleteMilestone(@Param('id') id: string, @Param('milestoneId') milestoneId: string) {
    return this.ledger.removeGoalMilestone(id, milestoneId);
  }

  @Post('plans')
  async createPlan(@Body() body: any) {
    return this.ledger.createPlan(body);
  }

  @Get('plans')
  async listPlans() {
    return this.ledger.listPlans();
  }

  @Get('plans/:id')
  async getPlan(@Param('id') id: string) {
    return this.ledger.getPlan(id);
  }

  @Post('plans/:id/link')
  async linkPlan(
    @Param('id') id: string,
    @Body() body: { goalId?: string; recordId?: string; actor?: string }
  ) {
    return this.ledger.linkPlan(id, body);
  }

  // Compatibility routes for existing frontend pages.
  @Get('tasks')
  async listTasks(@Query('status') status?: UnifiedRecordStatus, @Query('q') q?: string) {
    return this.ledger.listRecords({ kind: 'task', status, q });
  }

  @Get('tasks/:id')
  async getTask(@Param('id') id: string) {
    return this.ledger.getRecord(id);
  }

  @Post('tasks')
  async createTask(@Body() body: any) {
    return this.ledger.createRecord({
      ...body,
      kind: 'task',
      source: body.source || 'api',
    });
  }

  @Patch('tasks/:id')
  async patchTask(@Param('id') id: string, @Body() body: any) {
    return this.ledger.updateRecord(id, body);
  }

  @Get('suggestions')
  async listSuggestions(@Query('status') status?: UnifiedRecordStatus, @Query('q') q?: string) {
    return this.ledger.listRecords({ kind: 'suggestion', status, q });
  }

  @Get('suggestions/:id')
  async getSuggestion(@Param('id') id: string) {
    return this.ledger.getRecord(id);
  }

  @Post('suggestions')
  async createSuggestion(@Body() body: any) {
    return this.ledger.createRecord({
      ...body,
      kind: 'suggestion',
      source: body.source || 'api',
      status: body.status || 'submitted',
    });
  }

  @Patch('suggestions/:id')
  async patchSuggestion(@Param('id') id: string, @Body() body: any) {
    return this.ledger.updateRecord(id, body);
  }

  @Post('suggestions/:id/vote')
  async voteSuggestion(@Param('id') id: string, @Body() body: { direction: 'up' | 'down' }) {
    return this.ledger.voteRecord(id, body.direction);
  }
}
