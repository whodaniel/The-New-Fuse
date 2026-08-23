#!/usr/bin/env node

// Issue #176 — operator-facing onboarding surfaces must derive from canonical
// tnf:onboard semantics, never from a hand-maintained "await my confirmation"
// ritual. Guards scripts/tnf-onboard.cjs against regressing to the stale
// Turn Zero copy/paste prompt that leaked into ~/.tnf/tnf-status.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');
const ONBOARD = path.join(ROOT, 'scripts', 'tnf-onboard.cjs');
const STALE_RITUAL =
  'await my confirmation before executing any code changes';
const STALE_FULL =
  'Execute the Turn Zero Mandate exactly as outlined in ./docs/protocols/TURN_ZERO_MANDATE.md';

test('tnf-onboard.cjs carries no manual confirmation ritual', () => {
  const source = fs.readFileSync(ONBOARD, 'utf8');
  assert.ok(
    !source.includes(STALE_RITUAL),
    'stale "await my confirmation" ritual text must not reappear'
  );
  assert.ok(
    !source.includes(STALE_FULL),
    'hand-maintained Turn Zero copy/paste prompt must not reappear'
  );
});

test('canonical raw-agent prompt is defined once and references tnf:onboard authority', () => {
  const source = fs.readFileSync(ONBOARD, 'utf8');
  assert.match(
    source,
    /const CANONICAL_RAW_AGENT_PROMPT =[\s\S]*?tnf:onboard -- --task/,
    'single canonical constant pointing at pnpm run tnf:onboard'
  );
  // The constant is consumed by all four operator-facing surfaces
  // (system-prompt template, resource-map template, onboarding template,
  // raw-session console output) rather than duplicated literals.
  const usages = source.split('CANONICAL_RAW_AGENT_PROMPT').length - 1;
  assert.equal(
    usages,
    5,
    'one definition + four consumption sites (issue #176 evidence)'
  );
});

test('canonical onboarding entry exists in package.json and on disk', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const entry = pkg.scripts && pkg.scripts['tnf:onboard'];
  assert.ok(entry, 'package.json defines tnf:onboard');
  const scriptRel = entry.replace(/^node\s+/, '');
  assert.ok(
    fs.existsSync(path.join(ROOT, scriptRel)),
    `tnf:onboard target exists: ${scriptRel}`
  );
});
