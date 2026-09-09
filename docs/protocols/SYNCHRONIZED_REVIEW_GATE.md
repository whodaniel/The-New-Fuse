# Synchronized review gate

High-risk changes need an explicit, current review before TNF merges them. The
existing conflict classifier remains the policy authority. Protocols, workflows,
hooks, security scripts, guarded merge entrypoints, gitlinks, and changes over
120 paths escalate.

## Enforced paths

- `.husky/pre-push` blocks high-risk direct pushes to `main` or `master`. It
  also blocks creating/deleting those protected refs. Publish a feature or
  integration branch to obtain review instead.
- `bash scripts/safe-merge-to-main.sh <PR>` verifies live GitHub evidence before
  merging. Add `--squash` for a squash merge. The script no longer runs the old
  project-reconstruction checkout/merge workflow.
- Jules batch merging, maintenance PR merging, and the conflict-resolution
  script invoke the same guarded entrypoint. A denial remains a failure.
- Read-only check:
  `node scripts/protocols/synchronized-review-gate.cjs --pr=<PR>`.

For an escalated change, the reviewer must be a GitHub user other than the PR
author, with current repository write, maintain, or admin permission. Repository
writers act as the available owner authority; there is no CODEOWNERS mapping in
this repository. Each touched classifier surface must be explicitly
acknowledged. Multiple reviewers may cover separate surfaces.

Submit an **APPROVED** GitHub review of the exact current head commit, including
one standalone line in the review body:

```text
TNF_REVIEW_ACK base=<40-character current base SHA> surfaces=docs,root,scripts
```

The read-only check prints the exact line required for that PR. Use the listed
surfaces, not a wildcard. Approval of an older head or base is stale. The most
recent formal review state controls; dismissal revokes approval, and outstanding
changes requested by an authorized reviewer block an escalated merge. Ordinary
comments do not revoke a prior formal review.

Flash critic output is useful review evidence but is not an approval. A review
comment, a bot approval, a local JSON receipt, a PR-author assertion, or a
missing permission response cannot satisfy this gate. No environment override
grants an approval. API errors and incomplete file/tree inventories fail closed.

## Verification and limits

The gate fetches all PR files and reviews, checks current reviewer permissions,
classifies old and new rename paths and both trees' gitlinks, then rechecks PR
head/base/state before merging. The merge request supplies the exact approved
head SHA as GitHub's atomic precondition. GitHub's merge API has no base-SHA
precondition; a base movement in the short interval after the final read remains
a limitation. A review dismissal in that interval is likewise not atomically
bound by the client-side merge request.

These are local TNF controls. Direct GitHub UI/API merges and bypassed Git hooks
remain outside them. On 2026-09-07, the private repository's ruleset and branch
protection APIs returned HTTP 403 requiring a plan upgrade or public repository.
The existing strict privacy/security workflow is manual-only. This change does
not claim server-side enforcement or enable a runner with unresolved billing.
Enable server-side required checks/reviews when repository capabilities permit.

## Push inventory and handoff advisory diagnosis

The former new-branch collector used `rev-list <tip> --not --all`. Because the
tip was already in a local branch, that excluded its own commits and could feed
an empty inventory to security checks. The replacement compares against remote
refs, includes merge-parent changes and deletions, handles every pushed ref, and
fails on unreadable ranges. An empty inventory now skips downstream fallback
inference; an explicit empty classifier file list remains empty.

The handoff advisory has a separate scope mismatch. It checks the aggregate
pushed diff as if it were one commit on the current branch. Multiple committed
scoped receipts can appear ambiguous, and a valid carried receipt can fail its
current-branch binding. The merge-carried fix handles the staged `MERGE_HEAD`
case, not a completed multi-commit push. Reproducing the `fd0c842a5` file set in
an isolated integration branch produced a receipt branch-binding rejection. That
proves this failure mode, not the exact cause of an unavailable older push log.
Keep this check advisory until it validates each published commit against that
commit's own immutable receipt/basis. Do not promote aggregate false positives
to blockers or call the advisory universally broken.

## Tests

```sh
node --test scripts/protocols/synchronized-review-gate.test.cjs scripts/protocols/check-push-review.test.cjs
```

Tests cover actual temporary Git pushes and remote-ref invariance after a denied
push, first-branch inventories, deletions, stale/missing approvals, permission
failures, renamed risk paths, gitlinks, and PR drift during verification. API
response fixtures test evaluation semantics; they do not claim a live approved
merge or server protection.
