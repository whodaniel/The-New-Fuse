import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Param,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { hasPermission, isPrivilegedUser } from '../../../auth/auth-policy';
import { AuthLevel, RequireAuthLevel } from '../../../guards/secure-auth.guard';
import {
  ApproveAgentTokenRequestDto,
  AuthorizeAgentTokenDto,
  RequestAgentTokenDto,
  RevokeAgentTokenDto,
  RevokeAllAgentTokensDto,
  UpsertAuthBrokerPolicyDto,
} from '../dto/a2a-auth-broker.dto';
import { A2AAuthBrokerService } from '../services/a2a-auth-broker.service';

type AuthenticatedRequest = Request & {
  user?: {
    id?: string;
    roles?: string[];
    permissions?: string[];
  };
};

@ApiTags('a2a-auth-broker')
@Controller('a2a/auth')
@RequireAuthLevel(AuthLevel.USER)
@ApiBearerAuth()
export class A2AAuthBrokerController {
  constructor(private readonly authBrokerService: A2AAuthBrokerService) {}

  @Post('request-token')
  @ApiOperation({
    summary: 'Create an auth token request for an agent/integration action with scoped access',
  })
  @ApiResponse({ status: 201, description: 'Auth token request processed' })
  async requestToken(@Body() body: RequestAgentTokenDto, @Req() req: AuthenticatedRequest) {
    return this.authBrokerService.requestToken(body, {
      requesterUserId: req.user?.id,
      ip: this.getClientIp(req),
      runtimeId: body.runtimeId,
    });
  }

  @Post('approve')
  @RequireAuthLevel(AuthLevel.ADMIN)
  @ApiOperation({ summary: 'Approve a pending auth token request (step-up path)' })
  @ApiResponse({ status: 200, description: 'Request approved and token issued' })
  async approve(@Body() body: ApproveAgentTokenRequestDto, @Req() req: AuthenticatedRequest) {
    this.assertCanApprove(req);
    return this.authBrokerService.approveTokenRequest(body, {
      requesterUserId: req.user?.id,
      ip: this.getClientIp(req),
    });
  }

  @Post('revoke')
  @RequireAuthLevel(AuthLevel.ADMIN)
  @ApiOperation({ summary: 'Revoke a token by tokenId or requestId' })
  @ApiResponse({ status: 200, description: 'Token revoked' })
  async revoke(@Body() body: RevokeAgentTokenDto, @Req() req: AuthenticatedRequest) {
    this.assertCanManageRevocation(req);
    return this.authBrokerService.revokeTokenOrRequest(body, {
      requesterUserId: req.user?.id,
      ip: this.getClientIp(req),
    });
  }

  @Post('revoke-all')
  @RequireAuthLevel(AuthLevel.ADMIN)
  @ApiOperation({
    summary: 'Revoke all active broker tokens for an agent (optionally per integration)',
  })
  @ApiResponse({ status: 200, description: 'Agent tokens revoked' })
  async revokeAll(@Body() body: RevokeAllAgentTokensDto, @Req() req: AuthenticatedRequest) {
    this.assertCanManageRevocation(req);
    return this.authBrokerService.revokeAllForAgent(body, {
      requesterUserId: req.user?.id,
      ip: this.getClientIp(req),
    });
  }

  @Put('policies/:agentId/:integration')
  @RequireAuthLevel(AuthLevel.ADMIN)
  @ApiOperation({ summary: 'Upsert auth broker policy for agent+integration' })
  @ApiResponse({ status: 200, description: 'Policy saved' })
  async upsertPolicy(
    @Param('agentId') agentId: string,
    @Param('integration') integration: string,
    @Body() body: UpsertAuthBrokerPolicyDto,
    @Req() req: AuthenticatedRequest
  ) {
    this.assertCanManagePolicies(req);
    return this.authBrokerService.upsertPolicy(
      agentId,
      integration,
      body,
      req.user?.id || 'system'
    );
  }

  @Get('policies/:agentId/:integration')
  @RequireAuthLevel(AuthLevel.ADMIN)
  @ApiOperation({
    summary: 'Get auth broker policy for agent+integration (supports wildcard keys)',
  })
  @ApiResponse({ status: 200, description: 'Policy returned when found' })
  async getPolicy(@Param('agentId') agentId: string, @Param('integration') integration: string) {
    const policy = await this.authBrokerService.getPolicy(agentId, integration);
    return {
      found: Boolean(policy),
      policy,
    };
  }

  @Post('tokens/authorize')
  @ApiOperation({ summary: 'Authorize and consume a broker token for an integration action' })
  @ApiResponse({ status: 200, description: 'Token authorized' })
  async authorizeToken(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: AuthorizeAgentTokenDto,
    @Req() req: AuthenticatedRequest
  ) {
    if (!authorization) {
      throw new ForbiddenException('Authorization header is required');
    }
    return this.authBrokerService.authorizeAgentToken(
      {
        bearerToken: authorization,
        ...body,
      },
      {
        ip: this.getClientIp(req),
        runtimeId: body.runtimeId,
      }
    );
  }

  private assertCanApprove(req: AuthenticatedRequest): void {
    if (isPrivilegedUser(req.user || {})) {
      return;
    }
    if (hasPermission(req.user || {}, 'auth:approve')) {
      return;
    }
    throw new ForbiddenException('Approving broker tokens requires elevated privileges');
  }

  private assertCanManageRevocation(req: AuthenticatedRequest): void {
    if (isPrivilegedUser(req.user || {})) {
      return;
    }
    if (hasPermission(req.user || {}, 'auth:revoke')) {
      return;
    }
    throw new ForbiddenException('Revoking broker tokens requires elevated privileges');
  }

  private assertCanManagePolicies(req: AuthenticatedRequest): void {
    if (isPrivilegedUser(req.user || {})) {
      return;
    }
    if (hasPermission(req.user || {}, 'auth:policy:write')) {
      return;
    }
    throw new ForbiddenException('Managing broker policies requires elevated privileges');
  }

  private getClientIp(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (req.headers['x-real-ip'] as string) ||
      req.ip ||
      'unknown'
    );
  }
}
