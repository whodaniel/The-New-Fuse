/**
 * Scaffold test stubs for @the-new-fuse/mcp-cloud-redis-bridge.
 *
 * These are scaffolding-only — real round-trip tests would require a
 * running Redis instance and a known identity keypair. The placeholders
 * below are intended to grow into:
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
