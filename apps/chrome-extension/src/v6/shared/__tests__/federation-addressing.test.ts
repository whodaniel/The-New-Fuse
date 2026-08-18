/**
 * Federated addressing must work on every channel — the ones restored from saved
 * state and any created later — and must resolve the same way the standalone relay
 * client resolves it (scripts/lib/federation-relay-client.cjs#sendChannelMessage).
 *
 * Addressing is deliberately independent of channel membership: a recipient is
 * resolved from the agent registry, not from which channel it happens to be in, so
 * a channel created five minutes ago addresses exactly like one created at install.
 */

import * as fs from 'fs';
import * as path from 'path';

import { deterministicIdNumber, resolveMessageTarget } from '../federation-identity';
import type { Agent } from '../types';

function pageAgent(id: string, handle: string, platform: string, channels: string[] = []): Agent {
  return {
    id,
    name: `AI Chat (${platform})`,
    platform: 'browser-page',
    status: 'active',
    capabilities: [],
    lastSeen: Date.now(),
    channels,
    operationalHandle: handle,
    runtimeSessionId: id,
    canonicalEntityId: null,
    idNumber: deterministicIdNumber(id),
    aliases: [id, id.toLowerCase(), handle.toLowerCase(), platform.toLowerCase()],
    daccRole: 'participant',
    metadata: { node: { platform }, aliases: [id, handle.toLowerCase()] },
  };
}

const gemini = pageAgent('page-agent-7-green1', 'PAGE-7-GREEN1', 'gemini.google.com', ['green']);
const kimi = pageAgent('page-agent-44-blue1', 'PAGE-44-BLUE1', 'www.kimi.com', ['blue']);
const roster = [gemini, kimi];

describe('addressing by federated ID#', () => {
  it('routes to the agent holding that ID# and strips the token', () => {
    const routed = resolveMessageTarget(`@${kimi.idNumber} run the smoke test`, roster);

    expect(routed.to).toBe(kimi.id);
    expect(routed.addressedAgentId).toBe(kimi.id);
    expect(routed.addressedHandle).toBe('PAGE-44-BLUE1');
    expect(routed.content).toBe('run the smoke test');
  });

  it('disambiguates between agents on different channels', () => {
    expect(resolveMessageTarget(`@${gemini.idNumber} ping`, roster).to).toBe(gemini.id);
    expect(resolveMessageTarget(`@${kimi.idNumber} ping`, roster).to).toBe(kimi.id);
  });

  it('leaves an unknown ID# as a broadcast rather than misrouting it', () => {
    const routed = resolveMessageTarget('@ID#:zzzz nobody home', roster);

    expect(routed.to).toBe('broadcast');
    expect(routed.addressedAgentId).toBeNull();
  });
});

describe('addressing by /to directive', () => {
  it('routes by operational handle', () => {
    const routed = resolveMessageTarget(`/to ${kimi.operationalHandle} status?`, roster);

    expect(routed.to).toBe(kimi.id);
    expect(routed.content).toBe('status?');
  });

  it('routes by raw agent id', () => {
    expect(resolveMessageTarget(`/to ${gemini.id} status?`, roster).to).toBe(gemini.id);
  });

  it('does not route to an unknown handle', () => {
    const routed = resolveMessageTarget('/to NOBODY status?', roster);

    expect(routed.to).toBe('broadcast');
    expect(routed.addressedAgentId).toBeNull();
  });
});

describe('addressing by explicit page-agent id', () => {
  it('routes and strips the mention', () => {
    const routed = resolveMessageTarget(`@${kimi.id} hello`, roster);

    expect(routed.to).toBe(kimi.id);
    expect(routed.content).toBe('hello');
  });
});

describe('unaddressed traffic stays a broadcast', () => {
  it('passes content through untouched', () => {
    const routed = resolveMessageTarget('just talking to the channel', roster);

    expect(routed.to).toBe('broadcast');
    expect(routed.addressedAgentId).toBeNull();
    expect(routed.addressedHandle).toBeNull();
    expect(routed.content).toBe('just talking to the channel');
  });

  it('does not treat an email-style @ as addressing', () => {
    const routed = resolveMessageTarget('ping me at me@example.com', roster);
    expect(routed.to).toBe('broadcast');
  });
});

describe('addressing is channel-agnostic', () => {
  // The whole point: a channel created after install must address exactly like one
  // that has existed since the first run.
  const channelShapes: Array<[string, string[]]> = [
    ['a long-lived channel', ['green']],
    ['a newly created channel', ['channel-1765432100000-9fk3']],
    ['several channels at once', ['green', 'blue', 'ops']],
    ['no channel yet', []],
  ];

  it.each(channelShapes)('resolves ID# for an agent in %s', (_label, channels) => {
    const agent = pageAgent('page-agent-99-x', 'PAGE-99-X', 'www.kimi.com', channels);
    const routed = resolveMessageTarget(`@${agent.idNumber} go`, [agent]);

    expect(routed.to).toBe(agent.id);
    expect(routed.content).toBe('go');
  });

  it('resolves the same recipient regardless of channel membership', () => {
    const inGreen = pageAgent('page-agent-5-a', 'PAGE-5-A', 'www.kimi.com', ['green']);
    const inBrandNew = pageAgent('page-agent-5-a', 'PAGE-5-A', 'www.kimi.com', ['brand-new']);

    expect(resolveMessageTarget(`@${inGreen.idNumber} x`, [inGreen]).to).toBe(
      resolveMessageTarget(`@${inBrandNew.idNumber} x`, [inBrandNew]).to
    );
  });
});

/**
 * The helpers above are pure and easy to test; the risk is that they simply are not
 * called. They sat in the tree unused while `@ID#:` addressing silently did nothing,
 * so pin the call sites too. BackgroundService touches chrome.* in its constructor
 * and has no runtime harness, hence the structural check.
 */
describe('the background service actually uses the addressing helpers', () => {
  let source: string;

  beforeAll(() => {
    source = fs.readFileSync(path.resolve(__dirname, '../../background/index.ts'), 'utf8');
  });

  it('imports them', () => {
    expect(source).toMatch(
      /import\s*\{[\s\S]*?resolveMessageTarget[\s\S]*?\}\s*from\s*'\.\.\/shared\/federation-identity'/
    );
    expect(source).toMatch(
      /import\s*\{[\s\S]*?mergeRegistrationPayload[\s\S]*?\}\s*from\s*'\.\.\/shared\/federation-identity'/
    );
  });

  it('resolves a target when broadcasting, and sends the resolved recipient', () => {
    const broadcastCase = source.slice(
      source.indexOf("case 'BROADCAST_MESSAGE'"),
      source.indexOf("case 'SEND_TO_AGENT'")
    );

    expect(broadcastCase).not.toHaveLength(0);
    expect(broadcastCase).toMatch(/resolveMessageTarget\(/);
    expect(broadcastCase).toMatch(/to:\s*resolved\.to/);
    expect(broadcastCase).toMatch(/content:\s*resolved\.content/);
    // A hardcoded broadcast target would defeat the resolution above.
    expect(broadcastCase).not.toMatch(/to:\s*'broadcast'/);
  });

  it('merges relay agent payloads instead of overwriting local identity', () => {
    const agentList = source.slice(
      source.indexOf("case 'AGENT_LIST'"),
      source.indexOf("case 'AGENT_UNREGISTER'")
    );

    expect(agentList).not.toHaveLength(0);
    expect(agentList).toMatch(/mergeRegistrationPayload\(/);
    // Clearing the registry dropped tabId and the minted ID#/handle on every sync.
    expect(agentList).not.toMatch(/this\.agents\.clear\(\)/);
  });
});
