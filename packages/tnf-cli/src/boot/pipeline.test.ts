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
      21,
      'expected 21 boot steps including harness-context + voice-kws + continuity + attach'
    );
    assert.ok(byId['harness-context'], 'harness-context step required');
    assert.ok(byId['voice-kws-always-on'], 'voice-kws-always-on step required');

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

describe('boot pipeline parallel probes (#176)', () => {
  it('marks only warning-only independent checks as a contiguous parallel group', () => {
    const plan = toBootPlan(
      createBootPipeline(mockDeps(), { profile: 'goldberg', skipOnboard: true })
    );

    const groupMembers = plan.filter((s) => s.parallelGroup === 'preflight-probes');
    assert.deepEqual(
      groupMembers.map((s) => s.id),
      ['harness-context', 'port-preflight', 'env-validation', 'mcp-health'],
      'probe group membership is explicit'
    );
    for (const member of groupMembers) {
      assert.equal(
        member.critical,
        false,
        `${member.id} must stay warning-only to be parallel-safe`
      );
    }

    // Contiguity: no non-group step between the first and last member.
    const first = plan.findIndex((s) => s.parallelGroup === 'preflight-probes');
    let last = first;
    for (let k = plan.length - 1; k >= 0; k--) {
      if (plan[k].parallelGroup === 'preflight-probes') {
        last = k;
        break;
      }
    }
    for (let k = first; k <= last; k++) {
      assert.equal(
        plan[k].parallelGroup,
        'preflight-probes',
        `step ${plan[k].id} breaks group contiguity`
      );
    }

    // Every group member must complete before service-starting steps.
    const serviceStarters = ['factory-boot', 'agent-swarm'];
    for (const starter of serviceStarters) {
      assert.ok(
        plan.findIndex((s) => s.id === starter) > last,
        `${starter} must run after the probe group`
      );
    }

    // No other step may declare a group.
    assert.equal(
      plan.filter((s) => s.parallelGroup && s.parallelGroup !== 'preflight-probes').length,
      0,
      'no second parallel group without an independence proof'
    );
  });
});

describe('boot pipeline data-flow ordering (#176)', () => {
  it('starts the llm provider tester only after the agent swarm (Redis bus)', () => {
    const plan = toBootPlan(
      createBootPipeline(mockDeps(), { profile: 'goldberg', skipOnboard: true })
    );
    const swarmIdx = plan.findIndex((s) => s.id === 'agent-swarm');
    const testerIdx = plan.findIndex((s) => s.id === 'llm-provider-tester');
    assert.ok(swarmIdx >= 0, 'agent-swarm step present');
    assert.ok(testerIdx > swarmIdx,
      'provider tester must launch after agent-swarm: without Redis its registration fails and the continuous loop degenerates to one-shot mode'
    );
    const tester = plan[testerIdx];
    assert.equal(tester.critical, false, 'tester stays warning-only');
    assert.ok(
      (tester.notes ?? []).some((n) => n.includes('#176')),
      'ordering rationale recorded in plan notes'
    );
  });

  it('does not claim a Redis dependency for supercycle', () => {
    const plan = toBootPlan(
      createBootPipeline(mockDeps(), { profile: 'goldberg', skipOnboard: true })
    );
    const supercycleIdx = plan.findIndex((s) => s.id === 'supercycle');
    const swarmIdx = plan.findIndex((s) => s.id === 'agent-swarm');
    assert.ok(
      supercycleIdx < swarmIdx,
      'supercycle has no Redis dependency (verified: zero Redis references in supercycle-flywheel.cjs) and stays before stack steps'
    );
  });
});
