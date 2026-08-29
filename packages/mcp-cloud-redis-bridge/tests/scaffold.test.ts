/**
 * Scaffold test stubs for @the-new-fuse/mcp-cloud-redis-bridge.
 *
 * These are scaffolding-only — real round-trip tests would require a
 * running Redis instance and a known identity keypair (and, in this
 * environment, `@modelcontextprotocol/sdk` is not installed, so the server
 * module cannot be imported and exercised directly). The placeholders below
 * are intended to grow into:
 *
 *   1. JSON-schema shape tests (no I/O) — verify each tool's inputSchema.
 *   2. Boot test — boot the stdio server, send initialize, send tools/list.
 *   3. Identity round-trip — set_identity → bootstrap_identity equivalence.
 *   4. Cycle-state read — assert read_super_cycle_state returns a hash.
 *
 * Once Redis + keys are available in CI, swap the placeholder bodies for the
 * real assertions described above. Keep the export shape so `pnpm test`
 * always exits 0 until the test harness exists.
 *
 * @see ../README.md for tooling overview and authorization model.
 *
 * --- TNF-P0 CONTAINMENT REGRESSION (2026-08-25) -----------------------
 * The `containment` block below is a source-level regression suite for the
 * MCP Director identity incident: `set_director_identity` and
 * `broadcast_super_director_prompt` were disabled fail-closed because both
 * let a caller self-assert privileged identity (see README "Authorization
 * model"). These tests are static source-text assertions, not behavioral
 * I/O tests — same constraint as the rest of this file (no SDK, no Redis
 * available here) — but they isolate each tool's case body via brace
 * matching so the assertions are precise about *that* handler, not the
 * whole file.
 */

import { strict as assert } from 'node:assert';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(here, '..');

function scaffoldTest(name: string, fn: () => void | Promise<void>) {
  return async () => {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
    } catch (err: any) {
      console.error(`  ✗ ${name}: ${err.message}`);
      throw err;
    }
  };
}

/**
 * Extract the body of `case '<label>': { ... }` from a switch statement via
 * brace matching (a regex can't safely handle nested braces/backtick
 * template expressions). Returns the body text between the case's opening
 * `{` and its matching closing `}`, exclusive of both braces.
 */
function extractCaseBody(src: string, label: string): string {
  const marker = `case '${label}': {`;
  const start = src.indexOf(marker);
  assert.ok(start !== -1, `case '${label}' not found`);
  const bodyStart = start + marker.length;
  let depth = 1;
  let i = bodyStart;
  for (; i < src.length && depth > 0; i += 1) {
    if (src[i] === '{') depth += 1;
    else if (src[i] === '}') depth -= 1;
  }
  assert.ok(depth === 0, `unbalanced braces scanning case '${label}'`);
  return src.slice(bodyStart, i - 1);
}

/**
 * Strip `//` line comments before checking for dangerous code patterns, so
 * a maintainer describing the incident in prose (which necessarily quotes
 * the offending code, e.g. `authorizedIdentity = parsed`) doesn't trip a
 * regression assertion that only cares about *executable* code.
 */
function stripLineComments(body: string): string {
  return body
    .split('\n')
    .map((line) => line.replace(/\/\/.*$/, ''))
    .join('\n');
}

const tests = {
  'package.json declares MCP scaffold': scaffoldTest('package.json OK', () => {
    const pkg = JSON.parse(readFileSync(join(pkgRoot, 'package.json'), 'utf8'));
    assert.equal(pkg.name, '@the-new-fuse/mcp-cloud-redis-bridge');
    assert.ok(pkg.dependencies['@modelcontextprotocol/sdk'], 'sdk dep required');
    assert.ok(pkg.dependencies.zod, 'zod dep required');
  }),

  'dist is built': scaffoldTest('dist/index.js exists', () => {
    assert.ok(existsSync(join(pkgRoot, 'dist', 'index.js')), 'run pnpm build');
  }),

  'index.ts declares 6 tools': scaffoldTest('tool count', async () => {
    const src = readFileSync(join(pkgRoot, 'src', 'index.ts'), 'utf8');
    const declared = [
      'set_director_identity',
      'broadcast_super_director_prompt',
      'verify_master_clock_signal',
      'read_super_cycle_state',
      'bootstrap_identity',
      'get_terminal_access',
    ];
    for (const name of declared) {
      assert.ok(src.includes(`name: '${name}'`), `missing tool: ${name}`);
    }
  }),

  'transports via stdio': scaffoldTest('stdio transport', async () => {
    const src = readFileSync(join(pkgRoot, 'src', 'index.ts'), 'utf8');
    assert.ok(src.includes("StdioServerTransport"), 'stdio transport required');
  }),

  'Redis client targets env-configurable URL': scaffoldTest('redis URL', async () => {
    const src = readFileSync(join(pkgRoot, 'src', 'RedisClient.ts'), 'utf8');
    assert.ok(src.includes('CLOUD_REDIS_URL'), 'env var name required');
    assert.ok(src.includes("'tnf:bus:ingress'"), 'default ingress channel');
  }),

  // ---- TNF-P0 containment regression: set_director_identity ----------

  'set_director_identity cannot be elevated by supplying wallet/nft strings':
    scaffoldTest('set_director_identity denies unconditionally', () => {
      const src = readFileSync(join(pkgRoot, 'src', 'index.ts'), 'utf8');
      const body = extractCaseBody(src, 'set_director_identity');
      const code = stripLineComments(body);
      // The old vulnerable line: caller-supplied fields copied straight into
      // the trust variable with no verification.
      assert.ok(
        !code.includes('authorizedIdentity = parsed'),
        'set_director_identity must not assign caller input to authorizedIdentity'
      );
      assert.ok(
        !/authorizedIdentity\s*=/.test(code),
        'set_director_identity must not write authorizedIdentity at all'
      );
      // Must fail closed with an explicit, unconditional throw — not a
      // silent no-op success response.
      assert.ok(/throw new Error/.test(code), 'must throw an explicit denial');
      assert.ok(
        !/return\s*\{/.test(code),
        'must not return a success response (silent fallback)'
      );
    }),

  // ---- TNF-P0 containment regression: broadcast_super_director_prompt --

  'broadcast_super_director_prompt cannot be reached via invokerAgentId, nft id, or a literal signature':
    scaffoldTest('broadcast_super_director_prompt denies unconditionally', () => {
      const src = readFileSync(join(pkgRoot, 'src', 'index.ts'), 'utf8');
      const body = extractCaseBody(src, 'broadcast_super_director_prompt');
      const code = stripLineComments(body);

      // Must fail closed, unconditionally, before any bus write.
      assert.ok(/throw new Error/.test(code), 'must throw an explicit denial');
      assert.ok(
        !code.includes('redisClient.publish'),
        'must not publish to the ingress bus under any input'
      );

      // Supplying a "privileged" invokerAgentId string must no longer do
      // anything — the old string-equality gate must be gone from this case.
      assert.ok(
        !code.includes('authorizedInvokers.includes(invokerAgentId)'),
        'must not gate on a caller-supplied invokerAgentId string'
      );

      // The non-cryptographic "signature" must no longer be attached to any
      // outgoing envelope from this handler.
      assert.ok(
        !code.includes('nft-authorized:'),
        'must not attach the template-literal pseudo-signature'
      );
      assert.ok(
        !/envelope\.sig\s*=/.test(code),
        'must not set envelope.sig at all in this handler'
      );

      // A denial reachable regardless of prior state: the throw must not be
      // gated behind a conditional that a caller could satisfy (e.g. "only
      // deny if !authorizedIdentity" — that would let a caller who first
      // hits set_director_identity, or an operator-booted identity, through).
      const firstStatement = code.trim().split('\n').find((l) => l.trim().length > 0) || '';
      assert.ok(
        !firstStatement.trim().startsWith('if'),
        'the denial must not be conditional on prior authorizedIdentity state'
      );
    }),

  // ---- legitimate unrelated MCP behavior is preserved ------------------

  'unrelated tools are unaffected by the containment patch': scaffoldTest(
    'bootstrap_identity / read_super_cycle_state / get_terminal_access / verify_master_clock_signal intact',
    () => {
      const src = readFileSync(join(pkgRoot, 'src', 'index.ts'), 'utf8');

      const bootstrap = extractCaseBody(src, 'bootstrap_identity');
      assert.ok(
        bootstrap.includes('SecurityService.generateNodeKeys()'),
        'bootstrap_identity must still generate keys'
      );
      assert.ok(!/throw new Error/.test(bootstrap), 'bootstrap_identity must not be disabled');

      const cycleState = extractCaseBody(src, 'read_super_cycle_state');
      assert.ok(
        cycleState.includes("redisClient.hGetAll('tnf:master:super-cycle')"),
        'read_super_cycle_state must still read cycle state'
      );
      assert.ok(!/throw new Error/.test(cycleState), 'read_super_cycle_state must not be disabled');

      const terminalAccess = extractCaseBody(src, 'get_terminal_access');
      assert.ok(
        terminalAccess.includes('CLOUD_RUNTIME_PUBLIC_DOMAIN'),
        'get_terminal_access must still resolve the terminal URL'
      );
      assert.ok(!/throw new Error/.test(terminalAccess), 'get_terminal_access must not be disabled');

      // verify_master_clock_signal is intentionally left reachable (it only
      // decrypts using a key the operator supplied at boot; it grants no
      // bus-write authority) — confirm the patch did not touch it either.
      const verifySignal = extractCaseBody(src, 'verify_master_clock_signal');
      assert.ok(
        verifySignal.includes('SecurityService.verifyAndDecryptSignal'),
        'verify_master_clock_signal must still decrypt via SecurityService'
      );

      // All 6 tools must still be advertised in tools/list.
      const declared = [
        'set_director_identity',
        'broadcast_super_director_prompt',
        'verify_master_clock_signal',
        'read_super_cycle_state',
        'bootstrap_identity',
        'get_terminal_access',
      ];
      for (const name of declared) {
        assert.ok(src.includes(`name: '${name}'`), `tools/list must still declare ${name}`);
      }
    }
  ),
};

let failed = 0;
for (const [name, test] of Object.entries(tests)) {
  try {
    await test();
  } catch (err: any) {
    console.error(`  ${name}: ${err.message ?? err}`);
    failed += 1;
  }
}

if (failed > 0) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}

console.log('\nAll scaffold checks passed.');
