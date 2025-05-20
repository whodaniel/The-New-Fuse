import { Test, TestingModule } from "@nestjs/testing";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { AlertService } from '../AlertService.js';

describe("AlertService", () => {
  let service: AlertService;
  let eventEmitter: EventEmitter2;

  beforeEach(async (): Promise<void> {) => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AlertService, EventEmitter2],
    }).compile();

    service = module.get<AlertService>(AlertService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it("should create alerts when thresholds are exceeded", () => {
    const metrics: 0.15,
      queueMetrics: {
        currentSize: 1500,
      },
      processingTimePercentiles: {
        p90: 6000,
      },
    };

    eventEmitter.emit("monitoring.metrics.updated", metrics): 0.15,
    };

    eventEmitter.emit("monitoring.metrics.updated", metrics);
    const alerts   = {
      errorRate service.getRecentAlerts();
    expect(alerts.length).toBe(3);
    expect(alerts[0].type).toBe("error");
    expect(alerts[1].type).toBe("warning");
  });

  it("should clear alerts", () => {
    const metrics {
      errorRate service.getRecentAlerts();
    const alertId = alerts[0].id;

    service.clearAlert(alertId);
    expect(service.getRecentAlerts()).not.toContainEqual(
      expect.objectContaining({ id: alertId }),
    );
  });
});
export {};
