import { BusinessMetricsService } from '../../src/monitoring/business-metrics.service';
import { DrizzleService } from '../../src/drizzle/drizzle.service';
import { mockDeep } from 'jest-mock-extended';

describe('BusinessMetricsService', () => {
  let businessMetricsService: BusinessMetricsService;
  let drizzleService: DrizzleService;

  beforeEach(() => {
    drizzleService = mockDeep<DrizzleService>();
    businessMetricsService = new BusinessMetricsService(drizzleService);
  });

  it('should be defined', () => {
    expect(businessMetricsService).toBeDefined();
  });

  it('should call drizzle.businessMetric.create with the correct parameters', async () => {
    const metricName = 'test-metric';
    const metricValue = 123;
    const metricTags = {
      tag1: 'value1',
      tag2: 'value2',
    };

    // Explicitly type the mock function
    const createMock = drizzleService.businessMetric.create as jest.Mock;
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
