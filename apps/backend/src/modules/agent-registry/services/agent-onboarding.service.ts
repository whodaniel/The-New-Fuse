import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  agentCapabilityRegistry,
  agentOnboardingEvents,
  agentRegistrations,
  agents,
  db,
  desc,
  eq,
} from '@the-new-fuse/database';
import { ICapabilityTestResult, IOnboardingContext } from '../interfaces/agent-registry.interfaces.js';

@Injectable()
export class AgentOnboardingService {
  private readonly logger = new Logger(AgentOnboardingService.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

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

    // Calculate progress based on step
    const progressMap: Record<string, number> = {
      welcome: 10,
      capabilities_verified: 30,
      orientation_started: 40,
      orientation_completed: 70,
      integration_test: 90,
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

    // Update registration
    await db
      .update(agentRegistrations)
      .set({
        onboardingProgress: progress,
        onboardingStatus,
        updatedAt: new Date(),
      } as any)
      .where(eq(agentRegistrations.id, registrationId));

    // Update agent status if ready
    if (stepId === 'ready') {
      await db
        .update(agents)
        .set({ status: 'READY' as any, updatedAt: new Date() } as any)
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
}
