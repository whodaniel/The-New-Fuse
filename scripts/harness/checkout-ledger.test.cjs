#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');
const { repoIdentity, verifyCheckout, findRowForCwd } = require('./checkout-ledger.cjs');

const repoRoot = path.resolve(__dirname, '..', '..');
const identity = repoIdentity(repoRoot);
assert.ok(identity.fingerprint);
assert.ok(identity.sharedPrimary);

const sharedRow = {
  checkoutId: 'co_test_shared',
  kind: 'shared',
  path: identity.sharedPrimary,
  pathReal: identity.sharedPrimary,
  branch: null,
  state: 'active',
  heartbeatAt: new Date().toISOString(),
};
const ok = verifyCheckout(sharedRow, identity, identity.sharedPrimary);
assert.equal(ok.ok, true, ok.reasons.join('; '));

const bad = verifyCheckout(sharedRow, identity, os.tmpdir());
assert.equal(bad.ok, false);
assert.ok(bad.reasons.some((r) => /does not match/.test(r)));

const ledger = { checkouts: [sharedRow] };
assert.equal(findRowForCwd(ledger, identity.sharedPrimary).checkoutId, 'co_test_shared');

console.log('checkout-ledger.test.cjs: OK');
