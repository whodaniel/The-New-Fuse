# TNF Agent Resource Convergence

Use this skill when the task involves consolidating local agent resources, mapping installed CLI/desktop harness internals, deduplicating skills/prompts/rules, migrating agent resources into TNF, reducing duplicated host storage, adding a new host adapter, or handling reusable artifacts discovered during a TNF PARODY + ASSIMILATE cycle.

## Authority

Read first:
- `docs/protocols/TNF_AGENT_RESOURCE_CONVERGENCE_PROTOCOL.md`
- `data/harness/agent-resource-fabric.json`
- `data/harness/skill-publisher-registry.json`

When the task begins from an external agent/capability rather than a known resource path, also read:
- `.agent/skills/tnf-parody-assimilate-cycle/SKILL.md`
- `.agent/skills/tnf-skill-ubiquity-propagation/SKILL.md` when many runtimes need the retained skill/resource.

For host startup/injection changes also read:
- `scripts/install-agent-frontload.cjs`
- `scripts/harness/provision-injection-surfaces.cjs`

For session/memory/state convergence, use the existing memory compaction/freshness contracts rather than treating stateful stores as static duplicate files. For user-owned context/provider paths, reconcile with the existing user-context storage workstream instead of inventing a parallel model.

## Relationship to assimilation

Assimilation and Resource Fabric are different layers:

- **Assimilation** decides what distinctive external capability is worth retaining, checks existing TNF coverage, and codifies the gap TNF-native.
- **Resource Fabric** receives only the retained **reusable read-mostly artifacts** whose semantics have already been classified: skills, prompts, rules, templates, agent definitions, and non-secret reusable metadata.
- **Provider routing/host binding** stays in existing provider/host authorities.
- **Stateful history/memory** stays in memory/compaction/freshness.
- **User-owned durable context** stays in the user-context storage mandate.
- **Secrets** stay in machine-private credential storage.

Use `node scripts/harness/assimilation-scan.cjs --json` when the boundary is unclear. Never resurrect `.agent/assimilation-routes.json` as a second provider/resource registry.

## Workflow

1. **Refresh authority** — run Turn Zero and confirm canonical repo/head/workstream ownership.
2. **Discover** — inspect only documented or empirically observed host paths. Unknown hosts remain `discovery-required`.
3. **Classify semantic ownership first** — if the source came from another agent, run the parody/assimilate gap matrix before deciding the files belong in Resource Fabric.
4. **Scan** — run `node scripts/harness/agent-resource-converge.cjs scan --json` (optionally `--host <id>`).
5. **Plan** — review duplicate groups, reclaimable bytes, exclusions, and redirect readiness.
6. **Import** — use `import` to content-address eligible bytes. This is non-destructive.
7. **Redirect only when proven** — a host surface must have a verified adapter strategy. Never flip `redirectVerified` based on assumption.
8. **Verify** — run fabric verification plus a fresh-session host probe before considering a redirect complete.
9. **Prune later** — disk reclamation happens only after verified redirect + retention policy + rollback proof.
10. **Propagate** — update host profile, relevant assimilation/skill evidence, protocol docs, shared coordination state, and handoff.

## Invariants

- Same hash means same bytes, not same authority, semantics, publisher, or trust.
- One shared resource object may have many host/path/consumer facets.
- Secrets never enter the fabric.
- Stateful "agent brains" require export/compaction adapters; do not file-dedupe databases or histories.
- Import never deletes originals.
- Redirect fails closed unless the adapter is verified.
- Host correctness outranks disk savings.
- Do not create provider-specific TNF resource silos; host specificity belongs at the adapter edge.
- Assimilation decides semantic retention; Resource Fabric provides reusable artifact identity/storage after that decision.
