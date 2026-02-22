import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import { hasPermission, isPrivilegedUser } from '../auth/auth-policy';
import { AuthLevel, RequireAuthLevel } from '../guards/secure-auth.guard';
import { AgentHandoffService } from '../services/agent-handoff.service';

type AuthenticatedRequest = Request & {
  user?: {
    id?: string;
    tenantId?: string;
    roles?: string[];
    permissions?: string[];
  };
};

@ApiTags('agent-handoffs')
@Controller('api/handoffs')
@RequireAuthLevel(AuthLevel.USER)
export class AgentHandoffController {
  constructor(private readonly handoffService: AgentHandoffService) {}

  @Post('publish')
  @ApiOperation({ summary: 'Publish a targeted handoff packet to one or more agents' })
  @ApiResponse({ status: 201, description: 'Handoff packet published' })
  async publish(@Body() input: unknown, @Req() req: AuthenticatedRequest) {
    this.assertCanPublish(req);
    const bodyTenant = this.readTenantFromBody(input);
    const tenantId = this.resolveTenantId(req, bodyTenant);
    return this.handoffService.publishForTenant(input, tenantId);
  }

  @Get('agent/:agentId')
  @ApiOperation({ summary: 'List handoff inbox packets for a specific agent' })
  @ApiResponse({ status: 200, description: 'Agent handoff inbox listed' })
  async listAgentInbox(
    @Param('agentId') agentId: string,
    @Req() req: AuthenticatedRequest,
    @Query('tenantId') tenantIdParam?: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('includeAcknowledged') includeAcknowledged?: string
  ) {
    this.assertCanReadAgentInbox(req, agentId);
    const tenantId = this.resolveTenantId(req, tenantIdParam);
    const rows = await this.handoffService.listForAgent(agentId, tenantId, {
      limit: limit ?? 20,
      includeAcknowledged: includeAcknowledged === 'true',
    });
    return {
      agentId,
      tenantId,
      count: rows.length,
      items: rows,
    };
  }

  @Post('ack')
  @ApiOperation({ summary: 'Acknowledge a handoff packet from a target agent' })
  @ApiResponse({ status: 200, description: 'Handoff packet acknowledged' })
  async acknowledge(@Body() input: unknown, @Req() req: AuthenticatedRequest) {
    this.assertCanAcknowledge(req, input);
    const bodyTenant = this.readTenantFromBody(input);
    const tenantId = this.resolveTenantId(req, bodyTenant);
    return this.handoffService.acknowledgeForTenant(input, tenantId);
  }

  @Get('session/:sessionKey')
  @ApiOperation({ summary: 'List handoff packets for a session' })
  @ApiResponse({ status: 200, description: 'Session handoff packets listed' })
  async listBySession(
    @Param('sessionKey') sessionKey: string,
    @Req() req: AuthenticatedRequest,
    @Query('tenantId') tenantIdParam?: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number
  ) {
    this.assertCanReadSession(req);
    const tenantId = this.resolveTenantId(req, tenantIdParam);
    const packets = await this.handoffService.listBySession(sessionKey, tenantId, limit ?? 50);
    return {
      sessionKey,
      tenantId,
      count: packets.length,
      packets,
    };
  }

  @Get(':packetId')
  @ApiOperation({ summary: 'Get a single handoff packet by ID' })
  @ApiResponse({ status: 200, description: 'Handoff packet found' })
  async getPacket(
    @Param('packetId') packetId: string,
    @Req() req: AuthenticatedRequest,
    @Query('tenantId') tenantIdParam?: string
  ) {
    this.assertCanReadSession(req);
    const tenantId = this.resolveTenantId(req, tenantIdParam);
    return this.handoffService.getPacket(packetId, tenantId);
  }

  private resolveTenantId(req: AuthenticatedRequest, requestedTenantId?: string): string {
    const userTenantId =
      typeof req.user?.tenantId === 'string' && req.user.tenantId.trim().length > 0
        ? req.user.tenantId.trim()
        : undefined;
    const paramTenantId =
      typeof requestedTenantId === 'string' && requestedTenantId.trim().length > 0
        ? requestedTenantId.trim()
        : undefined;

    if (!paramTenantId && !userTenantId) {
      throw new BadRequestException('tenantId is required');
    }

    if (paramTenantId && userTenantId && paramTenantId !== userTenantId) {
      throw new BadRequestException('tenantId mismatch with authenticated user tenant scope');
    }

    return paramTenantId || userTenantId!;
  }

  private readTenantFromBody(input: unknown): string | undefined {
    if (!input || typeof input !== 'object') {
      return undefined;
    }

    const maybeScope = (input as { scope?: unknown }).scope;
    if (!maybeScope || typeof maybeScope !== 'object') {
      return undefined;
    }

    const tenantId = (maybeScope as { tenantId?: unknown }).tenantId;
    return typeof tenantId === 'string' ? tenantId : undefined;
  }

  private readAgentIdFromBody(input: unknown): string | undefined {
    if (!input || typeof input !== 'object') {
      return undefined;
    }
    const agentId = (input as { agentId?: unknown }).agentId;
    return typeof agentId === 'string' ? agentId : undefined;
  }

  private isPrivileged(req: AuthenticatedRequest): boolean {
    return isPrivilegedUser(req.user || {});
  }

  private hasPermission(req: AuthenticatedRequest, permission: string): boolean {
    return hasPermission(req.user || {}, permission);
  }

  private assertCanPublish(req: AuthenticatedRequest): void {
    if (this.isPrivileged(req) || this.hasPermission(req, 'handoff:publish')) {
      return;
    }
    throw new ForbiddenException(
      'Publishing handoffs requires admin/system role or handoff:publish'
    );
  }

  private assertCanReadAgentInbox(req: AuthenticatedRequest, agentId: string): void {
    if (this.isPrivileged(req) || this.hasPermission(req, 'handoff:read:any')) {
      return;
    }
    if (req.user?.id && req.user.id === agentId) {
      return;
    }
    throw new ForbiddenException('Reading another agent inbox requires elevated privileges');
  }

  private assertCanAcknowledge(req: AuthenticatedRequest, input: unknown): void {
    if (this.isPrivileged(req) || this.hasPermission(req, 'handoff:ack:any')) {
      return;
    }
    const requestedAgentId = this.readAgentIdFromBody(input);
    if (requestedAgentId && req.user?.id && requestedAgentId === req.user.id) {
      return;
    }
    throw new ForbiddenException('Acknowledging for another agent requires elevated privileges');
  }

  private assertCanReadSession(req: AuthenticatedRequest): void {
    if (this.isPrivileged(req) || this.hasPermission(req, 'handoff:read:any')) {
      return;
    }
    throw new ForbiddenException('Session-level handoff visibility requires elevated privileges');
  }
}
