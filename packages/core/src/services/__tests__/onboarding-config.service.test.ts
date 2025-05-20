import { Test, TestingModule } from '@nestjs/testing';
import { OnboardingConfigService } from '../onboarding-config.service.js';
import { PrismaService } from '../prisma.service.js';
import { ConfigService } from '@nestjs/config';

// Mock data
const mockGeneralSettings = {
  onboardingEnabled: true,
  skipForReturningUsers: true,
  allowSkipping: false,
  requireEmailVerification: true,
  logoUrl: '/assets/images/logo.png',
  primaryColor: '#3182CE',
  secondaryColor: '#4FD1C5',
  backgroundImage: '',
  welcomeTitle: 'Welcome to The New Fuse',
  welcomeMessage: 'The New Fuse is an AI agent coordination platform.',
  timeoutMinutes: 30,
  saveProgressAutomatically: true,
  redirectAfterCompletion: '/dashboard',
  analyticsEnabled: true
};

const mockUserTypes = [
  {
    id: 'human',
    name: 'Human User',
    description: 'Regular human users of the platform',
    enabled: true,
    detectionMethod: 'behavior',
    detectionConfig: {
      behaviorPattern: 'human-like interaction patterns'
    },
    onboardingFlow: 'human-onboarding',
    priority: 10
  },
  {
    id: 'ai_agent',
    name: 'AI Agent',
    description: 'AI agents that integrate with the platform',
    enabled: true,
    detectionMethod: 'header',
    detectionConfig: {
      headerName: 'X-Agent-Type',
      headerValue: 'ai_agent'
    },
    onboardingFlow: 'ai-agent-onboarding',
    priority: 20
  }
];

const mockSteps = [
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
      subheading: 'The AI agent coordination platform.',
      imageUrl: '/assets/images/welcome.png',
      buttonText: 'Get Started'
    }
  },
  {
    id: '2',
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

const mockAISettings = {
  ragEnabled: true,
  defaultEmbeddingModel: 'text-embedding-3-large',
  vectorDatabaseType: 'pinecone',
  vectorDatabaseConfig: {
    pineconeApiKey: 'test-api-key',
    pineconeEnvironment: 'test-env',
    pineconeIndex: 'onboarding-knowledge'
  },
  defaultLLMProvider: 'openai',
  defaultLLMModel: 'gpt-4',
  defaultTemperature: 0.7,
  defaultMaxTokens: 1000,
  greeterAgentEnabled: true,
  greeterAgentName: 'Fuse Assistant',
  greeterAgentAvatar: '/assets/images/greeter-avatar.png',
  greeterAgentPrompt: 'You are Fuse Assistant, a helpful AI assistant.',
  greeterAgentKnowledgeBase: [
    {
      id: 'kb-1',
      name: 'Platform Overview',
      description: 'General information about The New Fuse platform',
      enabled: true
    }
  ],
  multimodalEnabled: true,
  supportedModalities: ['text', 'image'],
  imageAnalysisModel: 'gpt-4-vision',
  audioTranscriptionModel: 'whisper-large-v3',
  enableDebugMode: false,
  logUserInteractions: true,
  maxConcurrentRequests: 5,
  requestTimeout: 30,
  fallbackBehavior: 'graceful-degradation'
};

describe('OnboardingConfigService', () => {
  let service: OnboardingConfigService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnboardingConfigService,
        {
          provide: PrismaService,
          useValue: {
            onboardingConfig: {
              findFirst: jest.fn(),
              upsert: jest.fn()
            }
          }
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key) => {
              if (key === 'DATABASE_URL') return 'test-db-url';
              return null;
            })
          }
        }
      ]
    }).compile();

    service = module.get<OnboardingConfigService>(OnboardingConfigService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getGeneralSettings', () => {
    it('should return general settings from database if they exist', async () => {
      (prismaService.onboardingConfig.findFirst as jest.Mock).mockResolvedValue({
        data: mockGeneralSettings
      });

      const result = await service.getGeneralSettings();
      expect(result).toEqual(mockGeneralSettings);
      expect(prismaService.onboardingConfig.findFirst).toHaveBeenCalledWith({
        where: { type: 'general' }
      });
    });

    it('should return default general settings if they do not exist in database', async () => {
      (prismaService.onboardingConfig.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await service.getGeneralSettings();
      expect(result).toBeDefined();
      expect(prismaService.onboardingConfig.findFirst).toHaveBeenCalledWith({
        where: { type: 'general' }
      });
    });

    it('should handle errors gracefully', async () => {
      (prismaService.onboardingConfig.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await service.getGeneralSettings();
      expect(result).toBeDefined();
    });
  });

  describe('updateGeneralSettings', () => {
    it('should update general settings in database', async () => {
      (prismaService.onboardingConfig.upsert as jest.Mock).mockResolvedValue({
        data: mockGeneralSettings
      });

      const result = await service.updateGeneralSettings(mockGeneralSettings);
      expect(result).toEqual({ success: true, data: mockGeneralSettings });
      expect(prismaService.onboardingConfig.upsert).toHaveBeenCalledWith({
        where: { type: 'general' },
        update: { data: mockGeneralSettings },
        create: {
          type: 'general',
          data: mockGeneralSettings
        }
      });
    });

    it('should throw error if database update fails', async () => {
      (prismaService.onboardingConfig.upsert as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(service.updateGeneralSettings(mockGeneralSettings)).rejects.toThrow();
    });
  });

  describe('getUserTypes', () => {
    it('should return user types from database if they exist', async () => {
      (prismaService.onboardingConfig.findFirst as jest.Mock).mockResolvedValue({
        data: mockUserTypes
      });

      const result = await service.getUserTypes();
      expect(result).toEqual(mockUserTypes);
      expect(prismaService.onboardingConfig.findFirst).toHaveBeenCalledWith({
        where: { type: 'user-types' }
      });
    });

    it('should return default user types if they do not exist in database', async () => {
      (prismaService.onboardingConfig.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await service.getUserTypes();
      expect(result).toBeDefined();
      expect(prismaService.onboardingConfig.findFirst).toHaveBeenCalledWith({
        where: { type: 'user-types' }
      });
    });
  });

  describe('updateUserTypes', () => {
    it('should update user types in database', async () => {
      (prismaService.onboardingConfig.upsert as jest.Mock).mockResolvedValue({
        data: mockUserTypes
      });

      const result = await service.updateUserTypes(mockUserTypes);
      expect(result).toEqual({ success: true, data: mockUserTypes });
      expect(prismaService.onboardingConfig.upsert).toHaveBeenCalledWith({
        where: { type: 'user-types' },
        update: { data: mockUserTypes },
        create: {
          type: 'user-types',
          data: mockUserTypes
        }
      });
    });
  });

  describe('getSteps', () => {
    it('should return steps from database if they exist', async () => {
      (prismaService.onboardingConfig.findFirst as jest.Mock).mockResolvedValue({
        data: mockSteps
      });

      const result = await service.getSteps();
      expect(result).toEqual(mockSteps);
      expect(prismaService.onboardingConfig.findFirst).toHaveBeenCalledWith({
        where: { type: 'steps' }
      });
    });

    it('should return default steps if they do not exist in database', async () => {
      (prismaService.onboardingConfig.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await service.getSteps();
      expect(result).toBeDefined();
      expect(prismaService.onboardingConfig.findFirst).toHaveBeenCalledWith({
        where: { type: 'steps' }
      });
    });
  });

  describe('updateSteps', () => {
    it('should update steps in database', async () => {
      (prismaService.onboardingConfig.upsert as jest.Mock).mockResolvedValue({
        data: mockSteps
      });

      const result = await service.updateSteps(mockSteps);
      expect(result).toEqual({ success: true, data: mockSteps });
      expect(prismaService.onboardingConfig.upsert).toHaveBeenCalledWith({
        where: { type: 'steps' },
        update: { data: mockSteps },
        create: {
          type: 'steps',
          data: mockSteps
        }
      });
    });
  });

  describe('getAISettings', () => {
    it('should return AI settings from database if they exist', async () => {
      (prismaService.onboardingConfig.findFirst as jest.Mock).mockResolvedValue({
        data: mockAISettings
      });

      const result = await service.getAISettings();
      expect(result).toEqual(mockAISettings);
      expect(prismaService.onboardingConfig.findFirst).toHaveBeenCalledWith({
        where: { type: 'ai-settings' }
      });
    });

    it('should return default AI settings if they do not exist in database', async () => {
      (prismaService.onboardingConfig.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await service.getAISettings();
      expect(result).toBeDefined();
      expect(prismaService.onboardingConfig.findFirst).toHaveBeenCalledWith({
        where: { type: 'ai-settings' }
      });
    });
  });

  describe('updateAISettings', () => {
    it('should update AI settings in database', async () => {
      (prismaService.onboardingConfig.upsert as jest.Mock).mockResolvedValue({
        data: mockAISettings
      });

      const result = await service.updateAISettings(mockAISettings);
      expect(result).toEqual({ success: true, data: mockAISettings });
      expect(prismaService.onboardingConfig.upsert).toHaveBeenCalledWith({
        where: { type: 'ai-settings' },
        update: { data: mockAISettings },
        create: {
          type: 'ai-settings',
          data: mockAISettings
        }
      });
    });
  });

  describe('validateConfiguration', () => {
    beforeEach(() => {
      jest.spyOn(service, 'getGeneralSettings').mockResolvedValue(mockGeneralSettings);
      jest.spyOn(service, 'getUserTypes').mockResolvedValue(mockUserTypes);
      jest.spyOn(service, 'getSteps').mockResolvedValue(mockSteps);
      jest.spyOn(service, 'getAISettings').mockResolvedValue(mockAISettings);
    });

    it('should validate configuration and return success if valid', async () => {
      const result = await service.validateConfiguration();
      expect(result.valid).toBe(true);
      expect(result.status).toBe('success');
    });

    it('should validate configuration and return error if invalid', async () => {
      // Mock invalid configuration
      jest.spyOn(service, 'getGeneralSettings').mockResolvedValue({
        ...mockGeneralSettings,
        welcomeTitle: '' // Missing required field
      });

      const result = await service.validateConfiguration();
      expect(result.valid).toBe(false);
      expect(result.status).toBe('error');
    });
  });

  describe('getAnalytics', () => {
    it('should return analytics data', async () => {
      const result = await service.getAnalytics();
      expect(result).toBeDefined();
      expect(result.completionRate).toBeDefined();
      expect(result.userTypeDistribution).toBeDefined();
    });
  });
});
