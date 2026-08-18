#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Husky does not generate a `reference-transaction` shim — it is not in husky's
 * known-hook list — and `.husky/_/` is gitignored because husky regenerates it.
 * Without this step the pre-mutation guard would silently stop firing after any
 * `pnpm install`, which is the exact silent-non-enforcement failure the guard
 * exists to prevent. Runs from `prepare`, right after `husky`.
 */
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');
const shimDir = path.join(root, '.husky', '_');
const shim = path.join(shimDir, 'reference-transaction');
const hook = path.join(root, '.husky', 'reference-transaction');

try {
  if (!fs.existsSync(hook)) process.exit(0); // nothing to route
  if (!fs.existsSync(shimDir)) process.exit(0); // husky not installed here
  fs.writeFileSync(shim, '#!/usr/bin/env sh\n. "$(dirname "$0")/h"\n', { mode: 0o755 });
  console.log('[mutation-guard] reference-transaction shim installed');
} catch (error) {
  // Never fail an install over this.
  console.warn(`[mutation-guard] could not install shim: ${error.message}`);
}
