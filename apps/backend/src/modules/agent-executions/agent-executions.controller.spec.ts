import { Test, TestingModule } from '@nestjs/testing';
import { AgentExecutionsController } from './agent-executions.controller';
import { AgentExecutionsService } from './agent-executions.service';
import { AgentExecutionQueryDto, ExecutionStatus } from './dto/agent-execution.dto';

describe('AgentExecutionsController', () => {
  let controller: AgentExecutionsController;
  let service: AgentExecutionsService;

  const mockAgentExecutionsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgentExecutionsController],
      providers: [
        {
          provide: AgentExecutionsService,
          useValue: mockAgentExecutionsService,
        },
      ],
    }).compile();

    controller = module.get<AgentExecutionsController>(AgentExecutionsController);
    service = module.get<AgentExecutionsService>(AgentExecutionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated execution history', async () => {
      const query: AgentExecutionQueryDto = {
        page: 1,
        limit: 20,
      };

      const mockResponse = {
        executions: [
          {
            id: 'exec_001',
            agentId: 'agent_123',
            agentName: 'Test Agent',
            userId: 'usr_123',
            status: ExecutionStatus.COMPLETED,
            startedAt: new Date(),
            createdAt: new Date(),
          },
        ],
        pagination: {
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      };

      mockAgentExecutionsService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll(query);

      expect(result).toEqual(mockResponse);
      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });

    it('should filter by agent ID', async () => {
      const query: AgentExecutionQueryDto = {
        agentId: 'agent_123',
        page: 1,
        limit: 20,
      };

      const mockResponse = {
        executions: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0,
        },
      };

      mockAgentExecutionsService.findAll.mockResolvedValue(mockResponse);

      await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
    });

    it('should filter by status', async () => {
      const query: AgentExecutionQueryDto = {
        status: ExecutionStatus.FAILED,
        page: 1,
        limit: 20,
      };

      mockAgentExecutionsService.findAll.mockResolvedValue({
        executions: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0,
        },
      });

      await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should return execution details', async () => {
      const executionId = 'exec_001';
      const mockExecution = {
        id: executionId,
        agentId: 'agent_123',
        agentName: 'Test Agent',
        userId: 'usr_123',
        status: ExecutionStatus.COMPLETED,
        input: { query: 'test' },
        output: { result: 'success' },
        startedAt: new Date(),
        completedAt: new Date(),
        duration: 5000,
        createdAt: new Date(),
      };

      mockAgentExecutionsService.findOne.mockResolvedValue(mockExecution);

      const result = await controller.findOne(executionId);

      expect(result).toEqual(mockExecution);
      expect(service.findOne).toHaveBeenCalledWith(executionId);
      expect(service.findOne).toHaveBeenCalledTimes(1);
    });
  });
});
