import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
// @ts-ignore
// @ts-ignore
// @ts-ignore
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from '@the-new-fuse/database';

import { hasPermission, isPrivilegedUser } from '../auth/auth-policy.js';

type AuthUser = User & {
  tenantId?: string;
  agencyId?: string;
  roles?: string[];
  permissions?: string[];
};

import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { AuthLevel, RequireAuthLevel } from '../guards/secure-auth.guard.js';
import { AgentHandoffService } from '../services/agent-handoff.service.js';

@ApiTags('agent-handoffs')
@Controller('handoffs')
@RequireAuthLevel(AuthLevel.USER)
export class AgentHandoffController {
  constructor(private readonly handoffService: AgentHandoffService) {}

  @Post('publish')
  @ApiOperation({ summary: 'Publish a targeted handoff packet to one or more agents' })
  @ApiResponse({ status: 201, description: 'Handoff packet published' })
  async publish(@Body() input: unknown, @CurrentUser() user: AuthUser) {
    if (!user || !user.id) {
      throw new HttpException('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    try {
      this.assertCanPublish(user);
      const bodyTenant = this.readTenantFromBody(input);
      const tenantId = this.resolveTenantId(user, bodyTenant);
      return await this.handoffService.publishForTenant(input, tenantId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        (error as Error).message || 'Failed to publish handoff',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('agent/:agentId')
  @ApiOperation({ summary: 'List handoff inbox packets for a specific agent' })
  @ApiResponse({ status: 200, description: 'Agent handoff inbox listed' })
  async listAgentInbox(
    @Param('agentId') agentId: string,
    @CurrentUser() user: AuthUser,
    @Query('tenantId') tenantIdParam?: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('includeAcknowledged') includeAcknowledged?: string
  ) {
    if (!user || !user.id) {
      throw new HttpException('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    try {
      this.assertCanReadAgentInbox(user, agentId);
      const tenantId = this.resolveTenantId(user, tenantIdParam);
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
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        (error as Error).message || 'Failed to list agent inbox',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('ack')
  @ApiOperation({ summary: 'Acknowledge a handoff packet from a target agent' })
  @ApiResponse({ status: 200, description: 'Handoff packet acknowledged' })
  async acknowledge(@Body() input: unknown, @CurrentUser() user: AuthUser) {
    if (!user || !user.id) {
      throw new HttpException('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    try {
      this.assertCanAcknowledge(user, input);
      const bodyTenant = this.readTenantFromBody(input);
      const tenantId = this.resolveTenantId(user, bodyTenant);
      return await this.handoffService.acknowledgeForTenant(input, tenantId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        (error as Error).message || 'Failed to acknowledge handoff',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('session/:sessionKey')
  @ApiOperation({ summary: 'List handoff packets for a session' })
  @ApiResponse({ status: 200, description: 'Session handoff packets listed' })
  async listBySession(
    @Param('sessionKey') sessionKey: string,
    @CurrentUser() user: AuthUser,
    @Query('tenantId') tenantIdParam?: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number
  ) {
    if (!user || !user.id) {
      throw new HttpException('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    try {
      this.assertCanReadSession(user);
      const tenantId = this.resolveTenantId(user, tenantIdParam);
      const packets = await this.handoffService.listBySession(sessionKey, tenantId, limit ?? 50);
      return {
        sessionKey,
        tenantId,
        count: packets.length,
        packets,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        (error as Error).message || 'Failed to list by session',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('packets/:id')
  @ApiOperation({ summary: 'Get a specific handoff packet' })
  @ApiResponse({ status: 200, description: 'Handoff packet retrieved' })
  async getPacket(
    @Param('id') packetId: string,
    @Query('tenantId') tenantIdParam: string,
    @CurrentUser() user: AuthUser
  ) {
    if (!user || !user.id) {
      throw new HttpException('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    try {
      this.assertCanReadSession(user);
      const tenantId = this.resolveTenantId(user, tenantIdParam);
      return await this.handoffService.getPacket(packetId, tenantId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        (error as Error).message || 'Failed to get packet',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  private resolveTenantId(user: AuthUser, requestedTenantId?: string): string {
    const userTenantId =
      typeof user?.tenantId === 'string' && user.tenantId.trim().length > 0
        ? user.tenantId.trim()
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

  private isPrivileged(user: AuthUser): boolean {
    return isPrivilegedUser(user || {});
  }

  private hasPermission(user: AuthUser, permission: string): boolean {
    return hasPermission(user || {}, permission);
  }

  private assertCanPublish(user: AuthUser): void {
    if (this.isPrivileged(user) || this.hasPermission(user, 'handoff:publish')) {
      return;
    }
    throw new ForbiddenException(
      'Publishing handoffs requires admin/system role or handoff:publish'
    );
  }

  private assertCanReadAgentInbox(user: AuthUser, agentId: string): void {
    if (this.isPrivileged(user) || this.hasPermission(user, 'handoff:read:any')) {
      return;
    }
    if (user?.id && user.id === agentId) {
      return;
    }
    throw new ForbiddenException('Reading another agent inbox requires elevated privileges');
  }

  private assertCanAcknowledge(user: AuthUser, input: unknown): void {
    if (this.isPrivileged(user) || this.hasPermission(user, 'handoff:ack:any')) {
      return;
    }
    const requestedAgentId = this.readAgentIdFromBody(input);
    if (requestedAgentId && user?.id && requestedAgentId === user.id) {
      return;
    }
    throw new ForbiddenException('Acknowledging for another agent requires elevated privileges');
  }

  private assertCanReadSession(user: AuthUser): void {
    if (this.isPrivileged(user) || this.hasPermission(user, 'handoff:read:any')) {
      return;
    }
    throw new ForbiddenException('Session-level handoff visibility requires elevated privileges');
  }
}
