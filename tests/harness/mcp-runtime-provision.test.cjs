'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const runtime = require('../../scripts/harness/mcp-runtime-provision.cjs');

test('setTomlServer replaces a server and removes its nested secret environment', () => {
  const input = `model = "gpt"

[mcp_servers."exa"]
command = "npx"
args = ["-y", "exa-mcp-server"]

[mcp_servers."exa".env]
EXA_API_KEY = "private-value"

[mcp_servers.supabase]
url = "https://example.test"
`;
  const output = runtime.setTomlServer(input, 'exa', 'command = "/managed/exa"\nstartup_timeout_sec = 30');
  assert.doesNotMatch(output, /npx|EXA_API_KEY|private-value/);
  assert.match(output, /command = "\/managed\/exa"/);
  assert.match(output, /\[mcp_servers\.supabase\]/);
});

test('extractTomlEnv reads only the requested server environment', () => {
  const input = `[mcp_servers."other".env]
EXA_API_KEY = "wrong"
[mcp_servers."exa".env]
EXA_API_KEY = "right\\nvalue"
`;
  assert.equal(runtime.extractTomlEnv(input, 'exa', 'EXA_API_KEY'), 'right\nvalue');
});

test('shared JSON migration retires invalid kilo server and canonicalizes TNF entrypoints', () => {
  const input = {
    mcpServers: {
      'kilo-media-mcp': { command: 'npx', args: ['-y', 'kilo-mcp@latest'] },
      jules: { command: 'pnpm', args: ['exec', 'tsx', 'packages/jules-skill/src/mcp-server.ts'] },
      'tnf-core-server': { command: 'pnpm', args: ['exec', 'tsx', 'src/mcp/server.ts'] },
      filesystem: { command: 'npx', args: ['-y', '@modelcontextprotocol/server-filesystem', '/scope'] },
    },
  };
  const result = runtime.migrateSharedJson(input, '/managed');
  assert.equal(result.config.mcpServers['kilo-media-mcp'], undefined);
  assert.equal(result.config.mcpServers.jules, undefined);
  assert.match(result.config.mcpServers['tnf-core-server'].command, /node_modules\/\.bin\/tsx$/);
  assert.deepEqual(result.config.mcpServers.filesystem, { command: '/managed/bin/tnf-mcp-filesystem', args: ['/scope'] });
});

test('host audit detects runtime installers, mutable tags, and inline secrets', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-mcp-host-'));
  fs.mkdirSync(path.join(home, '.codex'), { recursive: true });
  fs.writeFileSync(path.join(home, '.codex/config.toml'), `[mcp_servers.exa]
command = "npx"
args = ["-y", "exa-mcp-server@latest"]
[mcp_servers.exa.env]
EXA_API_KEY = "secret"
`);
  const findings = runtime.hostConfigFindings(home, '/managed');
  assert.ok(findings.some((finding) => finding.includes('runtime package-manager')));
  assert.ok(findings.some((finding) => finding.includes('mutable version tag')));
  assert.ok(findings.some((finding) => finding.includes('inline EXA_API_KEY')));
  fs.rmSync(home, { recursive: true, force: true });
});

test('managed package policy is exact and integrity-pinned', () => {
  const policy = runtime.loadPolicy();
  assert.deepEqual(runtime.validatePolicy(policy), []);
  assert.match(runtime.releaseId(policy), /^[a-f0-9]{16}$/);
});
