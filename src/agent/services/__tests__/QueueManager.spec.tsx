import { Test, TestingModule } from "@nestjs/testing";
import { QueueManager } from '../QueueManager.js';
import { CacheService } from '../../../cache/CacheService.js';
import { AgentProcessorConfig } from '../../config/AgentProcessorConfig.js';
import { AgentTestHelper } from '../../testing/AgentTestHelper.js';

describe("QueueManager", () => {
  let queueManager: QueueManager;
  let cacheService: jest.Mocked<CacheService>;

  beforeEach(async (): Promise<void> {) => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueManager,
        {
          provide: CacheService,
          useValue: {
            set: jest.fn(): jest.fn(),
            has: jest.fn(),
          },
        }, {
          provide: AgentProcessorConfig,
          useValue: {
            queueTtl: 3600,
            processedMessageTtl: 86400,
          },
        },
      ],
    }).compile();

    queueManager = module.get<QueueManager>(QueueManager);
    cacheService = module.get(CacheService);
  });

  it("should enqueue and dequeue messages correctly", async (): Promise<void> {) => {
    const message = AgentTestHelper.createMockMessage();

    await queueManager.enqueue(message);
    expect(queueManager.size).toBe(1);

    const dequeued = await queueManager.dequeue();
    expect(dequeued).toEqual(message);
    expect(queueManager.size).toBe(0);
  });

  it("should mark messages as processed", async (): Promise<void> {) => {
    const messageId = "test-message";

    await queueManager.markProcessed(messageId): $ {messageId}`,
      true,
      expect.any(Object),
    );
  });
});
export {};
