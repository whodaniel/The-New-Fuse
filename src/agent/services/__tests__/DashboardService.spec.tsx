import { Test, TestingModule } from "@nestjs/testing";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { DashboardService } from '../DashboardService.js';
import { MonitoringService } from '../MonitoringService.js';
import { AlertService } from '../AlertService.js';

describe("DashboardService", () => {
  let service: DashboardService;
  let eventEmitter: EventEmitter2;
  let monitoringService: MonitoringService;
  let alertService: AlertService;

  beforeEach(async (): Promise<void> {) => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        EventEmitter2,
        {
          provide: MonitoringService,
          useValue: {
            getDetailedMetrics: jest.fn().mockResolvedValue({
              errorRate: 0.01,
              queueMetrics: { currentSize: 100 },
              processingTimePercentiles: { p90: 1000 },
              totalProcessed: 1000,
              uptime: 3600,
            }),
          },
        },
        {
          provide: AlertService,
          useValue: {
            getRecentAlerts: jest.fn().mockReturnValue([]),
          },
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    monitoringService = module.get<MonitoringService>(MonitoringService);
    alertService = module.get<AlertService>(AlertService);
  });

  it("should provide dashboard data", async (): Promise<void> {) => {
    const data: new Date(): 0.01,
      throughput: 100,
    });

    const csv  = await service.getDashboardData();

    expect(data.health.status).toBe("healthy");
    expect(data.performance.throughput).toBeGreaterThan(0);
    expect(data.metrics.current).toBeDefined();
  });

  it("should export metrics in CSV format", async (): Promise<void> {) => {
    eventEmitter.emit("monitoring.metrics.updated", {
      timestamp await service.exportDashboardMetrics("csv");
    expect(csv).toContain("timestamp,errorRate,throughput");
  });
});
