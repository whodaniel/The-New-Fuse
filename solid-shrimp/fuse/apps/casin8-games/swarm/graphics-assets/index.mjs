import { assertString } from '../shared/contracts.mjs';

const SCREEN_CATALOG = Object.freeze([
  'poker-lobby',
  'cash-ring-table',
  'tournament-lobby',
  'multitable-view',
  'hand-replayer',
  'agent-sponsor-marketplace',
  'wallet-cashier',
  'trust-center',
  'player-profile-stats',
  'spectator-observer',
  'mobile-tablet-action-bar',
]);

const STYLE_DNA = Object.freeze({
  universe: 'ai-arcade-adjacent sci-fantasy, high-trust crypto-fintech poker room',
  palette: ['deep navy', 'emerald', 'royal red', 'royal blue', 'royal purple', 'royal gold'],
  materials: ['glassmorphism', 'brushed metal', 'carbon fiber', 'frosted holographic panels'],
  atmosphere: ['space-tech for cyborgs and bots', 'subtle particles', 'cinematic gradients'],
  constraints: ['no video poker aesthetics', 'focus on multiplayer poker economy'],
});

export function getScreenCatalog() {
  return [...SCREEN_CATALOG];
}

export function scoreReference(reference) {
  assertString(reference.id, 'reference.id');
  assertString(reference.url, 'reference.url');

  const completeness = Number(reference.completeness || 0);
  const harmony = Number(reference.harmonyWithAiArcade || 0);
  const originality = Number(reference.originality || 0);
  const clarity = Number(reference.informationClarity || 0);

  const weighted = completeness * 0.35 + harmony * 0.30 + originality * 0.20 + clarity * 0.15;
  return {
    ...reference,
    score: Number(weighted.toFixed(3)),
  };
}

export function rankReferences(references) {
  if (!Array.isArray(references)) {
    throw new Error('references must be an array');
  }
  return references
    .map(scoreReference)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}

export function buildMasterGraphicsPrompt({ appName = 'Casin8 Poker Room', screens = SCREEN_CATALOG }) {
  assertString(appName, 'appName');
  if (!Array.isArray(screens) || screens.length === 0) {
    throw new Error('screens must be a non-empty array');
  }

  const blocks = screens.map((screen, idx) => `${idx + 1}. ${screen}`);

  return [
    `Design ${appName} as a multiplayer-first crypto poker app, not video poker.`,
    `Style DNA: ${STYLE_DNA.universe}.`,
    `Palette: ${STYLE_DNA.palette.join(', ')}.`,
    `Materials: ${STYLE_DNA.materials.join(', ')}.`,
    `Atmosphere: ${STYLE_DNA.atmosphere.join(', ')}.`,
    `Constraints: ${STYLE_DNA.constraints.join(', ')}.`,
    'Required screen set:',
    ...blocks,
    'For each screen include desktop + mobile variants, explicit loading/error/reconnect/disabled states, and production-ready component specs.',
  ].join('\n');
}

export function buildNanoBananaImagePrompt({ screen, detailLevel = 'ultra', includeAnimationFrames = true }) {
  assertString(screen, 'screen');
  const animationClause = includeAnimationFrames
    ? 'Include 3 keyframes (idle, interaction, confirmation) with consistent camera framing.'
    : 'Single hero frame only.';

  return [
    `Create ${detailLevel} fidelity UI concept art for ${screen}.`,
    `Universe: ${STYLE_DNA.universe}.`,
    `Color range: ${STYLE_DNA.palette.join(', ')} with disciplined contrast and legibility.`,
    `Material language: ${STYLE_DNA.materials.join(', ')}.`,
    `Do not produce slot machine, roulette, blackjack, or video poker motifs.`,
    `Highlight trust UX: provably fair controls, transaction lifecycle, network health.` ,
    animationClause,
  ].join(' ');
}

export function createAssetManifest({ rankedReferences = [], screens = SCREEN_CATALOG }) {
  if (!Array.isArray(rankedReferences)) {
    throw new Error('rankedReferences must be an array');
  }

  return {
    generatedAt: new Date().toISOString(),
    scope: 'poker-only',
    screens: [...screens],
    topReferences: rankedReferences.slice(0, 12).map((ref) => ({
      id: ref.id,
      url: ref.url,
      score: ref.score,
      tags: Array.isArray(ref.tags) ? ref.tags : [],
    })),
    styleDNA: STYLE_DNA,
  };
}
