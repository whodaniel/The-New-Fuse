import { describe, expect, it, jest } from '@jest/globals';
import { AgentProxyController } from '../agent-proxy.controller';

describe('AgentProxyController', () => {
  const grantsService = {
    proxy: jest.fn(),
    adaptiveProxy: jest.fn(),
    getAdaptiveConfig: jest.fn(),
  } as any;

  const controller = new AgentProxyController(grantsService);

  it('routes to adaptive proxy when target is present in body', async () => {
    grantsService.adaptiveProxy.mockResolvedValueOnce({ ok: true });

    const result = await controller.proxy('openai', 'Bearer token', {
      target: 'picoclaw-tester',
      model: 'gpt-4o-mini',
    } as any);

    expect(result).toEqual({ ok: true });
    expect(grantsService.adaptiveProxy).toHaveBeenCalledWith('picoclaw-tester', 'Bearer token', {
      model: 'gpt-4o-mini',
    });
    expect(grantsService.proxy).not.toHaveBeenCalled();
  });

  it('routes to direct proxy when target is missing', async () => {
    grantsService.proxy.mockResolvedValueOnce({ ok: true });

    const payload = { model: 'gpt-4o-mini' } as any;
    const result = await controller.proxy('openai', 'Bearer token', payload);

    expect(result).toEqual({ ok: true });
    expect(grantsService.proxy).toHaveBeenCalledWith('openai', 'Bearer token', payload);
  });

  it('returns adaptive config via grants service', async () => {
    const expected = {
      target: 'picoclaw-tester',
      primary: { provider: 'openrouter', model: 'openai/gpt-4o-mini' },
      fallback: { provider: 'openai', model: 'gpt-4o-mini' },
    };
    grantsService.getAdaptiveConfig.mockResolvedValueOnce(expected);

    const result = await controller.adaptiveConfig('picoclaw-tester');
    expect(result).toEqual(expected);
    expect(grantsService.getAdaptiveConfig).toHaveBeenCalledWith('picoclaw-tester');
  });
});
