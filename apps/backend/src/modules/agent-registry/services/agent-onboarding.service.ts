import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { IOnboardingContext, ICapabilityTestResult } from '../interfaces/agent-registry.interfaces';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class AgentOnboardingService {
  private readonly logger = new Logger(AgentOnboardingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Start onboarding process for an agent
   */
  async startOnboarding(registrationId: string): Promise<IOnboardingContext> {
    this.logger.log(`Starting onboarding for registration: ${registrationId}`);

    const registration = await this.prisma.agentRegistration.findUnique({
      where: { id: registrationId },
      include: { agent: true },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    // Update onboarding status
    await this.prisma.agentRegistration.update({
      where: { id: registrationId },
      data: {
        onboardingStatus: 'WELCOME_SENT',
        onboardingStep: 'welcome',
        onboardingProgress: 10,
      },
    });

    // Create welcome event
    await this.createOnboardingEvent(
      registrationId,
      'WELCOME_MESSAGE_SENT',
      'Welcome message sent to agent',
      { step: 'welcome' },
    );

    // Emit event for welcome message
    this.eventEmitter.emit('agent.onboarding.started', {
      registrationId,
      agentId: registration.agentId,
      agentName: registration.agent.name,
    });

    return {
      registrationId,
      agentId: registration.agentId,
      agentName: registration.agent.name,
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

    const capabilities = await this.prisma.agentCapabilityRegistry.findMany({
      where: { registrationId },
    });

    const results: ICapabilityTestResult[] = [];

    for (const capability of capabilities) {
      // Simulate capability testing
      const testResult = await this.runCapabilityTest(capability);
      results.push(testResult);

      // Update capability status
      await this.prisma.agentCapabilityRegistry.update({
        where: { id: capability.id },
        data: {
          verificationStatus: testResult.passed ? 'VERIFIED' : 'FAILED',
          verifiedAt: testResult.passed ? new Date() : null,
          testResults: testResult as any,
        },
      });

      // Create event
      await this.createOnboardingEvent(
        registrationId,
        testResult.passed ? 'CAPABILITY_VERIFIED' : 'CAPABILITY_FAILED',
        `Capability ${capability.capabilityName} ${testResult.passed ? 'verified' : 'failed'}`,
        { capability: capability.capabilityName, result: testResult },
      );
    }

    // Update onboarding progress
    const allPassed = results.every((r) => r.passed);
    await this.prisma.agentRegistration.update({
      where: { id: registrationId },
      data: {
        onboardingStatus: 'CAPABILITIES_TESTED',
        onboardingStep: 'capabilities_verified',
        onboardingProgress: 30,
        verificationStatus: allPassed ? 'VERIFIED' : 'FAILED',
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
    stepData?: Record<string, any>,
  ): Promise<IOnboardingContext> {
    this.logger.log(`Completing step ${stepId} for registration: ${registrationId}`);

    const registration = await this.prisma.agentRegistration.findUnique({
      where: { id: registrationId },
      include: { agent: true },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

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
    const updated = await this.prisma.agentRegistration.update({
      where: { id: registrationId },
      data: {
        onboardingStep: stepId,
        onboardingProgress: progress,
        onboardingStatus,
        orientationCompleted: stepId === 'orientation_completed' || stepId === 'ready',
      },
    });

    // Update agent status if ready
    if (stepId === 'ready') {
      await this.prisma.agent.update({
        where: { id: registration.agentId },
        data: { status: 'READY' },
      });
    }

    // Create event
    await this.createOnboardingEvent(
      registrationId,
      'ORIENTATION_STEP_COMPLETED',
      `Completed step: ${stepId}`,
      { step: stepId, data: stepData },
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
      agentName: registration.agent.name,
      currentStep: stepId,
      progress,
      data: stepData || {},
    };
  }

  /**
   * Get onboarding progress
   */
  async getOnboardingProgress(registrationId: string) {
    const registration = await this.prisma.agentRegistration.findUnique({
      where: { id: registrationId },
      include: {
        agent: true,
        capabilities: true,
        onboardingEvents: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    return {
      registrationId: registration.id,
      agentId: registration.agentId,
      agentName: registration.agent.name,
      currentStep: registration.onboardingStep,
      progress: registration.onboardingProgress,
      status: registration.onboardingStatus,
      verificationStatus: registration.verificationStatus,
      orientationCompleted: registration.orientationCompleted,
      capabilities: registration.capabilities.map((cap) => ({
        name: cap.capabilityName,
        type: cap.capabilityType,
        verified: cap.verificationStatus === 'VERIFIED',
      })),
      events: registration.onboardingEvents,
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
    eventData?: any,
  ) {
    return this.prisma.agentOnboardingEvent.create({
      data: {
        registrationId,
        eventType: eventType as any,
        message,
        eventData: eventData || {},
      },
    });
  }
}
