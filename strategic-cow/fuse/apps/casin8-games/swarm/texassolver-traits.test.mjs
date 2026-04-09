import test from 'node:test';
import assert from 'node:assert/strict';

import {
  summarizeTexasSolverActionMix,
  craftTraitsFromTexasSolver,
} from './agent-strategy/texassolver-traits.mjs';

test('texassolver trait summary aggregates combo strategy map', () => {
  const solverDump = {
    strategy: {
      actions: ['fold', 'call', 'raise'],
      strategy: {
        AhKh: [0.05, 0.35, 0.6],
        QsQh: [0.1, 0.2, 0.7],
        '7c6c': [0.25, 0.5, 0.25],
      },
    },
  };
  const out = summarizeTexasSolverActionMix({ solverDump });
  assert.equal(out.combosProcessed, 3);
  assert.equal(out.actionMix.raise > out.actionMix.fold, true);
  assert.equal(out.actionMix.vpip > 0.6, true);
});

test('texassolver trait craft resolves nested nodePath and returns actionable profile recommendation', () => {
  const solverDump = {
    root: {
      childrens: {
        raise: {
          strategy: {
            actions: ['fold', 'call', 'raise'],
            strategy: {
              AcKc: [0.05, 0.1, 0.85],
              QdJd: [0.1, 0.25, 0.65],
            },
          },
        },
      },
    },
  };
  const out = craftTraitsFromTexasSolver({
    agentId: 'agent-ts-1',
    solverDump,
    nodePath: ['raise'],
  });
  assert.equal(out.agentId, 'agent-ts-1');
  assert.equal(typeof out.recommended.style, 'string');
  assert.equal(typeof out.recommended.temperament, 'string');
  assert.equal(out.recommended.maxRiskBps > 0, true);
  assert.equal(out.recommended.styleOverrides.pfrBps <= out.recommended.styleOverrides.vpipBps, true);
});
