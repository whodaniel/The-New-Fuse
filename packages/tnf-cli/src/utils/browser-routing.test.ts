import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildAgentBrowserArgs,
  normalizeAgentBrowserOperation,
  resolveTnfRepoRoot,
} from './browser-routing.js';

const here = path.dirname(fileURLToPath(import.meta.url));

assert.equal(normalizeAgentBrowserOperation('state-load'), 'state_load');
assert.equal(normalizeAgentBrowserOperation('state_save'), 'state_save');
// Global hyphen replace: every '-' becomes '_'
assert.equal(normalizeAgentBrowserOperation('state-load'), 'state_load');
assert.throws(() => normalizeAgentBrowserOperation('explode'), /Unsupported browser operation/);

assert.deepEqual(
  buildAgentBrowserArgs({
    operation: 'open',
    target: 'https://example.com',
    profile: 'Default',
    headed: true,
    json: true,
  }),
  ['--profile', 'Default', 'open', 'https://example.com', '--headed', '--json']
);

assert.deepEqual(
  buildAgentBrowserArgs({
    operation: 'state_load',
    target: '/tmp/auth.json',
    session: 'tnf',
    json: false,
  }),
  ['--session', 'tnf', 'state', 'load', '/tmp/auth.json']
);

assert.deepEqual(
  buildAgentBrowserArgs({
    operation: 'close',
    session: 'tnf-main',
    json: false,
  }),
  ['--session', 'tnf-main', 'close']
);

const root = resolveTnfRepoRoot(here);
assert.ok(fs.existsSync(path.join(root, 'packages', 'tnf-cli', 'package.json')));

// Even when startDir is outside the repo, fall back via MODULE_DIR
const fromTmp = resolveTnfRepoRoot(path.join(os.tmpdir(), 'tnf-not-a-repo'));
assert.equal(fromTmp, root);

console.log('browser-routing.test.ts OK');
