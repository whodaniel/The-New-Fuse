#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { describe, it, before, after } = require('node:test');

const { execFileSync } = require('node:child_process');

const {
  resolveTnfRepo,
  hasStatusAuthority,
  hasAuthority,
  writePointer,
  normalizeOriginSlug,
  POINTER_PATH,
} = require('../lib/resolve-tnf-repo.cjs');

const LIVE = path.resolve(__dirname, '../..');

// Build a throwaway directory that LOOKS like a valid checkout (marker file
// + real git repo) but has a non-canonical (or missing) origin, to exercise
// contract element (c) — canonical remote identity — in isolation from (a)
// and (b), which the pre-existing tests above already cover.
function makeFakeCheckout({ origin } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-fake-checkout-'));
  fs.mkdirSync(path.join(dir, 'scripts', 'runtime'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'scripts', 'runtime', 'tnf-status.cjs'), '// fake\n');
  execFileSync('git', ['-C', dir, 'init', '-q']);
  if (origin) {
    execFileSync('git', ['-C', dir, 'remote', 'add', 'origin', origin]);
  }
  return dir;
}

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

  it('prefers TNF_ROOT_DIR (the pre-existing ~70-script convention) over a stale pointer', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-resolve-root-'));
    writePointer(tmp);
    const prev = process.env.TNF_ROOT_DIR;
    process.env.TNF_ROOT_DIR = LIVE;
    try {
      const resolved = resolveTnfRepo(null);
      assert.equal(resolved, LIVE);
    } finally {
      if (prev === undefined) delete process.env.TNF_ROOT_DIR;
      else process.env.TNF_ROOT_DIR = prev;
      writePointer(LIVE);
    }
  });

  it('rejects a candidate with the marker file and real git but a non-canonical origin', () => {
    const fake = makeFakeCheckout({ origin: 'https://github.com/whodaniel/The-New-Fuse.git' });
    try {
      assert.equal(hasStatusAuthority(fake), false, 'publication-target origin must be rejected');
      assert.equal(hasAuthority(fake), false);
    } finally {
      fs.rmSync(fake, { recursive: true, force: true });
    }
  });

  it('rejects a candidate with the marker file and real git but no origin remote at all', () => {
    const fake = makeFakeCheckout();
    try {
      assert.equal(hasStatusAuthority(fake), false);
    } finally {
      fs.rmSync(fake, { recursive: true, force: true });
    }
  });

  it('accepts a candidate whose origin normalizes to the canonical slug via ssh form', () => {
    const fake = makeFakeCheckout({ origin: 'git@github.com:whodaniel/tnf-monorepo.git' });
    try {
      assert.equal(hasStatusAuthority(fake), true);
    } finally {
      fs.rmSync(fake, { recursive: true, force: true });
    }
  });

  it('normalizeOriginSlug tolerates https, ssh, trailing slash, and case variation', () => {
    const expected = 'whodaniel/tnf-monorepo';
    assert.equal(normalizeOriginSlug('https://github.com/whodaniel/tnf-monorepo.git'), expected);
    assert.equal(normalizeOriginSlug('git@github.com:whodaniel/tnf-monorepo.git'), expected);
    assert.equal(normalizeOriginSlug('https://github.com/WhoDaniel/TNF-Monorepo/'), expected);
    assert.equal(normalizeOriginSlug(''), null);
    assert.equal(normalizeOriginSlug(null), null);
  });
});
