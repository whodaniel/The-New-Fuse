import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';
import { ConfigService } from '@nestjs/config';

/**
 * Service for managing onboarding configuration settings
 */
@Injectable()
export class OnboardingConfigService {
  private readonly logger = new Logger(OnboardingConfigService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Get general onboarding settings
   */
  async getGeneralSettings() {
    try {
      const settings = await this.prisma.onboardingConfig.findFirst({
        where: { type: 'general' }
      });

      return settings?.data || this.getDefaultGeneralSettings();
    } catch (error) {
      this.logger.error('Error getting general onboarding settings', error);
      return this.getDefaultGeneralSettings();
    }
  }

  /**
   * Update general onboarding settings
   */
  async updateGeneralSettings(data: any) {
    try {
      const settings = await this.prisma.onboardingConfig.upsert({
        where: { type: 'general' },
        update: { data },
        create: {
          type: 'general',
          data
        }
      });

      return { success: true, data: settings.data };
    } catch (error) {
      this.logger.error('Error updating general onboarding settings', error);
      throw error;
    }
  }

  /**
   * Get user types configuration
   */
  async getUserTypes() {
    try {
      const settings = await this.prisma.onboardingConfig.findFirst({
        where: { type: 'user-types' }
      });

      return settings?.data || this.getDefaultUserTypes();
    } catch (error) {
      this.logger.error('Error getting user types configuration', error);
      return this.getDefaultUserTypes();
    }
  }

  /**
   * Update user types configuration
   */
  async updateUserTypes(data: any) {
    try {
      const settings = await this.prisma.onboardingConfig.upsert({
        where: { type: 'user-types' },
        update: { data },
        create: {
          type: 'user-types',
          data
        }
      });

      return { success: true, data: settings.data };
    } catch (error) {
      this.logger.error('Error updating user types configuration', error);
      throw error;
    }
  }

  /**
   * Get onboarding steps configuration
   */
  async getSteps() {
    try {
      const settings = await this.prisma.onboardingConfig.findFirst({
        where: { type: 'steps' }
      });

      return settings?.data || this.getDefaultSteps();
    } catch (error) {
      this.logger.error('Error getting onboarding steps configuration', error);
      return this.getDefaultSteps();
    }
  }

  /**
   * Update onboarding steps configuration
   */
  async updateSteps(data: any) {
    try {
      const settings = await this.prisma.onboardingConfig.upsert({
        where: { type: 'steps' },
        update: { data },
        create: {
          type: 'steps',
          data
        }
      });

      return { success: true, data: settings.data };
    } catch (error) {
      this.logger.error('Error updating onboarding steps configuration', error);
      throw error;
    }
  }

  /**
   * Get AI settings for onboarding
   */
  async getAISettings() {
    try {
      const settings = await this.prisma.onboardingConfig.findFirst({
        where: { type: 'ai-settings' }
      });

      return settings?.data || this.getDefaultAISettings();
    } catch (error) {
      this.logger.error('Error getting AI settings for onboarding', error);
      return this.getDefaultAISettings();
    }
  }

  /**
   * Update AI settings for onboarding
   */
  async updateAISettings(data: any) {
    try {
      const settings = await this.prisma.onboardingConfig.upsert({
        where: { type: 'ai-settings' },
        update: { data },
        create: {
          type: 'ai-settings',
          data
        }
      });

      return { success: true, data: settings.data };
    } catch (error) {
      this.logger.error('Error updating AI settings for onboarding', error);
      throw error;
    }
  }

  /**
   * Validate onboarding configuration
   */
  async validateConfiguration() {
    try {
      // Get all configuration
      const general = await this.getGeneralSettings();
      const userTypes = await this.getUserTypes();
      const steps = await this.getSteps();
      const aiSettings = await this.getAISettings();

      // Perform validation
      const issues = [];
      const warnings = [];

      // Check for required fields in general settings
      if (!general.welcomeTitle) {
        issues.push('Welcome title is required in general settings');
      }

      if (!general.welcomeMessage) {
        issues.push('Welcome message is required in general settings');
      }

      // Check for user types
      if (!userTypes.length) {
        issues.push('At least one user type must be defined');
      }

      // Check for steps
      if (!steps.length) {
        issues.push('At least one onboarding step must be defined');
      }

      // Check for required steps
      const hasWelcomeStep = steps.some(step => step.type === 'welcome' && step.enabled);
      if (!hasWelcomeStep) {
        issues.push('A welcome step is required');
      }

      const hasCompletionStep = steps.some(step => step.type === 'completion' && step.enabled);
      if (!hasCompletionStep) {
        issues.push('A completion step is required');
      }

      // Check for AI settings if RAG is enabled
      if (aiSettings.ragEnabled) {
        if (!aiSettings.defaultEmbeddingModel) {
          issues.push('Default embedding model is required when RAG is enabled');
        }

        if (!aiSettings.vectorDatabaseType) {
          issues.push('Vector database type is required when RAG is enabled');
        }
      }

      // Check for greeter agent settings if enabled
      if (aiSettings.greeterAgentEnabled) {
        if (!aiSettings.greeterAgentName) {
          issues.push('Greeter agent name is required when greeter agent is enabled');
        }

        if (!aiSettings.greeterAgentPrompt) {
          issues.push('Greeter agent prompt is required when greeter agent is enabled');
        }
      }

      // Add warnings for best practices
      if (steps.filter(step => step.enabled).length > 7) {
        warnings.push('Having more than 7 steps may lead to user fatigue');
      }

      if (steps.filter(step => step.userTypes.includes('ai_agent') && step.enabled).length > 4) {
        warnings.push('Having more than 4 steps for AI agents may be excessive');
      }

      // Return validation results
      return {
        valid: issues.length === 0,
        status: issues.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'success',
        message: issues.length > 0 
          ? 'Configuration has errors' 
          : warnings.length > 0 
            ? 'Configuration has warnings' 
            : 'Configuration is valid',
        details: [...issues, ...warnings]
      };
    } catch (error) {
      this.logger.error('Error validating onboarding configuration', error);
      throw error;
    }
  }

  /**
   * Get onboarding analytics
   */
  async getAnalytics() {
    try {
      // In a real implementation, this would query analytics data
      // For now, return placeholder data
      return {
        completionRate: 0.78,
        averageTimeSpent: 240, // seconds
        dropOffPoints: [
          { step: 'profile', rate: 0.12 },
          { step: 'ai_preferences', rate: 0.08 },
          { step: 'workspace', rate: 0.02 }
        ],
        userTypeDistribution: [
          { type: 'human', count: 156 },
          { type: 'ai_agent', count: 42 }
        ],
        totalOnboardings: 198,
        completedOnboardings: 154
      };
    } catch (error) {
      this.logger.error('Error getting onboarding analytics', error);
      throw error;
    }
  }

  /**
   * Get default general settings
   */
  private getDefaultGeneralSettings() {
    return {
      onboardingEnabled: true,
      skipForReturningUsers: true,
      allowSkipping: false,
      requireEmailVerification: true,
      logoUrl: '/assets/images/logo.png',
      primaryColor: '#3182CE',
      secondaryColor: '#4FD1C5',
      backgroundImage: '',
      welcomeTitle: 'Welcome to The New Fuse',
      welcomeMessage: 'The New Fuse is an AI agent coordination platform that enables intelligent interaction between different AI systems.',
      timeoutMinutes: 30,
      saveProgressAutomatically: true,
      redirectAfterCompletion: '/dashboard',
      analyticsEnabled: true
    };
  }

  /**
   * Get default user types
   */
  private getDefaultUserTypes() {
    return [
      {
        id: 'human',
        name: 'Human User',
        description: 'Regular human users of the platform',
        enabled: true,
        detectionMethod: 'behavior',
        detectionConfig: {
          behaviorPattern: 'human-like interaction patterns'
        },
        onboardingFlow: 'human',
        priority: 1
      },
      {
        id: 'ai_agent',
        name: 'AI Agent',
        description: 'AI agents that integrate with the platform',
        enabled: true,
        detectionMethod: 'header',
        detectionConfig: {
          headerName: 'X-Agent-Type',
          headerValue: 'ai-agent'
        },
        onboardingFlow: 'ai_agent',
        priority: 2
      }
    ];
  }

  /**
   * Get default steps
   */
  private getDefaultSteps() {
    return [
      {
        id: '1',
        type: 'welcome',
        title: 'Welcome',
        description: 'Introduction to The New Fuse platform',
        enabled: true,
        required: true,
        userTypes: ['human', 'ai_agent'],
        content: {
          heading: 'Welcome to The New Fuse',
          subheading: 'The AI agent coordination platform that enables intelligent interaction between different AI systems.',
          imageUrl: '/assets/images/welcome.png',
          buttonText: 'Get Started'
        }
      },
      {
        id: '2',
        type: 'profile',
        title: 'User Profile',
        description: 'Collect user information',
        enabled: true,
        required: true,
        userTypes: ['human'],
        content: {
          heading: 'Tell us about yourself',
          subheading: 'This information helps us personalize your experience.'
        }
      },
      {
        id: '3',
        type: 'ai_preferences',
        title: 'AI Preferences',
        description: 'Configure AI settings',
        enabled: true,
        required: false,
        userTypes: ['human'],
        content: {
          heading: 'AI Preferences',
          subheading: 'Configure how AI agents work for you.'
        }
      },
      {
        id: '4',
        type: 'workspace',
        title: 'Workspace Setup',
        description: 'Set up workspace preferences',
        enabled: true,
        required: true,
        userTypes: ['human', 'ai_agent'],
        content: {
          heading: 'Set Up Your Workspace',
          subheading: 'Configure your workspace to suit your needs.'
        }
      },
      {
        id: '5',
        type: 'tools',
        title: 'Tools & Integrations',
        description: 'Select tools and integrations',
        enabled: true,
        required: false,
        userTypes: ['human'],
        content: {
          heading: 'Tools & Integrations',
          subheading: 'Select the tools you want to use with The New Fuse.'
        }
      },
      {
        id: '6',
        type: 'greeter',
        title: 'Meet Your Assistant',
        description: 'Introduction to the Greeter Agent',
        enabled: true,
        required: false,
        userTypes: ['human'],
        content: {
          heading: 'Meet Your Assistant',
          subheading: 'Your AI assistant will help you navigate The New Fuse.'
        }
      },
      {
        id: '7',
        type: 'completion',
        title: 'Complete',
        description: 'Onboarding completion',
        enabled: true,
        required: true,
        userTypes: ['human', 'ai_agent'],
        content: {
          heading: 'All Set!',
          subheading: 'You\'re ready to start using The New Fuse.',
          buttonText: 'Get Started'
        }
      }
    ];
  }

  /**
   * Get default AI settings
   */
  private getDefaultAISettings() {
    return {
      ragEnabled: true,
      defaultEmbeddingModel: 'text-embedding-3-large',
      vectorDatabaseType: 'pinecone',
      vectorDatabaseConfig: {
        pineconeApiKey: '',
        pineconeEnvironment: '',
        pineconeIndex: 'onboarding-knowledge'
      },
      defaultLLMProvider: 'openai',
      defaultLLMModel: 'gpt-4',
      defaultTemperature: 0.7,
      defaultMaxTokens: 1000,
      greeterAgentEnabled: true,
      greeterAgentName: 'Fuse Assistant',
      greeterAgentAvatar: '/assets/images/greeter-avatar.png',
      greeterAgentPrompt: 'You are Fuse Assistant, a helpful AI assistant designed to help users get started with The New Fuse platform. Your goal is to be friendly, informative, and guide users through the onboarding process.',
      greeterAgentKnowledgeBase: [
        {
          id: 'kb-1',
          name: 'Platform Overview',
          description: 'General information about The New Fuse platform',
          enabled: true
        },
        {
          id: 'kb-2',
          name: 'Getting Started Guide',
          description: 'Step-by-step guide for new users',
          enabled: true
        },
        {
          id: 'kb-3',
          name: 'FAQ',
          description: 'Frequently asked questions',
          enabled: true
        }
      ],
      multimodalEnabled: true,
      supportedModalities: ['text', 'image', 'audio'],
      imageAnalysisModel: 'gpt-4-vision',
      audioTranscriptionModel: 'whisper-large-v3',
      enableDebugMode: false,
      logUserInteractions: true,
      maxConcurrentRequests: 5,
      requestTimeout: 30,
      fallbackBehavior: 'graceful-degradation'
    };
  }
}
