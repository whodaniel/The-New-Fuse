import { beforeEach, describe, expect, it } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { AgentDecision, AgentPerformanceMetrics, ReflectService } from './reflect.service.js';

describe('ReflectService', () => {
  let service: ReflectService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReflectService],
    }).compile();

    service = module.get<ReflectService>(ReflectService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('reflectOnPerformance', () => {
    it('should generate insights for low success rate', async () => {
      const metrics: AgentPerformanceMetrics = {
        tasksCompleted: 70,
        tasksFailed: 30, // 70% success rate
        averageResponseTimeMs: 100,
      };

      const result = await service.reflectOnPerformance('agent-1', metrics);

      expect(result.insights).toEqual(
        expect.arrayContaining([expect.stringContaining('Success rate is below optimal')])
      );
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should generate insights for high response time', async () => {
      const metrics: AgentPerformanceMetrics = {
        tasksCompleted: 100,
        tasksFailed: 0,
        averageResponseTimeMs: 5000, // 5s response time
      };

      const result = await service.reflectOnPerformance('agent-1', metrics);

      expect(result.insights).toEqual(
        expect.arrayContaining([expect.stringContaining('Response time is high')])
      );
    });
  });

  describe('analyzeDecisionPatterns', () => {
    it('should identify repeated failures', async () => {
      const decisions: AgentDecision[] = [
        {
          id: '1',
          context: 'ctx',
          action: 'retry',
          outcome: 'failure',
          confidence: 0.9,
          timestamp: new Date(),
        },
        {
          id: '2',
          context: 'ctx',
          action: 'retry',
          outcome: 'failure',
          confidence: 0.9,
          timestamp: new Date(),
        },
      ];

      const result = await service.analyzeDecisionPatterns('agent-1', decisions);

      expect(result.patterns).toEqual(
        expect.arrayContaining([expect.stringContaining('repeating failed actions')])
      );
    });
  });
});
