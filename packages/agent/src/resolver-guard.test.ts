import { createStandaloneRedisClient, createUpstashRestClient } from '@the-new-fuse/infrastructure';
import { RedisAgentRegistry } from './registry/redis-agent-registry.js';

/**
 * RC Phase B T3 regression guard for the agent package jest module resolution.
 *
 * Phase B failed at this package with `Cannot find module '../cline_bridge.js'`
 * because ts-jest could not resolve NodeNext-style relative `.js` specifiers,
 * and a second failure class resolved directory-mapped workspace packages to
 * tracked ESM build artifacts because the default `moduleFileExtensions` is
 * js-first. These imports exercise both resolver classes; if either the
 * relative `.js` mapper or the ts-first extension order regresses, this suite
 * fails at import time with the original Phase B error.
 */
describe('agent jest module resolution (RC Phase B T3 guard)', () => {
  it('resolves NodeNext-style relative .js specifiers through ts-jest', () => {
    expect(typeof RedisAgentRegistry).toBe('function');
  });

  it('resolves directory-mapped workspace packages to TypeScript sources', () => {
    expect(typeof createStandaloneRedisClient).toBe('function');
    expect(typeof createUpstashRestClient).toBe('function');
  });
});
