import { Test, TestingModule } from '@nestjs/testing';
import { AgentRegistryController } from '../agent-registry.controller.js';
import {
  AgentRegistrationService,
  AgentOnboardingService,
  AgentOrientationService,
  AgentDirectoryService,
} from '../services/index.js';

describe('AgentRegistryController', () => {
  let controller: AgentRegistryController;
  let registrationService: AgentRegistrationService;
  let onboardingService: AgentOnboardingService;
  let directoryService: AgentDirectoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgentRegistryController],
      providers: [
        {
          provide: AgentRegistrationService,
          useValue: {
            registerAgent: jest.fn(),
            verifyAuthToken: jest.fn(),
            updateHeartbeat: jest.fn(),
            getRegistration: jest.fn(),
          },
        },
        {
          provide: AgentOnboardingService,
          useValue: {
            startOnboarding: jest.fn(),
            testCapabilities: jest.fn(),
            completeStep: jest.fn(),
            getOnboardingProgress: jest.fn(),
          },
        },
        {
          provide: AgentOrientationService,
          useValue: {
            getOrientationSteps: jest.fn(),
            getOrientationStep: jest.fn(),
            getOrientationSummary: jest.fn(),
          },
        },
        {
          provide: AgentDirectoryService,
          useValue: {
            searchAgents: jest.fn(),
            getFeaturedAgents: jest.fn(),
            getDirectoryStats: jest.fn(),
            getAgentDetails: jest.fn(),
            recordMetric: jest.fn(),
            getAgentMetrics: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AgentRegistryController>(AgentRegistryController);
    registrationService = module.get<AgentRegistrationService>(AgentRegistrationService);
    onboardingService = module.get<AgentOnboardingService>(AgentOnboardingService);
    directoryService = module.get<AgentDirectoryService>(AgentDirectoryService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('registerAgent', () => {
    it('should register a new agent', async () => {
      const registerDto = {
        name: 'TestAgent',
        capabilities: [],
      };

      const user = { id: 'user-123' };
      const expectedResponse = {
        registrationId: 'reg-123',
        agentId: 'agent-123',
        authToken: 'token',
        verificationStatus: 'PENDING',
        onboardingStatus: 'INITIALIZED',
        welcomeMessage: 'Welcome!',
        nextSteps: [],
        createdAt: new Date(),
      };

      jest.spyOn(registrationService, 'registerAgent').mockResolvedValue(expectedResponse);

      const result = await controller.registerAgent(registerDto, user);

      expect(result).toEqual(expectedResponse);
      expect(registrationService.registerAgent).toHaveBeenCalledWith(registerDto, user.id);
    });
  });

  describe('sendHeartbeat', () => {
    it('should send heartbeat and return status', async () => {
      const token = 'valid-token';
      jest.spyOn(registrationService, 'verifyAuthToken').mockResolvedValue({
        agentId: 'agent-123',
        registrationId: 'reg-123',
      });
      jest.spyOn(registrationService, 'updateHeartbeat').mockResolvedValue();

      const result = await controller.sendHeartbeat(token);

      expect(result.status).toBe('ok');
      expect(result).toHaveProperty('timestamp');
    });
  });

  describe('searchAgents', () => {
    it('should search agents in directory', async () => {
      const query = { page: 1, limit: 20 };
      const expectedResponse = {
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      };

      jest.spyOn(directoryService, 'searchAgents').mockResolvedValue(expectedResponse);

      const result = await controller.searchAgents(query);

      expect(result).toEqual(expectedResponse);
    });
  });
});
