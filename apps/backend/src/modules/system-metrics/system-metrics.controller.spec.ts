import { Test, TestingModule } from '@nestjs/testing';
import { SystemMetricsController } from './system-metrics.controller';
import { SystemMetricsService } from './system-metrics.service';

describe('SystemMetricsController', () => {
  let controller: SystemMetricsController;
  let service: SystemMetricsService;

  const mockSystemMetricsService = {
    getMetrics: jest.fn(),
    getHealthCheck: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SystemMetricsController],
      providers: [
        {
          provide: SystemMetricsService,
          useValue: mockSystemMetricsService,
        },
      ],
    }).compile();

    controller = module.get<SystemMetricsController>(SystemMetricsController);
    service = module.get<SystemMetricsService>(SystemMetricsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMetrics', () => {
    it('should return comprehensive system metrics', async () => {
      const mockMetrics = {
        status: 'healthy' as const,
        uptime: 86400,
        timestamp: new Date(),
        memory: {
          total: 8589934592,
          used: 4294967296,
          free: 4294967296,
          usagePercent: 50.0,
        },
        cpu: {
          cores: 8,
          usagePercent: 45.2,
          loadAverage: 2.5,
        },
        database: {
          status: 'connected',
          activeConnections: 12,
          totalQueries: 15234,
          avgQueryTime: 25.3,
        },
        api: {
          totalRequests: 100000,
          requestsPerMinute: 150,
          avgResponseTime: 125.5,
          errorRate: 0.5,
          statusCodeDistribution: {
            '200': 95000,
            '400': 3000,
            '500': 2000,
          },
        },
        services: [
          {
            name: 'database',
            status: 'healthy' as const,
            responseTime: 5,
            lastCheck: new Date(),
            message: 'Database connection stable',
          },
        ],
        version: '1.0.0',
        environment: 'test',
      };

      mockSystemMetricsService.getMetrics.mockResolvedValue(mockMetrics);

      const result = await controller.getMetrics();

      expect(result).toEqual(mockMetrics);
      expect(service.getMetrics).toHaveBeenCalledTimes(1);
    });

    it('should return degraded status when services are degraded', async () => {
      const mockMetrics = {
        status: 'degraded' as const,
        uptime: 86400,
        timestamp: new Date(),
        memory: {
          total: 8589934592,
          used: 4294967296,
          free: 4294967296,
          usagePercent: 50.0,
        },
        cpu: {
          cores: 8,
          usagePercent: 85.0,
          loadAverage: 7.5,
        },
        database: {
          status: 'connected',
          activeConnections: 50,
          totalQueries: 15234,
          avgQueryTime: 125.3,
        },
        api: {
          totalRequests: 100000,
          requestsPerMinute: 150,
          avgResponseTime: 525.5,
          errorRate: 2.5,
        },
        services: [
          {
            name: 'database',
            status: 'degraded' as const,
            responseTime: 150,
            lastCheck: new Date(),
            message: 'High latency detected',
          },
        ],
        version: '1.0.0',
        environment: 'test',
      };

      mockSystemMetricsService.getMetrics.mockResolvedValue(mockMetrics);

      const result = await controller.getMetrics();

      expect(result.status).toBe('degraded');
      expect(service.getMetrics).toHaveBeenCalledTimes(1);
    });
  });

  describe('getHealth', () => {
    it('should return basic health check', async () => {
      const mockHealth = {
        status: 'healthy',
        timestamp: new Date(),
        uptime: 86400,
      };

      mockSystemMetricsService.getHealthCheck.mockResolvedValue(mockHealth);

      const result = await controller.getHealth();

      expect(result).toEqual(mockHealth);
      expect(service.getHealthCheck).toHaveBeenCalledTimes(1);
    });

    it('should return unhealthy status when system is down', async () => {
      const mockHealth = {
        status: 'unhealthy',
        timestamp: new Date(),
        uptime: 100,
      };

      mockSystemMetricsService.getHealthCheck.mockResolvedValue(mockHealth);

      const result = await controller.getHealth();

      expect(result.status).toBe('unhealthy');
    });
  });
});
