import { Test, TestingModule } from '@nestjs/testing';
import { AgentRegistrationService } from '../services/agent-registration.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { RegisterAgentDto } from '../dto';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

describe('AgentRegistrationService', () => {
  let service: AgentRegistrationService;
  let prisma: PrismaService;

  const mockPrismaService = {
    $transaction: jest.fn(),
    agent: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    agentRegistration: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    agentCapabilityRegistry: {
      create: jest.fn(),
    },
    agentOnboardingEvent: {
      create: jest.fn(),
    },
    agentDirectoryEntry: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentRegistrationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AgentRegistrationService>(AgentRegistrationService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerAgent', () => {
    it('should successfully register a new agent', async () => {
      const registerDto: RegisterAgentDto = {
        name: 'TestAgent',
        version: '1.0.0',
        author: 'Test Author',
        description: 'A test agent',
        capabilities: [
          {
            name: 'code_generation',
            type: 'core',
            version: '1.0.0',
            description: 'Generate code',
          },
        ],
        metadata: { key: 'value' },
      };

      const userId = 'user-123';

      const mockAgent = {
        id: 'agent-123',
        name: 'TestAgent',
        type: 'API',
        status: 'INITIALIZING',
        description: 'A test agent',
        capabilities: [],
        provider: 'self-registered',
        userId,
        config: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockRegistration = {
        id: 'reg-123',
        agentId: 'agent-123',
        authToken: 'tnf_agent_abc123',
        registrationData: registerDto,
        verificationStatus: 'PENDING',
        onboardingStatus: 'INITIALIZED',
        onboardingProgress: 0,
        isOnline: true,
        createdAt: new Date(),
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          agent: {
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue(mockAgent),
          },
          agentRegistration: {
            create: jest.fn().mockResolvedValue(mockRegistration),
          },
          agentCapabilityRegistry: {
            create: jest.fn().mockResolvedValue({}),
          },
          agentOnboardingEvent: {
            create: jest.fn().mockResolvedValue({}),
          },
          agentDirectoryEntry: {
            create: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(mockTx);
      });

      const result = await service.registerAgent(registerDto, userId);

      expect(result).toHaveProperty('registrationId');
      expect(result).toHaveProperty('agentId');
      expect(result).toHaveProperty('authToken');
      expect(result).toHaveProperty('welcomeMessage');
      expect(result).toHaveProperty('nextSteps');
      expect(result.verificationStatus).toBe('PENDING');
      expect(result.onboardingStatus).toBe('INITIALIZED');
    });

    it('should throw BadRequestException if agent name already exists', async () => {
      const registerDto: RegisterAgentDto = {
        name: 'ExistingAgent',
        capabilities: [],
      };

      const userId = 'user-123';

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          agent: {
            findFirst: jest.fn().mockResolvedValue({ id: 'existing-123' }),
          },
        };
        return callback(mockTx);
      });

      await expect(service.registerAgent(registerDto, userId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('verifyAuthToken', () => {
    it('should verify a valid token', async () => {
      const token = 'tnf_agent_validtoken';
      mockPrismaService.agentRegistration.findUnique.mockResolvedValue({
        id: 'reg-123',
        agentId: 'agent-123',
      });

      const result = await service.verifyAuthToken(token);

      expect(result).toEqual({
        agentId: 'agent-123',
        registrationId: 'reg-123',
      });
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      const token = 'invalid_token';
      mockPrismaService.agentRegistration.findUnique.mockResolvedValue(null);

      await expect(service.verifyAuthToken(token)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('updateHeartbeat', () => {
    it('should update agent heartbeat', async () => {
      const registrationId = 'reg-123';
      mockPrismaService.agentRegistration.update.mockResolvedValue({});

      await service.updateHeartbeat(registrationId);

      expect(mockPrismaService.agentRegistration.update).toHaveBeenCalledWith({
        where: { id: registrationId },
        data: {
          lastHeartbeat: expect.any(Date),
          isOnline: true,
        },
      });
    });
  });
});
