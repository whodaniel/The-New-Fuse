import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Logger,
  NotFoundException,
  Optional,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { DatabaseService } from '@the-new-fuse/database';
import { AnalyzerAgentService } from '../../agents/analyzer.service';
import { isPrivilegedUser } from '../../auth/auth-policy';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { UnifiedLedgerService } from './unified-ledger.service';
import {
  UnifiedRecordKind,
  UnifiedRecordStatus,
  UnifiedWorkHorizon,
  UnifiedWorkLane,
} from './unified-ledger.types';

type AuthUser = {
  id?: string;
  sub?: string;
  user_id?: string;
  userId?: string;
  tenantId?: string;
  workspaceId?: string;
  activeWorkspaceId?: string;
  currentWorkspaceId?: string;
  context?: Record<string, unknown>;
  scope?: Record<string, unknown>;
  email?: string | null;
  name?: string | null;
  role?: string | null;
  roles?: unknown;
  permissions?: unknown;
};

@Controller('unified-ledger')
@UseGuards(JwtAuthGuard)
export class UnifiedLedgerController {
  private readonly logger = new Logger(UnifiedLedgerController.name);

  constructor(
    private readonly ledger: UnifiedLedgerService,
    private readonly db: DatabaseService,
    @Optional() private readonly analyzer?: AnalyzerAgentService
  ) {}

  private requireUserId(user: AuthUser | undefined): string {
    const userId = [user?.id, user?.sub, user?.user_id, user?.userId]
      .filter((value): value is string => typeof value === 'string')
      .map((value) => value.trim())
      .find((value) => value.length > 0);
    if (!userId) {
      throw new UnauthorizedException('Missing authenticated user');
    }
    return userId;
  }

  private resolveTenantId(user: AuthUser | undefined): string | undefined {
    const tenantId = user?.tenantId;
    if (typeof tenantId !== 'string') {
      return undefined;
    }
    const normalized = tenantId.trim();
    return normalized.length > 0 ? normalized : undefined;
  }

  private resolveTenantIdHint(value: unknown): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : undefined;
  }

  private resolveWorkspaceId(value: unknown): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : undefined;
  }

  private resolveAuthenticatedWorkspaceId(user: AuthUser | undefined): string | undefined {
    const directWorkspaceId = this.resolveWorkspaceId(user?.workspaceId);
    if (directWorkspaceId) {
      return directWorkspaceId;
    }

    const activeWorkspaceId = this.resolveWorkspaceId(user?.activeWorkspaceId);
    if (activeWorkspaceId) {
      return activeWorkspaceId;
    }

    const currentWorkspaceId = this.resolveWorkspaceId(user?.currentWorkspaceId);
    if (currentWorkspaceId) {
      return currentWorkspaceId;
    }

    const contextWorkspaceId = this.resolveWorkspaceId(user?.context?.workspaceId);
    if (contextWorkspaceId) {
      return contextWorkspaceId;
    }

    const scopeWorkspaceId = this.resolveWorkspaceId(user?.scope?.workspaceId);
    if (scopeWorkspaceId) {
      return scopeWorkspaceId;
    }

    return undefined;
  }

  private buildScope(
    user: AuthUser | undefined,
    workspaceHint?: unknown,
    tenantHint?: unknown
  ): {
    tenantId?: string;
    workspaceId?: string;
  } {
    const privileged = isPrivilegedUser(user || {});
    const authenticatedTenantId = this.resolveTenantId(user);
    const hintedTenantId = this.resolveTenantIdHint(tenantHint);
    if (
      authenticatedTenantId &&
      hintedTenantId &&
      authenticatedTenantId !== hintedTenantId &&
      !privileged
    ) {
      throw new ForbiddenException('tenantId mismatch with authenticated user tenant scope');
    }

    const authenticatedWorkspaceId = this.resolveAuthenticatedWorkspaceId(user);
    const hintedWorkspaceId = this.resolveWorkspaceId(workspaceHint);
    if (
      authenticatedWorkspaceId &&
      hintedWorkspaceId &&
      authenticatedWorkspaceId !== hintedWorkspaceId &&
      !privileged
    ) {
      throw new ForbiddenException('workspaceId mismatch with authenticated workspace scope');
    }

    const resolvedWorkspaceId =
      authenticatedWorkspaceId &&
      (!hintedWorkspaceId || authenticatedWorkspaceId === hintedWorkspaceId)
        ? authenticatedWorkspaceId
        : hintedWorkspaceId;

    return {
      tenantId: privileged ? hintedTenantId || authenticatedTenantId : authenticatedTenantId,
      workspaceId: resolvedWorkspaceId,
    };
  }

  private scopeArgs(scope: {
    tenantId?: string;
    workspaceId?: string;
  }): [] | [{ tenantId?: string; workspaceId?: string }] {
    if (!scope.tenantId && !scope.workspaceId) {
      return [];
    }
    return [scope];
  }

  private withScope<T extends Record<string, unknown>>(
    payload: T,
    scope: { tenantId?: string; workspaceId?: string }
  ): T & { tenantId?: string; workspaceId?: string } {
    return {
      ...payload,
      ...(scope.tenantId ? { tenantId: scope.tenantId } : {}),
      ...(scope.workspaceId ? { workspaceId: scope.workspaceId } : {}),
    };
  }

  private async assertWorkspaceWriteAccess(
    user: AuthUser | undefined,
    userId: string,
    workspaceId: string | undefined
  ): Promise<void> {
    if (!workspaceId) {
      return;
    }

    const workspace = await this.db.workspaces.findByIdWithOwner(workspaceId);
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    if (isPrivilegedUser(user || {})) {
      return;
    }

    if (workspace.ownerId === userId) {
      return;
    }

    const membership = await this.db.workspaceMembers.findMembership(workspaceId, userId);
    if (!membership) {
      throw new ForbiddenException('Workspace access denied');
    }
  }

  private tenantOnlyScope(scope: { tenantId?: string; workspaceId?: string }): {
    tenantId?: string;
    workspaceId?: string;
  } {
    if (!scope.tenantId) {
      return {};
    }
    return { tenantId: scope.tenantId };
  }

  private async resolveWriteScope(
    user: AuthUser | undefined,
    userId: string,
    scope: { tenantId?: string; workspaceId?: string },
    workspaceResolver?: () => Promise<{ workspaceId?: string } | null | undefined>
  ): Promise<{ tenantId?: string; workspaceId?: string }> {
    let resolvedScope = scope;
    if (!resolvedScope.workspaceId && workspaceResolver) {
      const entity = await workspaceResolver();
      const derivedWorkspaceId = this.resolveWorkspaceId(entity?.workspaceId);
      if (derivedWorkspaceId) {
        resolvedScope = { ...resolvedScope, workspaceId: derivedWorkspaceId };
      }
    }
    await this.assertWorkspaceWriteAccess(user, userId, resolvedScope.workspaceId);
    return resolvedScope;
  }

  private mapIssueSeverityToPriority(
    severity: 'critical' | 'high' | 'medium' | 'low' | string
  ): 'critical' | 'high' | 'medium' | 'low' {
    if (severity === 'critical') {
      return 'critical';
    }
    if (severity === 'high') {
      return 'high';
    }
    if (severity === 'low') {
      return 'low';
    }
    return 'medium';
  }

  private normalizeSuggestionKey(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  private async ingestAnalyzerSuggestions(
    owner: string,
    scope: { tenantId?: string; workspaceId?: string },
    existing: Array<{ title?: string }>
  ): Promise<number> {
    if (!this.analyzer) {
      return 0;
    }

    try {
      const issues = await this.analyzer.getSuggestions();
      if (!Array.isArray(issues) || issues.length === 0) {
        return 0;
      }

      const existingKeys = new Set(
        existing
          .map((record) =>
            typeof record?.title === 'string' ? this.normalizeSuggestionKey(record.title) : ''
          )
          .filter((value) => value.length > 0)
      );

      let created = 0;
      for (const issue of issues) {
        const title = String(issue?.suggestion || issue?.description || '').trim();
        if (!title) {
          continue;
        }

        const normalizedTitle = this.normalizeSuggestionKey(title);
        if (existingKeys.has(normalizedTitle)) {
          continue;
        }

        const filePath = String(issue?.file || '').trim();
        const lineNumber = typeof issue?.line === 'number' ? issue.line : undefined;
        const issueType = String(issue?.type || 'quality').trim();
        const issueDescription = String(issue?.description || '').trim();
        const issueEffort = String(issue?.estimatedEffort || 'medium').trim();
        const severity = String(issue?.severity || 'medium')
          .trim()
          .toLowerCase();
        const priority = this.mapIssueSeverityToPriority(severity);

        const descriptionParts = [
          issueDescription || title,
          filePath ? `Location: ${filePath}${lineNumber ? `:${lineNumber}` : ''}.` : undefined,
          issueType ? `Type: ${issueType}.` : undefined,
          issueEffort ? `Estimated effort: ${issueEffort}.` : undefined,
          'Origin: Analyzer agent feature recommendation.',
        ].filter((part): part is string => typeof part === 'string' && part.trim().length > 0);

        await this.ledger.createRecord(
          this.withScope(
            {
              kind: 'suggestion',
              owner,
              title,
              description: descriptionParts.join(' '),
              status: 'submitted',
              priority,
              tags: ['ai-generated', 'analyzer-agent', issueType, severity].filter(
                (tag) => tag && tag !== 'undefined'
              ),
              source: 'system',
              metadata: {
                origin: 'analyzer-agent',
                issueId: issue?.id,
                issueType,
                severity,
                file: filePath || undefined,
                line: lineNumber,
                impact: issue?.impact,
                estimatedEffort: issueEffort,
              },
            },
            scope
          )
        );

        existingKeys.add(normalizedTitle);
        created += 1;
      }

      return created;
    } catch (error) {
      this.logger.warn(
        `Analyzer suggestion ingestion failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return 0;
    }
  }

  @Get('unified-ledger/records')
  async list(
    @CurrentUser() user: AuthUser,
    @Query('kind') kind?: UnifiedRecordKind,
    @Query('status') status?: UnifiedRecordStatus,
    @Query('lane') lane?: UnifiedWorkLane,
    @Query('horizon') horizon?: UnifiedWorkHorizon,
    @Query('q') q?: string,
    @Query('workspaceId') workspaceId?: string
  ) {
    const userId = this.requireUserId(user);
    const scope = this.buildScope(user, workspaceId);
    return this.ledger.listRecords(
      this.withScope({ owner: userId, kind, status, lane, horizon, q }, scope)
    );
  }

  @Get('unified-ledger/records/:id')
  async get(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Query('workspaceId') workspaceId?: string
  ) {
    const userId = this.requireUserId(user);
    const scope = this.buildScope(user, workspaceId);
    return this.ledger.getRecord(id, userId, ...this.scopeArgs(scope));
  }

  @Get('unified-ledger/records/:id/connections')
  async connections(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Query('workspaceId') workspaceId?: string
  ) {
    const userId = this.requireUserId(user);
    const scope = this.buildScope(user, workspaceId);
    return this.ledger.getRecordConnections(id, userId, ...this.scopeArgs(scope));
  }

  @Post('unified-ledger/records')
  async create(@CurrentUser() user: AuthUser, @Body() body: any) {
    const userId = this.requireUserId(user);
    const scope = await this.resolveWriteScope(
      user,
      userId,
      this.buildScope(user, body?.workspaceId, (body as any)?.tenantId)
    );
    return this.ledger.createRecord(
      this.withScope({ ...body, owner: userId, source: body.source || 'api' }, scope)
    );
  }

  @Patch('unified-ledger/records/:id')
  async patch(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: any) {
    const userId = this.requireUserId(user);
    const baseScope = this.buildScope(user, body?.workspaceId, (body as any)?.tenantId);
    const scope = await this.resolveWriteScope(user, userId, baseScope, async () =>
      this.ledger.getRecord(id, userId, ...this.scopeArgs(this.tenantOnlyScope(baseScope)))
    );
    return this.ledger.updateRecord(
      id,
      this.withScope({ ...body, owner: userId }, scope),
      userId,
      ...this.scopeArgs(scope)
    );
  }

  @Post('unified-ledger/records/:id/vote')
  async vote(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { direction: 'up' | 'down'; workspaceId?: string }
  ) {
    const userId = this.requireUserId(user);
    const baseScope = this.buildScope(user, body?.workspaceId, (body as any)?.tenantId);
    const scope = await this.resolveWriteScope(user, userId, baseScope, async () =>
      this.ledger.getRecord(id, userId, ...this.scopeArgs(this.tenantOnlyScope(baseScope)))
    );
    return this.ledger.voteRecord(id, body.direction, userId, ...this.scopeArgs(scope));
  }

  @Post('unified-ledger/records/:id/feedback')
  async feedback(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: any) {
    const userId = this.requireUserId(user);
    const baseScope = this.buildScope(user, body?.workspaceId, (body as any)?.tenantId);
    const scope = await this.resolveWriteScope(user, userId, baseScope, async () =>
      this.ledger.getRecord(id, userId, ...this.scopeArgs(this.tenantOnlyScope(baseScope)))
    );
    return this.ledger.addFeedbackIteration(id, body, userId, ...this.scopeArgs(scope));
  }

  @Post('unified-ledger/records/:id/links')
  async link(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: any) {
    const userId = this.requireUserId(user);
    const baseScope = this.buildScope(user, body?.workspaceId, (body as any)?.tenantId);
    const scope = await this.resolveWriteScope(user, userId, baseScope, async () =>
      this.ledger.getRecord(id, userId, ...this.scopeArgs(this.tenantOnlyScope(baseScope)))
    );
    return this.ledger.addFunctionalLink(id, body, userId, ...this.scopeArgs(scope));
  }

  @Post('unified-ledger/ingest/orchestration')
  async ingest(@CurrentUser() _user: { id?: string; sub?: string }, @Body() body: any) {
    return this.ledger.ingestOrchestrationEvent(body);
  }

  @Get('unified-ledger/grid')
  async grid(@CurrentUser() user: AuthUser, @Query('workspaceId') workspaceId?: string) {
    const userId = this.requireUserId(user);
    const scope = this.buildScope(user, workspaceId);
    return this.ledger.getGrid(userId, ...this.scopeArgs(scope));
  }

  @Get('timeline/events')
  async timeline(
    @CurrentUser() user: AuthUser,
    @Query('ownerId') ownerId?: string,
    @Query('recordId') recordId?: string,
    @Query('goalId') goalId?: string,
    @Query('planId') planId?: string,
    @Query('eventType') eventType?: string,
    @Query('actor') actor?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('timelineTrack') timelineTrack?: string,
    @Query('workspaceId') workspaceId?: string
  ) {
    const userId = this.requireUserId(user);
    const scope = this.buildScope(user, workspaceId);
    const scopedOwnerId =
      typeof ownerId === 'string' && ownerId.trim().length > 0 ? ownerId.trim() : userId;
    return this.ledger.listTimelineEvents(
      this.withScope(
        {
          userId: scopedOwnerId,
          viewerUserId: userId,
          recordId,
          goalId,
          planId,
          eventType,
          actor,
          dateFrom,
          dateTo,
          timelineTrack,
        },
        scope
      )
    );
  }

  @Get('timeline/events/:id')
  async timelineEvent(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Query('workspaceId') workspaceId?: string
  ) {
    const userId = this.requireUserId(user);
    const scope = this.buildScope(user, workspaceId);
    return this.ledger.getTimelineEvent(id, userId, ...this.scopeArgs(scope));
  }

  @Post('timeline/events')
  async createTimelineEvent(@CurrentUser() user: AuthUser, @Body() body: any) {
    const userId = this.requireUserId(user);
    const scope = await this.resolveWriteScope(
      user,
      userId,
      this.buildScope(user, body?.workspaceId, (body as any)?.tenantId)
    );
    return this.ledger.createTimelineEvent(this.withScope({ ...body, userId }, scope));
  }

  @Patch('timeline/events/:id')
  async patchTimelineEvent(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: any
  ) {
    const userId = this.requireUserId(user);
    const baseScope = this.buildScope(user, body?.workspaceId, (body as any)?.tenantId);
    const scope = await this.resolveWriteScope(user, userId, baseScope, async () =>
      this.ledger.getTimelineEvent(id, userId, ...this.scopeArgs(this.tenantOnlyScope(baseScope)))
    );
    return this.ledger.updateTimelineEvent(
      id,
      this.withScope({ ...body, userId }, scope),
      ...this.scopeArgs(scope)
    );
  }

  @Delete('timeline/events/:id')
  async deleteTimelineEvent(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Query('workspaceId') workspaceId?: string
  ) {
    const userId = this.requireUserId(user);
    const baseScope = this.buildScope(user, workspaceId);
    const scope = await this.resolveWriteScope(user, userId, baseScope, async () =>
      this.ledger.getTimelineEvent(id, userId, ...this.scopeArgs(this.tenantOnlyScope(baseScope)))
    );
    return this.ledger.deleteTimelineEvent(id, userId, ...this.scopeArgs(scope));
  }

  @Post('timeline/personal/bootstrap')
  async bootstrapPersonalTimeline(@CurrentUser() user: AuthUser) {
    const userId = this.requireUserId(user);
    const roles = Array.isArray(user.roles)
      ? user.roles.filter((role): role is string => typeof role === 'string')
      : undefined;
    return this.ledger.bootstrapPersonalTimeline(userId, {
      email: typeof user.email === 'string' ? user.email : undefined,
      name: typeof user.name === 'string' ? user.name : undefined,
      role: typeof user.role === 'string' ? user.role : undefined,
      roles,
    });
  }

  @Post('timeline/github/import')
  async importGithubNarrativeTimeline(
    @CurrentUser() user: { id?: string; sub?: string },
    @Body()
    body?: {
      reportPath?: string;
      report?: unknown;
      replaceExisting?: boolean;
      actor?: string;
    }
  ) {
    const userId = this.requireUserId(user);
    return this.ledger.importGithubNarrativeTimeline(userId, body || {});
  }

  @Get('timeline/github/graph')
  async githubNarrativeGraph(
    @CurrentUser() user: AuthUser,
    @Query('ownerId') ownerId?: string,
    @Query('timelineTrack') timelineTrack?: string,
    @Query('workspaceId') workspaceId?: string
  ) {
    const userId = this.requireUserId(user);
    const scope = this.buildScope(user, workspaceId);
    const scopedOwnerId =
      typeof ownerId === 'string' && ownerId.trim().length > 0 ? ownerId.trim() : userId;
    return this.ledger.getGithubNarrativeGraph(
      this.withScope(
        {
          userId: scopedOwnerId,
          viewerUserId: userId,
          timelineTrack,
        },
        scope
      )
    );
  }

  @Post('goals')
  async createGoal(@CurrentUser() user: AuthUser, @Body() body: any) {
    const userId = this.requireUserId(user);
    const scope = await this.resolveWriteScope(
      user,
      userId,
      this.buildScope(user, body?.workspaceId, (body as any)?.tenantId)
    );
    return this.ledger.createGoal(this.withScope({ ...body, owner: userId }, scope));
  }

  @Get('goals')
  async listGoals(@CurrentUser() user: AuthUser, @Query('workspaceId') workspaceId?: string) {
    const userId = this.requireUserId(user);
    return this.ledger.listGoals(
      this.withScope({ owner: userId }, this.buildScope(user, workspaceId))
    );
  }

  @Get('goals/:id')
  async getGoal(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Query('workspaceId') workspaceId?: string
  ) {
    const userId = this.requireUserId(user);
    const scope = this.buildScope(user, workspaceId);
    return this.ledger.getGoal(id, userId, ...this.scopeArgs(scope));
  }

  @Post('goals/:id/link-record')
  async linkGoalRecord(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { recordId: string; actor?: string; owner?: string }
  ) {
    const userId = this.requireUserId(user);
    const baseScope = this.buildScope(user, (body as any)?.workspaceId, (body as any)?.tenantId);
    const scope = await this.resolveWriteScope(user, userId, baseScope, async () =>
      this.ledger.getGoal(id, userId, ...this.scopeArgs(this.tenantOnlyScope(baseScope)))
    );
    return this.ledger.linkGoalToRecord(
      id,
      body.recordId,
      body.actor || userId,
      userId,
      ...this.scopeArgs(scope)
    );
  }

  @Post('goals/:id/milestones')
  async addMilestone(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: any) {
    const userId = this.requireUserId(user);
    const baseScope = this.buildScope(user, body?.workspaceId, (body as any)?.tenantId);
    const scope = await this.resolveWriteScope(user, userId, baseScope, async () =>
      this.ledger.getGoal(id, userId, ...this.scopeArgs(this.tenantOnlyScope(baseScope)))
    );
    return this.ledger.addGoalMilestone(id, { ...body, owner: userId }, ...this.scopeArgs(scope));
  }

  @Patch('goals/:id/milestones/:milestoneId')
  async updateMilestone(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('milestoneId') milestoneId: string,
    @Body() body: any
  ) {
    const userId = this.requireUserId(user);
    const baseScope = this.buildScope(user, body?.workspaceId, (body as any)?.tenantId);
    const scope = await this.resolveWriteScope(user, userId, baseScope, async () =>
      this.ledger.getGoal(id, userId, ...this.scopeArgs(this.tenantOnlyScope(baseScope)))
    );
    return this.ledger.updateGoalMilestone(
      id,
      milestoneId,
      { ...body, owner: userId },
      ...this.scopeArgs(scope)
    );
  }

  @Delete('goals/:id/milestones/:milestoneId')
  async deleteMilestone(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('milestoneId') milestoneId: string,
    @Query('workspaceId') workspaceId?: string
  ) {
    const userId = this.requireUserId(user);
    const baseScope = this.buildScope(user, workspaceId);
    const scope = await this.resolveWriteScope(user, userId, baseScope, async () =>
      this.ledger.getGoal(id, userId, ...this.scopeArgs(this.tenantOnlyScope(baseScope)))
    );
    return this.ledger.removeGoalMilestone(id, milestoneId, userId, ...this.scopeArgs(scope));
  }

  @Post('plans')
  async createPlan(@CurrentUser() user: AuthUser, @Body() body: any) {
    const userId = this.requireUserId(user);
    const scope = await this.resolveWriteScope(
      user,
      userId,
      this.buildScope(user, body?.workspaceId, (body as any)?.tenantId)
    );
    return this.ledger.createPlan(this.withScope({ ...body, owner: userId }, scope));
  }

  @Get('plans')
  async listPlans(@CurrentUser() user: AuthUser, @Query('workspaceId') workspaceId?: string) {
    const userId = this.requireUserId(user);
    return this.ledger.listPlans(
      this.withScope({ owner: userId }, this.buildScope(user, workspaceId))
    );
  }

  @Get('plans/:id')
  async getPlan(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Query('workspaceId') workspaceId?: string
  ) {
    const userId = this.requireUserId(user);
    const scope = this.buildScope(user, workspaceId);
    return this.ledger.getPlan(id, userId, ...this.scopeArgs(scope));
  }

  @Post('plans/:id/link')
  async linkPlan(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { owner?: string; goalId?: string; recordId?: string; actor?: string }
  ) {
    const userId = this.requireUserId(user);
    const baseScope = this.buildScope(user, (body as any)?.workspaceId, (body as any)?.tenantId);
    const scope = await this.resolveWriteScope(user, userId, baseScope, async () =>
      this.ledger.getPlan(id, userId, ...this.scopeArgs(this.tenantOnlyScope(baseScope)))
    );
    return this.ledger.linkPlan(
      id,
      { ...body, owner: userId, actor: body.actor || userId },
      ...this.scopeArgs(scope)
    );
  }

  // Compatibility routes for existing frontend pages under unified-ledger namespace.
  @Get('unified-ledger/tasks')
  async listTasks(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: UnifiedRecordStatus,
    @Query('lane') lane?: UnifiedWorkLane,
    @Query('horizon') horizon?: UnifiedWorkHorizon,
    @Query('q') q?: string,
    @Query('workspaceId') workspaceId?: string
  ) {
    const userId = this.requireUserId(user);
    return this.ledger.listRecords(
      this.withScope(
        { owner: userId, kind: 'task' as UnifiedRecordKind, status, lane, horizon, q },
        this.buildScope(user, workspaceId)
      )
    );
  }

  @Get('unified-ledger/tasks/:id')
  async getTask(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Query('workspaceId') workspaceId?: string
  ) {
    const userId = this.requireUserId(user);
    const scope = this.buildScope(user, workspaceId);
    return this.ledger.getRecord(id, userId, ...this.scopeArgs(scope));
  }

  @Post('unified-ledger/tasks')
  async createTask(@CurrentUser() user: AuthUser, @Body() body: any) {
    const userId = this.requireUserId(user);
    const scope = await this.resolveWriteScope(
      user,
      userId,
      this.buildScope(user, body?.workspaceId, (body as any)?.tenantId)
    );
    return this.ledger.createRecord(
      this.withScope(
        {
          ...body,
          kind: 'task',
          owner: userId,
          source: body.source || 'api',
        },
        scope
      )
    );
  }

  @Patch('unified-ledger/tasks/:id')
  async patchTask(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: any) {
    const userId = this.requireUserId(user);
    const baseScope = this.buildScope(user, body?.workspaceId, (body as any)?.tenantId);
    const scope = await this.resolveWriteScope(user, userId, baseScope, async () =>
      this.ledger.getRecord(id, userId, ...this.scopeArgs(this.tenantOnlyScope(baseScope)))
    );
    return this.ledger.updateRecord(
      id,
      this.withScope({ ...body, owner: userId }, scope),
      userId,
      ...this.scopeArgs(scope)
    );
  }

  @Get('suggestions')
  async listSuggestions(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: UnifiedRecordStatus,
    @Query('lane') lane?: UnifiedWorkLane,
    @Query('horizon') horizon?: UnifiedWorkHorizon,
    @Query('q') q?: string,
    @Query('workspaceId') workspaceId?: string
  ) {
    const userId = this.requireUserId(user);
    const scope = this.buildScope(user, workspaceId);
    const baseFilters = this.withScope(
      {
        owner: userId,
        kind: 'suggestion' as UnifiedRecordKind,
        status,
        lane,
        horizon,
        q,
      },
      scope
    );

    let rows = await this.ledger.listRecords(baseFilters);
    const allowAiAutofill = !status && !lane && !horizon && !q;
    if (rows.length === 0 && allowAiAutofill) {
      const created = await this.ingestAnalyzerSuggestions(userId, scope, rows);
      if (created > 0) {
        rows = await this.ledger.listRecords(baseFilters);
      }
    }
    return rows;
  }

  @Get('suggestions/:id')
  async getSuggestion(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Query('workspaceId') workspaceId?: string
  ) {
    const userId = this.requireUserId(user);
    const scope = this.buildScope(user, workspaceId);
    return this.ledger.getRecord(id, userId, ...this.scopeArgs(scope));
  }

  @Post('suggestions')
  async createSuggestion(@CurrentUser() user: AuthUser, @Body() body: any) {
    const userId = this.requireUserId(user);
    const scope = await this.resolveWriteScope(
      user,
      userId,
      this.buildScope(user, body?.workspaceId, (body as any)?.tenantId)
    );
    return this.ledger.createRecord(
      this.withScope(
        {
          ...body,
          kind: 'suggestion',
          owner: userId,
          source: body.source || 'api',
          status: body.status || 'submitted',
        },
        scope
      )
    );
  }

  @Patch('suggestions/:id')
  async patchSuggestion(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: any) {
    const userId = this.requireUserId(user);
    const baseScope = this.buildScope(user, body?.workspaceId, (body as any)?.tenantId);
    const scope = await this.resolveWriteScope(user, userId, baseScope, async () =>
      this.ledger.getRecord(id, userId, ...this.scopeArgs(this.tenantOnlyScope(baseScope)))
    );
    return this.ledger.updateRecord(
      id,
      this.withScope({ ...body, owner: userId }, scope),
      userId,
      ...this.scopeArgs(scope)
    );
  }

  @Post('suggestions/:id/vote')
  async voteSuggestion(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { direction: 'up' | 'down'; workspaceId?: string }
  ) {
    const userId = this.requireUserId(user);
    const baseScope = this.buildScope(user, body?.workspaceId, (body as any)?.tenantId);
    const scope = await this.resolveWriteScope(user, userId, baseScope, async () =>
      this.ledger.getRecord(id, userId, ...this.scopeArgs(this.tenantOnlyScope(baseScope)))
    );
    return this.ledger.voteRecord(id, body.direction, userId, ...this.scopeArgs(scope));
  }
}
