import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from '../build.js';
import type { ExtractResult } from '../extract/index.js';
import { assertValid, validateExtraction } from '../validate.js';

const validNode = { id: 'a.ts', label: 'a.ts', kind: 'file' as const, sourceFile: 'a.ts' };
const otherNode = { id: 'a.ts#f', label: 'f', kind: 'function' as const, sourceFile: 'a.ts' };

test('accepts a well-formed extraction', () => {
  const errors = validateExtraction({
    nodes: [validNode, otherNode],
    edges: [
      { source: 'a.ts', target: 'a.ts#f', relation: 'defines', confidence: 'EXTRACTED' },
    ],
  });
  assert.deepEqual(errors, []);
});

test('rejects an edge with no confidence label', () => {
  const errors = validateExtraction({
    nodes: [validNode, otherNode],
    edges: [{ source: 'a.ts', target: 'a.ts#f', relation: 'defines' }],
  });
  assert.equal(errors.length, 1);
  assert.match(errors[0] as string, /no valid confidence label/);
});

test('rejects a confidence value outside the vocabulary', () => {
  const errors = validateExtraction({
    nodes: [validNode, otherNode],
    edges: [
      { source: 'a.ts', target: 'a.ts#f', relation: 'defines', confidence: 'PROBABLY' },
    ],
  });
  assert.equal(errors.length, 1);
  assert.match(errors[0] as string, /PROBABLY/);
});

test('rejects an unknown relation and a bad source location', () => {
  const errors = validateExtraction({
    nodes: [{ ...validNode, sourceLocation: 'line 4' }],
    edges: [{ source: 'a.ts', target: 'b.ts', relation: 'sortOf', confidence: 'EXTRACTED' }],
  });
  assert.ok(errors.some((e) => /sourceLocation/.test(e)));
  assert.ok(errors.some((e) => /relation must be one of/.test(e)));
});

test('rejects duplicate node ids and self-edges', () => {
  const errors = validateExtraction({
    nodes: [validNode, validNode],
    edges: [{ source: 'a.ts', target: 'a.ts', relation: 'calls', confidence: 'EXTRACTED' }],
  });
  assert.ok(errors.some((e) => /duplicated/.test(e)));
  assert.ok(errors.some((e) => /self-edge/.test(e)));
});

test('assertValid throws and lists every error', () => {
  assert.throws(
    () => assertValid({ nodes: [validNode], edges: [{ source: 'a.ts', target: 'b' }] }),
    /Invalid extraction \(2 errors\)/
  );
});

test('build refuses an extraction whose edge has no confidence', () => {
  // The gate is at the choke point, not only in the linter: an extractor that
  // forgot a label cannot get its edges into the graph.
  const bad = {
    nodes: [validNode, otherNode],
    edges: [{ source: 'a.ts', target: 'a.ts#f', relation: 'defines' }],
    unresolvedCalls: [],
    failures: [],
    filesExtracted: 1,
  } as unknown as ExtractResult;
  assert.throws(() => build(bad), /no valid confidence label/);
});
