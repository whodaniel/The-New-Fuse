
import { Test, TestingModule } from '@nestjs/testing';
import { RelayService } from './relay.service.js';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

jest.mock('@the-new-fuse/relay-core', () => ({
  RelayServer: jest.fn().mockImplementation(() => ({
    start: jest.fn().mockResolvedValue(true),
    stop: jest.fn().mockResolvedValue(true),
    on: jest.fn(),
  })),
}));

describe('RelayService', () => {
  let service: RelayService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RelayService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue: any) => {
              if (key === 'RELAY_ID') return 'test-relay';
              return defaultValue;
            }),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RelayService>(RelayService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Agent Management', () => {
    it('should not allow more than 10,000 agents', () => {
      for (let i = 0; i < 10001; i++) {
        service.registerAgent({ id: `agent${i}`, name: `Agent ${i}`, type: 'test', capabilities: [], status: 'online' });
      }
      expect(service.getAllAgents()).resolves.toHaveLength(10000);
    });

    it('should evict least recently used agent', async () => {
      for (let i = 0; i < 10000; i++) {
        await service.registerAgent({ id: `agent${i}`, name: `Agent ${i}`, type: 'test', capabilities: [], status: 'online' });
      }
      await service.registerAgent({ id: 'new-agent', name: 'New Agent', type: 'test', capabilities: [], status: 'online' });

      expect(service.getAgent('agent0')).resolves.toBeUndefined();
      expect(service.getAgent('new-agent')).resolves.toBeDefined();
    });
  });

  describe('Message Queue Management', () => {
    it('should not allow more than 1,000 messages in the queue', async () => {
      for (let i = 0; i < 1001; i++) {
        await service.sendMessage({ source: 'test', type: 'test', payload: {} });
      }
      const status = service.getStatus();
      expect(status.messageCount).toBe(1000);
    });

    it('should evict oldest message when queue is full', async () => {
      for (let i = 0; i < 1000; i++) {
        await service.sendMessage({ source: `test${i}`, type: 'test', payload: {} });
      }
      await service.sendMessage({ source: 'new-message', type: 'test', payload: {} });

      const messageQueue = (service as any).messageQueue;
      expect(messageQueue[0].source).toBe('test1');
      expect(messageQueue[messageQueue.length - 1].source).toBe('new-message');
    });
  });

  describe('Cleanup Jobs', () => {
    it('should remove old messages from the queue', () => {
      const fiveMinutesAgo = new Date(Date.now() - 6 * 60 * 1000);
      (service as any).messageQueue = [
        { id: '1', timestamp: fiveMinutesAgo, source: 'test', type: 'test', payload: {} },
        { id: '2', timestamp: new Date(), source: 'test', type: 'test', payload: {} },
      ];
      service.handleMessageQueueCleanup();
      expect((service as any).messageQueue).toHaveLength(1);
    });
  });
});
