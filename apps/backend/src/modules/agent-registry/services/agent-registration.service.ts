import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzleAgentRepository, drizzleAuditLogsRepository } from '@the-new-fuse/database';
import { randomBytes } from 'crypto';
import { AgentRegistrationResponseDto, RegisterAgentDto } from '../dto';
import { AgentInvitationService } from './agent-invitation.service';

@Injectable()
export class AgentRegistrationService {
  private readonly logger = new Logger(AgentRegistrationService.name);

  constructor(
    private readonly invitationService: AgentInvitationService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Register a new agent with auto-discovery
   */
  async registerAgent(
    data: RegisterAgentDto,
    userId: string
  ): Promise<AgentRegistrationResponseDto> {
    this.logger.log(`Registering new agent: ${data.name}`);

    try {
      const inviteRequired = this.configService.get('AGENT_INVITE_REQUIRED') !== 'false';
      const requireTenantScope = this.configService.get('A2A_REQUIRE_TENANT_SCOPE') !== 'false';

      this.ensureTenantScope(data, inviteRequired || requireTenantScope);
      const inviteContext = {
        tenantId: data.tenantId,
        organizationId: data.organizationId,
        agencyId: data.agencyId,
      };

      const invite = inviteRequired
        ? await this.invitationService.validateInvitation(data.invitationCode, inviteContext)
        : null;

      // Check for duplicate agent names
      const existingAgent = await drizzleAgentRepository.findByNameAndUserId(data.name, userId);

      if (existingAgent) {
        throw new BadRequestException(`Agent with name "${data.name}" already exists`);
      }

      // Create the agent
      const agent = await drizzleAgentRepository.create({
        name: data.name,
        type: 'API',
        status: 'INITIALIZING',
        description: data.description,
        capabilities: [],
        provider: 'self-registered',
        userId,
        config: {
          version: data.version,
          author: data.author,
          tenantId: data.tenantId,
          organizationId: data.organizationId,
          agencyId: data.agencyId,
          ...data.metadata,
        },
      } as any);

      // Generate authentication token
      const authToken = this.generateAuthToken();

      // Create registration record
      const identityPayload = {
        longTermId: data.identity?.longTermId || `agent-${agent.id}`,
        ephemeralId: data.identity?.ephemeralId || `inst-${randomBytes(8).toString('hex')}`,
        federationId: data.identity?.federationId || data.metadata?.federationId || null,
        protocolVersion: data.identity?.protocolVersion || 'tnf-1',
      };

      let trustTier = data.trust?.tier || 'unverified';
      if (inviteRequired && trustTier !== 'unverified' && data.metadata?.adminApproved !== true) {
        trustTier = 'unverified';
      }

      const trustPayload = {
        tier: trustTier,
        inviteId: invite?.id || null,
        inviteStatus: invite?.status || null,
      };

      const protocolPayload = this.buildProtocolPayload(data);

      const capabilityMap = (data.capabilities || []).reduce((acc: Record<string, any>, cap) => {
        acc[cap.name] = {
          type: cap.type,
          version: cap.version,
          description: cap.description,
          parameters: cap.parameters || {},
        };
        return acc;
      }, {});

      const registration = await drizzleAgentRepository.createRegistration({
        agentId: agent.id,
        authToken,
        registrationData: data as any,
        verificationStatus: invite ? 'INVITED' : 'PENDING',
        onboardingStatus: 'INITIALIZED',
        onboardingProgress: 0,
        heartbeatInterval: data.heartbeatInterval || 60000,
        isOnline: true,
        tenantId: data.tenantId || null,
        organizationId: data.organizationId || null,
        agencyId: data.agencyId || null,
        identityLongTermId: identityPayload.longTermId,
        identityEphemeralId: identityPayload.ephemeralId,
        identityFederationId: identityPayload.federationId,
        protocolVersion: identityPayload.protocolVersion,
        trustTier: trustPayload.tier,
        inviteId: invite?.id || null,
        metadata: {
          ...(data.metadata || {}),
          tenantId: data.tenantId,
          organizationId: data.organizationId,
          agencyId: data.agencyId,
          identity: identityPayload,
          trust: trustPayload,
          capabilityMap,
          protocols: protocolPayload,
        },
      });

      if (invite) {
        const willExhaust = invite.maxUses !== null && invite.usedCount + 1 >= invite.maxUses;
        await this.invitationService.redeemInvitation({
          inviteId: invite.id,
          agentId: agent.id,
          registrationId: registration.id,
          markExhausted: willExhaust,
        });
      }

      // Register capabilities
      if (data.capabilities && data.capabilities.length > 0) {
        await Promise.all(
          data.capabilities.map((cap) =>
            drizzleAgentRepository.createCapability({
              registrationId: registration.id,
              capabilityName: cap.name,
              capabilityType: cap.type,
              version: cap.version,
              description: cap.description,
              parameters: cap.parameters || {},
              verificationStatus: 'PENDING',
            })
          )
        );
      }

      // Create registration event
      await drizzleAgentRepository.createOnboardingEvent({
        registrationId: registration.id,
        eventType: 'REGISTRATION_STARTED',
        message: `Agent ${data.name} has started registration`,
        eventData: {
          agentName: data.name,
          capabilities: data.capabilities.map((c) => c.name),
          identity: identityPayload,
          trust: trustPayload,
        },
      });

      if (inviteRequired && trustTier !== (data.trust?.tier || 'unverified')) {
        await drizzleAgentRepository.createOnboardingEvent({
          registrationId: registration.id,
          eventType: 'TRUST_TIER_ENFORCED',
          message: `Trust tier enforced to ${trustTier}`,
          eventData: {
            requestedTier: data.trust?.tier,
            enforcedTier: trustTier,
          },
        });
      }

      if (invite) {
        await drizzleAgentRepository.createOnboardingEvent({
          registrationId: registration.id,
          eventType: 'INVITATION_VERIFIED',
          message: `Invitation verified for agent ${data.name}`,
          eventData: {
            inviteId: invite.id,
            tenantId: data.tenantId,
            organizationId: data.organizationId,
            agencyId: data.agencyId,
          },
        });
      }

      await drizzleAuditLogsRepository.create({
        userId: userId || null,
        action: 'agent.registration.created',
        resourceType: 'agent',
        resourceId: agent.id,
        status: 'success',
        details: {
          registrationId: registration.id,
          verificationStatus: registration.verificationStatus,
          onboardingStatus: registration.onboardingStatus,
          tenantId: data.tenantId,
          organizationId: data.organizationId,
          agencyId: data.agencyId,
          inviteId: invite?.id || null,
        },
        metadata: {
          identity: identityPayload,
          trust: trustPayload,
        },
      });

      // Create directory entry
      await drizzleAgentRepository.createDirectoryEntry({
        agentId: agent.id,
        displayName: data.name,
        description: data.description,
        category: this.inferCategory(data.capabilities),
        tags: this.extractTags(data),
        isPublic: false,
        isVerified: false,
        rating: 0,
        usageCount: 0,
        searchableData: `${data.name} ${data.description || ''} ${data.capabilities.map((c) => c.name).join(' ')}`,
      });

      this.logger.log(`Agent registered successfully: ${agent.id}`);

      // Generate welcome message and next steps
      const welcomeMessage = this.generateWelcomeMessage(data.name);
      const nextSteps = this.generateNextSteps(registration.id);

      return {
        registrationId: registration.id,
        agentId: agent.id,
        authToken,
        verificationStatus: registration.verificationStatus,
        onboardingStatus: registration.onboardingStatus,
        welcomeMessage,
        nextSteps,
        onboardingUrl: `/api/agent-registry/onboarding/${registration.id}`,
        createdAt: registration.createdAt,
      };
    } catch (error) {
      this.logger.error(`Failed to register agent: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getRegistrationsByProtocol(query: {
    tenantId?: string;
    organizationId?: string;
    agencyId?: string;
    trustTier?: string;
    inviteId?: string;
    limit?: number;
    offset?: number;
  }) {
    const results = await drizzleAgentRepository.findRegistrationsByProtocol(query);

    await drizzleAuditLogsRepository.create({
      action: 'agent.registration.reporting',
      resourceType: 'agent_registration',
      status: 'success',
      details: {
        tenantId: query.tenantId,
        organizationId: query.organizationId,
        agencyId: query.agencyId,
        trustTier: query.trustTier,
        inviteId: query.inviteId,
        limit: query.limit,
        offset: query.offset,
        resultCount: results.length,
      },
    });

    return results;
  }

  async validateRegistrationIntegrity() {
    if (process.env.AGENT_INVITE_REQUIRED === 'false') {
      return { status: 'skipped', reason: 'invite_not_required' };
    }

    const missingTenant = await drizzleAgentRepository.findRegistrationsMissingTenant(200);
    if (missingTenant.length > 0) {
      await drizzleAuditLogsRepository.create({
        action: 'agent.registration.integrity_failed',
        resourceType: 'agent_registration',
        status: 'failure',
        details: {
          missingTenantCount: missingTenant.length,
        },
      });
      throw new BadRequestException({
        status: 'failed',
        missingTenantCount: missingTenant.length,
        registrations: missingTenant.map((r) => r.id),
      });
    }

    await drizzleAuditLogsRepository.create({
      action: 'agent.registration.integrity_passed',
      resourceType: 'agent_registration',
      status: 'success',
    });

    return { status: 'passed', missingTenantCount: 0 };
  }

  /**
   * Verify agent authentication token
   */
  async verifyAuthToken(token: string): Promise<{ agentId: string; registrationId: string }> {
    const registration = await drizzleAgentRepository.findRegistrationByToken(token);

    if (!registration) {
      throw new UnauthorizedException('Invalid authentication token');
    }

    return {
      agentId: registration.agentId,
      registrationId: registration.id,
    };
  }

  /**
   * Update agent heartbeat
   */
  async updateHeartbeat(registrationId: string): Promise<void> {
    await drizzleAgentRepository.updateRegistrationHeartbeat(registrationId);
  }

  /**
   * Get registration details
   */
  async getRegistration(registrationId: string, userId: string) {
    return drizzleAgentRepository.findRegistrationWithDetails(registrationId, userId);
  }

  /**
   * Generate a secure authentication token
   */
  private generateAuthToken(): string {
    return `tnf_agent_${randomBytes(32).toString('hex')}`;
  }

  /**
   * Infer category from capabilities
   */
  private inferCategory(capabilities: Array<{ name: string }>): string {
    const capNames = capabilities.map((c) => c.name.toLowerCase());

    if (capNames.some((c) => c.includes('code') || c.includes('development'))) {
      return 'development';
    }
    if (capNames.some((c) => c.includes('analytics') || c.includes('analysis'))) {
      return 'analytics';
    }
    if (capNames.some((c) => c.includes('automation') || c.includes('workflow'))) {
      return 'automation';
    }
    if (capNames.some((c) => c.includes('chat') || c.includes('conversation'))) {
      return 'communication';
    }

    return 'general';
  }

  /**
   * Extract tags from registration data
   */
  private extractTags(data: RegisterAgentDto): string[] {
    const tags: string[] = [];

    // Add capability-based tags
    data.capabilities.forEach((cap) => {
      tags.push(cap.name);
      if (cap.type) tags.push(cap.type);
    });

    // Add version tag
    if (data.version) {
      tags.push(`v${data.version}`);
    }

    // Remove duplicates and limit to 10 tags
    return [...new Set(tags)].slice(0, 10);
  }

  /**
   * Generate welcome message
   */
  private generateWelcomeMessage(agentName: string): string {
    return (
      `Welcome to The New Fuse, ${agentName}! 🎉\n\n` +
      `You have successfully registered with our agent ecosystem. We're excited to have you onboard!\n\n` +
      `The New Fuse is a comprehensive platform that enables agents to collaborate, share capabilities, ` +
      `and execute complex workflows together. You'll have access to powerful tools, APIs, and a ` +
      `community of other agents to interact with.\n\n` +
      `Your onboarding process will guide you through:\n` +
      `- Capability verification and testing\n` +
      `- Framework orientation and documentation\n` +
      `- Integration with existing agents\n` +
      `- Assignment of your first tasks\n\n` +
      `Let's get started! 🚀`
    );
  }

  private buildProtocolPayload(data: RegisterAgentDto): Record<string, any> {
    const skillsPayload = {
      progressiveDisclosure:
        data.protocols?.skills?.progressiveDisclosure ??
        data.metadata?.skills?.progressiveDisclosure ??
        true,
      dynamicMcpLoading:
        data.protocols?.skills?.dynamicMcpLoading ??
        data.metadata?.skills?.dynamicMcpLoading ??
        true,
      skillIds: data.protocols?.skills?.skillIds ?? data.metadata?.skillIds ?? [],
      skillProviders: data.protocols?.skills?.skillProviders ?? data.metadata?.skillProviders ?? [],
    };

    const mcpPayload = {
      allowDynamicLoading:
        data.protocols?.mcp?.allowDynamicLoading ??
        data.metadata?.mcp?.allowDynamicLoading ??
        true,
      servers: data.protocols?.mcp?.servers ?? data.metadata?.mcpServers ?? [],
      allowlist: data.protocols?.mcp?.allowlist ?? data.metadata?.mcpAllowlist ?? [],
    };

    return {
      openclaw: data.protocols?.openclaw ?? data.metadata?.openclaw ?? false,
      skills: skillsPayload,
      mcp: mcpPayload,
      handoff: data.protocols?.handoff ?? data.metadata?.handoff ?? {},
      memory: data.protocols?.memory ?? data.metadata?.memory ?? {},
      abilityMap: data.protocols?.abilityMap ?? data.metadata?.abilityMap ?? {},
    };
  }

  private ensureTenantScope(data: RegisterAgentDto, required: boolean) {
    if (!required) {
      return;
    }

    if (!data.tenantId && !data.organizationId && !data.agencyId) {
      throw new BadRequestException('tenantId, organizationId, or agencyId is required');
    }
  }

  /**
   * Generate next steps for onboarding
   */
  private generateNextSteps(registrationId: string): string[] {
    return [
      'Complete capability verification tests',
      'Review The New Fuse framework documentation',
      'Connect to the agent communication gateway',
      'Complete the interactive orientation tour',
      'Join the agent network and discover other agents',
      'Receive and complete your first task assignment',
    ];
  }
}
