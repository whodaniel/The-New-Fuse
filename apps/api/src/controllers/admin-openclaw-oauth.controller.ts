import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../decorators/current-user.decorator';
import {
  ExecuteOpenClawOAuthBindingDto,
  OPENCLAW_PROVIDERS,
  OpenClawProvider,
  UpsertOpenClawOAuthBindingDto,
} from '../dto/openclaw-oauth-rotation.dto';
import { AdminGuard } from '../guards/admin.guard';
import { SecureAuthGuard } from '../guards/secure-auth.guard';
import { AuditService } from '../services/audit.service';
import {
  OpenClawOAuthBindingSummary,
  OpenClawOAuthExecutionResult,
  OpenClawOAuthRotationService,
} from '../services/openclaw-oauth-rotation.service';

@ApiTags('admin-openclaw-oauth')
@Controller('admin/openclaw/oauth')
@UseGuards(SecureAuthGuard, AdminGuard)
export class AdminOpenClawOAuthController {
  constructor(
    private readonly rotationService: OpenClawOAuthRotationService,
    private readonly auditService: AuditService
  ) {}

  private assertSuperAdmin(user: any): void {
    const roles = Array.isArray(user?.roles) ? user.roles : [user?.role];
    const isSuper = roles.some(
      (role: string) => String(role || '').toUpperCase() === 'SUPER_ADMIN'
    );
    if (!isSuper) throw new ForbiddenException('SUPER_ADMIN required');
  }

  private normalizeProvider(provider: string): OpenClawProvider {
    const normalized = provider.trim().toLowerCase();
    if (!OPENCLAW_PROVIDERS.includes(normalized as OpenClawProvider)) {
      throw new ForbiddenException(`Unsupported provider '${provider}'`);
    }
    return normalized as OpenClawProvider;
  }

  private async getRotationAuditSnapshot(limit = 100): Promise<{
    events: Array<{
      id: string;
      action: string;
      status: string;
      createdAt: string | null;
      userId: string | null;
      tenantId: string | null;
      service: string | null;
      provider: string | null;
      details: Record<string, unknown>;
    }>;
    rollup: {
      totals: {
        total: number;
        success: number;
        warning: number;
        error: number;
      };
      latestRunByService: Array<{
        service: string;
        provider: string;
        status: string;
        deployStatus: string | null;
        overviewStatus: number | null;
        at: string | null;
      }>;
      findings: Array<{
        severity: 'P0' | 'P1';
        service: string;
        provider: string;
        issue: string;
        at: string | null;
      }>;
    };
  }> {
    const boundedLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 10), 300) : 100;
    const logs = await this.auditService.getLogs({
      resourceType: 'openclaw_oauth_binding',
      limit: boundedLimit,
    });

    const events = logs
      .filter((log) => String(log.action || '').startsWith('openclaw.oauth.'))
      .map((log) => {
        const details =
          log.details && typeof log.details === 'object'
            ? (log.details as Record<string, unknown>)
            : {};
        return {
          id: String(log.id || ''),
          action: String(log.action || ''),
          status: String(log.status || 'info'),
          createdAt: log.createdAt ? new Date(log.createdAt).toISOString() : null,
          userId: log.userId ?? null,
          tenantId: String(details.tenantId || '') || null,
          service: String(details.service || '') || null,
          provider: String(details.provider || '') || null,
          details,
        };
      });

    const totals = {
      total: events.length,
      success: events.filter((e) => e.status === 'success').length,
      warning: events.filter((e) => e.status === 'warning').length,
      error: events.filter((e) => e.status === 'error').length,
    };

    const latestMap = new Map<
      string,
      {
        service: string;
        provider: string;
        status: string;
        deployStatus: string | null;
        overviewStatus: number | null;
        at: string | null;
      }
    >();

    const findings: Array<{
      severity: 'P0' | 'P1';
      service: string;
      provider: string;
      issue: string;
      at: string | null;
    }> = [];

    for (const event of events) {
      const service = event.service || 'unknown';
      const provider = event.provider || 'unknown';
      if (event.action !== 'openclaw.oauth.binding.executed') continue;

      const deployStatus = String(event.details.deployStatus || '') || null;
      const overviewRaw = event.details.overviewStatus;
      const overviewStatus =
        typeof overviewRaw === 'number'
          ? overviewRaw
          : Number.isFinite(Number(overviewRaw))
            ? Number(overviewRaw)
            : null;
      const runStatus =
        deployStatus === 'SUCCESS' && overviewStatus === 200 ? 'healthy' : 'degraded';

      latestMap.set(`${service}:${provider}`, {
        service,
        provider,
        status: runStatus,
        deployStatus,
        overviewStatus,
        at: event.createdAt,
      });

      if (deployStatus && deployStatus !== 'SUCCESS') {
        findings.push({
          severity: 'P0',
          service,
          provider,
          issue: `Deployment status is ${deployStatus}`,
          at: event.createdAt,
        });
      }
      if (overviewStatus !== null && overviewStatus !== 200) {
        findings.push({
          severity: 'P1',
          service,
          provider,
          issue: `Overview endpoint returned HTTP ${overviewStatus}`,
          at: event.createdAt,
        });
      }
    }

    return {
      events,
      rollup: {
        totals,
        latestRunByService: Array.from(latestMap.values()),
        findings: findings.slice(0, 50),
      },
    };
  }

  @Get('bindings')
  @ApiOperation({ summary: 'List encrypted OpenClaw OAuth bindings metadata' })
  @ApiResponse({ status: 200, description: 'Binding metadata list' })
  async listBindings(@CurrentUser() user: any): Promise<OpenClawOAuthBindingSummary[]> {
    this.assertSuperAdmin(user);
    return this.rotationService.listBindings();
  }

  @Put('bindings')
  @ApiOperation({ summary: 'Upsert encrypted OpenClaw OAuth binding' })
  @ApiResponse({ status: 200, description: 'Binding metadata' })
  async upsertBinding(
    @CurrentUser() user: any,
    @Body() dto: UpsertOpenClawOAuthBindingDto
  ): Promise<OpenClawOAuthBindingSummary> {
    this.assertSuperAdmin(user);
    const binding = await this.rotationService.upsertBinding(user.id, dto);
    await this.auditService.log('openclaw.oauth.binding.upserted', {
      userId: user.id,
      resourceType: 'openclaw_oauth_binding',
      resourceId: binding.key,
      status: 'success',
      details: {
        tenantId: binding.tenantId,
        service: binding.service,
        provider: binding.provider,
      },
    });
    return binding;
  }

  @Delete('bindings/:tenantId/:service/:provider')
  @ApiOperation({ summary: 'Soft-delete an OpenClaw OAuth binding' })
  @ApiResponse({ status: 200, description: 'Deleted' })
  async deleteBinding(
    @CurrentUser() user: any,
    @Param('tenantId') tenantId: string,
    @Param('service') service: string,
    @Param('provider') provider: string
  ): Promise<{ success: true }> {
    this.assertSuperAdmin(user);
    const normalizedProvider = this.normalizeProvider(provider);
    await this.rotationService.deleteBinding(tenantId, service, normalizedProvider);
    await this.auditService.log('openclaw.oauth.binding.deleted', {
      userId: user.id,
      resourceType: 'openclaw_oauth_binding',
      resourceId: `${tenantId}:${service}:${normalizedProvider}`,
      status: 'success',
      details: { tenantId, service, provider: normalizedProvider },
    });
    return { success: true };
  }

  @Post('execute/:tenantId/:service/:provider')
  @ApiOperation({ summary: 'Execute OAuth rotation for a stored binding' })
  @ApiResponse({ status: 200, description: 'Execution result' })
  async execute(
    @CurrentUser() user: any,
    @Param('tenantId') tenantId: string,
    @Param('service') service: string,
    @Param('provider') provider: string,
    @Body() dto: ExecuteOpenClawOAuthBindingDto
  ): Promise<OpenClawOAuthExecutionResult> {
    this.assertSuperAdmin(user);
    const normalizedProvider = this.normalizeProvider(provider);
    const result = await this.rotationService.executeBinding(
      tenantId,
      service,
      normalizedProvider,
      {
        waitForSuccess: dto.waitForSuccess ?? true,
        timeoutSeconds: dto.timeoutSeconds ?? 600,
      }
    );
    await this.auditService.log('openclaw.oauth.binding.executed', {
      userId: user.id,
      resourceType: 'openclaw_oauth_binding',
      resourceId: `${tenantId}:${service}:${normalizedProvider}`,
      status: result.deployStatus === 'SUCCESS' ? 'success' : 'warning',
      details: {
        deployStatus: result.deployStatus,
        deployId: result.deployId,
        overviewStatus: result.overviewStatus,
        provider: normalizedProvider,
        service,
      },
    });
    return result;
  }

  @Get('activity')
  @ApiOperation({
    summary:
      'Get OpenClaw OAuth rotation activity stream snapshot with run-status and findings rollups',
  })
  @ApiResponse({ status: 200, description: 'Activity + rollup' })
  async getActivity(@CurrentUser() user: any, @Query('limit') limit?: string) {
    this.assertSuperAdmin(user);
    const numericLimit = limit ? Number(limit) : 120;
    return this.getRotationAuditSnapshot(numericLimit);
  }
}
