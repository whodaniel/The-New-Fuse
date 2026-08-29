import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { createBootPipeline, toBootPlan } from './pipeline.js';

function mockDeps() {
  return {
    repoRoot: process.cwd(),
    runCommand: async () => undefined,
    findExecutableOnPath: () => null,
  };
}

describe('boot pipeline plan', () => {
  it('includes harness-context and expected default launches', () => {
    const defaultPipeline = createBootPipeline(mockDeps(), {
      profile: 'goldberg',
      skipOnboard: true,
    });
    const plan = toBootPlan(defaultPipeline);
    const byId = Object.fromEntries(plan.map((step) => [step.id, step]));

    assert.equal(
      plan.length,
      22,
      'expected 22 boot steps including harness-context + voice-kws + live-surfaces + continuity + attach'
    );
    assert.ok(byId['harness-context'], 'harness-context step required');
    assert.ok(byId['voice-kws-always-on'], 'voice-kws-always-on step required');
    assert.ok(byId['local-live-surfaces'], 'local-live-surfaces step required');
    assert.deepEqual(byId['local-live-surfaces'].launches, [
      'node scripts/local-ui/ensure-local-live-surfaces.cjs',
      'python3 scripts/semantic-graph/build_all.py --publish-only',
      'frontend-app Vite (:5173)',
      'browser-control (:1421)',
    ]);

    assert.match(
      byId['turn-zero-onboard'].launches[0],
      /skipped/i,
      'default plan should skip redundant onboard'
    );
    assert.deepEqual(byId['handoff-matrix'].launches, [
      'node scripts/turn-end.cjs --no-stage',
      'node scripts/protocols/enforce-session-handoff.cjs --mode=ci',
    ]);
    assert.equal(byId['forefront'].launches[0], 'node scripts/local-ui/tnf-forefront-boot.cjs');
    assert.ok(
      !byId['agent-swarm'].launches.some((l) => l.includes('claude')),
      'claude wrapper must be opt-in'
    );
    assert.ok(
      byId['factory-boot'].launches.includes('scripts/orchestrator/impetus-loop.cjs loop'),
      'factory plan should include impetus-loop'
    );
    assert.deepEqual(
      byId['openclaw'].launches,
      ['pnpm run tnf:mcp:generate'],
      'openclaw step id is historical; the capability is MCP provisioning for any harness'
    );
    assert.equal(byId['openclaw'].label, 'Harness MCP provisioning');
    assert.equal(byId['zeroclaw'].label, 'On-demand execution sandbox wake');
  });

  it('lists claude wrapper only when --with-claude', () => {
    const withClaude = toBootPlan(
      createBootPipeline(mockDeps(), {
        profile: 'goldberg',
        withClaude: true,
        skipOnboard: true,
      })
    );
    assert.ok(
      withClaude.find((s) => s.id === 'agent-swarm')!.launches.some((l) => l.includes('claude')),
      '--with-claude should list claude wrapper'
    );
  });

  it('forceOnboard schedules tnf-onboard', () => {
    const forced = toBootPlan(
      createBootPipeline(mockDeps(), {
        profile: 'goldberg',
        forceOnboard: true,
        skipOnboard: false,
      })
    );
    assert.equal(
      forced.find((s) => s.id === 'turn-zero-onboard')!.launches[0],
      'node scripts/tnf-onboard.cjs --runtime-timeout-ms 1000'
    );
  });
});
