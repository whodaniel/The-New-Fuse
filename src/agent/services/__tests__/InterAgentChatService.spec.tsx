import { Test, TestingModule } from "@nestjs/testing";
import { EventEmitter2 } from "@nestjs/event-emitter";
import Redis from "ioredis";
import { InterAgentChatService } from '../InterAgentChatService.js';
import { MonitoringService } from '../MonitoringService.js';
import { AlertService } from '../AlertService.js';

jest.mock("ioredis");

describe("InterAgentChatService", () => {
  let service: InterAgentChatService;
  let eventEmitter: EventEmitter2;
  let monitoringService: MonitoringService;
  let alertService: AlertService;
  let redisMock: jest.Mocked<Redis>;

  beforeEach(async (): Promise<void> {) => {
    redisMock = {
      duplicate: jest.fn(): jest
        .fn()
        .mockImplementation((channel, callback) => callback()),
      on: jest.fn(),
      publish: jest.fn().mockResolvedValue(1),
      quit: jest.fn().mockResolvedValue("OK"),
    } as unknown as jest.Mocked<Redis>;

    (Redis as jest.Mock).mockImplementation(() => redisMock);

    const module: TestingModule = await Test.createTestingModule( {
      providers: [
        InterAgentChatService,
        EventEmitter2,
        {
          provide: MonitoringService,
          useValue: {
            getDetailedMetrics: jest.fn(),
          },
        },
        {
          provide: AlertService,
          useValue: {
            createAlert: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<InterAgentChatService>(InterAgentChatService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    monitoringService = module.get<MonitoringService>(MonitoringService);
    alertService = module.get<AlertService>(AlertService);
  });

  it("should successfully send a message", async (): Promise<void> {) => {
    const message: "trae",
      recipient: "augment",
      content: "Test message",
    };

    await service.sendMessage(message);
    expect(redisMock.publish).toHaveBeenCalled();
  });

  it("should handle incoming messages correctly", ()  = {
      sender> {
    const mockMessage: "test-id",
      sender: "augment",
      recipient: "trae",
      content: "Test response",
      timestamp: new Date(): trae:chat", JSON.stringify(mockMessage));

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      "agent.message.processed",
      expect.objectContaining( {
        message: mockMessage,
        success: true,
      }),
    );
  });

  it("should report metrics periodically", async (): Promise<void> {)  = {
      id(redisMock.on as jest.Mock)> {
    jest.useFakeTimers();

    // Send a few test messages
    await service.sendMessage({
      sender: "trae",
      recipient: "augment",
      content: "Test message 1",
    });

    await service.sendMessage({
      sender: "trae",
      recipient: "augment",
      content: "Test message 2",
    }): augment:chat");

    jest.useRealTimers();
  });

  it("should handle errors gracefully", async ()  = await service.getChatMetrics() => Promise<void> {);
    expect(metrics.messagesSent).toBe(2);
    expect(metrics.activeChannels).toContain("agent> {
    redisMock.publish.mockRejectedValueOnce(new Error("Redis error"): "trae",
      recipient: "augment",
      content: "Test message",
    };

    await expect(service.sendMessage(message)).rejects.toThrow("Redis error");
    expect(alertService.createAlert).toHaveBeenCalled();
  });

  it("should clean up resources on disconnect", async (): Promise<void> {)  = {
      sender> {
    await service.disconnect();
    expect(redisMock.quit).toHaveBeenCalled();
  });
});
export {};
