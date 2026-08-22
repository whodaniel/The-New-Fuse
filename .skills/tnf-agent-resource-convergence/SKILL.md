# TNF Agent Resource Convergence

Use this skill when the task involves consolidating local agent resources, mapping installed CLI/desktop harness internals, deduplicating skills/prompts/rules, migrating agent resources into TNF, reducing duplicated host storage, or adding a new host adapter.

## Authority

Read first:
- `docs/protocols/TNF_AGENT_RESOURCE_CONVERGENCE_PROTOCOL.md`
- `data/harness/agent-resource-fabric.json`
- `data/harness/skill-publisher-registry.json`

For host startup/injection changes also read:
- `scripts/install-agent-frontload.cjs`
- `scripts/harness/provision-injection-surfaces.cjs`

For session/memory/state convergence, use the existing memory compaction/freshness contracts rather than treating stateful stores as static duplicate files. For user-owned context/provider paths, reconcile with the existing user-context storage workstream instead of inventing a parallel model.

## Workflow

1. **Refresh authority** — run Turn Zero and confirm canonical repo/head/workstream ownership.
2. **Discover** — inspect only documented or empirically observed host paths. Unknown hosts remain `discovery-required`.
3. **Scan** — run `node scripts/harness/agent-resource-converge.cjs scan --json` (optionally `--host <id>`).
4. **Classify** — distinguish reusable read-mostly resources from secrets, mutable configs, and stateful/opaque stores.
5. **Plan** — run `plan`; review duplicate groups, reclaimable bytes, and redirect readiness.
6. **Import** — use `import` to content-address eligible bytes. This is non-destructive.
7. **Redirect only when proven** — a host surface must have a verified adapter strategy. Never flip `redirectVerified` based on assumption.
8. **Verify** — run fabric verification plus a fresh-session host probe before considering a redirect complete.
9. **Prune later** — disk reclamation happens only after verified redirect + retention policy + rollback proof.
10. **Propagate** — update the host profile, protocol evidence, shared coordination state, and handoff.

## Invariants

- Same hash means same bytes, not same authority or trust.
- One shared resource object may have many host/path/consumer facets.
- Secrets never enter the fabric.
- Stateful "agent brains" require export/compaction adapters; do not file-dedupe databases or histories.
- Import never deletes originals.
- Redirect fails closed unless the adapter is verified.
- Host correctness outranks disk savings.
- Do not create provider-specific TNF resource silos; host specificity belongs at the adapter edge.
