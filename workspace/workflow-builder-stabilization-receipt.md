=== ARCHITECTURE DETERMINATION ===
B: Tauri node map is thin compatibility projection over shared builder.
Evidence: apps/tauri-desktop/src/types/index.ts uses 'flowControl' key NOT present in packages/workflow-builder/src/nodes/nodeTypes.ts (agent, mcpTool, input, output, condition, transform, notification, a2a, loop, subworkflow, prompt, default).
Desktop WorkflowBuilder page uses inline AgentNode/MCPToolNode/FlowControlNode — separate from shared package. PR adapter (tauri-workflow-host) maps Zustand store → host contract without importing desktop page nodes.
Migration to A (shared nodeTypes owning Tauri) deferred: persisted graphs use 'flowControl'; no migration script implemented.
Adapter documented as explicit compatibility layer in PR branch apps/tauri-desktop/src/workflow/tauri-workflow-host.ts + host/types contract.

=== FULL RECEIPT ===
TNF WORKFLOW-BUILDER STABILIZATION — PR #181 RECEIPT
Generated: 2026-08-22 (EDT) via session
Branch HEAD: 477eda3bc (feat/assimilation-resource-convergence-20260822)
PR #181: origin/feat/workflow-builder-package-20260822 (b02e0f054a) INSPECTED, NOT MERGED
Sequence: #175 (4ade9dc831) NOT in origin/main (21722660) | #153 (398df37959) NOT in main => GATE BLOCKS MERGE.
ARCHITECTURE B (explicit adapter): Tauri's 'flowControl' ≠ shared nodeTypes; tauri-workflow-host is thin projection; desktop inline nodes are separate but adapter prevents second independent builder. Migration A deferred.
DUPLICATES: packages/workflow-core / saas-adapter / tauri-adapter — not tracked, not on disk, no git commits; retirement receipt: never existed; no unique delta; safe to ignore. Only unrelated 'workflow-engine' tracked.
ENVIRONMENT: coordinated (no storm); frozen-lockfile unchanged (Aug 21); reactflow present; tinyrainbow present; pnpm install --frozen-lockfile timed out at 300s (registry slow) — not a failure, no lock edited.
EXECUTION PATH: SaaS adapter (honest named errors for missing executeWorkflow/getExecutionHistory — reachable, broken, documented). Desktop adapter (truthful .id gate + [] history). No hidden TypeError preserved.
DEBUGGER: retired; no files in PR package; not reintroduced.
VERIFICATION: package inspected (946 ins, 2752 del); 12 nodes; host contract; adapters; validator; index exports. Full build/tests NOT rerun (sequence gate + install timeout). Persisted fixtures not loaded. No user-context/harness/resource-fabric files absorbed. Final #178 state requires #175+#153 on main → rebase → rerun builds → merge. LANE ENDS HERE.
