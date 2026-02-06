import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from '../../../db/db.service';
import { RegisterAgentDto } from '../dto';
import { AgentRegistrationService } from '../services/agent-registration.service';
import { AgentInvitationService } from '../services/agent-invitation.service';
import { ConfigService } from '@nestjs/config';

describe('AgentRegistrationService', () => {
  let service: AgentRegistrationService;
  let db: DatabaseService;

  const mockDbService = {
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

  const mockInvitationService = {
    validateInvitation: jest.fn().mockResolvedValue({ id: 'invite-123', status: 'ACTIVE', maxUses: 1, usedCount: 0 }),
    redeemInvitation: jest.fn().mockResolvedValue({}),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('true'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentRegistrationService,
        {
          provide: AgentInvitationService,
          useValue: mockInvitationService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: DatabaseService,
          useValue: mockDbService,
        },
      ],
    }).compile();

    service = module.get<AgentRegistrationService>(AgentRegistrationService);
    db = module.get<DatabaseService>(DatabaseService);
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
        invitationCode: 'tnf_invite_test',
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

      mockDbService.$transaction.mockImplementation(async (callback) => {
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
        invitationCode: 'tnf_invite_test',
        capabilities: [],
      };

      const userId = 'user-123';

      mockDbService.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          agent: {
            findFirst: jest.fn().mockResolvedValue({ id: 'existing-123' }),
          },
        };
        return callback(mockTx);
      });

      await expect(service.registerAgent(registerDto, userId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyAuthToken', () => {
    it('should verify a valid token', async () => {
      const token = 'tnf_agent_validtoken';
      mockDbService.agentRegistration.findUnique.mockResolvedValue({
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
      mockDbService.agentRegistration.findUnique.mockResolvedValue(null);

      await expect(service.verifyAuthToken(token)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('updateHeartbeat', () => {
    it('should update agent heartbeat', async () => {
      const registrationId = 'reg-123';
      mockDbService.agentRegistration.update.mockResolvedValue({});

      await service.updateHeartbeat(registrationId);

      expect(mockDbService.agentRegistration.update).toHaveBeenCalledWith({
        where: { id: registrationId },
        data: {
          lastHeartbeat: expect.any(Date),
          isOnline: true,
        },
      });
    });
  });
});
