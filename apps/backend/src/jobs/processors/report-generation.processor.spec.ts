import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bull';
import { SystemMetricsService } from '../../modules/system-metrics/system-metrics.service';
import { EmailService } from '../../services/email.service';
import { ReportGenerationProcessor } from './report-generation.processor';

// Mock dependencies
const mockEmailService = {
  sendEmail: jest.fn(),
};

const mockSystemMetricsService = {
  getMetrics: jest.fn().mockResolvedValue({
    cpu: { usagePercent: 50 },
    memory: { usagePercent: 60 },
    uptime: 1000,
    status: 'healthy',
  }),
};

// Mock Job
const mockJob = {
  id: 'job-1',
  data: {
    reportType: 'system-metrics',
    userId: 'user-1',
    parameters: {},
    format: 'json',
  },
  progress: jest.fn(),
} as unknown as Job;

describe('ReportGenerationProcessor', () => {
  let processor: ReportGenerationProcessor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportGenerationProcessor,
        { provide: EmailService, useValue: mockEmailService },
        { provide: SystemMetricsService, useValue: mockSystemMetricsService },
      ],
    }).compile();

    // Override logger to suppress output during tests
    module.useLogger(new Logger());

    processor = module.get<ReportGenerationProcessor>(ReportGenerationProcessor);
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  it('should generate system metrics report correctly', async () => {
    // Access private method using type assertion or testing utility
    // Since handleGenerateReport calls generateSystemMetricsReport internally

    // We mock sleep to speed up test
    // @ts-ignore
    processor.sleep = jest.fn().mockResolvedValue(undefined);
    // @ts-ignore
    processor.saveReport = jest.fn().mockResolvedValue('http://mock-url');

    const result = await processor.handleGenerateReport(mockJob);

    expect(mockSystemMetricsService.getMetrics).toHaveBeenCalled();
    expect(result.recordCount).toBe(1);
    expect(result.reportUrl).toBe('http://mock-url');
  });
});
