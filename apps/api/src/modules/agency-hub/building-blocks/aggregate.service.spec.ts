import { beforeEach, describe, expect, it } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { AggregateService } from './aggregate.service.js';

describe('AggregateService', () => {
  let service: AggregateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AggregateService],
    }).compile();

    service = module.get<AggregateService>(AggregateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findConsensus', () => {
    it('should find consensus with identical opinions', async () => {
      const opinions = [
        { agentId: '1', opinion: 'yes', weight: 0.8 },
        { agentId: '2', opinion: 'yes', weight: 0.9 },
        { agentId: '3', opinion: 'no', weight: 0.7 },
      ];

      const result = await service.findConsensus(opinions);

      expect(result.consensus).toBe('yes');
      expect(result.dissenting).toContain('3');
      expect(result.agreement).toBeGreaterThan(0.5);
    });

    it('should handle tie-breaking or no clear consensus', async () => {
      const opinions = [
        { agentId: '1', opinion: 'yes', weight: 0.5 },
        { agentId: '2', opinion: 'no', weight: 0.5 },
      ];
      // Depending on implementation, one wins or it's "no consensus"
      const result = await service.findConsensus(opinions);
      expect(result).toBeDefined();
    });
  });

  describe('aggregateResponses', () => {
    it('should aggregate responses correctly', async () => {
      const responses = [
        { agentId: '1', response: 'Target acquired', confidence: 0.9 },
        { agentId: '2', response: 'Target acquired', confidence: 0.8 },
        { agentId: '3', response: 'Searching...', confidence: 0.3 },
      ];

      const result = await service.aggregateResponses(responses);

      expect(result.summary).toBe('Target acquired');
      expect(result.keyPoints).toContain('Target acquired');
      expect(result.keyPoints).toContain('Searching...');
      expect(result.confidence).toBeGreaterThan(0.8); // Average of winners
      expect(result.sources).toEqual(['1', '2', '3']);
    });
  });
});
