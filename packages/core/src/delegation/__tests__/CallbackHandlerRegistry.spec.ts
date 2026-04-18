import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { CallbackHandlerRegistry, SubTaskEvent } from '../CallbackHandlerRegistry.js';

// Mock Logger to prevent console output during tests
jest.mock('@nestjs/common', () => {
  const originalModule = jest.requireActual('@nestjs/common');
  return {
    ...originalModule,
    Logger: class {
      constructor(context?: any, options?: any) {}
      log = jest.fn();
      error = jest.fn();
      warn = jest.fn();
      debug = jest.fn();
      verbose = jest.fn();
      static overrideLogger = jest.fn();
    },
  };
});

describe('CallbackHandlerRegistry', () => {
  let registry: CallbackHandlerRegistry;
  let eventEmitter: EventEmitter2;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CallbackHandlerRegistry,
        {
          provide: EventEmitter2,
          useValue: mock<EventEmitter2>(),
        },
      ],
    }).compile();

    registry = module.get<CallbackHandlerRegistry>(CallbackHandlerRegistry);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it('should be defined', () => {
    expect(registry).toBeDefined();
  });

  describe('registerHandler', () => {
    it('should register a handler for a parent task ID', () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      registry.registerHandler('task1', handler);
      // @ts-ignore - access private property for testing
      expect(registry.handlers.get('task1')).toEqual([handler]);
    });

    it('should register multiple handlers for the same parent task ID', () => {
      const handler1 = jest.fn().mockResolvedValue(undefined);
      const handler2 = jest.fn().mockResolvedValue(undefined);
      registry.registerHandler('task1', handler1);
      registry.registerHandler('task1', handler2);
      // @ts-ignore
      expect(registry.handlers.get('task1')).toEqual([handler1, handler2]);
    });
  });

  describe('executeHandlers', () => {
    const event: SubTaskEvent = {
      parentTaskId: 'task1',
      subTask: { id: 'sub1', data: 'test' },
      timestamp: new Date(),
    };

    it('should execute all registered handlers for a given event', async () => {
      const handler1 = jest.fn().mockResolvedValue(undefined);
      const handler2 = jest.fn().mockResolvedValue(undefined);
      registry.registerHandler('task1', handler1);
      registry.registerHandler('task1', handler2);

      await registry.executeHandlers(event);

      expect(handler1).toHaveBeenCalledWith(event);
      expect(handler2).toHaveBeenCalledWith(event);
    });

    it('should not throw an error if a handler fails', async () => {
      const failingHandler = jest.fn().mockRejectedValue(new Error('Handler failed'));
      const successfulHandler = jest.fn().mockResolvedValue(undefined);

      registry.registerHandler('task1', failingHandler);
      registry.registerHandler('task1', successfulHandler);

      await expect(registry.executeHandlers(event)).resolves.not.toThrow();

      expect(failingHandler).toHaveBeenCalledWith(event);
      expect(successfulHandler).toHaveBeenCalledWith(event);
    });

    it('should do nothing if no handlers are registered for the event', async () => {
      const eventWithoutHandlers: SubTaskEvent = { ...event, parentTaskId: 'task2' };
      // We expect no calls and no errors
      await expect(registry.executeHandlers(eventWithoutHandlers)).resolves.toBeUndefined();
    });
  });

  describe('handleSubtaskCompleted', () => {
    it('should call executeHandlers when a "subtask.completed" event is received', () => {
      const event: SubTaskEvent = {
        parentTaskId: 'task1',
        subTask: { id: 'sub1' },
        timestamp: new Date(),
      };

      const executeHandlersSpy = jest.spyOn(registry, 'executeHandlers');
      registry.handleSubtaskCompleted(event);

      expect(executeHandlersSpy).toHaveBeenCalledWith(event);
    });
  });
});
