#!/usr/bin/env node
'use strict';
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { parseStageEntries, hydrateStage } = require('./frontload-manifest.cjs');

test('parses Stage A paths from the manifest table', () => {
  const text = `# x\n## Stage A — Orientation\n| # | Path | Role |\n|---|---|---|\n| 1 | \`a.md\` | A |\n| 2 | \`b.json\` | B |\n\n## Stage B — Other\n| Path | Role |\n|---|---|\n| \`c.md\` | C |`;
  assert.deepStrictEqual(parseStageEntries(text, 'A').map((x) => x.path), ['a.md', 'b.json']);
  assert.deepStrictEqual(parseStageEntries(text, 'B').map((x) => x.path), ['c.md']);
});

test('hydrates full files and emits content hashes without hard-coded rail lists', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-frontload-'));
  fs.mkdirSync(path.join(root, 'docs/core'), { recursive: true });
  fs.writeFileSync(path.join(root, 'docs/core/FRONTLOAD_MANIFEST.md'), `## Stage A — Orientation\n| # | Path | Role |\n|---|---|---|\n| 1 | \`a.md\` | A |\n| 2 | \`b.json\` | B |\n`);
  fs.writeFileSync(path.join(root, 'a.md'), 'alpha');
  fs.writeFileSync(path.join(root, 'b.json'), '{"beta":true}');
  const receipt = hydrateStage({ root, stage: 'A', consumer: 'test' });
  assert.strictEqual(receipt.ok, true);
  assert.strictEqual(receipt.entries.length, 2);
  assert.ok(receipt.entries.every((x) => /^[a-f0-9]{64}$/.test(x.sha256)));
});

test('fails closed when a manifest-derived rail is missing', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-frontload-'));
  fs.mkdirSync(path.join(root, 'docs/core'), { recursive: true });
  fs.writeFileSync(path.join(root, 'docs/core/FRONTLOAD_MANIFEST.md'), `## Stage A — Orientation\n| # | Path | Role |\n|---|---|---|\n| 1 | \`missing.md\` | A |\n`);
  const receipt = hydrateStage({ root, stage: 'A', consumer: 'test' });
  assert.strictEqual(receipt.ok, false);
  assert.strictEqual(receipt.entries[0].status, 'missing');
});
