#!/usr/bin/env node

/**
 * TNF Grant Issuer — mints links in the authority delegation chain.
 *
 * Canonical implementations now reside in @the-new-fuse/control-plane-contracts.
 * This module re-exports the canonical primitives for CLI, scripts, and legacy consumers.
 *
 * @see packages/control-plane-contracts/src/grant-issuer.ts
 * @see packages/database/src/drizzle/schema/authority-grants.ts
 * @see docs/protocols/TNF_AUTHORITY_IDENTIFIER_STANDARD.md
 */

'use strict';

const path = require('node:path');

let contracts;
try {
  contracts = require('@the-new-fuse/control-plane-contracts');
} catch {
  contracts = require(path.resolve(__dirname, '../../packages/control-plane-contracts'));
}

const {
  issueGrant,
  issueOperatorRoot,
  renewGrant,
  DEFAULT_TTL_SECONDS,
  MAX_CROSS_RESIDENCY_TTL_SECONDS,
} = contracts;

module.exports = {
  issueGrant,
  issueOperatorRoot,
  renewGrant,
  DEFAULT_TTL_SECONDS,
  MAX_CROSS_RESIDENCY_TTL_SECONDS,
};
