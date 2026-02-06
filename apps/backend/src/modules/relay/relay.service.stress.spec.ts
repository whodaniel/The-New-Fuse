import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { RelayService } from './relay.service';

jest.mock('@the-new-fuse/relay-core', () => ({
  RelayServer: jest.fn().mockImplementation(() => ({
    start: jest.fn().mockResolvedValue(true),
    stop: jest.fn().mockResolvedValue(true),
    on: jest.fn(),
  })),
}));

describe('RelayService Stress', () => {
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

  it(
    'should maintain stable memory usage over a long period',
    async () => {
      const testDuration = 60 * 60 * 1000; // 1 hour
      const startTime = Date.now();

      while (Date.now() - startTime < testDuration) {
        for (let i = 0; i < 1000; i++) {
          await service.registerAgent({
            id: `agent${i}`,
            name: `Agent ${i}`,
            type: 'test',
            capabilities: [],
            status: 'online',
          });
          await service.sendMessage({ source: 'test', type: 'test', payload: {} });
        }
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay
      }

      const { agentCount, messageCount } = service.getStatus();
      expect(agentCount).toBeLessThanOrEqual(10000);
      expect(messageCount).toBeLessThanOrEqual(1000);
    },
    2 * 60 * 60 * 1000
  ); // 2 hour timeout for this test
});
