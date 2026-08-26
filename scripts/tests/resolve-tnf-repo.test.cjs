#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { describe, it, before, after } = require('node:test');

const {
  resolveTnfRepo,
  hasStatusAuthority,
  writePointer,
  POINTER_PATH,
} = require('../lib/resolve-tnf-repo.cjs');

const LIVE = path.resolve(__dirname, '../..');

describe('resolve-tnf-repo', () => {
  let previousPointer = null;
  let pointerExisted = false;

  before(() => {
    pointerExisted = fs.existsSync(POINTER_PATH);
    if (pointerExisted) previousPointer = fs.readFileSync(POINTER_PATH, 'utf8');
  });

  after(() => {
    try {
      if (pointerExisted && previousPointer != null) {
        fs.writeFileSync(POINTER_PATH, previousPointer);
      } else if (!pointerExisted && fs.existsSync(POINTER_PATH)) {
        // leave pointer if installer/tests wrote a valid one for the live checkout
      }
    } catch {
      // ignore restore failures in disposable CI sandboxes
    }
  });

  it('resolves the live checkout via explicit path', () => {
    const resolved = resolveTnfRepo(LIVE);
    assert.equal(resolved, LIVE);
    assert.equal(hasStatusAuthority(resolved), true);
  });

  it('prefers TNF_REPO_DIR over stale pointer', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-resolve-'));
    writePointer(tmp); // invalid / incomplete
    const prev = process.env.TNF_REPO_DIR;
    process.env.TNF_REPO_DIR = LIVE;
    try {
      const resolved = resolveTnfRepo(null);
      assert.equal(resolved, LIVE);
    } finally {
      if (prev === undefined) delete process.env.TNF_REPO_DIR;
      else process.env.TNF_REPO_DIR = prev;
      writePointer(LIVE);
    }
  });

  it('skips an invalid explicit path and still finds a live checkout', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-empty-'));
    const resolved = resolveTnfRepo(tmp);
    assert.ok(resolved);
    assert.equal(hasStatusAuthority(resolved), true);
  });
});
