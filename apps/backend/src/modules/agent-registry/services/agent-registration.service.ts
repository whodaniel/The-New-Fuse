import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { drizzleAgentRepository } from '@the-new-fuse/database';
import { randomBytes } from 'crypto';
import { AgentRegistrationResponseDto, RegisterAgentDto } from '../dto/index.js';

@Injectable()
export class AgentRegistrationService {
  private readonly logger = new Logger(AgentRegistrationService.name);

  /**
   * Register a new agent with auto-discovery
   */
  async registerAgent(
    data: RegisterAgentDto,
    userId: string
  ): Promise<AgentRegistrationResponseDto> {
    this.logger.log(`Registering new agent: ${data.name}`);

    try {
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
          ...data.metadata,
        },
      } as any);

      // Generate authentication token
      const authToken = this.generateAuthToken();

      // Create registration record
      const registration = await drizzleAgentRepository.createRegistration({
        agentId: agent.id,
        authToken,
        registrationData: data as any,
        verificationStatus: 'PENDING',
        onboardingStatus: 'INITIALIZED',
        onboardingProgress: 0,
        heartbeatInterval: data.heartbeatInterval || 60000,
        isOnline: true,
        metadata: data.metadata || {},
      } as any);

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
            } as any)
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
        },
      } as any);

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
      } as any);

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
  async getRegistration(registrationId: string) {
    return (drizzleAgentRepository as any).findRegistrationWithDetails(registrationId);
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
