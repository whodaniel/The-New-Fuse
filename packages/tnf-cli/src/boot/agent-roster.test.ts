import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import {
  buildRosterFromRawAgents,
  classifyPresence,
  formatAge,
  parseRedisHgetallPairs,
} from './agent-roster.js';

describe('protocol agent roster', () => {
  const nowMs = Date.parse('2026-07-24T20:00:00.000Z');

  it('classifies fresh heartbeats as active and stale/offline as inactive', () => {
    assert.equal(
      classifyPresence(
        { status: 'active', lastSeen: '2026-07-24T19:59:45.000Z', isOnline: true },
        nowMs
      ),
      'active'
    );
    assert.equal(
      classifyPresence(
        { status: 'active', lastSeen: '2026-07-24T18:00:00.000Z', isOnline: true },
        nowMs
      ),
      'inactive'
    );
    assert.equal(
      classifyPresence(
        { status: 'offline', lastSeen: '2026-07-24T19:59:50.000Z', isOnline: false },
        nowMs
      ),
      'inactive'
    );
  });

  it('parses redis HGETALL pairs and builds ACTIVE/INACTIVE sections', () => {
    const raw = [
      'agent_a',
      JSON.stringify({
        id: 'agent_a',
        name: 'BROKER-Green',
        role: 'broker',
        platform: 'tnf-runtime',
        status: 'active',
        lastSeen: '2026-07-24T19:59:50.000Z',
      }),
      'agent_b',
      JSON.stringify({
        id: 'agent_b',
        name: 'BROKER-Green',
        role: 'broker',
        platform: 'tnf-runtime',
        status: 'active',
        lastSeen: '2026-07-24T10:00:00.000Z',
      }),
      'agent_c',
      JSON.stringify({
        id: 'agent_c',
        name: 'TNF Runtime Broker',
        role: 'broker',
        platform: 'broker-agent',
        status: 'offline',
        lastSeen: '2026-07-24T19:59:50.000Z',
        isOnline: false,
      }),
    ].join('\n');

    const parsed = parseRedisHgetallPairs(raw);
    assert.equal(parsed.length, 3);

    const roster = buildRosterFromRawAgents(parsed, {
      nowMs,
      knownCatalogCount: 327,
      source: 'redis',
    });

    assert.equal(roster.registrationCount, 3);
    assert.equal(roster.uniqueAgentCount, 2);
    assert.equal(roster.active.length, 1);
    assert.equal(roster.inactive.length, 1);
    assert.equal(roster.active[0].name, 'BROKER-Green');
    assert.equal(roster.active[0].instanceCount, 2);
    assert.equal(roster.inactive[0].name, 'TNF Runtime Broker');
    assert.equal(roster.knownCatalogCount, 327);
  });

  it('formats relative ages', () => {
    assert.equal(formatAge('2026-07-24T19:59:30.000Z', nowMs), '30s ago');
    assert.equal(formatAge('2026-07-24T19:00:00.000Z', nowMs), '1h ago');
    assert.equal(formatAge(null, nowMs), 'never');
  });

  it('keeps known network agents when merging with empty redis set', () => {
    const roster = buildRosterFromRawAgents(
      [
        {
          id: 'network:gemini',
          name: 'gemini',
          role: 'worker',
          platform: 'gemini',
          status: 'active',
          lastSeen: '2026-07-24T19:59:50.000Z',
          isOnline: true,
        },
        {
          id: 'network:claude',
          name: 'claude',
          role: 'broker',
          platform: 'claude',
          status: 'offline',
          lastSeen: null,
          isOnline: false,
        },
      ],
      { nowMs, knownCatalogCount: 10, source: 'redis' }
    );
    assert.equal(roster.active.map((a) => a.name).join(','), 'gemini');
    assert.equal(roster.inactive.map((a) => a.name).join(','), 'claude');
  });
});
