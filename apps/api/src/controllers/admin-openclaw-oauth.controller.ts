import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Put,
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
}
