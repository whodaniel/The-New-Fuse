import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { AgentApiGrantsService } from './agent-api-grants.service';

describe('AgentApiGrantsService', () => {
  const service = new AgentApiGrantsService({} as any, {} as any, {} as any);
  const originalAdkBase = process.env.ADK_GATEWAY_URL;

  afterEach(() => {
    if (typeof originalAdkBase === 'undefined') {
      delete process.env.ADK_GATEWAY_URL;
    } else {
      process.env.ADK_GATEWAY_URL = originalAdkBase;
    }
  });

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

  describe('google-adk routing helpers', () => {
    it('resolves google-adk proxy endpoint from gateway base URL', () => {
      process.env.ADK_GATEWAY_URL = 'http://localhost:8089';
      const endpoint = (service as any).getProviderEndpoint('google-adk');
      expect(endpoint).toBe('http://localhost:8089/v1/execute');
    });

    it('builds google-adk headers using the gateway key header', () => {
      const headers = (service as any).buildProviderHeaders('google-adk', 'gateway-secret', {});
      expect(headers).toEqual({
        'Content-Type': 'application/json',
        'x-adk-gateway-key': 'gateway-secret',
      });
    });

    it('maps OpenAI-style payloads into ADK execute envelope', () => {
      const payload = (service as any).buildOutboundPayload('google-adk', {
        model: 'gemini-2.5-pro',
        messages: [{ role: 'user', content: 'hello from test' }],
      }) as any;

      expect(typeof payload.requestId).toBe('string');
      expect(typeof payload.traceId).toBe('string');
      expect(payload.model).toBe('gemini-2.5-pro');
      expect(payload.input.messages).toEqual([{ role: 'user', content: 'hello from test' }]);
      expect(payload.workspaceId).toBe('tnf-agent-proxy');
      expect(payload.agentId).toBe('tnf-agent-proxy');
    });

    it('extracts usage from ADK token fields', () => {
      const usage = (service as any).extractUsage({
        usage: {
          inputTokens: 11,
          outputTokens: 22,
          totalTokens: 33,
        },
      });

      expect(usage).toEqual({
        promptTokens: 11,
        completionTokens: 22,
        totalTokens: 33,
      });
    });
  });
});
