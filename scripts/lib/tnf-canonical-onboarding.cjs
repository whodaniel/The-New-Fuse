#!/usr/bin/env node

/**
 * Canonical raw-agent onboarding semantics (issue #176).
 *
 * Single source of truth consumed by every operator-facing surface
 * (scripts/tnf-onboard.cjs templates, scripts/runtime/tnf-status.cjs).
 * New sessions enter through the manifest-derived onboard gate (`tnf:onboard`
 * → scripts/tnf-onboard-twip.cjs), which derives Stage A from FRONTLOAD_MANIFEST,
 * verifies task routes + host injection, and classifies write-readiness before
 * mutations.
 *
 * Naming law: "Turn Zero" means Turn Zero V2. There is no competing current
 * Turn Zero. The executable is scripts/protocols/turn-zero-v2-gate.cjs; the law
 * is docs/protocols/TURN_ZERO_MANDATE.md (TNF Turn Zero Mandate — V2).
 *
 * The old hand-maintained "await my confirmation" Turn Zero copy/paste ritual
 * is retired; surfaces must consume these constants instead of carrying their
 * own copy so they cannot drift back into a competing manual onboarding flow.
 */

'use strict';

const TURN_ZERO_PROTOCOL_NAME = 'Turn Zero V2';
const TURN_ZERO_GATE = 'scripts/protocols/turn-zero-v2-gate.cjs';
const TURN_ZERO_LAW = 'docs/protocols/TURN_ZERO_MANDATE.md';

const CANONICAL_RAW_AGENT_PROMPT =
  'Before planning or acting, run Turn Zero V2 (current Turn Zero) from the repository root: pnpm run tnf:onboard -- --task "<current task>". It runs scripts/protocols/turn-zero-v2-gate.cjs, derives Stage A from docs/core/FRONTLOAD_MANIFEST.md, verifies task routes and host injection, and classifies write-readiness before any mutation. Law: docs/protocols/TURN_ZERO_MANDATE.md.';

module.exports = {
  TURN_ZERO_PROTOCOL_NAME,
  TURN_ZERO_GATE,
  TURN_ZERO_LAW,
  CANONICAL_RAW_AGENT_PROMPT,
};
