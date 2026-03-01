import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildWorkQueue,
  assignWorkLanes,
  detectAssignmentCollisions,
  buildExecutionBoard,
} from './orchestrator/index.mjs';
import {
  getScreenCatalog,
  rankReferences,
  buildMasterGraphicsPrompt,
  buildNanoBananaImagePrompt,
  createAssetManifest,
} from './graphics-assets/index.mjs';

test('orchestrator builds queue, assigns lanes, and avoids collisions', () => {
  const queue = buildWorkQueue({
    gapReport: {
      uncoveredDomains: ['swarm-realtime', 'graphics-assets', 'ui-poker-room'],
      activeDomains: {},
    },
    extraDomains: ['swarm-fairness'],
  });

  assert.equal(queue[0].domain, 'swarm-realtime');
  assert.equal(queue[0].priority >= queue[1].priority, true);

  const assignments = assignWorkLanes({
    workQueue: queue,
    agents: [
      { id: 'agent-alpha', lane: 'platform', capacity: 2, domains: ['swarm-realtime'] },
      { id: 'agent-beta', lane: 'design', capacity: 2, domains: ['graphics-assets', 'ui-poker-room'] },
    ],
    currentOwnership: {
      otherSwarm: ['swarm-fairness'],
    },
  });

  const collisionCheck = detectAssignmentCollisions(assignments);
  assert.equal(collisionCheck.ok, true);

  const board = buildExecutionBoard({ assignments, generatedAt: '2026-02-27T00:00:00.000Z' });
  assert.equal(board.includes('agent-alpha'), true);
  assert.equal(board.includes('agent-beta'), true);
});

test('graphics-assets ranks references and emits poker-only prompt + manifest', () => {
  const refs = rankReferences([
    {
      id: 'fav-a',
      url: 'https://stitch.withgoogle.com/projects/17721323542527226395',
      completeness: 9,
      harmonyWithAiArcade: 9,
      originality: 8,
      informationClarity: 8,
      tags: ['roulette', 'lighting'],
    },
    {
      id: 'fav-b',
      url: 'https://stitch.withgoogle.com/projects/3112669340205976824',
      completeness: 10,
      harmonyWithAiArcade: 10,
      originality: 9,
      informationClarity: 9,
      tags: ['poker', 'glassmorphism'],
    },
  ]);

  assert.equal(refs[0].id, 'fav-b');

  const catalog = getScreenCatalog();
  assert.equal(catalog.includes('cash-ring-table'), true);

  const master = buildMasterGraphicsPrompt({ screens: catalog.slice(0, 4) });
  assert.equal(master.includes('multiplayer-first crypto poker app, not video poker'), true);

  const imagePrompt = buildNanoBananaImagePrompt({ screen: 'cash-ring-table' });
  assert.equal(imagePrompt.includes('Do not produce slot machine, roulette, blackjack, or video poker motifs.'), true);

  const manifest = createAssetManifest({ rankedReferences: refs, screens: catalog.slice(0, 3) });
  assert.equal(manifest.scope, 'poker-only');
  assert.equal(manifest.topReferences.length, 2);
});
