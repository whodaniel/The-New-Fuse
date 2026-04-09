import { describe, expect, it, jest } from '@jest/globals';
import { AgentApiGrantsService } from './agent-api-grants.service';

describe('AgentApiGrantsService', () => {
  const service = new AgentApiGrantsService({} as any, {} as any, {} as any);

  describe('getAdaptiveConfig', () => {
    it('decodes target and returns resolved primary/fallback selection', async () => {
      const resolveAdaptiveRouting = jest
        .spyOn(service as any, 'resolveAdaptiveRouting')
        .mockResolvedValueOnce({
          primary: { provider: 'openrouter', model: 'openai/gpt-4o-mini' },
          fallback: { provider: 'openai', model: 'gpt-4o-mini' },
        });

      const result = await service.getAdaptiveConfig('picoclaw%20tester');

      expect(resolveAdaptiveRouting).toHaveBeenCalledWith('picoclaw tester');
      expect(result).toEqual({
        target: 'picoclaw tester',
        primary: { provider: 'openrouter', model: 'openai/gpt-4o-mini' },
        fallback: { provider: 'openai', model: 'gpt-4o-mini' },
      });
    });

    it('throws when target is empty', async () => {
      await expect(service.getAdaptiveConfig('')).rejects.toThrow(
        'Target is required for adaptive routing'
      );
    });
  });
});
