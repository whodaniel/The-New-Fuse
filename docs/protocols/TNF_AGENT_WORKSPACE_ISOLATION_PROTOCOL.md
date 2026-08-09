# 🧱 TNF Agent Workspace Isolation Protocol

**Status:** ACTIVE · **Class:** [CLASS:PRIME] · **Protocol ID:**
TNF*AGENT_WORKSPACE_ISOLATION_CANONICAL **Scope:** Every agent that writes to a
TNF repository — which \_physical workspace* it works in, and what it may do
there. **Location:** `docs/protocols/TNF_AGENT_WORKSPACE_ISOLATION_PROTOCOL.md`
**Machine policy:** `docs/protocols/agent-workspace-policy.json` **Companions:**
`TNF_CONCURRENT_AGENT_COORDINATION_PROTOCOL.md` (conceptual overlap),
`MULTI_AGENT_INTEGRATION_PROTOCOL.md` (git-level conflicts),
`AGENT_STATUS_LEDGER.md`.

> The companion protocols answer _"who owns this task"_ and _"how do we merge."_
> This one answers the question underneath both: **whose working tree am I
> standing in, and what am I allowed to do to it?** A tree-mutating command run
> in a shared checkout destroys other agents' work regardless of how well the
> task was coordinated.

---

## 1. Why this exists

Written from a measured incident on **2026-08-09**, not from theory. Four agents
(Claude, Codex, Cursor, plus fleet daemons) shared one checkout of
`The-New-Fuse`. In a single working day:

| Event                                                                                  | Cost                                                |
| -------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Two agents edited `SynergyStatusBar.tsx`, `Terminal.tsx`, `PageShell.tsx` concurrently | reads went stale in **< 60 s**                      |
| A branch-maintenance job ran `stash push` → `merge origin/main` → branch switch        | **~30 files** of uncommitted work erased, **twice** |
| Two `tauri build` runs contended on one `target/` dir                                  | **13 min** deadlock, neither progressed             |
| A `sync-repos --dry-run` copied ~1 GB into `/tmp`                                      | **ENOSPC**; killed a DMG build mid-flight           |
| Untracked deliverables (incl. `packages/claw-skills/`) sat in no stash and no commit   | survived only because nothing ran `git clean`       |

Only the first is a file-collision problem. The rest are workspace problems, and
the second row is the one that actually destroyed work.

### 1.1 The non-obvious hazard

`git stash push` **does not capture untracked files.** Whether an agent's work
survives a maintenance stash therefore depends on whether it happened to be
staged — an accident, not a policy. On 2026-08-09 three files (`populations.ts`,
two `.woff2`) survived only because an unrelated authority gate had blocked a
commit and left them in the index. `packages/claw-skills/` — which `openclaw`
and `picoclaw` **symlink into** — was untracked the whole time; a `git clean`
would have left both trees pointing at nothing.

**Corollary:** parking work with `git stash` is not a safe operation on a shared
tree. Committing to a scratch branch is, because it captures everything
deterministically, is named, appears in the reflog, and cannot be buried by the
next stash push.

---

## 2. The isolation ladder

Tier is a function of **task class**, resolved from
`docs/protocols/agent-workspace-policy.json` — not chosen ad hoc per run.

| Tier  | Workspace                  | For                                                | Real cost on this machine                                          |
| ----- | -------------------------- | -------------------------------------------------- | ------------------------------------------------------------------ |
| **0** | shared checkout, read-only | audits, inventories, investigation, reporting      | none                                                               |
| **1** | shared checkout            | single-file / short edits                          | none; requires commit-early discipline                             |
| **2** | shared checkout + lease    | multi-file work while other agents are active      | one lock file                                                      |
| **3** | git worktree               | multi-hour refactors, risky or broad changes       | ~3.3 GB (Rust `target/`); `node_modules` ≈ free via pnpm hardlinks |
| **4** | separate clone             | **anything that moves `HEAD`** or rewrites history | clone + fetch                                                      |

Tier 3 is cheaper than it looks: pnpm's content-addressed store hardlinks, so a
worktree does **not** duplicate `node_modules` (5.1 GB). The only real
duplication is the Rust `target/` dir (measured 3.3 GB for `tauri-desktop`).

> **Tier 3 tradeoff, stated explicitly.** Sharing `CARGO_TARGET_DIR` across
> worktrees saves that 3.3 GB but reintroduces the cargo lock contention that
> cost 13 minutes on 2026-08-09. Separate target dirs cost disk and avoid it.
> Choose per machine; record the choice in the policy file. This is an
> engineering tradeoff, not a budget question.

---

## 3. Rules

### R1 — Nothing that moves `HEAD` runs in a shared tree _(load-bearing)_

`stash`, `checkout <branch>`, `reset`, `merge`, `rebase`, `clean`, branch
switches, history rewrites: **Tier 4 only**. These are categorically different
from editing files. Branch maintenance is legitimate and necessary work — it
simply must not happen where other agents are standing.

### R2 — Never `stash` paths you do not own

If a job must park foreign work, it commits to a scratch branch
(`wip/<agent>-<timestamp>`) or refuses and reports. See §1.1: stash silently
drops untracked files, and stash entries get buried by the next push.

### R3 — Uncommitted work is unprotected work

Commit at every stage boundary. Concretely: **no more than 20 minutes or one
completed unit of work uncommitted** in a shared tree. Gates exist at commit
time; nothing protects the working tree. On 2026-08-09 the agent that lost work
twice had flagged the concurrency risk in its own first message and then carried
~30 files for hours anyway. Discipline should not be load-bearing, but until
enforcement lands it is.

### R4 — Declare a path lease before multi-file work

Tier 2. Write the intended glob set to the lease file before editing; check it
before writing. Cheapest real win in this protocol: it prevents collisions with
no isolation cost, and TNF already has the primitives (`AGENT_STATUS_LEDGER.md`,
the handoff artifacts, the pre-commit gate harness).

### R5 — Shared build artifacts need a declared owner

One `CARGO_TARGET_DIR` per workspace tier, or an advisory lock. Two agents
running the same build against one target dir is a deadlock, not a race that
resolves.

### R6 — Scratch space is not free

Anything that copies a repo (`sync-repos --dry-run`, export staging) writes to a
declared scratch root with a size budget and cleans up on exit, including on
abort. `/tmp` on the operator machine is the same volume as the repo.

---

## 4. Machine policy

`docs/protocols/agent-workspace-policy.json`. Task class → tier, plus the shared
tree's rules. Agents resolve their tier at Turn Zero.

```jsonc
{
  "byTaskClass": {
    "analysis": "shared-readonly",
    "edit": "shared",
    "refactor": "worktree",
    "branch-maintenance": "clone", // R1
    "history-rewrite": "clone",
    "release-build": "worktree",
  },
  "sharedTree": {
    "maxUncommittedMinutes": 20,
    "requireLeaseForPaths": ["apps/**", "packages/**", "scripts/**"],
    "onForeignDirtyTree": "refuse", // never "stash"
    "parkForeignWorkAs": "scratch-branch",
  },
  "worktree": {
    "root": ".claude/worktrees",
    "cargoTargetDir": "per-worktree", // or "shared" — see §2 tradeoff
    "nodeModules": "link",
  },
  "scratch": { "root": "/tmp/tnf-scratch", "maxGB": 2, "cleanOnExit": true },
}
```

---

## 5. Enforcement

TNF's gates are strong at **commit** time and absent at **mutation** time. That
asymmetry is precisely the gap: on 2026-08-09 no gate objected to stashing 138
files belonging to three agents, while several gates correctly blocked a
well-formed commit.

| Point              | Check                                                             | Status   |
| ------------------ | ----------------------------------------------------------------- | -------- |
| Turn Zero          | resolve task class → tier; refuse Tier 4 work in a shared tree    | proposed |
| pre-mutation guard | block `stash`/`checkout`/`reset`/`clean` when foreign paths dirty | proposed |
| pre-commit         | existing handoff / secret / build / authority gates               | **live** |
| lease check        | warn on writes outside a declared lease                           | proposed |

---

## 6. Recovery

If work is lost to a tree mutation:

1. `git fsck --lost-found` and `git reflog` — commits are almost never gone.
2. `git stash list` — but check **both** the stash's tracked set _and_ whether
   the missing file was ever untracked (§1.1). Untracked absence is silent.
3. Prefer `git checkout <ref> -- <path>` **file by file**. A single path that
   does not exist in the source ref aborts a bulk checkout, which reads as total
   failure when 35 of 36 files were recoverable.
4. Before dropping any stash, tag it:
   `git tag archive/stash-<date>-<name> 'stash@{n}'`. Tags are permanent, named,
   and cannot be buried. Verify with `git show <tag>:<path>` **before**
   dropping.

Applied on 2026-08-09: both maintenance stashes preserved as
`archive/stash-2026-08-09-*` and dropped from the stack.

---

## 7. Open decisions

- **Tier 3 `CARGO_TARGET_DIR`** — shared (save 3.3 GB/worktree, accept lock
  contention) or per-worktree (avoid contention, pay disk). Operator call;
  record in the policy file.
- **Lease format** — extend `AGENT_STATUS_LEDGER.md` or a dedicated
  `data/protocols/path-leases.json`.
- **Enforcement depth** — advisory warnings first, or hard refusal from the
  outset.
