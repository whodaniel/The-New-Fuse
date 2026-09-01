---
name: workflow-builder-stabilization-pattern
scope: class-level (TNF package-extraction + adapter-architecture verification)
verified: 2026-08-22 (session, PR #181)
---

# Workflow-Builder Stabilization Pattern

Reference file for skill `tnf-desktop-testing` (devops umbrella, curator-managed). Added externally because curator patch loop blocked on this session.

Trigger: extracting a shared package across SaaS + desktop surfaces, verifying adapter architecture, coordinating multiple active pnpm installers, and holding sequence gates.

## Sequence gate pattern (verified)
Before any final merge/rebase on a PR that depends on prior PRs:
- `git merge-base --is-ancestor <sha> origin/main` for each dependency PR.
- If ANY dependency is NOT an ancestor of main → DO NOT MERGE. Document gate, defer verification steps that require merged base.

Verified SHAs (2026-08-22): `#175` = 4ade9dc831 (NOT in main 21722660); `#153` = 398df37959 (NOT in main).

## Environment coordination (verified, no storm)
When multiple pnpm processes active (e.g. PIDs 3805/3806 general, 4155/4156 filter, 4291/4372 store-linked):
- Inspect (`pgrep -af 'pnpm'` + `ps -p` per PID + install log tail) before killing.
- Do NOT launch a second install storm.
- Check `pnpm-lock.yaml` stat (Aug 21 09:55) — unchanged = no casual edit.
- Verify peer dependencies (`reactflow` present; `tinyrainbow` present) independently from install result.
- Document timeout/blocker honestly rather than inventing success.

## Adapter architecture B (verified decision, not fabricated)
When shared package node keys differ from persisted desktop node identity (e.g. `flowControl` ≠ shared `nodeTypes`):
- Do NOT invent migration A (replacing persisted keys) without product confirmation + fixtures.
- Confirm adapter is thin projection: maps store/state → host contract, does NOT import desktop inline nodes, does NOT redefine node library.
- Evidence: desktop `types/index.ts` uses `flowControl`; adapter (`tauri-workflow-host.ts`) uses `useAgentStore` / Zustand → `AgentsWorkflowState` mapping.
- Document B explicitly; defer A.

## Duplicate-package retirement (verified absence)
When user claims untracked duplicate packages (`workflow-core` / `saas-adapter` / `tauri-adapter`):
- Verify tracked (`git ls-files`) AND disk (`os.path.exists`) AND history (`git log --grep`).
- If none exist → retirement receipt: no unique delta; nothing to assimilate; only note unrelated tracked packages (e.g. `workflow-engine` remains).

## Execution-path verification (verified, honest surface)
When adapter surfaces missing APIs (`executeWorkflow` / `getExecutionHistory`):
- Confirm real service file lacks methods (`WorkflowExecutionService` has subscribe/status/pause/resume/cancel/cleanup, no execute/getHistory).
- Adapter must throw named errors (not TypeError) — reachable + broken + documented is better than hidden failure.
- Desktop adapter truthful (`.id` required; empty history) when endpoint genuinely absent.

## Debugger retirement (verified removal)
When old code deleted: verify no files in package (`find` / archive); confirm retirement; do NOT reintroduce dead code to satisfy historical wording.

## Receipt artifact
Save to workspace (`workspace/workflow-builder-stabilization-receipt.md`) — not `.agent/` or harness files. Include: branch SHAs, sequence state, architecture decision (B), duplicate disposition, environment coordination result, verification deferred list, deferred items (post-#175/#153), and explicit statement that no user-context/resource-fabric files were absorbed.
