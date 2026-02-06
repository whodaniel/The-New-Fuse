import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  agentCapabilityRegistry,
  agentOnboardingEvents,
  agentRegistrations,
  agents,
  db,
  desc,
  eq,
  drizzleAuditLogsRepository,
} from '@the-new-fuse/database';
import { ICapabilityTestResult, IOnboardingContext } from '../interfaces/agent-registry.interfaces';

@Injectable()
export class AgentOnboardingService {
  private readonly logger = new Logger(AgentOnboardingService.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService
  ) {}

  /**
   * Start onboarding process for an agent
   */
  async startOnboarding(registrationId: string): Promise<IOnboardingContext> {
    this.logger.log(`Starting onboarding for registration: ${registrationId}`);

    const registration = await db.query.agentRegistrations.findFirst({
      where: eq(agentRegistrations.id, registrationId),
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    const inviteRequired = this.configService.get('AGENT_INVITE_REQUIRED') !== 'false';
    if (inviteRequired) {
      const allowedStatuses = new Set(['INVITED', 'VERIFIED']);
      if (!allowedStatuses.has(registration.verificationStatus)) {
        throw new BadRequestException('Invitation verification required before onboarding');
      }
      if (!registration.inviteId) {
        throw new BadRequestException('Invitation record missing for onboarding');
      }
      if (!registration.tenantId && !registration.organizationId && !registration.agencyId) {
        throw new BadRequestException('Tenant, organization, or agency required for onboarding');
      }
    }

    const agent = await db.query.agents.findFirst({
      where: eq(agents.id, registration.agentId),
    });

    // Update onboarding status
    await db
      .update(agentRegistrations)
      .set({
        onboardingStatus: 'WELCOME_SENT',
        onboardingProgress: 10,
        updatedAt: new Date(),
      } as any)
      .where(eq(agentRegistrations.id, registrationId));

    // Create welcome event
    await this.createOnboardingEvent(
      registrationId,
      'WELCOME_MESSAGE_SENT',
      'Welcome message sent to agent',
      { step: 'welcome' }
    );

    // Emit event for welcome message
    this.eventEmitter.emit('agent.onboarding.started', {
      registrationId,
      agentId: registration.agentId,
      agentName: agent?.name,
    });

    await drizzleAuditLogsRepository.create({
      action: 'agent.onboarding.started',
      resourceType: 'agent_registration',
      resourceId: registration.id,
      status: 'success',
      details: {
        agentId: registration.agentId,
        agentName: agent?.name,
      },
    });

    return {
      registrationId,
      agentId: registration.agentId,
      agentName: agent?.name || 'Unknown',
      currentStep: 'welcome',
      progress: 10,
      data: {},
    };
  }

  /**
   * Test agent capabilities
   */
  async testCapabilities(registrationId: string): Promise<ICapabilityTestResult[]> {
    this.logger.log(`Testing capabilities for registration: ${registrationId}`);

    const capabilities = await db.query.agentCapabilityRegistry.findMany({
      where: eq(agentCapabilityRegistry.registrationId, registrationId),
    });

    const results: ICapabilityTestResult[] = [];

    for (const capability of capabilities) {
      // Simulate capability testing
      const testResult = await this.runCapabilityTest(capability);
      results.push(testResult);

      // Update capability status
      await db
        .update(agentCapabilityRegistry)
        .set({
          verificationStatus: testResult.passed ? 'VERIFIED' : 'FAILED',
          updatedAt: new Date(),
        } as any)
        .where(eq(agentCapabilityRegistry.id, capability.id));

      // Create event
      await this.createOnboardingEvent(
        registrationId,
        testResult.passed ? 'CAPABILITY_VERIFIED' : 'CAPABILITY_FAILED',
        `Capability ${capability.capabilityName} ${testResult.passed ? 'verified' : 'failed'}`,
        { capability: capability.capabilityName, result: testResult }
      );
    }

    // Update onboarding progress
    const allPassed = results.every((r) => r.passed);
    await db
      .update(agentRegistrations)
      .set({
        onboardingStatus: 'CAPABILITIES_TESTED',
        onboardingProgress: 30,
        verificationStatus: allPassed ? 'VERIFIED' : 'FAILED',
        updatedAt: new Date(),
      } as any)
      .where(eq(agentRegistrations.id, registrationId));

    await drizzleAuditLogsRepository.create({
      action: 'agent.capabilities.tested',
      resourceType: 'agent_registration',
      resourceId: registrationId,
      status: allPassed ? 'success' : 'failure',
      details: {
        passed: allPassed,
        total: results.length,
      },
    });

    return results;
  }

  /**
   * Complete an onboarding step
   */
  async completeStep(
    registrationId: string,
    stepId: string,
    stepData?: Record<string, any>
  ): Promise<IOnboardingContext> {
    this.logger.log(`Completing step ${stepId} for registration: ${registrationId}`);

    const registration = await db.query.agentRegistrations.findFirst({
      where: eq(agentRegistrations.id, registrationId),
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    const agent = await db.query.agents.findFirst({
      where: eq(agents.id, registration.agentId),
    });

    this.validateStepData(stepId, stepData);

    // Calculate progress based on step
    const progressMap: Record<string, number> = {
      welcome: 10,
      invitation_verified: 20,
      identity_assigned: 25,
      capabilities_verified: 35,
      protocol_alignment: 45,
      orientation_started: 55,
      orientation_completed: 75,
      skills_discovered: 85,
      handoff_verified: 87,
      mcp_configured: 90,
      memory_configured: 92,
      integration_test: 95,
      ready: 100,
    };

    const progress = progressMap[stepId] || registration.onboardingProgress;

    // Determine next status
    let onboardingStatus = registration.onboardingStatus;
    if (stepId === 'orientation_started') {
      onboardingStatus = 'ORIENTATION_IN_PROGRESS';
    } else if (stepId === 'orientation_completed') {
      onboardingStatus = 'ORIENTATION_COMPLETED';
    } else if (stepId === 'integration_test') {
      onboardingStatus = 'INTEGRATION_TESTING';
    } else if (stepId === 'ready') {
      onboardingStatus = 'READY';
    }

    let updatedMetadata = registration.metadata || {};
    const updatePayload: Record<string, any> = {
      onboardingProgress: progress,
      onboardingStatus,
      updatedAt: new Date(),
    };

    if (stepId === 'identity_assigned' && stepData?.identity) {
      updatedMetadata = {
        ...updatedMetadata,
        identity: {
          ...(updatedMetadata as any).identity,
          ...stepData.identity,
        },
      };
      if (stepData.identity.longTermId) {
        updatePayload.identityLongTermId = stepData.identity.longTermId;
      }
      if (stepData.identity.ephemeralId) {
        updatePayload.identityEphemeralId = stepData.identity.ephemeralId;
      }
      if (stepData.identity.federationId) {
        updatePayload.identityFederationId = stepData.identity.federationId;
      }
      if (stepData.identity.protocolVersion) {
        updatePayload.protocolVersion = stepData.identity.protocolVersion;
      }
    }

    if (stepId === 'protocol_alignment' && stepData?.protocols) {
      updatedMetadata = {
        ...updatedMetadata,
        protocols: {
          ...(updatedMetadata as any).protocols,
          ...stepData.protocols,
        },
      };
    }

    if (stepId === 'skills_discovered' && stepData?.skills) {
      updatedMetadata = {
        ...updatedMetadata,
        protocols: {
          ...(updatedMetadata as any).protocols,
          skills: {
            ...(updatedMetadata as any).protocols?.skills,
            ...stepData.skills,
          },
        },
      };
    }

    if (stepId === 'mcp_configured' && stepData?.mcp) {
      updatedMetadata = {
        ...updatedMetadata,
        protocols: {
          ...(updatedMetadata as any).protocols,
          mcp: {
            ...(updatedMetadata as any).protocols?.mcp,
            ...stepData.mcp,
          },
        },
      };
    }

    if (stepId === 'integration_test' && stepData?.result) {
      updatedMetadata = {
        ...updatedMetadata,
        integrationTest: stepData.result,
      };
    }

    if (stepId === 'handoff_verified' && stepData?.handoff) {
      updatedMetadata = {
        ...updatedMetadata,
        protocols: {
          ...(updatedMetadata as any).protocols,
          handoff: {
            ...(updatedMetadata as any).protocols?.handoff,
            ...stepData.handoff,
          },
        },
      };
    }

    if (stepId === 'memory_configured' && stepData?.memory) {
      updatedMetadata = {
        ...updatedMetadata,
        protocols: {
          ...(updatedMetadata as any).protocols,
          memory: {
            ...(updatedMetadata as any).protocols?.memory,
            ...stepData.memory,
          },
        },
      };
    }

    updatePayload.metadata = updatedMetadata;

    // Update registration
    await db
      .update(agentRegistrations)
      .set(updatePayload as any)
      .where(eq(agentRegistrations.id, registrationId));

    // Update agent status if ready
    if (stepId === 'ready') {
      await db
        .update(agents)
        .set({ status: 'READY', updatedAt: new Date() } as any)
        .where(eq(agents.id, registration.agentId));
    }

    // Create event
    await this.createOnboardingEvent(
      registrationId,
      'ORIENTATION_STEP_COMPLETED',
      `Completed step: ${stepId}`,
      { step: stepId, data: stepData }
    );

    // Emit event
    this.eventEmitter.emit('agent.onboarding.step.completed', {
      registrationId,
      agentId: registration.agentId,
      step: stepId,
      progress,
    });

    await drizzleAuditLogsRepository.create({
      action: 'agent.onboarding.step.completed',
      resourceType: 'agent_registration',
      resourceId: registrationId,
      status: 'success',
      details: {
        agentId: registration.agentId,
        stepId,
        progress,
      },
    });

    return {
      registrationId,
      agentId: registration.agentId,
      agentName: agent?.name || 'Unknown',
      currentStep: stepId,
      progress,
      data: stepData || {},
    };
  }

  /**
   * Get onboarding progress
   */
  async getOnboardingProgress(registrationId: string) {
    const registration = await db.query.agentRegistrations.findFirst({
      where: eq(agentRegistrations.id, registrationId),
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    const agent = await db.query.agents.findFirst({
      where: eq(agents.id, registration.agentId),
    });

    const capabilities = await db.query.agentCapabilityRegistry.findMany({
      where: eq(agentCapabilityRegistry.registrationId, registrationId),
    });

    const onboardingEvents = await db.query.agentOnboardingEvents.findMany({
      where: eq(agentOnboardingEvents.registrationId, registrationId),
      orderBy: [desc(agentOnboardingEvents.timestamp)],
    });

    return {
      registrationId: registration.id,
      agentId: registration.agentId,
      agentName: agent?.name,
      currentStep: null, // Could add to schema if needed
      progress: registration.onboardingProgress,
      status: registration.onboardingStatus,
      verificationStatus: registration.verificationStatus,
      orientationCompleted: registration.onboardingProgress >= 70,
      capabilities: capabilities.map((cap) => ({
        name: cap.capabilityName,
        type: cap.capabilityType,
        verified: cap.verificationStatus === 'VERIFIED',
      })),
      events: onboardingEvents,
      createdAt: registration.createdAt,
      updatedAt: registration.updatedAt,
    };
  }

  /**
   * Run capability test (simulated)
   */
  private async runCapabilityTest(capability: any): Promise<ICapabilityTestResult> {
    // This is a simulated test - in production, you would implement actual tests
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Simulate a 95% pass rate
    const passed = Math.random() > 0.05;

    return {
      capabilityName: capability.capabilityName,
      passed,
      score: passed ? Math.random() * 0.3 + 0.7 : Math.random() * 0.5,
      details: passed
        ? `Capability ${capability.capabilityName} verified successfully`
        : `Capability ${capability.capabilityName} failed verification`,
      errors: passed ? [] : ['Test timeout', 'Invalid response format'],
    };
  }

  /**
   * Create onboarding event
   */
  private async createOnboardingEvent(
    registrationId: string,
    eventType: string,
    message: string,
    eventData?: any
  ) {
    return db.insert(agentOnboardingEvents).values({
      registrationId,
      eventType,
      message,
      eventData: eventData || {},
    } as any);
  }

  private validateStepData(stepId: string, stepData?: Record<string, any>) {
    if (!stepData) {
      if (['identity_assigned', 'protocol_alignment', 'skills_discovered', 'mcp_configured', 'integration_test'].includes(stepId)) {
        throw new BadRequestException(`Step "${stepId}" requires payload data`);
      }
      return;
    }

    if (stepId === 'identity_assigned') {
      const identity = stepData.identity || stepData;
      if (!identity?.longTermId || !identity?.ephemeralId) {
        throw new BadRequestException('identity_assigned requires longTermId and ephemeralId');
      }
    }

    if (stepId === 'protocol_alignment') {
      if (!stepData.protocols || typeof stepData.protocols !== 'object') {
        throw new BadRequestException('protocol_alignment requires protocols payload');
      }
    }

    if (stepId === 'skills_discovered') {
      const skills = stepData.skills || stepData;
      const skillIds = skills?.skillIds || stepData.skillIds;
      if (!Array.isArray(skillIds) || skillIds.length === 0) {
        throw new BadRequestException('skills_discovered requires skillIds');
      }
    }

    if (stepId === 'mcp_configured') {
      const mcp = stepData.mcp || stepData;
      const hasServers = Array.isArray(mcp?.servers) && mcp.servers.length > 0;
      const allowsDynamic = mcp?.allowDynamicLoading === true;
      if (!hasServers && !allowsDynamic) {
        throw new BadRequestException('mcp_configured requires servers or allowDynamicLoading=true');
      }
    }

    if (stepId === 'integration_test') {
      if (typeof stepData?.result?.passed !== 'boolean') {
        throw new BadRequestException('integration_test requires result.passed boolean');
      }
    }

    if (stepId === 'handoff_verified') {
      const handoff = stepData.handoff || stepData;
      if (!handoff?.protocolVersion) {
        throw new BadRequestException('handoff_verified requires handoff.protocolVersion');
      }
    }

    if (stepId === 'memory_configured') {
      const memory = stepData.memory || stepData;
      if (!memory?.provider && !memory?.namespace) {
        throw new BadRequestException('memory_configured requires memory.provider or memory.namespace');
      }
    }
  }
}
