/**
 * Enforcement guard for --permission-mode / --allowed-tools / --disallowed-tools.
 *
 * These flags previously existed only as descriptions on the root program;
 * nothing read them. The failure mode being guarded here is a regression back
 * to that state — a flag that parses, prints nicely, and grants everything.
 * Every assertion below is about what the resolver actually SUBTRACTS.
 *
 * Run: pnpm --filter @the-new-fuse/tnf-cli test
 */
import {
  KNOWN_TOOLS,
  modeDisablesAutonomy,
  normalizePermissionMode,
  resolvePermissions,
} from './ToolPermissionService.js';

let pass = 0;
let fail = 0;

function check(name: string, cond: boolean, detail = ''): void {
  if (cond) {
    console.log(`  PASS  ${name}`);
    pass += 1;
  } else {
    console.log(`  FAIL  ${name} ${detail}`);
    fail += 1;
  }
}

console.log('\ntool permissions — mode parsing');

check('empty defaults to default', normalizePermissionMode(undefined) === 'default');
check('exact match', normalizePermissionMode('plan') === 'plan');
check('case-insensitive', normalizePermissionMode('PLAN') === 'plan');
check('kebab spelling peers use', normalizePermissionMode('accept-edits') === 'acceptEdits');
check(
  'kebab spelling peers use (2)',
  normalizePermissionMode('bypass-permissions') === 'bypassPermissions'
);
check(
  'unknown falls back to default, not to open',
  normalizePermissionMode('nonsense') === 'default'
);

console.log('\ntool permissions — the mode actually restricts');

const dflt = resolvePermissions({ mode: 'default' });
check('default allows the full catalog', dflt.allowed.length === KNOWN_TOOLS.length);
check('default allows mutation', dflt.mutationsAllowed === true);

const plan = resolvePermissions({ mode: 'plan' });
check('plan removes bash', !plan.allowed.includes('bash'));
check('plan removes write_file', !plan.allowed.includes('write_file'));
check('plan removes browser_interact', !plan.allowed.includes('browser_interact'));
check('plan keeps read_file', plan.allowed.includes('read_file'));
check('plan keeps search_files', plan.allowed.includes('search_files'));
check('plan keeps mcp_list_tools', plan.allowed.includes('mcp_list_tools'));
check('plan removes mcp_call_tool', !plan.allowed.includes('mcp_call_tool'));
check('plan reports no mutation', plan.mutationsAllowed === false);
check(
  'plan is strictly smaller than default (the whole point)',
  plan.allowed.length < dflt.allowed.length,
  `${plan.allowed.length} vs ${dflt.allowed.length}`
);

const readOnly = resolvePermissions({ mode: 'readOnly' });
check('readOnly matches plan', readOnly.allowed.join() === plan.allowed.join());

console.log('\ntool permissions — allow/deny lists');

const allowOnly = resolvePermissions({ allowedTools: 'read_file,bash' });
check('allowlist narrows to exactly what was asked', allowOnly.allowed.join() === 'read_file,bash');
check('allowlist keeps mutation when bash is in it', allowOnly.mutationsAllowed === true);

const denied = resolvePermissions({ disallowedTools: 'bash,write_file,browser_interact' });
check('denylist removes named tools', !denied.allowed.some((t) => t === 'bash'));
check('denylist alone still treats MCP calls as mutating', denied.mutationsAllowed === true);

const deniedAllMutating = resolvePermissions({
  disallowedTools: 'bash,write_file,browser_interact,mcp_call_tool',
});
check('denylist can drop mutation entirely', deniedAllMutating.mutationsAllowed === false);

const denyWins = resolvePermissions({ allowedTools: 'bash,read_file', disallowedTools: 'bash' });
check(
  'deny wins over allow — a denied tool cannot be re-granted',
  denyWins.allowed.join() === 'read_file',
  denyWins.allowed.join()
);

const planPlusAllow = resolvePermissions({ mode: 'plan', allowedTools: 'bash' });
check(
  'an allowlist cannot widen past the mode baseline',
  planPlusAllow.allowed.length === 0 && !planPlusAllow.mutationsAllowed,
  planPlusAllow.allowed.join()
);
check(
  'no tools resolves to the "none" sentinel agents-run understands',
  planPlusAllow.enableTools === 'none'
);

console.log('\ntool permissions — operator errors surface');

const typo = resolvePermissions({ allowedTools: 'read_file,bahs' });
check('unknown tool names are reported, not ignored', typo.unknownTools.join() === 'bahs');
check('known names in the same list still apply', typo.allowed.join() === 'read_file');

console.log('\ntool permissions — enableTools wiring');

check('default hands a concrete list to agents-run', dflt.enableTools.includes('bash'));
check('plan hands a list without bash', !plan.enableTools.includes('bash'));
check(
  'enableTools always matches allowed',
  plan.enableTools === plan.allowed.join(','),
  plan.enableTools
);

console.log('\ntool permissions — autonomy interlock');

check('plan disables autonomy', modeDisablesAutonomy('plan') === true);
check('readOnly disables autonomy', modeDisablesAutonomy('readOnly') === true);
check('default does not', modeDisablesAutonomy('default') === false);
check('bypassPermissions does not', modeDisablesAutonomy('bypassPermissions') === false);

console.log(`\ntool-permissions: ${pass} passed, ${fail} failed\n`);
if (fail > 0) process.exit(1);
