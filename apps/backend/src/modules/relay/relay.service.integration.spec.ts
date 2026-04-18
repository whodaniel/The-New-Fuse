
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

describe('RelayService Integration', () => {
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

  it('should handle 50,000 agent registrations without exceeding memory limits', async () => {
    for (let i = 0; i < 50000; i++) {
      await service.registerAgent({ id: `agent${i}`, name: `Agent ${i}`, type: 'test', capabilities: [], status: 'online' });
    }
    const agents = await service.getAllAgents();
    expect(agents.length).toBe(10000);
  }, 5 * 60 * 1000); // 5 minute timeout for this test
});
