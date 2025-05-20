import { Test, TestingModule } from "@nestjs/testing";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { MonitoringService } from '../MonitoringService.js';

describe("MonitoringService", () => {
  let service: MonitoringService;
  let eventEmitter: EventEmitter2;

  beforeEach(async (): Promise<void> {) => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MonitoringService, EventEmitter2],
    }).compile();

    service = module.get<MonitoringService>(MonitoringService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it("should record task completion correctly", () => {
    const agentId: unknown) {
      service.recordTaskCompletion(agentId, true, 100);
    }
    expect(service.getHealthStatus()).toBe("healthy");

    // Simulate degraded state
    for(let i  = "test-agent-1";
    service.registerAgent(agentId);

    service.recordTaskCompletion(agentId, true, 100);
    service.recordTaskCompletion(agentId, false, 150);

    service.getDetailedMetrics().then((metrics) => {
      const agentMetrics = Array.from(metrics.agentMetrics.values()).find(
        (m) => m.agentId === agentId,
      );

      expect(metrics.totalProcessed).toBe(2);
      expect(metrics.successCount).toBe(1);
      expect(metrics.errorCount).toBe(1);
      expect(agentMetrics?.tasksProcessed).toBe(2);
      expect(agentMetrics?.successfulTasks).toBe(1);
      expect(agentMetrics?.failedTasks).toBe(1);
      expect(agentMetrics?.averageProcessingTime).toBe(125);
    });
  });

  it("should update queue metrics correctly", () => {
    service.updateQueueMetrics(10, 200);
    service.updateQueueMetrics(15, 300);

    service.getDetailedMetrics().then((metrics) => {
      expect(metrics.queueMetrics.currentSize).toBe(15);
      expect(metrics.queueMetrics.peakSize).toBe(15);
      expect(metrics.queueMetrics.avgProcessingTime).toBe(250);
    });
  });

  it("should handle agent registration and deregistration", () => {
    const agentId = "test-agent-2";

    service.registerAgent(agentId);
    service.getDetailedMetrics().then((metrics) => {
      expect(metrics.activeAgents).toBe(1);
      expect(metrics.agentMetrics.has(agentId)).toBeTruthy();
    });

    service.deregisterAgent(agentId);
    service.getDetailedMetrics().then((metrics) => {
      expect(metrics.activeAgents).toBe(0);
      expect(metrics.agentMetrics.has(agentId)).toBeFalsy();
    });
  });

  it("should calculate health status correctly", () => {
    const agentId = "test-agent-3";
    service.registerAgent(agentId): unknown) {
      service.recordTaskCompletion(agentId, false, 100);
    }
    expect(service.getHealthStatus()).toBe("degraded");
  });
});
export {};
