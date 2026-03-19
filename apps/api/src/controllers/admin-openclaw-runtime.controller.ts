import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../decorators/current-user.decorator';
import { AdminGuard } from '../guards/admin.guard';
import { SecureAuthGuard } from '../guards/secure-auth.guard';
import { AuditService } from '../services/audit.service';
import { OpenClawRuntimeService } from '../services/openclaw-runtime.service';

@ApiTags('admin-openclaw-runtime')
@Controller('admin/openclaw/runtime')
@UseGuards(SecureAuthGuard, AdminGuard)
export class AdminOpenClawRuntimeController {
  constructor(
    private readonly openClawRuntimeService: OpenClawRuntimeService,
    private readonly auditService: AuditService
  ) {}

  private assertSuperAdmin(user: any): void {
    const roles = Array.isArray(user?.roles) ? user.roles : [user?.role];
    const isSuper = roles.some(
      (role: string) => String(role || '').toUpperCase() === 'SUPER_ADMIN'
    );
    if (!isSuper) throw new ForbiddenException('SUPER_ADMIN required');
  }

  private getActorId(user: any): string {
    return String(user?.id || user?.userId || user?.sub || 'admin');
  }

  private toTargetOptions(input: {
    installationId?: string;
    instanceId?: string;
    stateDir?: string;
    allInstances?: boolean | string;
  }) {
    return {
      installationId: input?.installationId || undefined,
      instanceId: input?.instanceId || undefined,
      stateDir: input?.stateDir || undefined,
      allInstances:
        typeof input?.allInstances === 'string'
          ? ['1', 'true', 'yes', 'on'].includes(input.allInstances.toLowerCase())
          : Boolean(input?.allInstances),
    };
  }

  @Get('instances')
  @ApiOperation({ summary: 'List OpenClaw installations and instances known to TNF' })
  @ApiResponse({ status: 200, description: 'OpenClaw installation and instance inventory' })
  async listInstances(@CurrentUser() _user: any) {
    return this.openClawRuntimeService.listInstances();
  }

  @Get('inventory')
  @ApiOperation({ summary: 'Get redacted OpenClaw runtime inventory and TNF schedule mapping' })
  @ApiResponse({ status: 200, description: 'OpenClaw runtime inventory' })
  async getInventory(
    @CurrentUser() _user: any,
    @Query('installationId') installationId?: string,
    @Query('instanceId') instanceId?: string,
    @Query('stateDir') stateDir?: string,
    @Query('allInstances') allInstances?: string
  ) {
    return this.openClawRuntimeService.getInventory(
      this.toTargetOptions({ installationId, instanceId, stateDir, allInstances })
    );
  }

  @Get('config')
  @ApiOperation({ summary: 'Get redacted OpenClaw config or a subtree' })
  @ApiResponse({ status: 200, description: 'OpenClaw config snapshot' })
  async getConfig(
    @CurrentUser() _user: any,
    @Query('path') path?: string,
    @Query('installationId') installationId?: string,
    @Query('instanceId') instanceId?: string,
    @Query('stateDir') stateDir?: string,
    @Query('allInstances') allInstances?: string
  ) {
    return this.openClawRuntimeService.getConfig(
      path,
      this.toTargetOptions({ installationId, instanceId, stateDir, allInstances })
    );
  }

  @Put('config')
  @ApiOperation({ summary: 'Set an OpenClaw config value through TNF' })
  @ApiResponse({ status: 200, description: 'Updated OpenClaw config path' })
  async setConfig(
    @CurrentUser() user: any,
    @Body()
    body: {
      path: string;
      value: string;
      valueType?: 'string' | 'number' | 'boolean' | 'json' | 'null';
      installationId?: string;
      instanceId?: string;
      stateDir?: string;
    }
  ) {
    this.assertSuperAdmin(user);
    const result = await this.openClawRuntimeService.setConfig(
      body.path,
      body.value,
      body.valueType || 'string',
      this.toTargetOptions(body)
    );
    await this.auditService.log('openclaw.runtime.config.updated', {
      userId: this.getActorId(user),
      resourceType: 'openclaw_runtime',
      resourceId: body.path,
      status: 'success',
      details: {
        path: body.path,
        valueType: body.valueType || 'string',
      },
    });
    return result;
  }

  @Delete('config')
  @ApiOperation({ summary: 'Unset an OpenClaw config path through TNF' })
  @ApiResponse({ status: 200, description: 'Removed OpenClaw config path' })
  async unsetConfig(
    @CurrentUser() user: any,
    @Body() body: { path: string; installationId?: string; instanceId?: string; stateDir?: string }
  ) {
    this.assertSuperAdmin(user);
    const result = await this.openClawRuntimeService.unsetConfig(
      body.path,
      this.toTargetOptions(body)
    );
    await this.auditService.log('openclaw.runtime.config.unset', {
      userId: this.getActorId(user),
      resourceType: 'openclaw_runtime',
      resourceId: body.path,
      status: 'success',
      details: {
        path: body.path,
      },
    });
    return result;
  }

  @Get('cron')
  @ApiOperation({ summary: 'List OpenClaw cron jobs with TNF schedule mapping' })
  @ApiResponse({ status: 200, description: 'OpenClaw cron list' })
  async listCron(
    @CurrentUser() _user: any,
    @Query('installationId') installationId?: string,
    @Query('instanceId') instanceId?: string,
    @Query('stateDir') stateDir?: string,
    @Query('allInstances') allInstances?: string
  ) {
    return this.openClawRuntimeService.listCronJobs(
      this.toTargetOptions({ installationId, instanceId, stateDir, allInstances })
    );
  }

  @Post('cron/enable')
  @ApiOperation({ summary: 'Enable an OpenClaw cron job through TNF' })
  @ApiResponse({ status: 200, description: 'Enabled OpenClaw cron job' })
  async enableCron(
    @CurrentUser() user: any,
    @Body() body: { job: string; installationId?: string; instanceId?: string; stateDir?: string }
  ) {
    this.assertSuperAdmin(user);
    const result = await this.openClawRuntimeService.enableCronJob(
      body.job,
      this.toTargetOptions(body)
    );
    await this.auditService.log('openclaw.runtime.cron.enabled', {
      userId: this.getActorId(user),
      resourceType: 'openclaw_runtime_cron',
      resourceId: body.job,
      status: 'success',
      details: {
        job: body.job,
      },
    });
    return result;
  }

  @Post('cron/disable')
  @ApiOperation({ summary: 'Disable an OpenClaw cron job through TNF' })
  @ApiResponse({ status: 200, description: 'Disabled OpenClaw cron job' })
  async disableCron(
    @CurrentUser() user: any,
    @Body() body: { job: string; installationId?: string; instanceId?: string; stateDir?: string }
  ) {
    this.assertSuperAdmin(user);
    const result = await this.openClawRuntimeService.disableCronJob(
      body.job,
      this.toTargetOptions(body)
    );
    await this.auditService.log('openclaw.runtime.cron.disabled', {
      userId: this.getActorId(user),
      resourceType: 'openclaw_runtime_cron',
      resourceId: body.job,
      status: 'success',
      details: {
        job: body.job,
      },
    });
    return result;
  }

  @Post('cron/schedule')
  @ApiOperation({ summary: 'Change an OpenClaw cron job schedule through TNF' })
  @ApiResponse({ status: 200, description: 'Updated OpenClaw cron schedule' })
  async scheduleCron(
    @CurrentUser() user: any,
    @Body()
    body: {
      job: string;
      cron?: string;
      tz?: string;
      staggerMs?: string | number;
      everyMs?: string | number;
      anchorMs?: string | number;
      at?: string;
      installationId?: string;
      instanceId?: string;
      stateDir?: string;
    }
  ) {
    this.assertSuperAdmin(user);
    const result = await this.openClawRuntimeService.scheduleCronJob(
      body.job,
      body,
      this.toTargetOptions(body)
    );
    await this.auditService.log('openclaw.runtime.cron.scheduled', {
      userId: this.getActorId(user),
      resourceType: 'openclaw_runtime_cron',
      resourceId: body.job,
      status: 'success',
      details: {
        job: body.job,
        cron: body.cron || null,
        tz: body.tz || null,
        everyMs: body.everyMs ?? null,
        anchorMs: body.anchorMs ?? null,
        at: body.at || null,
      },
    });
    return result;
  }

  @Post('sync')
  @ApiOperation({ summary: 'Sync live OpenClaw runtime state into TNF control-plane records' })
  @ApiResponse({ status: 200, description: 'OpenClaw control-plane sync result' })
  async syncControlPlane(
    @CurrentUser() user: any,
    @Body()
    body: {
      installationId?: string;
      instanceId?: string;
      stateDir?: string;
      allInstances?: boolean | string;
    } = {}
  ) {
    this.assertSuperAdmin(user);
    const actorId = this.getActorId(user);
    const result = await this.openClawRuntimeService.syncControlPlane(
      actorId,
      this.toTargetOptions(body)
    );
    const snapshot = (result?.snapshot || {}) as { updatedAt?: string };
    await this.auditService.log('openclaw.runtime.synced', {
      userId: actorId,
      resourceType: 'openclaw_runtime',
      resourceId: 'control-plane',
      status: 'success',
      details: {
        snapshotUpdatedAt: snapshot.updatedAt || null,
      },
    });
    return result;
  }

  @Post('cleanup')
  @ApiOperation({ summary: 'Clean up duplicate/failing TNF-managed OpenClaw cron jobs' })
  @ApiResponse({ status: 200, description: 'OpenClaw cleanup result' })
  async cleanupCron(
    @CurrentUser() user: any,
    @Body()
    body: {
      dryRun?: boolean;
      disableFailing?: boolean;
      keepLaunchValidationDuplicates?: boolean;
      installationId?: string;
      instanceId?: string;
      stateDir?: string;
      allInstances?: boolean | string;
    }
  ) {
    this.assertSuperAdmin(user);
    const actorId = this.getActorId(user);
    const result = await this.openClawRuntimeService.cleanupCron(actorId, {
      dryRun: body?.dryRun,
      disableFailing: body?.disableFailing,
      keepLaunchValidationDuplicates: body?.keepLaunchValidationDuplicates,
      ...this.toTargetOptions(body),
    });
    const cleanup = (result?.cleanup || {}) as {
      removedJobs?: unknown[];
      disabledJobs?: unknown[];
    };
    await this.auditService.log('openclaw.runtime.cleaned', {
      userId: actorId,
      resourceType: 'openclaw_runtime_cron',
      resourceId: 'cleanup',
      status: 'success',
      details: {
        dryRun: Boolean(body?.dryRun),
        disableFailing: Boolean(body?.disableFailing),
        changed: Boolean(result?.changed),
        removedJobs: cleanup.removedJobs?.length || 0,
        disabledJobs: cleanup.disabledJobs?.length || 0,
      },
    });
    return result;
  }
}
