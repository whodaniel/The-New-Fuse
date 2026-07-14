import { describe, expect, it } from 'vitest';
import { isRelayHealthPayload } from './endpointDiscovery';

describe('endpointDiscovery', () => {
  it('recognizes relay health payloads', () => {
    expect(isRelayHealthPayload({ status: 'ok', relay: 'running', agents: 0 })).toBe(true);
    expect(isRelayHealthPayload({ status: 'ok', agents: 2, channels: 1 })).toBe(true);
  });

  it('rejects generic websocket gateway health', () => {
    expect(isRelayHealthPayload({ status: 'ok', connectedClients: 0 })).toBe(false);
  });

  it('rejects malformed payloads', () => {
    expect(isRelayHealthPayload(null)).toBe(false);
    expect(isRelayHealthPayload({ status: 'error' })).toBe(false);
  });
});
