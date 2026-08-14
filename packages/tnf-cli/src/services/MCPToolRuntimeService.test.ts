import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { MCPManagerService } from './MCPManagerService.js';
import { MCPToolRuntimeService } from './MCPToolRuntimeService.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../../..');
const configDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-real-mcp-runtime-'));

const manager = new MCPManagerService(configDir);
manager.addServer('tnf-complete-api-wrapper', {
  command: 'pnpm',
  args: ['exec', 'tsx', 'src/mcp/complete-api-mcp-server.ts'],
  cwd: repoRoot,
  enabled: true,
  type: 'local',
  transport: 'stdio',
});

const runtime = new MCPToolRuntimeService(repoRoot, manager);
const listed = await runtime.listTools('tnf-complete-api-wrapper', 20_000);
assert.equal(listed.length, 1);
assert.equal(listed[0].ok, true, listed[0].error);
assert.ok(
  listed[0].tools.some((tool) => tool.name === 'complete_api_probe'),
  JSON.stringify(listed[0].tools)
);

const called = await runtime.callTool('tnf-complete-api-wrapper', 'complete_api_probe', {}, 20_000);
assert.equal(called.ok, true, called.error);
const content = (called.result as any).content;
assert.ok(Array.isArray(content), JSON.stringify(called.result));
assert.match(String(content[0]?.text || ''), /complete-api MCP server is bound and operational/);

const missing = await runtime.listTools('missing-real-server', 5000);
assert.equal(missing[0].ok, false);
assert.match(missing[0].error || '', /not found/);

console.log('MCPToolRuntimeService.test.ts OK');
