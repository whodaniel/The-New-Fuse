# 🛠️ Durable Local Runtime Mandate

**Status:** ACTIVE **Tier:** Tier 2 — Operating & State Freshness (The Harness)
**Classified By:** Governance Auditor (Case: repo-root resolver drift,
2026-08-24)

**Tier placement note:** initially drafted under Tier 1 (Core Governance),
reclassified to Tier 2 on reconciliation review. This is operational/runtime
discipline ("session startup, runtime execution" — Tier 2's own scope), not a
constitutional axiom. See §5 for why the three obvious homes (Turn Zero, State
Freshness, Artifacts Lifecycle) were each insufficient rather than folding this
into one of them.

## 1. The Tenet

> **Local runtime state under `~/.tnf/` (and any locally-installed wrapper or
> launcher, e.g. `~/.local/bin/tnf*`) is a build output of this checkout,
> produced by a versioned installer under `scripts/install-*` / `scripts/lib/`.
> It is never a hand-maintained file.**

A fix applied directly to a file under `~/.tnf/` fixes exactly one machine, for
exactly as long as nothing re-runs that file's installer. It is not durable (a
reinstall, a fresh clone, or the installer's own periodic self-heal silently
reverts it) and it is not transferable (no other tenant running this framework
benefits from it). The fix belongs in the generator, in source control.

## 2. Case study: six independent repo-root resolvers

On 2026-08-24, a report of
`tnf-status authority missing: /Users/.../Repos/tnf-monorepo/...` led to
discovering the same "find the TNF checkout" logic implemented **six separate
times**, independently, all with the same latent flaw (validating a candidate
directory by _marker-file existence only_, never confirming it's a live git work
tree — so an orphaned/broken git worktree that still has the marker file
physically on disk was silently accepted as authoritative):

1. `scripts/lib/resolve-tnf-repo.cjs` — the actual canonical Node resolver, used
   by the installers below to decide what they're installing _from_.
2. `scripts/install-tnf-host-wrappers.cjs`'s `buildStatusWrapper()` /
   `buildUpdateFromLatestWrapper()` — bash logic embedded as template strings,
   generating `~/.tnf/tnf-status` and `~/.tnf/update-from-latest.sh`.
3. `scripts/install-tnf-cli.sh`'s heredoc, generating `~/.local/bin/tnf`.
4. `scripts/runtime/subdirector-autopilot-loop.cjs`'s `resolveRepoRoot()` — a
   bespoke candidate list, independent of all of the above.
5. `~/.tnf/config.json` (`workspace.path`) / `~/.tnf/config.yaml`
   (`core.workspace`) — static, hand-set values that drifted stale after a
   directory reorg and only kept working because someone manually created a
   compatibility symlink.
6. `scripts/runtime/tnf-director-loop.cjs`'s `DEFAULT_REPO_ROOT` — a fifth
   _technique_ (`path.resolve(__dirname, '..', '..')`, i.e. self-location) that
   silently resolves to the wrong directory if the file is ever copied somewhere
   other than its canonical location (confirmed: a `~/.tnf/bin/` copy of this
   exact file resolved to `$HOME` instead of the checkout).

The first attempted fix hand-edited the _deployed_ artifacts
(`~/.tnf/tnf-status`, `~/.local/bin/tnf`,
`~/.tnf/bin/subdirector-autopilot-loop.cjs`) directly. A
`tnf-status.pre-resolve-<timestamp>.bak` backup found during that same session
proved `install-tnf-host-wrappers.cjs` had _already run once that day on its
own_ — meaning the hand-edit was already scheduled to be silently overwritten
back to the vulnerable version the next time it ran. That's this mandate's proof
case, not a hypothetical.

## 3. The rule going forward

Before editing anything under `~/.tnf/` or `~/.local/bin/tnf*` by hand:

1. **Stop.** Check whether a generator already exists
   (`scripts/install-*.{sh,cjs}`, `scripts/lib/*`). It almost certainly does —
   every artifact in the table above did.
2. Fix the generator's _source template_ (or the shared library it
   `require()`s/`source`s), not the file it produced.
3. If no generator exists yet for a given `~/.tnf/`-installed file, that itself
   is a gap: either build one (preferred) or, at minimum, record the gap
   explicitly in the relevant protocol doc rather than leaving a silent,
   un-reproducible manual copy as the only record of how that file got there.
4. Re-run the (now-fixed) installer for real, and verify its _output_, not just
   the source diff — a fixed generator that was never executed proves nothing.
5. One canonical algorithm, not N reimplementations: a bootstrap wrapper that
   must resolve its own checkout before it can trust anything inside that
   checkout (e.g. `~/.tnf/tnf-status`) has to embed its resolution logic
   self-contained — that's fine, and unavoidable. Everything else (any script
   that already knows it's running from inside, or has already-installed access
   to, a resolved checkout) should `require()` / `source` the one shared
   resolver (`scripts/lib/resolve-tnf-repo.cjs` / `.sh`) instead of writing its
   own candidate list.
6. A candidate directory is authoritative only if it **both** has the expected
   marker file **and** passes `git -C <dir> rev-parse --is-inside-work-tree`.
   File existence alone is not sufficient — see §2. Any new resolver, anywhere
   in this codebase, must include this check.

## 4. Known gaps at time of writing

- **Closed 2026-08-24 (reconciliation pass):**
  `scripts/runtime/subdirector-autopilot-loop.cjs` had no installer deploying it
  to `~/.tnf/bin/` — whatever put it there originally was a manual, unversioned
  copy, and it was re-synced by hand at least once.
  `scripts/install-tnf-host-wrappers.cjs` now deploys it via the same
  backup-then-copy discipline as the resolver library files (`installRepoFile`).
  `scripts/runtime/subdirector-autopilot-service.sh` remains the separate
  _service launcher_ for the deployed copy — installer and service launcher are
  deliberately separate concerns.
- **Deliberately out of scope:**
  `scripts/runtime/local-subdirector-runtime.cjs`. Unlike
  subdirector-autopilot-loop.cjs, it does not consume
  `resolve-tnf-repo.{cjs,sh}` or resolve a checkout at all (confirmed by
  inspection — it operates purely on `os.homedir()`-relative `~/.tnf/*` state
  paths). It is not part of _this_ mandate's problem class; how it gets deployed
  is a separate question for whoever owns it.
- `~/.tnf/config.json` / `~/.tnf/config.yaml`'s `workspace`/`workspace.path`
  fields are still hand-set values, just corrected to the current path — not yet
  unified with the resolver's cache pointer (`~/.tnf/repo-root`). Unifying them
  is a follow-up.

## 5. Related protocols — and why this isn't just a section of one of them

- [`TURN_ZERO_MANDATE.md`](./TURN_ZERO_MANDATE.md) — governs _session_
  bootstrap/hydration (what to load, in what order, before acting). This mandate
  governs a narrower, prior question: whether the local files Turn Zero and
  everything else _reads_ were even produced correctly in the first place. Turn
  Zero assumes `~/.tnf/` is trustworthy; this mandate is what keeps that
  assumption true.
- [`STATE_FRESHNESS_MANDATE.md`](./STATE_FRESHNESS_MANDATE.md) — governs
  _volatile facts_ (remote refs, PR state, work-tree identity) needing a current
  receipt instead of being asserted from memory. Repo-root resolution is
  adjacent (it's also "don't trust what you assumed") but is about _generation
  provenance_ of local files, not _empirical re-verification_ of remote/mutable
  facts — different failure mode, different fix shape (a validated resolver +
  installer, not a receipt TTL).
- [`TNF_ARTIFACTS_LIFECYCLE_PROTOCOL.md`](./TNF_ARTIFACTS_LIFECYCLE_PROTOCOL.md)
  — the closest sibling; also about `~/.tnf/` artifact hygiene, also motivated
  by a real incident. But its axis is **retention** (persistent logic vs.
  transient state vs. open tasks; what to prune, what to never delete). This
  mandate's axis is **provenance** (what generates a file, and whether
  hand-editing the output instead of the generator is ever acceptable — it
  isn't). A file can pass Artifacts Lifecycle (correctly classified, correctly
  retained) while still violating this mandate (hand-edited instead of
  regenerated from source). Neither subsumes the other; both apply to the same
  directory for different reasons.
- [`AUTHORITY_INTEGRATION_MAP.md`](./AUTHORITY_INTEGRATION_MAP.md) — the broader
  authority-surface guard this mandate's resolver feeds into.
- [`HOST_LIFECYCLE/host_lifecycle_protocol.md`](./HOST_LIFECYCLE/host_lifecycle_protocol.md)
  (#177) — the sibling protocol for reconciling _third-party_ host tool installs
  (Cursor, Claude, Kilo, etc.) against drift; this mandate is the same
  discipline applied to TNF's own local runtime instead.
