import { Body, Controller, ForbiddenException, Get, Param, Post, Req } from '@nestjs/common';
// @ts-ignore
// @ts-ignore
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { hasPermission, isPrivilegedUser } from '../../../auth/auth-policy';
import {
  CreateManagedAccountGrantDto,
  ProvisionManagedAccountDto,
  RedeemManagedAccountGrantDto,
} from '../../../dto/email-custodian.dto';
import { AuthLevel, RequireAuthLevel } from '../../../guards/secure-auth.guard';
import { EmailCustodianService } from '../services/email-custodian.service';

type AuthenticatedRequest = Request & {
  user?: {
    id?: string;
    roles?: string[];
    permissions?: string[];
  };
};

@ApiTags('email-custodian')
@Controller('a2a/email-custodian')
@RequireAuthLevel(AuthLevel.USER)
@ApiBearerAuth()
export class EmailCustodianController {
  constructor(private readonly emailCustodianService: EmailCustodianService) {}

  @Get('accounts')
  @ApiOperation({ summary: 'List managed credential accounts owned by the current user' })
  @ApiResponse({ status: 200, description: 'Managed accounts list returned' })
  async listAccounts(@Req() req: AuthenticatedRequest) {
    const ownerUserId = this.requireUserId(req);
    this.assertCanManage(req);
    return this.emailCustodianService.listAccountsForOwner(ownerUserId);
  }

  @Post('accounts/provision')
  @ApiOperation({
    summary:
      'Provision a managed account record (hosted email or ChatGPT) and optionally execute provider automation',
  })
  @ApiResponse({ status: 201, description: 'Managed account provisioned' })
  async provisionAccount(
    @Req() req: AuthenticatedRequest,
    @Body() body: ProvisionManagedAccountDto
  ) {
    const ownerUserId = this.requireUserId(req);
    this.assertCanManage(req);
    return this.emailCustodianService.provisionAccountForOwner(ownerUserId, body);
  }

  @Post('accounts/:accountId/grants')
  @ApiOperation({
    summary:
      'Create a time-bound access grant token for a target agent to retrieve account credentials',
  })
  @ApiResponse({ status: 201, description: 'Grant created' })
  async createGrant(
    @Req() req: AuthenticatedRequest,
    @Param('accountId') accountId: string,
    @Body() body: CreateManagedAccountGrantDto
  ) {
    const ownerUserId = this.requireUserId(req);
    this.assertCanManage(req);
    return this.emailCustodianService.createGrantForAccount(ownerUserId, accountId, body);
  }

  @Get('accounts/:accountId/grants')
  @ApiOperation({ summary: 'List active and historical grants for one managed account' })
  @ApiResponse({ status: 200, description: 'Grant list returned' })
  async listGrants(@Req() req: AuthenticatedRequest, @Param('accountId') accountId: string) {
    const ownerUserId = this.requireUserId(req);
    this.assertCanManage(req);
    return this.emailCustodianService.listAccountGrants(ownerUserId, accountId);
  }

  @Post('grants/:grantId/revoke')
  @ApiOperation({ summary: 'Revoke an existing managed account grant token' })
  @ApiResponse({ status: 200, description: 'Grant revoked' })
  async revokeGrant(@Req() req: AuthenticatedRequest, @Param('grantId') grantId: string) {
    const ownerUserId = this.requireUserId(req);
    this.assertCanManage(req);
    return this.emailCustodianService.revokeGrant(ownerUserId, grantId);
  }

  @Post('grants/redeem')
  @ApiOperation({
    summary: 'Redeem a custodian grant token to retrieve delegated account login credentials',
  })
  @ApiResponse({ status: 200, description: 'Grant redeemed and credentials returned' })
  async redeemGrant(@Body() body: RedeemManagedAccountGrantDto) {
    return this.emailCustodianService.redeemGrant(body);
  }

  private requireUserId(req: AuthenticatedRequest): string {
    const userId = req.user?.id?.trim();
    if (!userId) {
      throw new ForbiddenException('Authenticated user id is required');
    }
    return userId;
  }

  private assertCanManage(req: AuthenticatedRequest): void {
    if (isPrivilegedUser(req.user || {})) return;
    if (hasPermission(req.user || {}, 'email_custodian:manage')) return;
    throw new ForbiddenException(
      'Managing email custodian accounts requires admin/system or email_custodian:manage'
    );
  }
}
