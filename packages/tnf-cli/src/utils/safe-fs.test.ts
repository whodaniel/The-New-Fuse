import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { safeJsonParse, safeReadJson, writeFileAtomic } from './safe-fs.js';

describe('safeJsonParse', () => {
  it('returns fallback on invalid JSON', () => {
    assert.deepEqual(safeJsonParse('not json', { ok: false }), { ok: false });
    assert.equal(safeJsonParse('', null), null);
    assert.equal(safeJsonParse('null', null), null);
  });

  it('parses valid JSON', () => {
    assert.deepEqual(safeJsonParse('{"a":1}'), { a: 1 });
    assert.deepEqual(safeJsonParse('[1,2,3]'), [1, 2, 3]);
  });
});

describe('safeReadJson', () => {
  it('returns fallback for missing files', () => {
    assert.equal(
      safeReadJson(path.join(os.tmpdir(), 'tnf-safefs-' + Date.now() + '-missing.json')),
      null
    );
  });

  it('returns fallback for torn-write contents', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-safefs-'));
    try {
      const file = path.join(dir, 'torn.json');
      fs.writeFileSync(file, '{"a":1,'); // truncated
      assert.equal(safeReadJson(file), null);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('parses valid files', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-safefs-'));
    try {
      const file = path.join(dir, 'good.json');
      fs.writeFileSync(file, '{"a":2}');
      assert.deepEqual(safeReadJson(file), { a: 2 });
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('writeFileAtomic', () => {
  it('writes content and replaces destination', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-safefs-'));
    try {
      const file = path.join(dir, 'state.json');
      writeFileAtomic(file, '{"v":1}');
      assert.equal(fs.readFileSync(file, 'utf8'), '{"v":1}');
      // Overwrite
      writeFileAtomic(file, '{"v":2}');
      assert.equal(fs.readFileSync(file, 'utf8'), '{"v":2}');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('leaves no .tmp-* files behind on success', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-safefs-'));
    try {
      const file = path.join(dir, 'state.json');
      writeFileAtomic(file, 'ok');
      const stray = fs.readdirSync(dir).filter((n) => n.includes('.tmp-'));
      assert.equal(stray.length, 0, `unexpected tmp files: ${stray.join(', ')}`);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('creates the parent directory if missing', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-safefs-'));
    try {
      const nested = path.join(root, 'a', 'b', 'c.json');
      writeFileAtomic(nested, 'hi');
      assert.equal(fs.readFileSync(nested, 'utf8'), 'hi');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
