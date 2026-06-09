// @ts-nocheck
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
  Optional,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
// @ts-ignore
// @ts-ignore
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  and,
  DatabaseService,
  desc,
  drizzleSchema,
  eq,
  isNull,
  sql,
  tasks,
} from '@the-new-fuse/database';
import { randomUUID } from 'node:crypto';
import { promises as dns } from 'node:dns';
import { promises as fs } from 'fs';
import * as os from 'node:os';
import * as path from 'path';
import { CurrentUser } from '../decorators/current-user.decorator';
import { SecureAuthGuard } from '../guards/secure-auth.guard';
import { UnifiedLedgerService } from '../modules/unified-ledger/unified-ledger.service';

type WorkspaceAccessRole = 'owner' | 'admin' | 'member' | 'viewer';
type WorkspaceManageableRole = Exclude<WorkspaceAccessRole, 'owner'>;

/**
 * DTO for creating a new workspace
 */
export class CreateWorkspaceDto {
  name!: string;
  description?: string;
}

/**
 * DTO for updating a workspace
 */
export class UpdateWorkspaceDto {
  name?: string;
  description?: string;
}

/**
 * DTO for adding a workspace member
 */
export class AddWorkspaceMemberDto {
  userId?: string;
  email?: string;
  role?: WorkspaceManageableRole;
}

/**
 * DTO for updating a workspace member role
 */
export class UpdateWorkspaceMemberRoleDto {
  role!: WorkspaceManageableRole;
}

/**
 * DTO for setting delegated sub-access (VA access)
 */
export class SetWorkspaceSubAccessDto extends AddWorkspaceMemberDto {}

/**
 * DTO for updating delegated sub-access (VA access)
 */
export class UpdateWorkspaceSubAccessDto extends UpdateWorkspaceMemberRoleDto {}

/**
 * DTO for workspace custom domain
 */
export class CreateWorkspaceDomainDto {
  domain!: string;
}

/**
 * DTO for workspace bookmark
 */
export class CreateWorkspaceBookmarkDto {
  title!: string;
  url!: string;
  tags?: string[];
  note?: string;
}

/**
 * DTO for updating workspace bookmark
 */
export class UpdateWorkspaceBookmarkDto {
  title?: string;
  url?: string;
  tags?: string[];
  note?: string;
}

interface WorkspaceWithOwner {
  id: string;
  ownerId: string;
  createdAt: Date;
  owner: { email: string | null } | null;
}

interface WorkspaceMemberView {
  userId: string;
  email: string | null;
  role: WorkspaceAccessRole;
  joinedAt: Date;
}

interface WorkspaceMembership {
  workspaceId: string;
  userId: string;
  role: WorkspaceAccessRole;
  addedByUserId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface WorkspaceAccessContext {
  workspace: WorkspaceWithOwner;
  membership: WorkspaceMembership | null;
  isOwner: boolean;
  isAdmin: boolean;
}

interface WorkspaceAssetSummaryProject {
  projectName: string;
  timelineTrackKeys: string[];
  timelineEventCount: number;
  linkedAssetCount: number;
  latestEvidenceAt: string | null;
}

interface WorkspaceAssetSummaryAsset {
  ref: string;
  occurrences: number;
  projects: string[];
  lastSeenAt: string | null;
}

interface WorkspaceAssetSummaryEvent {
  id: string;
  title: string;
  timestamp: string;
  projectName: string;
  linkedAssetCount: number;
}

interface WorkspaceAssetSummaryResponse {
  workspaceId: string;
  ownerId: string;
  scope: 'owner' | 'delegated';
  totalTimelineEvents: number;
  uniqueLinkedAssets: number;
  assetPagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  eventPagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  appliedFilters: {
    project: string | null;
    timelineTrack: string | null;
    assetSearch: string | null;
  };
  projects: WorkspaceAssetSummaryProject[];
  assets: WorkspaceAssetSummaryAsset[];
  recentEvents: WorkspaceAssetSummaryEvent[];
}

interface WorkspaceActor {
  id?: string;
  sub?: string;
  email?: string;
}

interface HostMariaSyncInputs {
  configPath: string;
  reportPath: string;
  archivePath: string;
  targets: string[];
  latestReport: Record<string, unknown> | null;
  latestArchive: Record<string, unknown> | null;
}

type HostMariaTaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
type HostMariaTaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

interface HostMariaTaskBlueprint {
  syncKey: string;
  title: string;
  description: string;
  status: HostMariaTaskStatus;
  priority: HostMariaTaskPriority;
  data: any;
  metadata: any;
}

interface HostMariaTaskSyncResult {
  created: number;
  updated: number;
  items: Array<Record<string, unknown>>;
}

type WorkspaceDomainStatus = 'pending' | 'verified' | 'error';

@ApiTags('workspaces')
@ApiBearerAuth()
@Controller('workspaces')
@UseGuards(SecureAuthGuard)
export class WorkspaceController implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WorkspaceController.name);
  private readonly hostMariaOwnerEmails = new Set(
    (process.env.HOSTMARIA_OWNER_EMAILS || 'owner@example.com')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter((email) => email.length > 0)
  );
  private hostMariaAutoSyncTimer: NodeJS.Timeout | null = null;
  private hostMariaAutoSyncRunning = false;

  constructor(
    private readonly db: DatabaseService,
    @Optional() private readonly unifiedLedger?: UnifiedLedgerService
  ) {}

  onModuleInit(): void {
    if (!this.isHostMariaAutoSyncEnabled()) {
      return;
    }

    const intervalMs = this.getHostMariaAutoSyncIntervalMs();
    const runOnStart = this.shouldRunHostMariaAutoSyncOnStart();

    this.logger.log(
      `HostMaria workspace auto-sync enabled (interval=${intervalMs}ms, runOnStart=${runOnStart})`
    );

    if (runOnStart) {
      void this.runHostMariaAutoSyncCycle('startup');
    }

    this.hostMariaAutoSyncTimer = setInterval(() => {
      void this.runHostMariaAutoSyncCycle('interval');
    }, intervalMs);
  }

  onModuleDestroy(): void {
    if (this.hostMariaAutoSyncTimer) {
      clearInterval(this.hostMariaAutoSyncTimer);
      this.hostMariaAutoSyncTimer = null;
    }
  }

  private isHostMariaAutoSyncEnabled(): boolean {
    const raw = String(process.env.HOSTMARIA_AUTO_SYNC_ENABLED || '')
      .trim()
      .toLowerCase();
    if (!raw) {
      return false;
    }
    return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on';
  }

  private shouldRunHostMariaAutoSyncOnStart(): boolean {
    const raw = String(process.env.HOSTMARIA_AUTO_SYNC_RUN_ON_START || '')
      .trim()
      .toLowerCase();
    if (!raw) return true;
    return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on';
  }

  private getHostMariaAutoSyncIntervalMs(): number {
    const fromEnv = Number.parseInt(process.env.HOSTMARIA_AUTO_SYNC_INTERVAL_MS || '', 10);
    if (Number.isFinite(fromEnv) && fromEnv >= 60_000) {
      return fromEnv;
    }
    return 10 * 60 * 1000;
  }

  private async runHostMariaAutoSyncCycle(
    trigger: 'startup' | 'interval' | 'manual'
  ): Promise<void> {
    if (this.hostMariaAutoSyncRunning) {
      return;
    }
    this.hostMariaAutoSyncRunning = true;

    try {
      const inputs = await this.readHostMariaSyncInputs();
      const noSignals =
        inputs.targets.length === 0 && !inputs.latestReport && !inputs.latestArchive;
      if (noSignals) {
        this.logger.warn(
          'HostMaria auto-sync skipped: no targets or latest report/archive artifacts detected'
        );
        return;
      }

      const allWorkspaces = await this.db.workspaces.findAllWithOwner();
      const eligible = allWorkspaces.filter((workspace: any) =>
        this.isHostMariaOwnerEmail(String(workspace.owner?.email || ''))
      );

      if (eligible.length === 0) {
        return;
      }

      let syncedWorkspaces = 0;
      let tasksCreated = 0;
      let tasksUpdated = 0;
      let ledgerCreated = 0;
      let ledgerUpdated = 0;

      for (const workspace of eligible) {
        try {
          const ownerEmail = String(workspace.owner?.email || '')
            .trim()
            .toLowerCase();
          const project = await this.upsertHostMariaProject(workspace.id, ownerEmail, inputs);
          const taskSync = await this.upsertHostMariaTasks(
            workspace.ownerId,
            workspace.id,
            project.id,
            ownerEmail,
            inputs
          );
          const ledgerSync = await this.upsertHostMariaLedgerTasks(
            workspace.ownerId,
            workspace.id,
            taskSync.items
          );

          syncedWorkspaces += 1;
          tasksCreated += taskSync.created;
          tasksUpdated += taskSync.updated;
          ledgerCreated += ledgerSync.created;
          ledgerUpdated += ledgerSync.updated;
        } catch (error) {
          this.logger.error(
            `HostMaria auto-sync failed for workspace ${workspace.id}`,
            error as Error
          );
        }
      }

      if (syncedWorkspaces > 0) {
        this.logger.log(
          `HostMaria auto-sync (${trigger}) completed: workspaces=${syncedWorkspaces}, tasks=+${tasksCreated}/~${tasksUpdated}, ledger=+${ledgerCreated}/~${ledgerUpdated}`
        );
      }
    } catch (error) {
      this.logger.error('HostMaria auto-sync cycle failed', error as Error);
    } finally {
      this.hostMariaAutoSyncRunning = false;
    }
  }

  private requireActor(user: WorkspaceActor): { userId: string; email: string } {
    const userId = user.id || user.sub;
    if (!userId) {
      throw new ForbiddenException('Authenticated user id is required');
    }

    const email = String(user.email || '')
      .trim()
      .toLowerCase();
    if (!email) {
      throw new ForbiddenException('Authenticated user email is required');
    }

    return { userId, email };
  }

  private isHostMariaOwnerEmail(email: string): boolean {
    return this.hostMariaOwnerEmails.has(
      String(email || '')
        .trim()
        .toLowerCase()
    );
  }

  private isHostMariaProject(project: unknown): boolean {
    const payload = this.asObject(project);
    const name = String(payload.name || '')
      .trim()
      .toLowerCase();
    const settings = this.asObject(payload.settings);
    return settings.hostMariaOps === true || name === 'hostmaria legacy ops';
  }

  private canAccessHostMariaWorkspace(
    access: WorkspaceAccessContext,
    actorEmail: string,
    mode: 'read' | 'write'
  ): boolean {
    const ownerEmail = String(access.workspace.owner?.email || '')
      .trim()
      .toLowerCase();
    if (!this.isHostMariaOwnerEmail(ownerEmail)) {
      return false;
    }

    if (this.isHostMariaOwnerEmail(actorEmail)) {
      return true;
    }

    const membership = access.membership;
    if (!membership) {
      return false;
    }

    const delegatedByOwner = membership.addedByUserId === access.workspace.ownerId;
    if (!delegatedByOwner) {
      return false;
    }

    if (mode === 'write') {
      return membership.role === 'admin' || membership.role === 'member';
    }

    return membership.role !== 'viewer';
  }

  private async ensureHostMariaWorkspaceAccess(
    workspaceId: string,
    user: WorkspaceActor,
    mode: 'read' | 'write'
  ): Promise<{ actor: { userId: string; email: string }; access: WorkspaceAccessContext }> {
    const actor = this.requireActor(user);
    const access =
      mode === 'write'
        ? await this.ensureWorkspaceMemberManagement(workspaceId, actor.userId)
        : await this.ensureWorkspaceAccess(workspaceId, actor.userId);

    if (!this.canAccessHostMariaWorkspace(access, actor.email, mode)) {
      throw new ForbiddenException(
        `HostMaria operations are restricted to account owner (${Array.from(this.hostMariaOwnerEmails).join(', ')}) and delegated agents.`
      );
    }

    return { actor, access };
  }

  private resolveHostMariaPaths() {
    const homeDir = os.homedir();
    return {
      configPath:
        process.env.HOSTMARIA_PROJECTS_FILE ||
        path.join(homeDir, '.tnf', 'hostmaria', 'projects.txt'),
      reportPath:
        process.env.HOSTMARIA_LATEST_REPORT_FILE ||
        path.join(homeDir, '.tnf', 'hostmaria', 'reports', 'hostmaria-preservation-latest.json'),
      archivePath:
        process.env.HOSTMARIA_LATEST_ARCHIVE_FILE ||
        path.join(homeDir, '.tnf', 'hostmaria', 'archive', 'latest-archive-summary.json'),
    };
  }

  private sanitizeSyncKey(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9:_-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);
  }

  private normalizeHostMariaTarget(input: unknown): string | null {
    const raw = String(input || '').trim();
    if (!raw || raw.startsWith('#')) return null;

    const withScheme = /^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(raw) ? raw : `https://${raw}`;
    try {
      const parsed = new URL(withScheme);
      const host = parsed.hostname.trim().toLowerCase();
      return host || null;
    } catch {
      return null;
    }
  }

  private normalizeHostMariaSeverity(value: unknown): 'ok' | 'warning' | 'critical' {
    const normalized = String(value || '')
      .trim()
      .toLowerCase();
    if (normalized === 'critical') return 'critical';
    if (normalized === 'warning') return 'warning';
    return 'ok';
  }

  private asObject(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }

  private asStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value
      .map((item: any) => String(item || '').trim())
      .filter((item: any) => item.length > 0);
  }

  private async readJsonObject(filePath: string): Promise<Record<string, unknown> | null> {
    try {
      const raw = await fs.readFile(filePath, 'utf8');
      const parsed: unknown = JSON.parse(raw);
      const payload = this.asObject(parsed);
      return Object.keys(payload).length > 0 ? payload : null;
    } catch {
      return null;
    }
  }

  private async readHostMariaSyncInputs(): Promise<HostMariaSyncInputs> {
    const { configPath, reportPath, archivePath } = this.resolveHostMariaPaths();

    let targets: string[] = [];
    try {
      const raw = await fs.readFile(configPath, 'utf8');
      targets = Array.from(
        new Set(
          raw
            .split('\n')
            .map((line) => this.normalizeHostMariaTarget(line))
            .filter((line): line is string => Boolean(line))
        )
      );
    } catch {
      targets = [];
    }

    const [latestReport, latestArchive] = await Promise.all([
      this.readJsonObject(reportPath),
      this.readJsonObject(archivePath),
    ]);

    return {
      configPath,
      reportPath,
      archivePath,
      targets,
      latestReport,
      latestArchive,
    };
  }

  private mapSeverityToTaskStatus(severity: 'ok' | 'warning' | 'critical'): HostMariaTaskStatus {
    if (severity === 'critical') return 'FAILED';
    if (severity === 'warning') return 'IN_PROGRESS';
    return 'COMPLETED';
  }

  private mapSeverityToTaskPriority(
    severity: 'ok' | 'warning' | 'critical'
  ): HostMariaTaskPriority {
    if (severity === 'critical') return 'URGENT';
    if (severity === 'warning') return 'HIGH';
    return 'MEDIUM';
  }

  private mapTaskStatusToLedgerStatus(
    status: string
  ): 'submitted' | 'in_progress' | 'completed' | 'failed' | 'rejected' {
    if (status === 'COMPLETED') return 'completed';
    if (status === 'IN_PROGRESS') return 'in_progress';
    if (status === 'FAILED') return 'failed';
    if (status === 'CANCELLED') return 'rejected';
    return 'submitted';
  }

  private mapTaskPriorityToLedgerPriority(
    priority: string
  ): 'low' | 'medium' | 'high' | 'critical' | 'urgent' {
    if (priority === 'URGENT') return 'urgent';
    if (priority === 'HIGH') return 'high';
    if (priority === 'LOW') return 'low';
    return 'medium';
  }

  private formatTargetStatusSummary(check: Record<string, unknown> | null): string {
    if (!check) return 'No live check data available yet.';

    const http = this.asObject(check.http);
    const tls = this.asObject(check.tls);
    const statusCode = Number(http.statusCode || 0);
    const daysRemaining = Number(tls.daysRemaining || 0);
    const httpSummary = statusCode > 0 ? `HTTP ${statusCode}` : 'HTTP unavailable';
    const tlsSummary =
      Number.isFinite(daysRemaining) && daysRemaining > 0
        ? `TLS ${daysRemaining} days remaining`
        : 'TLS unavailable';
    return `${httpSummary} | ${tlsSummary}`;
  }

  private buildHostMariaTaskBlueprints(
    workspaceId: string,
    projectId: string,
    actorEmail: string,
    inputs: HostMariaSyncInputs
  ): HostMariaTaskBlueprint[] {
    const latestReport = this.asObject(inputs.latestReport);
    const summary = this.asObject(latestReport.summary);
    const reportChecksRaw = Array.isArray(latestReport.checks) ? latestReport.checks : [];
    const reportChecks = reportChecksRaw.map((item: any) => this.asObject(item));
    const checksByTarget = new Map<string, Record<string, unknown>>();
    for (const check of reportChecks) {
      const normalizedTarget = this.normalizeHostMariaTarget(check.target);
      if (normalizedTarget) {
        checksByTarget.set(normalizedTarget, check);
      }
    }

    const reportSeverity = this.normalizeHostMariaSeverity(latestReport.status);
    const generatedAt = String(latestReport.generatedAt || 'unknown');
    const targetCount = inputs.targets.length;
    const okCount = Number(summary.ok || 0);
    const warningCount = Number(summary.warning || 0);
    const criticalCount = Number(summary.critical || 0);

    const sharedMetadata = {
      hostMariaOps: true,
      workspaceId,
      projectId,
      ownerEmail: actorEmail,
      configPath: inputs.configPath,
      reportPath: inputs.reportPath,
      archivePath: inputs.archivePath,
      targetCount,
      reportGeneratedAt: generatedAt,
      reportSeverity,
    };

    const blueprints: HostMariaTaskBlueprint[] = [
      {
        syncKey: 'hostmaria:monitor',
        title: 'HostMaria Preservation Monitor',
        description: `Track legacy site health every 10 minutes. Last report: ${generatedAt}. ok=${okCount}, warning=${warningCount}, critical=${criticalCount}.`,
        status: reportSeverity === 'critical' ? 'FAILED' : 'IN_PROGRESS',
        priority: reportSeverity === 'critical' ? 'URGENT' : 'HIGH',
        data: {
          command:
            'node scripts/runtime/hostmaria-preservation-check.cjs --config ~/.tnf/hostmaria/projects.txt --out-dir ~/.tnf/hostmaria/reports',
          latestReport: latestReport || null,
        },
        metadata: {
          ...sharedMetadata,
          hostMariaSyncKey: 'hostmaria:monitor',
          schedule: '*/10 * * * *',
        },
      },
      {
        syncKey: 'hostmaria:archive',
        title: 'HostMaria Daily Archive Snapshot',
        description: `Capture homepage/robots/sitemap snapshots daily for ${Math.max(targetCount, 1)} target(s).`,
        status: inputs.latestArchive ? 'IN_PROGRESS' : 'PENDING',
        priority: 'MEDIUM',
        data: {
          command:
            'node scripts/runtime/hostmaria-daily-archive.cjs --config ~/.tnf/hostmaria/projects.txt --out-dir ~/.tnf/hostmaria/archive',
          latestArchive: inputs.latestArchive || null,
        },
        metadata: {
          ...sharedMetadata,
          hostMariaSyncKey: 'hostmaria:archive',
          schedule: '17 2 * * *',
        },
      },
    ];

    for (const target of inputs.targets) {
      const check = checksByTarget.get(target) || null;
      const severity = this.normalizeHostMariaSeverity(check?.severity);
      const reasons = this.asStringArray(check?.reasons);
      blueprints.push({
        syncKey: `hostmaria:target:${this.sanitizeSyncKey(target)}`,
        title: `Preserve ${target}`,
        description:
          reasons.length > 0
            ? `${reasons.join(' | ')} (${this.formatTargetStatusSummary(check)})`
            : this.formatTargetStatusSummary(check),
        status: this.mapSeverityToTaskStatus(severity),
        priority: this.mapSeverityToTaskPriority(severity),
        data: {
          target,
          check,
        },
        metadata: {
          ...sharedMetadata,
          hostMariaSyncKey: `hostmaria:target:${this.sanitizeSyncKey(target)}`,
          target,
          severity,
          reasons,
        },
      });
    }

    return blueprints;
  }

  private async upsertHostMariaProject(
    workspaceId: string,
    actorEmail: string,
    inputs: HostMariaSyncInputs
  ) {
    const [existingProject] = await this.db.client
      .select()
      .from(drizzleSchema.projects)
      .where(
        and(
          eq(drizzleSchema.projects.workspaceId, workspaceId),
          eq(drizzleSchema.projects.name, 'HostMaria Legacy Ops')
        )
      )
      .orderBy(desc(drizzleSchema.projects.updatedAt))
      .limit(1);

    const report = this.asObject(inputs.latestReport);
    const reportSummary = this.asObject(report.summary);
    const description = `Legacy preservation + archive automation for ${Math.max(inputs.targets.length, 1)} target(s). Last report status: ${String(report.status || 'unknown')}.`;
    const settings = {
      hostMariaOps: true,
      ownerEmail: actorEmail,
      configPath: inputs.configPath,
      reportPath: inputs.reportPath,
      archivePath: inputs.archivePath,
      targets: inputs.targets,
      reportStatus: report.status || 'unknown',
      reportSummary,
      syncedAt: new Date().toISOString(),
    };

    if (existingProject) {
      const [updatedProject] = await this.db.client
        .update(drizzleSchema.projects)
        .set({
          description,
          settings,
          customInstructions:
            'Keep HostMaria legacy properties healthy with 10-minute checks and daily archival snapshots.',
          updatedAt: new Date(),
        })
        .where(eq(drizzleSchema.projects.id, existingProject.id))
        .returning();
      return updatedProject || existingProject;
    }

    const [createdProject] = await this.db.client
      .insert(drizzleSchema.projects)
      .values({
        id: `prj_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
        name: 'HostMaria Legacy Ops',
        description,
        workspaceId,
        customInstructions:
          'Keep HostMaria legacy properties healthy with 10-minute checks and daily archival snapshots.',
        settings,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return createdProject;
  }

  private async upsertHostMariaTasks(
    userId: string,
    workspaceId: string,
    projectId: string,
    actorEmail: string,
    inputs: HostMariaSyncInputs
  ): Promise<HostMariaTaskSyncResult> {
    try {
      return await this.upsertHostMariaTasksModern(
        userId,
        workspaceId,
        projectId,
        actorEmail,
        inputs
      );
    } catch (error) {
      if (!this.isHostMariaLegacyTaskSchemaError(error)) {
        throw error;
      }
      this.logger.warn(
        'HostMaria task sync detected legacy tasks schema; applying compatibility upsert path.'
      );
      return this.upsertHostMariaTasksLegacy(userId, workspaceId, projectId, actorEmail, inputs);
    }
  }

  private async upsertHostMariaTasksModern(
    userId: string,
    workspaceId: string,
    projectId: string,
    actorEmail: string,
    inputs: HostMariaSyncInputs
  ): Promise<HostMariaTaskSyncResult> {
    const blueprints = this.buildHostMariaTaskBlueprints(
      workspaceId,
      projectId,
      actorEmail,
      inputs
    );
    const existingTasks = await this.db.client
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, userId),
          eq(tasks.type, 'HOSTMARIA_LEGACY_OPS'),
          isNull(tasks.deletedAt)
        )
      );

    const bySyncKey = new Map<string, (typeof existingTasks)[number]>();
    for (const taskRow of existingTasks) {
      const metadata = this.asObject(taskRow.metadata);
      const syncKey = String(metadata.hostMariaSyncKey || '');
      if (syncKey) bySyncKey.set(syncKey, taskRow);
    }

    let created = 0;
    let updated = 0;
    const items: Array<Record<string, unknown>> = [];

    for (const blueprint of blueprints) {
      const existing = bySyncKey.get(blueprint.syncKey);
      if (existing) {
        const [updatedTask] = await this.db.client
          .update(tasks)
          .set({
            title: blueprint.title,
            description: blueprint.description,
            status: blueprint.status,
            priority: blueprint.priority,
            data: blueprint.data,
            metadata: blueprint.metadata,
            updatedAt: new Date(),
            deletedAt: null,
          })
          .where(eq(tasks.id, existing.id))
          .returning();

        if (updatedTask) {
          updated += 1;
          items.push({
            id: updatedTask.id,
            title: updatedTask.title,
            description: updatedTask.description,
            status: updatedTask.status,
            priority: updatedTask.priority,
            updatedAt: updatedTask.updatedAt,
            metadata: updatedTask.metadata,
          });
        }
        continue;
      }

      const [createdTask] = await this.db.client
        .insert(tasks)
        .values({
          type: 'HOSTMARIA_LEGACY_OPS',
          title: blueprint.title,
          description: blueprint.description,
          status: blueprint.status,
          priority: blueprint.priority,
          data: blueprint.data,
          metadata: blueprint.metadata,
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      if (createdTask) {
        created += 1;
        items.push({
          id: createdTask.id,
          title: createdTask.title,
          description: createdTask.description,
          status: createdTask.status,
          priority: createdTask.priority,
          updatedAt: createdTask.updatedAt,
          metadata: createdTask.metadata,
        });
      }
    }

    const liveSyncKeys = new Set(blueprints.map((blueprint) => blueprint.syncKey));
    for (const existing of existingTasks) {
      const metadata = this.asObject(existing.metadata);
      const syncKey = String(metadata.hostMariaSyncKey || '');
      if (!syncKey || liveSyncKeys.has(syncKey)) continue;

      const [cancelledTask] = await this.db.client
        .update(tasks)
        .set({
          status: 'CANCELLED',
          updatedAt: new Date(),
          metadata: {
            ...metadata,
            active: false,
            archivedAt: new Date().toISOString(),
          },
        })
        .where(eq(tasks.id, existing.id))
        .returning();

      if (cancelledTask) {
        updated += 1;
      }
    }

    return { created, updated, items };
  }

  private normalizeSqlRows(result: unknown): Array<Record<string, unknown>> {
    if (Array.isArray(result)) {
      return result.map((row: any) => this.asObject(row));
    }

    const payload = this.asObject(result);
    if (Array.isArray(payload.rows)) {
      return payload.rows.map((row: any) => this.asObject(row));
    }

    return [];
  }

  private isHostMariaLegacyTaskSchemaError(error: unknown): boolean {
    const message = String((error as Error | undefined)?.message || '').toLowerCase();
    return (
      message.includes('column "data" does not exist') ||
      message.includes('column "user_id" does not exist') ||
      message.includes('column "deleted_at" does not exist') ||
      message.includes('column "updated_at" does not exist') ||
      message.includes('column "created_at" does not exist')
    );
  }

  private async upsertHostMariaTasksLegacy(
    userId: string,
    workspaceId: string,
    projectId: string,
    actorEmail: string,
    inputs: HostMariaSyncInputs
  ): Promise<HostMariaTaskSyncResult> {
    const blueprints = this.buildHostMariaTaskBlueprints(
      workspaceId,
      projectId,
      actorEmail,
      inputs
    );
    const existingRaw = await this.db.client.execute(sql`
      SELECT
        "id",
        "title",
        "description",
        "status",
        "priority",
        "metadata",
        "updatedAt"
      FROM "tasks"
      WHERE "createdBy" = ${userId}
        AND "type" = 'HOSTMARIA_LEGACY_OPS'
    `);
    const existingTasks = this.normalizeSqlRows(existingRaw);

    const bySyncKey = new Map<string, Record<string, unknown>>();
    for (const taskRow of existingTasks) {
      const metadata = this.asObject(taskRow.metadata);
      const syncKey = String(metadata.hostMariaSyncKey || '');
      if (syncKey) bySyncKey.set(syncKey, taskRow);
    }

    let created = 0;
    let updated = 0;
    const items: Array<Record<string, unknown>> = [];

    for (const blueprint of blueprints) {
      const existing = bySyncKey.get(blueprint.syncKey);
      const now = new Date();
      const nowIso = now.toISOString();
      const completedAt = blueprint.status === 'COMPLETED' ? nowIso : null;
      const errorText = blueprint.status === 'FAILED' ? blueprint.description : null;
      const metadataJson = JSON.stringify(blueprint.metadata || {});

      if (existing) {
        const taskId = String(existing.id || '');
        if (!taskId) continue;

        const updatedRows = this.normalizeSqlRows(
          await this.db.client.execute(sql`
            UPDATE "tasks"
            SET
              "title" = ${blueprint.title},
              "description" = ${blueprint.description},
              "status" = ${blueprint.status},
              "priority" = ${blueprint.priority},
              "metadata" = ${metadataJson}::jsonb,
              "updatedAt" = ${nowIso},
              "completedAt" = ${completedAt},
              "error" = ${errorText}
            WHERE "id" = ${taskId}
            RETURNING
              "id",
              "title",
              "description",
              "status",
              "priority",
              "metadata",
              "updatedAt"
          `)
        );
        const updatedTask = updatedRows[0];
        if (updatedTask) {
          updated += 1;
          items.push({
            id: updatedTask.id,
            title: updatedTask.title,
            description: updatedTask.description,
            status: updatedTask.status,
            priority: updatedTask.priority,
            updatedAt: updatedTask.updatedAt,
            metadata: this.asObject(updatedTask.metadata),
          });
        }
        continue;
      }

      const taskId = `task_${randomUUID().replace(/-/g, '').slice(0, 24)}`;
      const createdRows = this.normalizeSqlRows(
        await this.db.client.execute(sql`
          INSERT INTO "tasks" (
            "id",
            "title",
            "description",
            "status",
            "priority",
            "type",
            "updatedAt",
            "createdBy",
            "metadata",
            "completedAt",
            "error"
          )
          VALUES (
            ${taskId},
            ${blueprint.title},
            ${blueprint.description},
            ${blueprint.status},
            ${blueprint.priority},
            'HOSTMARIA_LEGACY_OPS',
            ${nowIso},
            ${userId},
            ${metadataJson}::jsonb,
            ${completedAt},
            ${errorText}
          )
          RETURNING
            "id",
            "title",
            "description",
            "status",
            "priority",
            "metadata",
            "updatedAt"
        `)
      );
      const createdTask = createdRows[0];
      if (createdTask) {
        created += 1;
        items.push({
          id: createdTask.id,
          title: createdTask.title,
          description: createdTask.description,
          status: createdTask.status,
          priority: createdTask.priority,
          updatedAt: createdTask.updatedAt,
          metadata: this.asObject(createdTask.metadata),
        });
      }
    }

    const liveSyncKeys = new Set(blueprints.map((blueprint) => blueprint.syncKey));
    for (const existing of existingTasks) {
      const metadata = this.asObject(existing.metadata);
      const syncKey = String(metadata.hostMariaSyncKey || '');
      const taskId = String(existing.id || '');
      if (!taskId || !syncKey || liveSyncKeys.has(syncKey)) continue;

      await this.db.client.execute(sql`
        UPDATE "tasks"
        SET
          "status" = 'CANCELLED',
          "updatedAt" = ${new Date().toISOString()},
          "metadata" = ${JSON.stringify({
            ...metadata,
            active: false,
            archivedAt: new Date().toISOString(),
          })}::jsonb
        WHERE "id" = ${taskId}
      `);
      updated += 1;
    }

    return { created, updated, items };
  }

  private async upsertHostMariaLedgerTasks(
    userId: string,
    workspaceId: string,
    taskItems: Array<Record<string, unknown>>
  ): Promise<{ created: number; updated: number }> {
    if (!this.unifiedLedger) {
      return { created: 0, updated: 0 };
    }

    let created = 0;
    let updated = 0;

    for (const taskItem of taskItems) {
      const metadata = this.asObject(taskItem.metadata);
      const syncKey = String(metadata.hostMariaSyncKey || '');
      if (!syncKey) continue;

      const ledgerId =
        `hostmaria_${this.sanitizeSyncKey(workspaceId)}_${this.sanitizeSyncKey(syncKey)}`.slice(
          0,
          120
        );
      const existing = await this.unifiedLedger.getRecord(ledgerId, userId);

      const payload = {
        title: String(taskItem.title || 'HostMaria Task'),
        description: String(taskItem.description || ''),
        status: this.mapTaskStatusToLedgerStatus(String(taskItem.status || 'PENDING')),
        priority: this.mapTaskPriorityToLedgerPriority(String(taskItem.priority || 'MEDIUM')),
        owner: userId,
        tags: ['hostmaria', 'legacy', `workspace:${workspaceId}`],
        metadata: {
          ...(metadata || {}),
          sourceTaskId: taskItem.id,
          workspaceId,
        },
        source: 'orchestrator' as const,
      };

      if (existing) {
        await this.unifiedLedger.updateRecord(ledgerId, payload, userId);
        updated += 1;
      } else {
        await this.unifiedLedger.createRecord({
          id: ledgerId,
          kind: 'task',
          ...payload,
        });
        created += 1;
      }
    }

    return { created, updated };
  }

  private normalizeDomain(value: string): string {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) return '';

    let normalized = trimmed.replace(/^https?:\/\//, '');
    normalized = normalized.split('/')[0];
    if (normalized.startsWith('www.')) {
      normalized = normalized.slice(4);
    }
    return normalized;
  }

  private normalizeBookmarkUrl(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('/')) return trimmed;
    if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  }

  private isValidDomain(domain: string): boolean {
    return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/.test(
      domain
    );
  }

  private isValidBookmarkUrl(url: string): boolean {
    if (url.startsWith('/')) return true;
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private async verifyDomainDns(domain: string): Promise<{
    status: WorkspaceDomainStatus;
    verificationMessage: string;
  }> {
    const details: string[] = [];

    try {
      const cnames = await dns.resolveCname(domain);
      if (cnames.length > 0) {
        details.push(`CNAME -> ${cnames.join(', ')}`);
      }
    } catch {
      // Best effort: CNAME may not exist when A/AAAA is used.
    }

    try {
      const aRecords = await dns.resolve4(domain);
      if (aRecords.length > 0) {
        details.push(`A -> ${aRecords.join(', ')}`);
      }
    } catch {
      // Best effort: A record may not exist when CNAME/AAAA is used.
    }

    try {
      const aaaaRecords = await dns.resolve6(domain);
      if (aaaaRecords.length > 0) {
        details.push(`AAAA -> ${aaaaRecords.join(', ')}`);
      }
    } catch {
      // Best effort: AAAA may not exist.
    }

    if (details.length === 0) {
      return {
        status: 'error',
        verificationMessage: 'No DNS records found. Add CNAME or A/AAAA records and retry.',
      };
    }

    return {
      status: 'verified',
      verificationMessage: `DNS records found: ${details.join(' | ')}`,
    };
  }

  private handleError(error: unknown, context: string): never {
    if (error instanceof HttpException) {
      throw error;
    }
    this.logger.error(`${context} failed`, error as Error);
    throw new HttpException(
      (error as Error)?.message || 'Internal server error',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }

  private validateUser(userId: string | undefined): string {
    if (!userId) {
      throw new HttpException('Authentication required', HttpStatus.UNAUTHORIZED);
    }
    return userId;
  }

  private timelineTrackToProjectName(track: string): string {
    const normalized = track.trim();
    if (normalized === 'tnf_platform_development') return 'The New Fuse Platform';
    if (normalized === 'media_empire_strategy') return "Daniel Who's Media Empire";
    if (normalized === 'new_fuse_novel_development') return 'The New Fuse (Novel)';
    if (!normalized) return 'Unassigned';
    return normalized.replace(/_/g, ' ');
  }

  private readTimelineProject(payload: Record<string, unknown>): {
    projectName: string;
    timelineTrackKey: string | null;
  } {
    const explicitProject =
      typeof payload.project === 'string' ? payload.project.trim() : '';
    const trackCandidate =
      typeof payload.timelineTrack === 'string'
        ? payload.timelineTrack
        : typeof payload.segment === 'string'
          ? payload.segment
          : '';
    const timelineTrackKey = trackCandidate.trim() || null;

    if (explicitProject.length > 0) {
      return { projectName: explicitProject, timelineTrackKey };
    }
    if (timelineTrackKey) {
      return {
        projectName: this.timelineTrackToProjectName(timelineTrackKey),
        timelineTrackKey,
      };
    }

    return { projectName: 'Unassigned', timelineTrackKey: null };
  }

  private readTimelineAssetRefs(payload: Record<string, unknown>): string[] {
    const refs = new Set<string>();

    if (Array.isArray(payload.assetRefs)) {
      for (const value of payload.assetRefs) {
        if (typeof value !== 'string') continue;
        const trimmed = value.trim();
        if (trimmed.length > 0) refs.add(trimmed);
      }
    }

    if (Array.isArray(payload.evidenceRefs)) {
      for (const value of payload.evidenceRefs) {
        if (typeof value !== 'string') continue;
        const trimmed = value.trim();
        if (!trimmed.startsWith('librarian:artifact:')) continue;
        refs.add(trimmed.replace('librarian:artifact:', ''));
      }
    }

    return Array.from(refs);
  }

  private readTimelineEventTitle(event: any, payload: Record<string, unknown>): string {
    if (typeof payload.title === 'string' && payload.title.trim().length > 0) {
      return payload.title.trim();
    }
    if (typeof payload.note === 'string' && payload.note.trim().length > 0) {
      return payload.note.trim();
    }
    if (typeof event?.eventType === 'string' && event.eventType.trim().length > 0) {
      return event.eventType.trim();
    }
    return 'timeline_event';
  }

  private parsePositiveInt(
    input: string | undefined,
    fallback: number,
    min: number,
    max: number
  ): number {
    const value = Number.parseInt(String(input || ''), 10);
    if (!Number.isFinite(value)) return fallback;
    return Math.min(max, Math.max(min, value));
  }

  private normalizeRole(role?: string): WorkspaceManageableRole {
    return role === 'admin' || role === 'member' || role === 'viewer' ? role : 'member';
  }

  private async listAccessibleWorkspaces(userId: string) {
    const owned = await this.db.workspaces.findByOwnerWithOwner(userId);
    const memberRows = await this.db.workspaceMembers.listByUser(userId);
    const ownedIds = new Set(owned.map((workspace: any) => workspace.id));
    const memberIds = memberRows
      .map((row: any) => row.workspaceId)
      .filter((id: any) => !ownedIds.has(id));
    const memberWorkspaces = await this.db.workspaces.findByIdsWithOwner(memberIds);
    const roleByWorkspace = new Map(memberRows.map((row: any) => [row.workspaceId, row.role]));

    return [
      ...owned.map((workspace: any) => ({ ...workspace, membershipRole: 'owner' })),
      ...memberWorkspaces.map((workspace: any) => ({
        ...workspace,
        membershipRole: roleByWorkspace.get(workspace.id) || 'member',
      })),
    ];
  }

  private async ensureWorkspaceAccess(
    workspaceId: string,
    userId: string
  ): Promise<WorkspaceAccessContext> {
    const workspace = (await this.db.workspaces.findByIdWithOwner(
      workspaceId
    )) as WorkspaceWithOwner;
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const membership = (await this.db.workspaceMembers.findMembership(
      workspaceId,
      userId
    )) as WorkspaceMembership | null;
    const isOwner = workspace.ownerId === userId;
    const isAdmin = membership?.role === 'admin';

    if (!isOwner && !membership) {
      throw new ForbiddenException('You do not have access to this workspace');
    }

    return { workspace, membership, isOwner, isAdmin };
  }

  private async ensureWorkspaceMemberManagement(
    workspaceId: string,
    userId: string
  ): Promise<WorkspaceAccessContext> {
    const access = await this.ensureWorkspaceAccess(workspaceId, userId);
    if (!access.isOwner && !access.isAdmin) {
      throw new ForbiddenException('Only workspace owners or admins can manage members');
    }
    return access;
  }

  private async ensureWorkspaceWriteAccess(workspaceId: string, userId: string) {
    const access = await this.ensureWorkspaceAccess(workspaceId, userId);
    if (!access.isOwner && access.membership?.role === 'viewer') {
      throw new ForbiddenException('Workspace viewers have read-only access');
    }
    return access;
  }

  private async resolveTargetUserId(memberData: AddWorkspaceMemberDto): Promise<string> {
    if (memberData.userId?.trim()) {
      const existingById = await this.db.users.findById(memberData.userId.trim());
      if (!existingById) {
        throw new NotFoundException('User not found');
      }
      return existingById.id;
    }

    if (memberData.email?.trim()) {
      const normalizedEmail = memberData.email.trim().toLowerCase();
      const existingByEmail = await this.db.users.findByEmail(normalizedEmail);
      if (!existingByEmail) {
        throw new NotFoundException(
          'User with this email was not found. Ask them to create an account first.'
        );
      }
      return existingByEmail.id;
    }

    throw new BadRequestException('Either userId or email is required');
  }

  private async listWorkspaceMembersInternal(
    workspaceId: string,
    userId: string
  ): Promise<WorkspaceMemberView[]> {
    const { workspace } = await this.ensureWorkspaceAccess(workspaceId, userId);
    const members = await this.db.workspaceMembers.listByWorkspaceWithUsers(workspaceId);
    const hasOwner = members.some((member: any) => member.userId === workspace.ownerId);

    const formatted: WorkspaceMemberView[] = members.map((member: any) => ({
      userId: member.userId,
      email: member.userEmail,
      role: member.role as WorkspaceAccessRole,
      joinedAt: member.createdAt,
    }));

    if (!hasOwner) {
      formatted.unshift({
        userId: workspace.ownerId,
        email: workspace.owner?.email ?? null,
        role: 'owner',
        joinedAt: workspace.createdAt,
      });
    }

    return formatted;
  }

  private async addWorkspaceMemberInternal(
    workspaceId: string,
    memberData: AddWorkspaceMemberDto,
    actingUserId: string
  ) {
    const { workspace } = await this.ensureWorkspaceMemberManagement(workspaceId, actingUserId);
    const targetUserId = await this.resolveTargetUserId(memberData);

    if (targetUserId === workspace.ownerId) {
      throw new ForbiddenException('Workspace owner already has full access');
    }

    const role = this.normalizeRole(memberData.role);
    const member = await this.db.workspaceMembers.upsertMember({
      workspaceId,
      userId: targetUserId,
      role,
      addedByUserId: actingUserId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const targetUser = await this.db.users.findById(targetUserId);

    return {
      message: 'Workspace member added',
      member: {
        userId: member.userId,
        email: targetUser?.email ?? null,
        role: member.role,
        joinedAt: member.createdAt,
      },
    };
  }

  private async updateWorkspaceMemberRoleInternal(
    workspaceId: string,
    memberUserId: string,
    roleData: UpdateWorkspaceMemberRoleDto,
    actingUserId: string
  ) {
    const { workspace } = await this.ensureWorkspaceMemberManagement(workspaceId, actingUserId);
    if (memberUserId === workspace.ownerId) {
      throw new ForbiddenException('Cannot change role for the workspace owner');
    }

    const existingMember = await this.db.workspaceMembers.findMembership(workspaceId, memberUserId);
    if (!existingMember) {
      throw new NotFoundException('Workspace member not found');
    }

    const role = this.normalizeRole(roleData.role);
    const updatedMember = await this.db.workspaceMembers.updateRole(
      workspaceId,
      memberUserId,
      role
    );
    if (!updatedMember) {
      throw new NotFoundException('Workspace member not found');
    }

    const targetUser = await this.db.users.findById(memberUserId);

    return {
      message: 'Workspace member role updated',
      member: {
        userId: updatedMember.userId,
        email: targetUser?.email ?? null,
        role: updatedMember.role,
        joinedAt: updatedMember.createdAt,
      },
    };
  }

  private async removeWorkspaceMemberInternal(
    workspaceId: string,
    memberUserId: string,
    actingUserId: string
  ) {
    const { workspace } = await this.ensureWorkspaceMemberManagement(workspaceId, actingUserId);
    if (memberUserId === workspace.ownerId) {
      throw new ForbiddenException('Cannot remove the workspace owner. Transfer ownership first.');
    }

    const removed = await this.db.workspaceMembers.removeMember(workspaceId, memberUserId);
    if (!removed) {
      throw new NotFoundException('Workspace member not found');
    }

    return {
      message: 'Workspace member removed',
      memberId: memberUserId,
    };
  }

  /**
   * Get all workspaces accessible by the current user
   */
  @Get()
  @ApiOperation({ summary: 'Get all workspaces for the current user' })
  @ApiResponse({ status: 200, description: 'List of workspaces' })
  async getAllWorkspaces(@CurrentUser('id') userId: string) {
    try {
      this.validateUser(userId);
      return await this.listAccessibleWorkspaces(userId);
    } catch (error) {
      this.handleError(error, 'getAllWorkspaces');
    }
  }

  /**
   * Get current workspace for user.
   * Uses first accessible workspace as default current workspace.
   */
  @Get('current')
  @ApiOperation({ summary: 'Get current workspace for current user' })
  @ApiResponse({ status: 200, description: 'Current workspace' })
  @ApiResponse({ status: 404, description: 'No workspace found for user' })
  async getCurrentWorkspace(@CurrentUser('id') userId: string) {
    try {
      this.validateUser(userId);
      const workspaces = await this.listAccessibleWorkspaces(userId);
      if (workspaces.length === 0) {
        throw new NotFoundException('No workspace found for current user');
      }
      return workspaces[0];
    } catch (error) {
      this.handleError(error, 'getCurrentWorkspace');
    }
  }

  /**
   * Get workspace by ID
   * Accessible by workspace owner or members
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get workspace by ID' })
  @ApiResponse({ status: 200, description: 'Workspace details' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getWorkspaceById(@Param('id') id: string, @CurrentUser('id') userId: string) {
    try {
      this.validateUser(userId);
      const { workspace } = await this.ensureWorkspaceAccess(id, userId);
      return workspace;
    } catch (error) {
      this.handleError(error, 'getWorkspaceById');
    }
  }

  /**
   * Create a new workspace
   * The current user becomes the owner
   */
  @Post()
  @ApiOperation({ summary: 'Create new workspace' })
  @ApiResponse({ status: 201, description: 'Workspace created' })
  @HttpCode(HttpStatus.CREATED)
  async createWorkspace(
    @Body() workspaceData: CreateWorkspaceDto,
    @CurrentUser('id') userId: string
  ) {
    try {
      this.validateUser(userId);
      const workspace = await this.db.workspaces.create({
        name: workspaceData.name,
        description: workspaceData.description,
        ownerId: userId,
      });

      await this.db.workspaceMembers.upsertMember({
        workspaceId: workspace.id,
        userId,
        role: 'owner',
        addedByUserId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return workspace;
    } catch (error) {
      this.handleError(error, 'createWorkspace');
    }
  }

  /**
   * Update workspace
   * Accessible by workspace owner and admins
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update workspace' })
  @ApiResponse({ status: 200, description: 'Workspace updated' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async updateWorkspace(
    @Param('id') id: string,
    @Body() workspaceData: UpdateWorkspaceDto,
    @CurrentUser('id') userId: string
  ) {
    try {
      this.validateUser(userId);
      const { isOwner, isAdmin } = await this.ensureWorkspaceAccess(id, userId);
      if (!isOwner && !isAdmin) {
        throw new ForbiddenException('You do not have permission to update this workspace');
      }

      const updatedWorkspace = await this.db.workspaces.update(id, {
        name: workspaceData.name,
        description: workspaceData.description,
      });

      return updatedWorkspace;
    } catch (error) {
      this.handleError(error, 'updateWorkspace');
    }
  }

  /**
   * Delete workspace
   * Only the owner can delete the workspace
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete workspace' })
  @ApiResponse({ status: 200, description: 'Workspace deleted' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async deleteWorkspace(@Param('id') id: string, @CurrentUser('id') userId: string) {
    try {
      this.validateUser(userId);
      const existingWorkspace = await this.db.workspaces.findById(id);
      if (!existingWorkspace) {
        throw new NotFoundException('Workspace not found');
      }

      if (existingWorkspace.ownerId !== userId) {
        throw new ForbiddenException('You do not have permission to delete this workspace');
      }

      const deleted = await this.db.workspaces.delete(id);
      if (!deleted) {
        throw new NotFoundException('Workspace not found');
      }

      return { message: 'Workspace deleted successfully', id };
    } catch (error) {
      this.handleError(error, 'deleteWorkspace');
    }
  }

  /**
   * Get workspace members
   */
  @Get(':id/members')
  @ApiOperation({ summary: 'Get workspace members' })
  @ApiResponse({ status: 200, description: 'List of workspace members' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  async getWorkspaceMembers(@Param('id') id: string, @CurrentUser('id') userId: string) {
    try {
      this.validateUser(userId);
      return await this.listWorkspaceMembersInternal(id, userId);
    } catch (error) {
      this.handleError(error, 'getWorkspaceMembers');
    }
  }

  /**
   * Add member to workspace by userId or email
   */
  @Post(':id/members')
  @ApiOperation({ summary: 'Add member to workspace' })
  @ApiResponse({ status: 201, description: 'Member added' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @HttpCode(HttpStatus.CREATED)
  async addWorkspaceMember(
    @Param('id') id: string,
    @Body() memberData: AddWorkspaceMemberDto,
    @CurrentUser('id') userId: string
  ) {
    try {
      this.validateUser(userId);
      return await this.addWorkspaceMemberInternal(id, memberData, userId);
    } catch (error) {
      this.handleError(error, 'addWorkspaceMember');
    }
  }

  /**
   * Update member role in workspace
   */
  @Patch(':id/members/:userId')
  @ApiOperation({ summary: 'Update workspace member role' })
  @ApiResponse({ status: 200, description: 'Member role updated' })
  @ApiResponse({ status: 404, description: 'Workspace or member not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async updateWorkspaceMemberRole(
    @Param('id') id: string,
    @Param('userId') memberUserId: string,
    @Body() roleData: UpdateWorkspaceMemberRoleDto,
    @CurrentUser('id') userId: string
  ) {
    try {
      this.validateUser(userId);
      return await this.updateWorkspaceMemberRoleInternal(id, memberUserId, roleData, userId);
    } catch (error) {
      this.handleError(error, 'updateWorkspaceMemberRole');
    }
  }

  /**
   * Remove member from workspace
   */
  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Remove member from workspace' })
  @ApiResponse({ status: 200, description: 'Member removed' })
  @ApiResponse({ status: 404, description: 'Workspace or member not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async removeWorkspaceMember(
    @Param('id') id: string,
    @Param('userId') memberUserId: string,
    @CurrentUser('id') userId: string
  ) {
    try {
      this.validateUser(userId);
      return await this.removeWorkspaceMemberInternal(id, memberUserId, userId);
    } catch (error) {
      this.handleError(error, 'removeWorkspaceMember');
    }
  }

  /**
   * List delegated sub-access users (non-owner members), useful for VA management UIs.
   */
  @Get(':id/sub-access')
  @ApiOperation({ summary: 'List delegated sub-access users for workspace' })
  @ApiResponse({ status: 200, description: 'List of delegated users and access levels' })
  async listWorkspaceSubAccess(@Param('id') id: string, @CurrentUser('id') userId: string) {
    try {
      this.validateUser(userId);
      const members = await this.listWorkspaceMembersInternal(id, userId);
      return {
        workspaceId: id,
        members: members
          .filter((member) => member.role !== 'owner')
          .map((member) => ({
            ...member,
            accessLevel: member.role,
          })),
      };
    } catch (error) {
      this.handleError(error, 'listWorkspaceSubAccess');
    }
  }

  /**
   * Grant delegated sub-access (VA access) using email or userId.
   */
  @Post(':id/sub-access')
  @ApiOperation({ summary: 'Grant delegated sub-access to workspace' })
  @ApiResponse({ status: 201, description: 'Sub-access granted' })
  @HttpCode(HttpStatus.CREATED)
  async grantWorkspaceSubAccess(
    @Param('id') id: string,
    @Body() accessData: SetWorkspaceSubAccessDto,
    @CurrentUser('id') userId: string
  ) {
    try {
      this.validateUser(userId);
      const result = await this.addWorkspaceMemberInternal(id, accessData, userId);
      return {
        message: 'Sub-access granted',
        member: result.member,
        accessLevel: result.member.role,
      };
    } catch (error) {
      this.handleError(error, 'grantWorkspaceSubAccess');
    }
  }

  /**
   * Update delegated sub-access role.
   */
  @Patch(':id/sub-access/:userId')
  @ApiOperation({ summary: 'Update delegated sub-access level' })
  @ApiResponse({ status: 200, description: 'Sub-access updated' })
  async updateWorkspaceSubAccess(
    @Param('id') id: string,
    @Param('userId') memberUserId: string,
    @Body() accessData: UpdateWorkspaceSubAccessDto,
    @CurrentUser('id') userId: string
  ) {
    try {
      this.validateUser(userId);
      const result = await this.updateWorkspaceMemberRoleInternal(
        id,
        memberUserId,
        accessData,
        userId
      );
      return {
        message: 'Sub-access updated',
        member: result.member,
        accessLevel: result.member.role,
      };
    } catch (error) {
      this.handleError(error, 'updateWorkspaceSubAccess');
    }
  }

  /**
   * Revoke delegated sub-access.
   */
  @Delete(':id/sub-access/:userId')
  @ApiOperation({ summary: 'Revoke delegated sub-access' })
  @ApiResponse({ status: 200, description: 'Sub-access revoked' })
  async revokeWorkspaceSubAccess(
    @Param('id') id: string,
    @Param('userId') memberUserId: string,
    @CurrentUser('id') userId: string
  ) {
    try {
      this.validateUser(userId);
      const result = await this.removeWorkspaceMemberInternal(id, memberUserId, userId);
      return {
        message: 'Sub-access revoked',
        memberId: result.memberId,
      };
    } catch (error) {
      this.handleError(error, 'revokeWorkspaceSubAccess');
    }
  }

  /**
   * List custom domains assigned to workspace.
   */
  @Get(':id/domains')
  @ApiOperation({ summary: 'List workspace custom domains' })
  @ApiResponse({ status: 200, description: 'Workspace domains' })
  async getWorkspaceDomains(@Param('id') id: string, @CurrentUser('id') userId: string) {
    try {
      this.validateUser(userId);
      await this.ensureWorkspaceAccess(id, userId);
      const items = await this.db.workspaceDomains.listByWorkspace(id);
      return { workspaceId: id, items };
    } catch (error) {
      this.handleError(error, 'getWorkspaceDomains');
    }
  }

  /**
   * Add custom domain for workspace.
   */
  @Post(':id/domains')
  @ApiOperation({ summary: 'Add workspace custom domain' })
  @ApiResponse({ status: 201, description: 'Workspace domain created' })
  @HttpCode(HttpStatus.CREATED)
  async addWorkspaceDomain(
    @Param('id') id: string,
    @Body() payload: CreateWorkspaceDomainDto,
    @CurrentUser('id') userId: string
  ) {
    try {
      this.validateUser(userId);
      await this.ensureWorkspaceMemberManagement(id, userId);

      const normalized = this.normalizeDomain(payload.domain || '');
      if (!normalized || !this.isValidDomain(normalized)) {
        throw new BadRequestException('Enter a valid domain (example.com)');
      }

      const existingDomain = await this.db.workspaceDomains.findByDomain(normalized);
      if (existingDomain?.workspaceId === id) {
        return { workspaceId: id, item: existingDomain };
      }
      if (existingDomain && existingDomain.workspaceId !== id) {
        throw new BadRequestException('This domain is already connected to another workspace');
      }

      const item = await this.db.workspaceDomains.addDomain({
        workspaceId: id,
        domain: normalized,
        status: 'pending' as WorkspaceDomainStatus,
        verificationMessage: 'Add DNS records and verify from hosting.',
        createdByUserId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return { workspaceId: id, item };
    } catch (error) {
      this.handleError(error, 'addWorkspaceDomain');
    }
  }

  /**
   * Remove custom domain from workspace.
   */
  @Delete(':id/domains/:domainId')
  @ApiOperation({ summary: 'Remove workspace custom domain' })
  @ApiResponse({ status: 200, description: 'Workspace domain removed' })
  async removeWorkspaceDomain(
    @Param('id') id: string,
    @Param('domainId') domainId: string,
    @CurrentUser('id') userId: string
  ) {
    try {
      this.validateUser(userId);
      await this.ensureWorkspaceMemberManagement(id, userId);
      const removed = await this.db.workspaceDomains.removeDomain(id, domainId);
      if (!removed) {
        throw new NotFoundException('Workspace domain not found');
      }
      return { workspaceId: id, domainId };
    } catch (error) {
      this.handleError(error, 'removeWorkspaceDomain');
    }
  }

  /**
   * Verify custom domain DNS state for workspace.
   */
  @Post(':id/domains/:domainId/verify')
  @ApiOperation({ summary: 'Verify workspace custom domain DNS state' })
  @ApiResponse({ status: 200, description: 'Workspace domain verification result' })
  async verifyWorkspaceDomain(
    @Param('id') id: string,
    @Param('domainId') domainId: string,
    @CurrentUser('id') userId: string
  ) {
    try {
      this.validateUser(userId);
      await this.ensureWorkspaceWriteAccess(id, userId);

      const existing = await this.db.workspaceDomains.findById(id, domainId);
      if (!existing) {
        throw new NotFoundException('Workspace domain not found');
      }

      const verification = await this.verifyDomainDns(existing.domain);
      const item = await this.db.workspaceDomains.updateStatus(
        id,
        domainId,
        verification.status,
        verification.verificationMessage
      );
      if (!item) {
        throw new NotFoundException('Workspace domain not found');
      }

      return { workspaceId: id, item };
    } catch (error) {
      this.handleError(error, 'verifyWorkspaceDomain');
    }
  }

  /**
   * List workspace bookmarks.
   */
  @Get(':id/bookmarks')
  @ApiOperation({ summary: 'List workspace bookmarks' })
  @ApiResponse({ status: 200, description: 'Workspace bookmarks' })
  async getWorkspaceBookmarks(@Param('id') id: string, @CurrentUser('id') userId: string) {
    try {
      this.validateUser(userId);
      await this.ensureWorkspaceAccess(id, userId);
      const items = await this.db.workspaceBookmarks.listByWorkspaceForUser(id, userId);
      return { workspaceId: id, items };
    } catch (error) {
      this.handleError(error, 'getWorkspaceBookmarks');
    }
  }

  /**
   * Add (or upsert by URL) workspace bookmark.
   */
  @Post(':id/bookmarks')
  @ApiOperation({ summary: 'Add workspace bookmark' })
  @ApiResponse({ status: 201, description: 'Workspace bookmark created' })
  @HttpCode(HttpStatus.CREATED)
  async addWorkspaceBookmark(
    @Param('id') id: string,
    @Body() payload: CreateWorkspaceBookmarkDto,
    @CurrentUser('id') userId: string
  ) {
    try {
      this.validateUser(userId);
      await this.ensureWorkspaceWriteAccess(id, userId);

      const title = String(payload.title || '').trim();
      const normalizedUrl = this.normalizeBookmarkUrl(String(payload.url || ''));
      if (!title || !normalizedUrl || !this.isValidBookmarkUrl(normalizedUrl)) {
        throw new BadRequestException('Valid title and URL are required');
      }

      const tags = Array.isArray(payload.tags)
        ? payload.tags.map((tag) => String(tag || '').trim()).filter((tag) => tag.length > 0)
        : [];
      const note = typeof payload.note === 'string' ? payload.note.trim() || null : null;

      const existing = await this.db.workspaceBookmarks.findByUrlForUser(id, normalizedUrl, userId);
      if (existing) {
        const updated = await this.db.workspaceBookmarks.updateBookmarkForUser(
          id,
          existing.id,
          userId,
          {
            title,
            tags,
            note,
            url: normalizedUrl,
          }
        );
        return { workspaceId: id, item: updated || existing };
      }

      const item = await this.db.workspaceBookmarks.addBookmark({
        workspaceId: id,
        title,
        url: normalizedUrl,
        tags,
        note,
        createdByUserId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return { workspaceId: id, item };
    } catch (error) {
      this.handleError(error, 'addWorkspaceBookmark');
    }
  }

  /**
   * Update workspace bookmark.
   */
  @Patch(':id/bookmarks/:bookmarkId')
  @ApiOperation({ summary: 'Update workspace bookmark' })
  @ApiResponse({ status: 200, description: 'Workspace bookmark updated' })
  async updateWorkspaceBookmark(
    @Param('id') id: string,
    @Param('bookmarkId') bookmarkId: string,
    @Body() payload: UpdateWorkspaceBookmarkDto,
    @CurrentUser('id') userId: string
  ) {
    try {
      this.validateUser(userId);
      await this.ensureWorkspaceWriteAccess(id, userId);

      const existing = await this.db.workspaceBookmarks.findByIdForUser(id, bookmarkId, userId);
      if (!existing) {
        throw new NotFoundException('Workspace bookmark not found');
      }

      const nextTitle =
        payload.title === undefined ? existing.title : String(payload.title || '').trim();
      const nextUrl =
        payload.url === undefined
          ? existing.url
          : this.normalizeBookmarkUrl(String(payload.url || ''));

      if (!nextTitle || !nextUrl || !this.isValidBookmarkUrl(nextUrl)) {
        throw new BadRequestException('Valid title and URL are required');
      }

      const tags =
        payload.tags === undefined
          ? existing.tags || []
          : payload.tags.map((tag) => String(tag || '').trim()).filter((tag) => tag.length > 0);
      const note =
        payload.note === undefined
          ? existing.note
          : typeof payload.note === 'string'
            ? payload.note.trim()
            : null;

      if (nextUrl !== existing.url) {
        const conflicting = await this.db.workspaceBookmarks.findByUrlForUser(id, nextUrl, userId);
        if (conflicting && conflicting.id !== bookmarkId) {
          throw new BadRequestException('A bookmark with this URL already exists for this user');
        }
      }

      const item = await this.db.workspaceBookmarks.updateBookmarkForUser(id, bookmarkId, userId, {
        title: nextTitle,
        url: nextUrl,
        tags,
        note,
      });
      if (!item) {
        throw new NotFoundException('Workspace bookmark not found');
      }

      return { workspaceId: id, item };
    } catch (error) {
      this.handleError(error, 'updateWorkspaceBookmark');
    }
  }

  /**
   * Remove workspace bookmark.
   */
  @Delete(':id/bookmarks/:bookmarkId')
  @ApiOperation({ summary: 'Remove workspace bookmark' })
  @ApiResponse({ status: 200, description: 'Workspace bookmark removed' })
  async removeWorkspaceBookmark(
    @Param('id') id: string,
    @Param('bookmarkId') bookmarkId: string,
    @CurrentUser('id') userId: string
  ) {
    try {
      this.validateUser(userId);
      await this.ensureWorkspaceWriteAccess(id, userId);
      const removed = await this.db.workspaceBookmarks.removeBookmarkForUser(
        id,
        bookmarkId,
        userId
      );
      if (!removed) {
        throw new NotFoundException('Workspace bookmark not found');
      }
      return { workspaceId: id, bookmarkId };
    } catch (error) {
      this.handleError(error, 'removeWorkspaceBookmark');
    }
  }

  /**
   * Get workspace asset exposure summary (owner-scoped timeline + linked assets).
   */
  @Get(':id/assets')
  @ApiOperation({ summary: 'Get workspace asset exposure summary' })
  @ApiResponse({ status: 200, description: 'Workspace asset summary' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getWorkspaceAssets(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Query('project') projectQuery?: string,
    @Query('timelineTrack') timelineTrackQuery?: string,
    @Query('assetSearch') assetSearchQuery?: string,
    @Query('assetPage') assetPageQuery?: string,
    @Query('assetPageSize') assetPageSizeQuery?: string,
    @Query('eventPage') eventPageQuery?: string,
    @Query('eventPageSize') eventPageSizeQuery?: string,
    @Query('projectLimit') projectLimitQuery?: string
  ) {
    try {
      this.validateUser(userId);
      const access = await this.ensureWorkspaceAccess(id, userId);
      const ownerId = access.workspace.ownerId;
      const scope: 'owner' | 'delegated' = access.isOwner ? 'owner' : 'delegated';

      const projectFilter = projectQuery?.trim().toLowerCase() || null;
      const timelineTrackFilter = timelineTrackQuery?.trim().toLowerCase() || null;
      const assetSearchFilter = assetSearchQuery?.trim().toLowerCase() || null;

      const assetPage = this.parsePositiveInt(assetPageQuery, 1, 1, 10000);
      const assetPageSize = this.parsePositiveInt(assetPageSizeQuery, 50, 1, 200);
      const eventPage = this.parsePositiveInt(eventPageQuery, 1, 1, 10000);
      const eventPageSize = this.parsePositiveInt(eventPageSizeQuery, 25, 1, 200);
      const projectLimit = this.parsePositiveInt(projectLimitQuery, 200, 1, 1000);

      const empty: WorkspaceAssetSummaryResponse = {
        workspaceId: id,
        ownerId,
        scope,
        totalTimelineEvents: 0,
        uniqueLinkedAssets: 0,
        assetPagination: {
          page: assetPage,
          pageSize: assetPageSize,
          total: 0,
          totalPages: 0,
        },
        eventPagination: {
          page: eventPage,
          pageSize: eventPageSize,
          total: 0,
          totalPages: 0,
        },
        appliedFilters: {
          project: projectFilter,
          timelineTrack: timelineTrackFilter,
          assetSearch: assetSearchFilter,
        },
        projects: [],
        assets: [],
        recentEvents: [],
      };

      if (!this.unifiedLedger) {
        return empty;
      }

      const allTimelineEvents = await this.unifiedLedger.listTimelineEvents({
        userId: ownerId,
        viewerUserId: userId,
      });

      const timelineEvents = allTimelineEvents.filter((event) => {
        const payload =
          event?.payload && typeof event.payload === 'object'
            ? (event.payload as Record<string, unknown>)
            : {};
        const { projectName, timelineTrackKey } = this.readTimelineProject(payload);
        if (projectFilter && !projectName.toLowerCase().includes(projectFilter)) {
          return false;
        }
        if (
          timelineTrackFilter &&
          (!timelineTrackKey || timelineTrackKey.toLowerCase() !== timelineTrackFilter)
        ) {
          return false;
        }
        return true;
      });

      const projectMap = new Map<
        string,
        {
          projectName: string;
          timelineTrackKeys: Set<string>;
          timelineEventCount: number;
          linkedAssets: Set<string>;
          latestEvidenceAt: string | null;
        }
      >();

      const assetMap = new Map<
        string,
        { occurrences: number; projects: Set<string>; lastSeenAt: string | null }
      >();

      const recentEvents: WorkspaceAssetSummaryEvent[] = [];

      for (const event of timelineEvents) {
        const payload =
          event?.payload && typeof event.payload === 'object'
            ? (event.payload as Record<string, unknown>)
            : {};
        const { projectName, timelineTrackKey } = this.readTimelineProject(payload);
        const assetRefs = this.readTimelineAssetRefs(payload);
        const projectKey = projectName.trim().toLowerCase() || 'unassigned';

        let projectEntry = projectMap.get(projectKey);
        if (!projectEntry) {
          projectEntry = {
            projectName,
            timelineTrackKeys: new Set<string>(),
            timelineEventCount: 0,
            linkedAssets: new Set<string>(),
            latestEvidenceAt: null,
          };
          projectMap.set(projectKey, projectEntry);
        }

        projectEntry.timelineEventCount += 1;
        if (timelineTrackKey) {
          projectEntry.timelineTrackKeys.add(timelineTrackKey);
        }
        for (const assetRef of assetRefs) {
          projectEntry.linkedAssets.add(assetRef);
        }
        if (!projectEntry.latestEvidenceAt || event.timestamp > projectEntry.latestEvidenceAt) {
          projectEntry.latestEvidenceAt = event.timestamp;
        }

        for (const assetRef of assetRefs) {
          let assetEntry = assetMap.get(assetRef);
          if (!assetEntry) {
            assetEntry = { occurrences: 0, projects: new Set<string>(), lastSeenAt: null };
            assetMap.set(assetRef, assetEntry);
          }
          assetEntry.occurrences += 1;
          assetEntry.projects.add(projectName);
          if (!assetEntry.lastSeenAt || event.timestamp > assetEntry.lastSeenAt) {
            assetEntry.lastSeenAt = event.timestamp;
          }
        }

        recentEvents.push({
          id: event.id,
          title: this.readTimelineEventTitle(event, payload),
          timestamp: event.timestamp,
          projectName,
          linkedAssetCount: assetRefs.length,
        });
      }

      const projects: WorkspaceAssetSummaryProject[] = Array.from(projectMap.values())
        .map((entry) => ({
          projectName: entry.projectName,
          timelineTrackKeys: Array.from(entry.timelineTrackKeys).sort(),
          timelineEventCount: entry.timelineEventCount,
          linkedAssetCount: entry.linkedAssets.size,
          latestEvidenceAt: entry.latestEvidenceAt,
        }))
        .sort((a, b) => {
          if (b.timelineEventCount !== a.timelineEventCount) {
            return b.timelineEventCount - a.timelineEventCount;
          }
          return a.projectName.localeCompare(b.projectName);
        })
        .slice(0, projectLimit);

      const sortedAssets: WorkspaceAssetSummaryAsset[] = Array.from(assetMap.entries())
        .map(([ref, entry]) => ({
          ref,
          occurrences: entry.occurrences,
          projects: Array.from(entry.projects).sort(),
          lastSeenAt: entry.lastSeenAt,
        }))
        .sort((a, b) => {
          if (b.occurrences !== a.occurrences) {
            return b.occurrences - a.occurrences;
          }
          return a.ref.localeCompare(b.ref);
        });

      const filteredAssets = assetSearchFilter
        ? sortedAssets.filter(
            (asset) =>
              asset.ref.toLowerCase().includes(assetSearchFilter) ||
              asset.projects.some((project) => project.toLowerCase().includes(assetSearchFilter))
          )
        : sortedAssets;

      const assetTotal = filteredAssets.length;
      const assetTotalPages = assetTotal > 0 ? Math.ceil(assetTotal / assetPageSize) : 0;
      const effectiveAssetPage =
        assetTotalPages > 0 ? Math.min(assetPage, assetTotalPages) : assetPage;
      const assetOffset = assetTotalPages > 0 ? (effectiveAssetPage - 1) * assetPageSize : 0;
      const assets = filteredAssets.slice(assetOffset, assetOffset + assetPageSize);

      const sortedRecentEvents = recentEvents.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      const eventTotal = sortedRecentEvents.length;
      const eventTotalPages = eventTotal > 0 ? Math.ceil(eventTotal / eventPageSize) : 0;
      const effectiveEventPage =
        eventTotalPages > 0 ? Math.min(eventPage, eventTotalPages) : eventPage;
      const eventOffset = eventTotalPages > 0 ? (effectiveEventPage - 1) * eventPageSize : 0;
      const paginatedRecentEvents = sortedRecentEvents.slice(eventOffset, eventOffset + eventPageSize);

      return {
        workspaceId: id,
        ownerId,
        scope,
        totalTimelineEvents: timelineEvents.length,
        uniqueLinkedAssets: assetMap.size,
        assetPagination: {
          page: effectiveAssetPage,
          pageSize: assetPageSize,
          total: assetTotal,
          totalPages: assetTotalPages,
        },
        eventPagination: {
          page: effectiveEventPage,
          pageSize: eventPageSize,
          total: eventTotal,
          totalPages: eventTotalPages,
        },
        appliedFilters: {
          project: projectFilter,
          timelineTrack: timelineTrackFilter,
          assetSearch: assetSearchFilter,
        },
        projects,
        assets,
        recentEvents: paginatedRecentEvents,
      } satisfies WorkspaceAssetSummaryResponse;
    } catch (error) {
      this.handleError(error, 'getWorkspaceAssets');
    }
  }

  /**
   * Get all projects in a workspace
   */
  @Get(':id/projects')
  @ApiOperation({ summary: 'Get workspace projects' })
  @ApiResponse({ status: 200, description: 'List of projects in the workspace' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getWorkspaceProjects(@Param('id') id: string, @CurrentUser('id') userId: string) {
    try {
      this.validateUser(userId);
      await this.ensureWorkspaceAccess(id, userId);
      const workspaceWithProjects = await this.db.workspaces.findByIdWithProjects(id);
      return workspaceWithProjects?.projects || [];
    } catch (error) {
      this.handleError(error, 'getWorkspaceProjects');
    }
  }
}
