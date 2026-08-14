import assert from 'node:assert/strict';
import { BUILTIN_TOOLS, resolveBuiltinTools } from './llm-tools.js';

const names = BUILTIN_TOOLS.map((t) => t.name);
assert.ok(names.includes('browser_interact'));
assert.ok(names.includes('web_fetch'));
assert.ok(names.includes('mcp_list_tools'));
assert.ok(names.includes('mcp_call_tool'));

const browser = BUILTIN_TOOLS.find((t) => t.name === 'browser_interact');
assert.ok(browser);
assert.equal(browser?.defaultEnabled, true);
const op = browser?.parameters.properties.operation as { enum?: string[] } | undefined;
assert.ok(Array.isArray(op?.enum));
assert.ok(op?.enum?.includes('state_load'));

const resolved = resolveBuiltinTools({ builtinTools: 'all' });
assert.ok(resolved.some((t) => t.name === 'browser_interact'));
assert.ok(resolved.some((t) => t.name === 'web_fetch'));
assert.ok(resolved.some((t) => t.name === 'mcp_list_tools'));
assert.ok(resolved.some((t) => t.name === 'mcp_call_tool'));
console.log('llm-tools.browser.test.ts OK');
