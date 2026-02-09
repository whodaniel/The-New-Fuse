import { BusinessMetricsService } from '../../src/monitoring/business-metrics.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { mockDeep } from 'jest-mock-extended';

describe('BusinessMetricsService', () => {
  let businessMetricsService: BusinessMetricsService;
  let prismaService: PrismaService;

  beforeEach(() => {
    prismaService = mockDeep<PrismaService>();
    businessMetricsService = new BusinessMetricsService(prismaService);
  });

  it('should be defined', () => {
    expect(businessMetricsService).toBeDefined();
  });

  it('should call prisma.businessMetric.create with the correct parameters', async () => {
    const metricName = 'test-metric';
    const metricValue = 123;
    const metricTags = {
      tag1: 'value1',
      tag2: 'value2',
    };

    // Explicitly type the mock function
    const createMock = prismaService.businessMetric.create as jest.Mock;
    createMock.mockResolvedValueOnce({ id: '1', name: metricName, value: metricValue, tags: metricTags, createdAt: new Date() });

    await businessMetricsService.recordMetric(metricName, metricValue, metricTags);

    expect(createMock).toHaveBeenCalledWith({
      data: {
        name: metricName,
        value: metricValue,
        tags: metricTags,
      },
    });
  });
});
