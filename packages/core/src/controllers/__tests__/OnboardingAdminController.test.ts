import { Test, TestingModule } from '@nestjs/testing';
import { OnboardingAdminController } from '../OnboardingAdminController.js';
import { OnboardingConfigService } from '../../services/onboarding-config.service.js';
import { PrismaService } from '../../services/prisma.service.js';
import { ConfigService } from '@nestjs/config';

// Mock request object
const mockRequest = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'admin'
  }
};

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

const mockValidationResult = {
  valid: true,
  status: 'success',
  message: 'Configuration is valid',
  details: []
};

const mockAnalytics = {
  completionRate: 0.78,
  averageTimeSpent: 240,
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

describe('OnboardingAdminController', () => {
  let controller: OnboardingAdminController;
  let service: OnboardingConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OnboardingAdminController],
      providers: [
        {
          provide: OnboardingConfigService,
          useValue: {
            getGeneralSettings: jest.fn().mockResolvedValue(mockGeneralSettings),
            updateGeneralSettings: jest.fn().mockResolvedValue({ success: true, data: mockGeneralSettings }),
            getUserTypes: jest.fn().mockResolvedValue(mockUserTypes),
            updateUserTypes: jest.fn().mockResolvedValue({ success: true, data: mockUserTypes }),
            getSteps: jest.fn().mockResolvedValue(mockSteps),
            updateSteps: jest.fn().mockResolvedValue({ success: true, data: mockSteps }),
            getAISettings: jest.fn().mockResolvedValue(mockAISettings),
            updateAISettings: jest.fn().mockResolvedValue({ success: true, data: mockAISettings }),
            validateConfiguration: jest.fn().mockResolvedValue(mockValidationResult),
            getAnalytics: jest.fn().mockResolvedValue(mockAnalytics)
          }
        },
        {
          provide: PrismaService,
          useValue: {}
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

    controller = module.get<OnboardingAdminController>(OnboardingAdminController);
    service = module.get<OnboardingConfigService>(OnboardingConfigService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getGeneralSettings', () => {
    it('should return general settings', async () => {
      const result = await controller.getGeneralSettings(mockRequest as any);
      expect(result).toEqual(mockGeneralSettings);
      expect(service.getGeneralSettings).toHaveBeenCalled();
    });
  });

  describe('updateGeneralSettings', () => {
    it('should update general settings', async () => {
      const result = await controller.updateGeneralSettings(mockGeneralSettings, mockRequest as any);
      expect(result).toEqual({ success: true, data: mockGeneralSettings });
      expect(service.updateGeneralSettings).toHaveBeenCalledWith(mockGeneralSettings);
    });
  });

  describe('getUserTypes', () => {
    it('should return user types', async () => {
      const result = await controller.getUserTypes(mockRequest as any);
      expect(result).toEqual(mockUserTypes);
      expect(service.getUserTypes).toHaveBeenCalled();
    });
  });

  describe('updateUserTypes', () => {
    it('should update user types', async () => {
      const result = await controller.updateUserTypes(mockUserTypes, mockRequest as any);
      expect(result).toEqual({ success: true, data: mockUserTypes });
      expect(service.updateUserTypes).toHaveBeenCalledWith(mockUserTypes);
    });
  });

  describe('getSteps', () => {
    it('should return steps', async () => {
      const result = await controller.getSteps(mockRequest as any);
      expect(result).toEqual(mockSteps);
      expect(service.getSteps).toHaveBeenCalled();
    });
  });

  describe('updateSteps', () => {
    it('should update steps', async () => {
      const result = await controller.updateSteps(mockSteps, mockRequest as any);
      expect(result).toEqual({ success: true, data: mockSteps });
      expect(service.updateSteps).toHaveBeenCalledWith(mockSteps);
    });
  });

  describe('getAISettings', () => {
    it('should return AI settings', async () => {
      const result = await controller.getAISettings(mockRequest as any);
      expect(result).toEqual(mockAISettings);
      expect(service.getAISettings).toHaveBeenCalled();
    });
  });

  describe('updateAISettings', () => {
    it('should update AI settings', async () => {
      const result = await controller.updateAISettings(mockAISettings, mockRequest as any);
      expect(result).toEqual({ success: true, data: mockAISettings });
      expect(service.updateAISettings).toHaveBeenCalledWith(mockAISettings);
    });
  });

  describe('validateConfiguration', () => {
    it('should validate configuration', async () => {
      const result = await controller.validateConfiguration(mockRequest as any);
      expect(result).toEqual(mockValidationResult);
      expect(service.validateConfiguration).toHaveBeenCalled();
    });
  });

  describe('getAnalytics', () => {
    it('should return analytics', async () => {
      const result = await controller.getAnalytics(mockRequest as any);
      expect(result).toEqual(mockAnalytics);
      expect(service.getAnalytics).toHaveBeenCalled();
    });
  });
});
