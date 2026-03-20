import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../decorators/current-user.decorator';
import { AdminGuard } from '../guards/admin.guard';
import { SecureAuthGuard } from '../guards/secure-auth.guard';
import { RcloneRuntimeService } from '../services/rclone-runtime.service';

@ApiTags('admin-rclone-runtime')
@Controller('admin/rclone/runtime')
@UseGuards(SecureAuthGuard, AdminGuard)
export class AdminRcloneRuntimeController {
  constructor(private readonly rcloneRuntimeService: RcloneRuntimeService) {}

  private toBoolean(value: boolean | string | undefined): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
    }
    return false;
  }

  private toInteger(value: number | string | undefined, fallback: number): number {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback;
    return Math.floor(numeric);
  }

  private getActorId(user: any): string {
    return String(user?.id || user?.userId || user?.sub || 'admin');
  }

  @Get('doctor')
  @ApiOperation({ summary: 'Run TNF rclone doctor and return JSON status' })
  @ApiResponse({ status: 200, description: 'Rclone doctor status' })
  async doctor(
    @Query('remote') remote?: string,
    @Query('probe') probe?: string,
    @Query('strict') strict?: string
  ) {
    return this.rcloneRuntimeService.doctor({
      remote: remote || undefined,
      probe: this.toBoolean(probe),
      strict: this.toBoolean(strict),
    });
  }

  @Get('providers')
  @ApiOperation({ summary: 'Get TNF rclone provider profiles and integration modes' })
  @ApiResponse({ status: 200, description: 'Provider profile list' })
  async providers() {
    return this.rcloneRuntimeService.getProviderProfiles();
  }

  @Get('providers/:providerId/blueprint')
  @ApiOperation({ summary: 'Get implementation blueprint and compliance policy for a provider' })
  @ApiResponse({ status: 200, description: 'Provider blueprint' })
  async providerBlueprint(@Param('providerId') providerId: string) {
    return this.rcloneRuntimeService.getProviderBlueprint(providerId);
  }

  @Post('providers/ardrive/turbo/preflight')
  @ApiOperation({ summary: 'Create ArDrive Turbo connector preflight (scaffold contract)' })
  @ApiResponse({ status: 200, description: 'ArDrive Turbo preflight response' })
  async preflightArdriveTurbo(
    @CurrentUser() user: any,
    @Body()
    body?: {
      fileName?: string;
      fileSizeBytes?: number | string;
      localPath?: string;
      contentType?: string;
      targetDriveId?: string;
      targetFolderId?: string;
      checksumSha256?: string;
    }
  ) {
    return this.rcloneRuntimeService.preflightArdriveTurboUpload({
      actorId: this.getActorId(user),
      fileName: String(body?.fileName || ''),
      fileSizeBytes: Number(body?.fileSizeBytes ?? 0),
      localPath: body?.localPath ? String(body.localPath) : undefined,
      contentType: body?.contentType ? String(body.contentType) : undefined,
      targetDriveId: body?.targetDriveId ? String(body.targetDriveId) : undefined,
      targetFolderId: body?.targetFolderId ? String(body.targetFolderId) : undefined,
      checksumSha256: body?.checksumSha256 ? String(body.checksumSha256) : undefined,
    });
  }

  @Post('providers/ardrive/turbo/queue')
  @ApiOperation({ summary: 'Enqueue ArDrive Turbo upload item from preflight' })
  @ApiResponse({ status: 200, description: 'ArDrive Turbo queue item created' })
  async enqueueArdriveTurbo(
    @CurrentUser() user: any,
    @Body()
    body?: {
      preflightId?: string;
      localPath?: string;
      targetDriveId?: string;
      targetFolderId?: string;
      checksumSha256?: string;
    }
  ) {
    return this.rcloneRuntimeService.enqueueArdriveTurboUpload({
      actorId: this.getActorId(user),
      preflightId: String(body?.preflightId || ''),
      localPath: body?.localPath ? String(body.localPath) : undefined,
      targetDriveId: body?.targetDriveId ? String(body.targetDriveId) : undefined,
      targetFolderId: body?.targetFolderId ? String(body.targetFolderId) : undefined,
      checksumSha256: body?.checksumSha256 ? String(body.checksumSha256) : undefined,
    });
  }

  @Get('providers/ardrive/turbo/queue')
  @ApiOperation({ summary: 'List ArDrive Turbo connector queue items' })
  @ApiResponse({ status: 200, description: 'ArDrive Turbo queue list' })
  async listArdriveTurboQueue(@Query('limit') limit?: string, @Query('status') status?: string) {
    return this.rcloneRuntimeService.getArdriveTurboQueue({
      limit: this.toInteger(limit, 20),
      status: status || undefined,
    });
  }

  @Post('providers/ardrive/turbo/queue/:queueId/transition')
  @ApiOperation({ summary: 'Transition ArDrive Turbo queue item state in scaffold worker flow' })
  @ApiResponse({ status: 200, description: 'ArDrive Turbo queue item transitioned' })
  async transitionArdriveTurboQueueItem(
    @CurrentUser() user: any,
    @Param('queueId') queueId: string,
    @Body()
    body?: {
      status?: 'queued' | 'processing' | 'submitted' | 'failed' | 'completed';
      note?: string;
    }
  ) {
    return this.rcloneRuntimeService.transitionArdriveTurboQueueItem({
      actorId: this.getActorId(user),
      queueId: String(queueId || ''),
      status: String(body?.status || '') as
        | 'queued'
        | 'processing'
        | 'submitted'
        | 'failed'
        | 'completed',
      note: body?.note ? String(body.note) : undefined,
    });
  }

  @Get('providers/ardrive/turbo/worker')
  @ApiOperation({ summary: 'Get ArDrive Turbo connector worker status' })
  @ApiResponse({ status: 200, description: 'ArDrive Turbo worker status' })
  async ardriveTurboWorkerStatus() {
    return this.rcloneRuntimeService.getArdriveTurboWorkerStatus();
  }

  @Post('providers/ardrive/turbo/worker/tick')
  @ApiOperation({ summary: 'Run one manual ArDrive Turbo connector worker tick' })
  @ApiResponse({ status: 200, description: 'ArDrive Turbo worker tick result' })
  async ardriveTurboWorkerTick(
    @CurrentUser() user: any,
    @Body()
    body?: {
      maxItems?: number | string;
    }
  ) {
    return this.rcloneRuntimeService.runArdriveTurboWorkerTick({
      actorId: this.getActorId(user),
      trigger: 'manual',
      maxItems: body?.maxItems == null ? undefined : this.toInteger(body.maxItems, 5),
    });
  }

  @Post('providers/ardrive/turbo/worker/process-one')
  @ApiOperation({ summary: 'Process one ArDrive Turbo queue item (optional queueId targeting)' })
  @ApiResponse({ status: 200, description: 'ArDrive Turbo worker process-one result' })
  async ardriveTurboWorkerProcessOne(
    @CurrentUser() user: any,
    @Body()
    body?: {
      queueId?: string;
    }
  ) {
    return this.rcloneRuntimeService.runArdriveTurboWorkerProcessOne({
      actorId: this.getActorId(user),
      trigger: 'manual',
      queueId: body?.queueId ? String(body.queueId) : undefined,
    });
  }

  @Get('gui')
  @ApiOperation({ summary: 'Build rclone GUI URL and launch command descriptor for admin UI' })
  @ApiResponse({ status: 200, description: 'Rclone GUI descriptor' })
  async gui(
    @Query('addr') addr?: string,
    @Query('baseurl') baseurl?: string,
    @Query('tls') tls?: string
  ) {
    return this.rcloneRuntimeService.getGuiDescriptor({
      addr: addr || undefined,
      baseurl: baseurl || undefined,
      tls: this.toBoolean(tls),
    });
  }

  @Post('workflows/run')
  @ApiOperation({ summary: 'Start a policy-approved rclone workflow preset' })
  @ApiResponse({ status: 200, description: 'Workflow run started' })
  async runWorkflow(
    @CurrentUser() user: any,
    @Body()
    body?: {
      presetId?: 'sync' | 'backup' | 'mirror' | 'migrate' | 'offload';
      source?: string;
      destination?: string;
      dryRun?: boolean | string;
      checksum?: boolean | string;
      bwlimit?: string;
      transfers?: number | string;
      timeoutMs?: number | string;
      extraArgs?: string[];
    }
  ) {
    return this.rcloneRuntimeService.runWorkflow({
      actorId: this.getActorId(user),
      presetId: body?.presetId || 'sync',
      source: String(body?.source || ''),
      destination: String(body?.destination || ''),
      dryRun: this.toBoolean(body?.dryRun),
      checksum: this.toBoolean(body?.checksum),
      bwlimit: body?.bwlimit ? String(body.bwlimit) : undefined,
      transfers: body?.transfers == null ? undefined : this.toInteger(body.transfers, 1),
      timeoutMs: body?.timeoutMs == null ? undefined : this.toInteger(body.timeoutMs, 180000),
      extraArgs: Array.isArray(body?.extraArgs)
        ? body?.extraArgs.map((item) => String(item || '')).filter(Boolean)
        : [],
    });
  }

  @Post('workflows/:runId/pause')
  @ApiOperation({ summary: 'Pause an active rclone workflow process (SIGSTOP)' })
  @ApiResponse({ status: 200, description: 'Workflow paused' })
  async pauseWorkflow(@CurrentUser() user: any, @Param('runId') runId: string) {
    return this.rcloneRuntimeService.pauseWorkflow(runId, this.getActorId(user));
  }

  @Post('workflows/:runId/resume')
  @ApiOperation({ summary: 'Resume a paused rclone workflow process (SIGCONT)' })
  @ApiResponse({ status: 200, description: 'Workflow resumed' })
  async resumeWorkflow(@CurrentUser() user: any, @Param('runId') runId: string) {
    return this.rcloneRuntimeService.resumeWorkflow(runId, this.getActorId(user));
  }

  @Post('workflows/:runId/stop')
  @ApiOperation({ summary: 'Stop an active rclone workflow process (SIGTERM -> SIGKILL fallback)' })
  @ApiResponse({ status: 200, description: 'Workflow stop requested' })
  async stopWorkflow(@CurrentUser() user: any, @Param('runId') runId: string) {
    return this.rcloneRuntimeService.stopWorkflow(runId, this.getActorId(user));
  }

  @Get('workflows/logs')
  @ApiOperation({ summary: 'Get recent rclone workflow logs (runtime + persistent)' })
  @ApiResponse({ status: 200, description: 'Recent workflow logs' })
  async getWorkflowLogs(
    @Query('limit') limit?: string,
    @Query('includePersistent') includePersistent?: string
  ) {
    return this.rcloneRuntimeService.getWorkflowRunLogs({
      limit: this.toInteger(limit, 15),
      includePersistent: includePersistent == null ? true : this.toBoolean(includePersistent),
    });
  }
}
