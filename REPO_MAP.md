# TNF Repo Map — where the code lives (verified 2026-11-21)

There are three TNF repos. They do NOT contain the same code, and the V3 code
was never merged into the monorepo. Any agent or person working here should
start from this map, not from any single repo's own docs — those docs disagree
with each other (see "Contradictory docs" below).

## whodaniel/tnf-v3-monorepo (private) — the only home of the V3 code

- All 12 V3 packages (`@the-new-fuse-v3/*`: tnf-core, context-fabric-runtime,
  context-fabric-mcp, relay-runtime, relay-compat, product-contracts,
  migration-ledger, parity-rig, code-graph-adapter, source-adapter,
  bus-auth-node, redis-node), the V3 API and CLI apps, schemas, and deploy
  configs. No frontend app exists in this repo, and there is no Rust in it.
- The full V2→V3 migration record (`migration/`, 1,275 files — over half the
  repo). Preserve it as-is; it is the audit trail of the V2→V3 program.
- Last commit 2026-11-13 (main `96b9b0397c23`). Silent since. No CI, no sync
  script, no path for this code to reach the public repo.

## whodaniel/tnf-monorepo (private) — where active development happens

- Live product development on the V2 architecture, latest commit 2026-11-20
  (main `80ec9bb5282141`). ~100 packages and 12 apps, including the frontend —
  the only repo with a frontend. The only Rust in the fleet lives here
  (3 Cargo.toml: Tauri desktop, a Cloudflare accelerator, a relay-core
  native envelope validator).
- It has its own parallel implementations of the same components (its own
  tnf-core, relay-core, api, cli). These are NOT the V3 packages.
- Release forwarding runs from HERE, via `scripts/sync-repos.sh`
  (`pnpm run sync:repos`, manual — no GitHub Actions in any repo): a filtered
  copy goes to the public `The-New-Fuse` (proprietary paths replaced by stubs)
  and to private `fuse-control-plane`. The public repo lags: neither the
  Nov 17 nor the Nov 20 monorepo work had been forwarded as of Nov 21.

## whodaniel/The-New-Fuse (public) — publication of the monorepo line only

- A filtered publication of tnf-monorepo (90.6% of its files trace to the mono
  line). Last updated 2026-11-13 (main `43dc21c334cde`, unchanged since).
  Nothing from V3 has ever reached it.

## How the repos relate

- V3 was seeded from a one-time file snapshot of the monorepo at commit
  `87d2111c8ff` (2026-09-21) and given a fresh history starting 2026-09-22.
  A snapshot is not a merge: the two repos share ZERO commits, on any branch
  (743 v3 commits vs 12,882 mono commits).
- 86.1% of the v3 repo's files (2,085 of 2,421) exist nowhere in the monorepo.
  The shared content is almost entirely the `.agent/` skills layer
  (325 of 336 shared files) — not product code.
- Consolidation is not a git operation: disjoint histories plus parallel
  implementations mean unifying them would be a component-by-component
  porting project. Do not attempt a merge; raise it as a decision for Daniel.

## Contradictory docs (do not trust either one alone)

- tnf-v3-monorepo `docs/foundation/WHY_V3.md` and
  `docs/collaboration/FLEET_ROUTING.md` call the monorepo "frozen" and v3 the
  home of all new work. Reality: new work landed in the monorepo; v3 stopped
  Nov 13.
- tnf-monorepo `docs/REPO_SEPARATION.md` says "ALL development happens in
  whodaniel/tnf-monorepo" and does not mention v3 as a development home.
  Reality: the V3 product code and the deployed V3 services live only in v3.
- This map, dated 2026-11-21 and verified against fresh clones at commit and
  file-content level (remote heads re-checked 2026-11-21), supersedes both
  claims until Daniel decides otherwise.
