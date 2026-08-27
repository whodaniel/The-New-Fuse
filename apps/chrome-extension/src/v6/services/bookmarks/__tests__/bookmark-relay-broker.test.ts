/**
 * BookmarkRelayBroker request/response correlation. No chrome.* mocking needed —
 * `send`/`getAgents` are injected, so this exercises the exact same code path
 * BackgroundService wires into handleAgentMessage.
 */

import type { Agent, AgentMessage } from '../../../shared/types';
import { BookmarkRelayBroker } from '../bookmark-relay-broker';

function makeAgent(overrides: Partial<Agent> = {}): Agent {
  return {
    id: 'agent-1',
    name: 'Test Agent',
    platform: 'claude' as any,
    status: 'online' as any,
    capabilities: [],
    lastSeen: Date.now(),
    ...overrides,
  };
}

function makeReply(requestId: string, content: string): AgentMessage {
  return {
    id: 'reply-1',
    from: 'agent-1',
    to: 'browser',
    content,
    timestamp: Date.now(),
    type: 'response',
    metadata: { requestId },
  };
}

describe('BookmarkRelayBroker', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('resolves a pending request when a reply with the matching requestId arrives', async () => {
    const sent: Record<string, unknown>[] = [];
    const broker = new BookmarkRelayBroker({
      send: (data) => sent.push(data),
      getAgents: () => [],
      getAgentId: () => 'browser',
    });

    const promise = broker.request('generate-taxonomy', { hello: 'world' });
    expect(sent).toHaveLength(1);
    const requestId = (sent[0].metadata as Record<string, unknown>).requestId as string;
    expect(typeof requestId).toBe('string');

    const consumed = broker.resolve(makeReply(requestId, '{"ok":true}'));
    expect(consumed).toBe(true);

    const reply = await promise;
    expect(reply.content).toBe('{"ok":true}');
  });

  it('ignores replies whose requestId does not match any pending request', () => {
    const broker = new BookmarkRelayBroker({
      send: () => {},
      getAgents: () => [],
      getAgentId: () => 'browser',
    });

    const consumed = broker.resolve(makeReply('not-a-real-id', '{}'));
    expect(consumed).toBe(false);
  });

  it('rejects with no_agent_response after the timeout elapses', async () => {
    const broker = new BookmarkRelayBroker({
      send: () => {},
      getAgents: () => [],
      getAgentId: () => 'browser',
    });

    const promise = broker.request('generate-taxonomy', {}, { timeoutMs: 1000 });
    const assertion = expect(promise).rejects.toThrow('no_agent_response');
    await jest.advanceTimersByTimeAsync(1000);
    await assertion;
  });

  it('requestWithRetry retries on timeout and succeeds if a later attempt resolves', async () => {
    // Real timers here: the retry backoff delay (TIMINGS.retryInterval) isn't
    // injectable per-call, and driving that interaction through fake timers is
    // fragile (the retry's own timeout races the backoff timer's microtasks).
    // Values are kept small so this still runs in ~1.5s.
    jest.useRealTimers();

    let sendCount = 0;
    const broker = new BookmarkRelayBroker({
      send: (data) => {
        sendCount += 1;
        // Resolve only the second (retried) request — the first is left to time out.
        if (sendCount === 2) {
          const requestId = (data.metadata as Record<string, unknown>).requestId as string;
          setTimeout(() => broker.resolve(makeReply(requestId, '[]')), 10);
        }
      },
      getAgents: () => [],
      getAgentId: () => 'browser',
    });

    const reply = await broker.requestWithRetry('classify-batch', {}, { timeoutMs: 100 }, 1);
    expect(sendCount).toBe(2);
    expect(reply.content).toBe('[]');
  });

  it('prefers an agent advertising bookmark-classify capability over broadcast', () => {
    const sent: Record<string, unknown>[] = [];
    const broker = new BookmarkRelayBroker({
      send: (data) => sent.push(data),
      getAgents: () => [
        makeAgent({ id: 'plain' }),
        makeAgent({ id: 'capable', capabilities: ['bookmark-classify'] }),
      ],
      getAgentId: () => 'browser',
    });

    void broker.request('generate-taxonomy', {}, { channel: 'general' });
    expect(sent[0].to).toBe('capable');
  });

  it('falls back to broadcasting on the given channel when no agent is capable', () => {
    const sent: Record<string, unknown>[] = [];
    const broker = new BookmarkRelayBroker({
      send: (data) => sent.push(data),
      getAgents: () => [makeAgent({ id: 'plain' })],
      getAgentId: () => 'browser',
    });

    void broker.request('generate-taxonomy', {}, { channel: 'general' });
    expect(sent[0].to).toBe('broadcast');
    expect(sent[0].channel).toBe('general');
  });
});
