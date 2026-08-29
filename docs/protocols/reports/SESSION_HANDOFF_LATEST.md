TNF_PROTOCOL_ACK

# RC PHASE B T2 — MCP-CORE TEST INTEGRITY REPAIR (SCOPED RECEIPT)

Scoped receipt for T2 on `fix/rc-phase-b-test-integrity-20260828` (base = T1
commit `bd465336a`). Covers the mcp-core teardown leak repairs, fixture
determinism fixes, and the broken test-script shell semantics.

Production lifecycle ownership (VERIFIED named owners):

- MCPServer request-timeout `setTimeout` cleared in `finally`.
- CircuitBreaker idempotent `stop()`, manager `stopAll()`, `remove()` stops
  before delete; `process.once('exit')` bandaid removed.
- ConnectionPoolMonitor / CacheMonitor / RBACManager constructor intervals
  stored and stopped via idempotent `stop()`.
- MonitoringSystem.stopComponents stops cacheMonitor + connectionPoolMonitor;
  shutdown() runs stopComponents even when not running.

Fixture teardown (real teardown, no bandaids): ConnectionManager.test now calls
`shutdown()` in afterEach (was closeAllConnections only — leaked the
health-check interval and signal handlers); MCPBroker.test stops the
never-stopped `errorBroker`; CircuitBreaker/RBAC/PermissionValidator/
SecurityIntegration stop their instances.

Determinism (no assertion weakening): RBAC cache test asserts cache identity;
ToolExecutionEngine timeout tests pin memory limit (whole-process heap sampling
raced the 64 MiB default); SecurityIntegration endDate captured after flush().

Script integrity: `pnpm test` was exiting 127 for every run because sh split the
unquoted `integration|performance` flag at the pipe. Ignore semantics moved into
jest.config.ts; scripts are now `jest --passWithNoTests`.

Verification (3 consecutive runs): `pnpm test` exit 0, 30/30 suites, 719/719
tests, zero force-exited workers, zero MaxListeners warnings; type-check exit 0;
agent suite 13/13 natural exit 0. No `--forceExit` used.

## Next Actions

- T3: regression guards (agent ESM `.js` import test; smallest mcp-core
  lifecycle regression test)
- T4: config-drift report (infrastructure/src tracked artifacts,
  tsconfig.test.json TS6307, ts-jest isolatedModules deprecation,
  ConnectionManager per-instance signal-handler hygiene)
- T5/T6: next RC candidate assembly and full Phase B matrix
