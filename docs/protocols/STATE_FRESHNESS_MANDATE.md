# TNF State Freshness Mandate

**Status:** active — 2026-08-14 **Enforced by:**
`scripts/protocols/state-freshness-gate.cjs` **Registry:**
`docs/protocols/state-freshness.registry.json` **Relates to:**
`docs/protocols/TURN_ZERO_MANDATE.md` (Core Tenet 4 — Inspect → Act → Verify)

## The incident this exists to prevent

On 2026-08-14 an agent session reported to the operator that the public
`The-New-Fuse` repository had suffered a catastrophe:

- `main`'s entire history replaced with a single commit
- the whole open-PR queue destroyed, including a CRITICAL SQL-injection fix
- proprietary control-plane source republished to a public repo

**All three were false.** The verified state at the same moment was: `main` at
`655c84aad` with intact ancestry rooted in the previous sync, ten open PRs, and
every proprietary path returning 404 on the public remote.

The agent then recommended halting all merge work on the strength of that
report. That recommendation was acted on. The cost of the error was not a bad
edit — it was a wrong decision by the operator, made from a confident and
entirely fictional status report.

## Root cause

Not a tool failure. An **unverified inference**, in three compounding steps:

1. `gh api repos/<r>/commits/<sha>` returned `200` for the sync's orphan commit.
2. That `200` was read as _"this commit is `main`'s tip."_ It is not — the
   endpoint returns any reachable object, including a commit on **no branch**.
3. The conclusion was reported without ever running a ref lookup
   (`git/ref/heads/main`) or checking whether the sha appeared on any branch.

A single command — `gh api repos/<r>/branches` — would have shown the sha on
zero of 81 branches and collapsed the entire narrative. It was never run,
because nothing required it to be.

The aggravating factor is **context compaction**. When a session resumes from a
summary, every fact it inherits is undated. A conclusion drawn from a misread 30
minutes ago is indistinguishable from one verified 30 seconds ago. The summary
faithfully preserved the false claims and stripped the uncertainty that should
have travelled with them.

## The rules

### R1 — Volatile facts are never asserted from memory

A fact is **volatile** if it can change without this agent's involvement: remote
refs, PR and CI state, branch protections, published file contents, service
reachability, work-tree cleanliness, cron schedules.

Volatile facts may only be stated from a receipt observed within that domain's
TTL. Anything older is re-probed first. Conversation history — including your
own earlier messages in this session, and anything inherited from a compaction
summary — is **not** a source for a volatile fact.

### R2 — Existence is not position

Proving an object exists never proves where it sits. Specifically:

| The observation              | What it proves          | What it does NOT prove                |
| ---------------------------- | ----------------------- | ------------------------------------- |
| `commits/<sha>` → 200        | the object is reachable | that it is a branch tip               |
| a file exists locally        | it is on disk           | it is committed, pushed, or published |
| a port is LISTENing          | a process bound it      | the service answers                   |
| a PR number is closed        | that PR ended           | the work was abandoned                |
| `commits?per_page=100` → 100 | _at least_ 100          | exactly 100                           |

Each of these is recorded as the `trap` field on its domain in the registry.

### R3 — Catastrophic claims require corroboration

Before reporting **irreversible loss or exposure** — history rewritten, data
destroyed, secrets or proprietary source published — the claim must be confirmed
by a **second, independent probe** that could have falsified it.

The gate encodes this: high-severity domains carry a `corroborate` command, and
when the two views disagree the domain is marked `SPLIT`. A `SPLIT` domain is
never resolved by picking the more alarming reading. Disagreement between two
views is the _signature_ of this bug class, not evidence of disaster.

### R4 — Report the probe, not just the conclusion

State what was run and what it returned. "`main` is at `655c84aad` (17 commits,
`git/ref/heads/main`)" is verifiable by the reader. "The history was replaced"
is not. A conclusion presented without its evidence cannot be checked by the
operator, which is precisely how the 2026-08-14 report survived to the point of
changing a decision.

### R5 — Correct at the same volume as the claim

An alarming report that turns out to be wrong is corrected explicitly and
prominently, naming each false claim. Quietly moving on leaves the operator
holding a false model of their system.

## Session lifecycle

**Turn Zero.** The onboarder prints a `State Freshness` section listing every
domain with its age. Anything not `FRESH` is flagged as requiring
re-verification before it may be spoken about.

**Mid-session.** Refresh before asserting, and after any operation that could
have moved the state:

```
node scripts/protocols/state-freshness-gate.cjs --refresh
node scripts/protocols/state-freshness-gate.cjs --check
```

**After compaction.** Treat every inherited volatile fact as `STALE` regardless
of receipt age — the summary carries claims, not observations. Re-probe before
continuing work that depends on them.

## Extending the registry

Add a domain when a class of fact has caused, or could cause, a false report.
Every domain must carry a `trap` describing the specific misread that produces a
wrong claim about it — a domain without a `trap` is a monitoring entry, not a
drift guard, and the test suite rejects it.

## Verification

```
node --test scripts/protocols/state-freshness-gate.test.cjs
```

Covers registry well-formedness (including mandatory `trap` text), `SPLIT`
detection on disagreement, silence on agreement, TTL expiry, and the guarantee
that `--frontload` can never fail a session.
