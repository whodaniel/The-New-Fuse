import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { UnifiedLedgerService } from '../unified-ledger/unified-ledger.service.js';
import { CreateTaskExecutionLogDto } from './dto/task.dto.js';
import { TaskController } from './task.controller.js';
import { TaskService } from './task.service.js';

describe('TaskController', () => {
  let controller: TaskController;
  let taskService: TaskService;
  let unifiedLedgerService: UnifiedLedgerService;

  const mockUser = { id: 'user-123', sub: 'user-123' };
  const mockTaskId = 'task-456';
  const mockTask = { id: mockTaskId, userId: 'user-123' };
  const mockLogEntry = { id: 'log-789' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskController],
      providers: [
        {
          provide: TaskService,
          useValue: {
            getTaskByIdForUser: jest.fn(),
            appendExecutionLog: jest.fn(),
            getExecutionLogs: jest.fn(),
          },
        },
        {
          provide: UnifiedLedgerService,
          useValue: {
            createTimelineEvent: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<TaskController>(TaskController);
    taskService = module.get<TaskService>(TaskService);
    unifiedLedgerService = module.get<UnifiedLedgerService>(UnifiedLedgerService);
  });

  describe('createExecutionLog', () => {
    it('should create an execution log and a timeline event with userId', async () => {
      const dto: CreateTaskExecutionLogDto = {
        level: 'info',
        message: 'test log',
        actor: 'test-actor',
        source: 'test-source',
        stage: 'test-stage',
      };

      (taskService.getTaskByIdForUser as jest.Mock).mockResolvedValue(mockTask);
      (taskService.appendExecutionLog as jest.Mock).mockResolvedValue(mockLogEntry);
      (taskService.getExecutionLogs as jest.Mock).mockResolvedValue([]);

      await controller.createExecutionLog(mockUser, mockTaskId, dto);

      expect(taskService.getTaskByIdForUser).toHaveBeenCalledWith(mockTaskId, mockUser.id);
      expect(taskService.appendExecutionLog).toHaveBeenCalledWith(mockTaskId, dto);

      // THIS IS THE KEY VERIFICATION FOR THE FIX
      expect(unifiedLedgerService.createTimelineEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          eventType: 'historical_event',
          payload: expect.objectContaining({
            taskId: mockTaskId,
            logId: mockLogEntry.id,
          }),
        })
      );
    });

    it('should throw UnauthorizedException if user is missing', async () => {
      const dto: CreateTaskExecutionLogDto = {
        level: 'info',
        message: 'test log',
        actor: 'test-actor',
        source: 'test-source',
      };

      await expect(
        controller.createExecutionLog(undefined as any, mockTaskId, dto)
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw NotFoundException if task is not found', async () => {
      const dto: CreateTaskExecutionLogDto = {
        level: 'info',
        message: 'test log',
        actor: 'test-actor',
        source: 'test-source',
      };

      (taskService.getTaskByIdForUser as jest.Mock).mockResolvedValue(null);

      await expect(controller.createExecutionLog(mockUser, mockTaskId, dto)).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
