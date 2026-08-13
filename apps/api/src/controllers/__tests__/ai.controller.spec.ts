import { describe, expect, it } from '@jest/globals';
import { AiController } from '../ai.controller';

describe('AiController (google-adk)', () => {
  const controller = new AiController({} as any);

  it('resolves gateway base URL to execute endpoint', () => {
    const endpoint = (controller as any).resolveTextEndpoint('google-adk', 'http://localhost:8089');
    expect(endpoint).toBe('http://localhost:8089/v1/execute');
  });

  it('builds gateway headers with x-adk-gateway-key', () => {
    const headers = (controller as any).buildProviderHeaders('google-adk', 'adk-key');
    expect(headers).toEqual({
      'content-type': 'application/json',
      'x-adk-gateway-key': 'adk-key',
    });
  });

  it('builds ADK execute payload envelope', () => {
    const payload = (controller as any).buildTextPayload(
      'google-adk',
      'gemini-2.5-pro',
      'hello',
      'system prompt'
    ) as any;

    expect(typeof payload.requestId).toBe('string');
    expect(typeof payload.traceId).toBe('string');
    expect(payload.workspaceId).toBe('tnf-default-workspace');
    expect(payload.agentId).toBe('tnf-ai-controller');
    expect(payload.model).toBe('gemini-2.5-pro');
    expect(payload.input.messages).toEqual([
      { role: 'system', content: 'system prompt' },
      { role: 'user', content: 'hello' },
    ]);
    expect(payload.timeoutMs).toBe(120000);
  });

  it('extracts text from ADK response envelope', () => {
    const text = (controller as any).extractTextContent('google-adk', {
      output: { content: 'adk response text' },
    });
    expect(text).toBe('adk response text');
  });
});
