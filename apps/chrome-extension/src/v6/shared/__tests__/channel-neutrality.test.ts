/**
 * Channel neutrality invariants for the background service worker.
 *
 * Every channel must behave identically — the ones restored from saved state and
 * the ones created later in the session. Two regressions previously broke that:
 *
 *   1. `joinedChannels.add('red')` hardcoded one channel at load, so that channel
 *      alone was joined implicitly.
 *   2. Channel membership was one-directional. `registerPageAgent()` joined a NEW
 *      page agent to EXISTING channels, but nothing joined EXISTING page agents to
 *      a NEW channel — so a channel created after a tab was already open never
 *      delivered to that tab on the relay.
 *
 * BackgroundService boots straight into chrome.* APIs in its constructor and has no
 * runtime harness, so these are enforced structurally against the source instead of
 * behaviourally. Structural is weaker than behavioural, but it does pin the exact
 * two shapes that regressed.
 */

import * as fs from 'fs';
import * as path from 'path';

const BACKGROUND_SOURCE = path.resolve(__dirname, '../../background/index.ts');

let source: string;

beforeAll(() => {
  source = fs.readFileSync(BACKGROUND_SOURCE, 'utf8');
});

describe('no channel is special-cased by name', () => {
  it('never auto-joins a hardcoded channel id', () => {
    // e.g. joinedChannels.add('red')
    const hardcodedJoin = /joinedChannels\s*\.\s*add\(\s*['"`][^'"`]+['"`]\s*\)/g;
    const offenders = source.match(hardcodedJoin) || [];
    expect(offenders).toEqual([]);
  });

  it('routes channel membership through variables, not literals', () => {
    // Any surviving add() call must take an expression (message.channelId, etc).
    const adds = source.match(/joinedChannels\s*\.\s*add\([^)]*\)/g) || [];
    expect(adds.length).toBeGreaterThan(0);
    for (const call of adds) {
      expect(call).not.toMatch(/add\(\s*['"`]/);
    }
  });
});

describe('channel membership is symmetric in both directions', () => {
  it('defines a helper that joins existing page agents to a channel', () => {
    expect(source).toMatch(/private\s+joinPageAgentsToChannel\s*\(/);
  });

  it('joins existing page agents when a channel is created', () => {
    const createCase = source.slice(
      source.indexOf("case 'CHANNEL_CREATE'"),
      source.indexOf("case 'CHANNEL_JOIN'")
    );
    expect(createCase).not.toHaveLength(0);
    expect(createCase).toMatch(/this\.joinPageAgentsToChannel\(/);
  });

  it('joins existing page agents when a channel is joined', () => {
    const joinCase = source.slice(
      source.indexOf("case 'CHANNEL_JOIN'"),
      source.indexOf("case 'CHANNEL_LEAVE'")
    );
    expect(joinCase).not.toHaveLength(0);
    expect(joinCase).toMatch(/this\.joinPageAgentsToChannel\(/);
  });

  it('still joins a newly registered page agent to the existing channels', () => {
    const registerFn = source.slice(source.indexOf('private registerPageAgent('));
    expect(registerFn).toMatch(/for\s*\(\s*const\s+channelId\s+of\s+this\.joinedChannels\s*\)/);
  });

  it('records membership even while the relay socket is closed, so reconnect replays it', () => {
    const helper = source.slice(
      source.indexOf('private joinPageAgentsToChannel('),
      source.indexOf('private reRegisterAllAgents(')
    );
    // agent.channels must be updated before the open-socket early-continue.
    const pushIndex = helper.indexOf('agent.channels.push(');
    const bailIndex = helper.indexOf('if (!isOpen) continue;');
    expect(pushIndex).toBeGreaterThan(-1);
    expect(bailIndex).toBeGreaterThan(-1);
    expect(pushIndex).toBeLessThan(bailIndex);
  });

  it('does not guess a response channel when multiple channels are joined', () => {
    const responseCase = source.slice(
      source.indexOf("case 'RESPONSE_COMPLETE'"),
      source.indexOf('// Explicit cases that need async response')
    );
    expect(responseCase).toMatch(/this\.tabActiveChannels\.get\(sender\.tab\.id\)/);
    expect(responseCase).toMatch(/this\.joinedChannels\.size === 1/);
    expect(responseCase).not.toMatch(
      /this\.joinedChannels\.size > 0[\s\S]{0,220}Array\.from\(this\.joinedChannels\)\[0\]/
    );
  });
});
