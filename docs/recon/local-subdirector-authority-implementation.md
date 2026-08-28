# Local Subdirector Authority Implementation

## 1. Before State
- `tnf agent` (tnf-cli-agent) identified as `director` by default.
- No central authority config (`.tnf/local-subdirector.json`).
- Autonomy flag (`--autonomous`) was evaluated merely as a flag, with no concept of a "Local Subdirector" capability boundary.
- Child/subordinate agents had implicit identical permissions as the parent.
- Action receipts (`action-receipt.ts`) did not capture the actor, realm, or authority grant.

## 2. Enforcement Points Touched
- `packages/tnf-cli/src/cli.ts`:
  - Added `local-subdirector` to `AGENT_ROLE_TRAITS`.
  - Updated `loadDefaultAgentIdentity()` to default to `local-subdirector`.
  - Updated `runAgentsRun` call payload (`autonomous = true`) if identity matches and autonomy is enabled.
  - Injected `...receiptProps` into `recordCommandOutcome` covering `actor`, `localRealm`, and `authorityGrant`.
- `packages/tnf-cli/src/commands/agents-run.ts`:
  - Updated `executeBuiltinTool` dispatch to check `LocalSubdirectorAuthorityService.isAuthorized`.
  - Added Subordinate delegation check via `TNF_DELEGATED_AUTHORITY`.
- `packages/tnf-cli/src/commands/subdirector.ts`:
  - Added `autonomy` subcommand to enable/pause autonomy and grant/revoke capabilities.
- `packages/tnf-cli/src/utils/action-receipt.ts`:
  - Evolved schema to `tnf/action-receipt/0.2`.
  - Included `actor`, `localRealm`, `authorityGrant`, and `delegatedAuthority` in the log.
- `packages/tnf-cli/src/services/LocalSubdirectorAuthorityService.ts`:
  - Created to manage the `.tnf/local-subdirector.json` state.

## 3. Remaining Bypasses
- Raw script executions (`python scripts/...`) directly from the user bypass the CLI layer.
- `mcp_call_tool` doesn't enforce individual MCP tool boundaries yet, just the whole `mcp_call_tool` capability.
- Explicit `--tools` might still override visibility, though `executeBuiltinTool` blocks execution.

## 4. Tests Performed
- **Normal local bootstrap**: Verified `tnf agent` defaults to `local-subdirector`.
- **Narrowing**: Verified `tnf subdirector autonomy --revoke bash` causes `Authority Denied: Capability 'bash' is not granted to Local Subdirector.`
- **Pause/Resume**: Verified `tnf subdirector autonomy --pause` blocks tools.
- **Delegation**: Configured `TNF_DELEGATED_AUTHORITY` for a subordinate agent and verified it limits tools.

## 5. Exact Commands
- Enable autonomy: `tnf subdirector autonomy --enable`
- Grant capability: `tnf subdirector autonomy --grant bash read_file`
- Revoke capability: `tnf subdirector autonomy --revoke write_file`
- Pause autonomy: `tnf subdirector autonomy --pause`
- View status: `tnf subdirector autonomy --status`

## 6. Unknowns
- How does `TNF_DELEGATED_AUTHORITY` interact with `ToolPermissionService.ts` for deep subagent trees?
- Are cron jobs (`subdirector-local-cli-agent-cycle.sh`) fully subject to the autonomy pause flag?
