#!/usr/bin/env node

/**
 * Canonical raw-agent onboarding semantics (issue #176).
 *
 * Single source of truth consumed by every operator-facing surface
 * (scripts/tnf-onboard.cjs templates, scripts/runtime/tnf-status.cjs).
 * New sessions enter through the manifest-derived onboard gate (`tnf:onboard`
 * → scripts/tnf-onboard-twip.cjs), which derives Stage A from FRONTLOAD_MANIFEST,
 * verifies task routes + host injection, and classifies write-readiness before
 * mutations. The old hand-maintained "await my confirmation" Turn Zero
 * copy/paste ritual is retired; surfaces must consume this constant instead of
 * carrying their own copy so they cannot drift back into a competing manual
 * onboarding flow.
 */

'use strict';

const CANONICAL_RAW_AGENT_PROMPT =
  'Before planning or acting, run canonical TNF onboarding from the repository root: pnpm run tnf:onboard -- --task "<current task>". It derives Stage A from docs/core/FRONTLOAD_MANIFEST.md, verifies task routes and host injection, and classifies write-readiness before any mutation.';

module.exports = { CANONICAL_RAW_AGENT_PROMPT };
