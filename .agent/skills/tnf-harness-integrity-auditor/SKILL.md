---
name: tnf-harness-integrity-auditor
category: tnf-platform
department: tech
description:
  Automated pre-flight quality gate auditor for TNF harness framework
  compliance. Verifies Turn Zero mandate adherence, local runtime environment
  boundaries (.tnf.local.env), package export maps, TS path mappings, and core
  governance tenets before handoffs.
---

# TNF Harness Integrity Auditor Skill

> **Objective:** Ensure all TNF harness runtimes, CLI services, and agent swarms
> satisfy canonical framework standards before code commits or session handoffs.

## 1. Automated Pre-Flight Quality Gates

Run these validation scripts to confirm harness integrity:

```bash
# 1. Turn Zero Mandate & Budget Check
node scripts/tnf-onboard.cjs --runtime-timeout-ms 1000

# 2. Local Environment Boundary Check
node scripts/protocols/validate-local-runtime-boundary.cjs

# 3. Operator Terminal Inviolability Guard Check
node scripts/protocols/check-operator-terminal-inviolability.cjs

# 4. Monorepo Package Compilation & Type-Check
pnpm --filter @the-new-fuse/tnf-cli exec tsc --noEmit
```

## 2. Package Export & Resolution Audit Standard

When modifying monorepo packages (`packages/*`), verify:

1. **ESM Export Map Integrity**: ESM packages (`"type": "module"`) MUST NOT
   include `"require": "./dist/index.js"` in their `"exports"` map if
   `./dist/index.js` is an ESM module.
2. **TS Path Mappings**: `tsconfig.json` files for CLI/runtime packages MUST
   include `"paths": { "@the-new-fuse/*": ["../*/src"] }` to resolve internal
   dependencies to `src/` during `tsx` dev execution.

## 3. Message Auth & Environment Guardrails

- **Warn Mode Default**: Ensure `TNF_MESSAGE_AUTH_MODE=warn` in `.tnf.local.env`
  until full public-key registry provisioning is complete.
- **Relay Port Fallback**: Verify relay connectivity on port `3000` (primary)
  and `3007` (standalone fallback).

## 4. Tenet Compliance Matrix

Every completed agent task must satisfy the **Core Tenets Matrix**:

- [ ] **Fleet Delegation**: Peer targets queried and utilized where applicable.
- [ ] **Attribution Cornerstone**: Substantive factual claims carry raw
      `resource_pointer` attribution.
- [ ] **Operating Loop**: All actions empirically verified via command output or
      log inspection.
- [ ] **Anti-Lobotomy**: `.agent/`, `.gemini/`, `.claude/`, `.tnf/` directories
      left intact.
