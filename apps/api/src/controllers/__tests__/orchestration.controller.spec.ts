import { describe, expect, it } from '@jest/globals';
import { OrchestrationController } from '../orchestration.controller';

describe('OrchestrationController (google-adk)', () => {
  const controller = new OrchestrationController({} as any);

  it('uses gemini model default for google-adk provider', () => {
    const model = (controller as any).defaultModelForProvider('google-adk');
    expect(model).toBe('gemini-2.5-pro');
  });

  it('resolves gateway base URL to execute endpoint', () => {
    const endpoint = (controller as any).resolveChatEndpoint('google-adk', 'http://localhost:8089');
    expect(endpoint).toBe('http://localhost:8089/v1/execute');
  });

  it('builds gateway headers with x-adk-gateway-key', () => {
    const headers = (controller as any).buildHeaders('google-adk', 'adk-key');
    expect(headers).toEqual({
      'content-type': 'application/json',
      'x-adk-gateway-key': 'adk-key',
    });
  });

  it('builds ADK execute payload envelope', () => {
    const payload = (controller as any).buildPayload(
      'google-adk',
      'gemini-2.5-pro',
      'hello',
      'system prompt',
      0.2,
      1200
    ) as any;

    expect(typeof payload.requestId).toBe('string');
    expect(typeof payload.traceId).toBe('string');
    expect(payload.workspaceId).toBe('tnf-default-workspace');
    expect(payload.agentId).toBe('tnf-orchestration-controller');
    expect(payload.model).toBe('gemini-2.5-pro');
    expect(payload.input.messages).toEqual([
      { role: 'system', content: 'system prompt' },
      { role: 'user', content: 'hello' },
    ]);
    expect(payload.temperature).toBe(0.2);
    expect(payload.maxTokens).toBe(1200);
  });

  it('extracts text from ADK response envelope', () => {
    const text = (controller as any).extractTextContent('google-adk', {
      output: { content: 'adk orchestration response' },
    });
    expect(text).toBe('adk orchestration response');
  });
});
