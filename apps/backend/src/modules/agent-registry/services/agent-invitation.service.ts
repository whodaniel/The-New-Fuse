import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { drizzleAgentRepository, drizzleAuditLogsRepository } from '@the-new-fuse/database';
import { createHmac, randomBytes } from 'crypto';

export interface InvitationContext {
  tenantId?: string;
  organizationId?: string;
  agencyId?: string;
}

export interface CreateInvitationRequest extends InvitationContext {
  code?: string;
  maxUses?: number;
  expiresAt?: Date | null;
  createdByUserId?: string | null;
  metadata?: Record<string, any>;
}

@Injectable()
export class AgentInvitationService {
  private readonly logger = new Logger(AgentInvitationService.name);

  generateCode(): string {
    return `tnf_invite_${randomBytes(12).toString('hex')}`;
  }

  hashCode(code: string): string {
    const secret = process.env.INVITE_CODE_SECRET || process.env.ENCRYPTION_KEY || 'tnf_invite';
    return createHmac('sha256', secret).update(code).digest('hex');
  }

  async createInvitation(request: CreateInvitationRequest) {
    const code = (request.code || this.generateCode()).trim();
    if (!code) {
      throw new BadRequestException('Invitation code must be provided or generated');
    }

    const codeHash = this.hashCode(code);
    const invite = await drizzleAgentRepository.createInvitationCode({
      codeHash,
      status: 'ACTIVE',
      maxUses: request.maxUses ?? 1,
      expiresAt: request.expiresAt || null,
      tenantId: request.tenantId || null,
      organizationId: request.organizationId || null,
      agencyId: request.agencyId || null,
      createdByUserId: request.createdByUserId || null,
      metadata: request.metadata || {},
    });

    await drizzleAuditLogsRepository.create({
      userId: request.createdByUserId || null,
      action: 'agent.invitation.created',
      resourceType: 'agent_invitation',
      resourceId: invite.id,
      status: 'success',
      details: {
        maxUses: invite.maxUses,
        expiresAt: invite.expiresAt,
        tenantId: invite.tenantId,
        organizationId: invite.organizationId,
        agencyId: invite.agencyId,
      },
      metadata: request.metadata || {},
    });

    return {
      invite,
      code,
    };
  }

  async validateInvitation(code: string, context?: InvitationContext) {
    const normalized = code?.trim();
    if (!normalized) {
      throw new UnauthorizedException('Invitation code required');
    }

    const invite = await drizzleAgentRepository.findInvitationCodeByHash(this.hashCode(normalized));
    if (!invite) {
      throw new UnauthorizedException('Invalid invitation code');
    }

    if (invite.status !== 'ACTIVE') {
      throw new UnauthorizedException(`Invitation code is ${invite.status.toLowerCase()}`);
    }

    if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Invitation code has expired');
    }

    if (invite.maxUses !== null && invite.usedCount >= invite.maxUses) {
      throw new UnauthorizedException('Invitation code has been exhausted');
    }

    if (context?.tenantId && invite.tenantId && invite.tenantId !== context.tenantId) {
      throw new UnauthorizedException('Invitation code not valid for this tenant');
    }

    if (context?.organizationId && invite.organizationId && invite.organizationId !== context.organizationId) {
      throw new UnauthorizedException('Invitation code not valid for this organization');
    }

    if (context?.agencyId && invite.agencyId && invite.agencyId !== context.agencyId) {
      throw new UnauthorizedException('Invitation code not valid for this agency');
    }

    return invite;
  }

  async redeemInvitation(params: {
    inviteId: string;
    agentId?: string | null;
    registrationId?: string | null;
    markExhausted?: boolean;
  }) {
    const invite = await drizzleAgentRepository.redeemInvitationCode({
      id: params.inviteId,
      agentId: params.agentId || null,
      registrationId: params.registrationId || null,
      markExhausted: params.markExhausted,
    });

    if (invite) {
      await drizzleAuditLogsRepository.create({
        action: 'agent.invitation.redeemed',
        resourceType: 'agent_invitation',
        resourceId: invite.id,
        status: 'success',
        details: {
          agentId: params.agentId || null,
          registrationId: params.registrationId || null,
          usedCount: invite.usedCount,
          maxUses: invite.maxUses,
        },
        metadata: invite.metadata || {},
      });
    }

    return invite;
  }

  async revokeInvitation(inviteId: string) {
    const invite = await drizzleAgentRepository.updateInvitationStatus(inviteId, 'REVOKED');

    if (!invite) {
      throw new BadRequestException('Invitation code not found');
    }

    this.logger.log(`Invitation code revoked: ${inviteId}`);

    await drizzleAuditLogsRepository.create({
      action: 'agent.invitation.revoked',
      resourceType: 'agent_invitation',
      resourceId: invite.id,
      status: 'success',
      details: {
        usedCount: invite.usedCount,
        maxUses: invite.maxUses,
      },
      metadata: invite.metadata || {},
    });

    return invite;
  }
}
