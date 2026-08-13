# CI Baseline Debt

**Status:** open
**Opened:** 2026-08-08
**Scope:** `whodaniel/The-New-Fuse` (open-runtime split)

## Why this document exists

Every one of the ~20 CI gates fails on `main`, and therefore fails identically
on every open pull request. This means **CI currently carries no signal about
the changes in a PR** — a red check tells you nothing about whether that PR is
good, because a no-op PR would be equally red.

That has two consequences worth stating plainly:

1. Reviewers cannot use CI as a merge gate, so review falls back to reading
   diffs by hand. That is slower and it scales badly.
2. A genuine regression introduced by a PR would be invisible, because it would
   land in a sea of pre-existing failures.

Restoring a green baseline is what makes every other gate meaningful again.
Until then, `main` is unprotected and merges are judgement calls.

## Merge policy while this debt is open

Agreed 2026-08-08:

- **Narrow security / remediation PRs** may merge on a reviewed diff, with red
  CI treated as baseline noise.
- **Product and architecture changes may not.** Red CI is not permission to
  merge feature work casually.

## Ledger

Owners are unassigned — fill in before starting. Each item lists the gate it
un-blocks, so progress is measurable rather than vibes.

### 1. Missing split-repo contracts package — blocks `Type Check`

`packages/relay-core` re-exports from `@the-new-fuse/control-plane-contracts`,
a package that **does not exist anywhere in this repository**. It lives in the
control-plane repo, so the open-runtime split cannot resolve it.

- `packages/relay-core/src/broker-agent.ts:13` — `export { BrokerConfig } from '@the-new-fuse/control-plane-contracts'`
- `packages/relay-core/src/master-clock.ts:13` — `export { MasterClockSignal, MasterClockConfig } from '@the-new-fuse/control-plane-contracts'`

Failure: `error TS2307: Cannot find module '@the-new-fuse/control-plane-contracts'`

A second, smaller variant: `@the-new-fuse/protocol-contracts` *does* exist in
this repo but is not built before its consumers, so it fails the same way. The
`Prepare workspace package boundaries for type-check` step in
`.github/workflows/test.yml` builds an explicit ordered list that omits it.

**Decision required (architectural, not a fix):** either vendor/publish
`control-plane-contracts` into this repo, or sever the dependency so the open
runtime does not reach into control-plane types.

- Owner: _unassigned_
- Gate: `Type Check` passes

### 2. `websocket-infrastructure` build failure — blocks `Build Packages`

`tsc -b` in `packages/websocket-infrastructure` fails on three distinct causes:

- `src/testing/websocket-client.ts:3` — `TS2307: Cannot find module '../strategies.js'`
- `src/testing/websocket-client.ts:224` — `TS7006: Parameter 'error' implicitly has an 'any' type`
- `src/utils/binary-protocol.ts:2` — `TS7016: Could not find a declaration file for module 'msgpack-lite'`

The third needs either `@types/msgpack-lite` or a local `declare module` shim.

- Owner: _unassigned_
- Gate: `Build Packages` passes

### 3. Core unit tests fully red — blocks `Unit Tests`

`@the-new-fuse/core` reports **10 failed suites out of 10 total** — i.e. the
package's entire test suite is down, not a flake. Also surfaced:

`TS5107: Option 'moduleResolution=node10' is deprecated and will stop
functioning in TypeScript 7.0`

Because every suite fails, this gate cannot detect a regression from any PR.

- Owner: _unassigned_
- Gate: `Unit Tests (1)` and `(2)` pass

### 4. Dependency vulnerabilities — blocks `Security & Dependency Audit`

`pnpm audit` reports **5 critical** vulnerabilities; the workflow fails when
critical count is greater than zero. Needs triage into fix / upgrade / documented
accepted-risk.

- Owner: _unassigned_
- Gate: `Security & Dependency Audit` passes

## Resolved

### ESLint test-runner globals — `Lint Code` (fixed 2026-08-08)

`eslint.config.mjs` declared an explicit `globals` list rather than pulling in
an environment, and its test-file override only relaxed rules without declaring
runner globals. So `describe` / `it` / `expect` tripped `no-undef` and failed
the Lint gate on `packages/prompt-templating`, and would have failed any PR that
adds a test file.

Fixed by declaring jest/vitest globals on the test-file override block, and
widening its `files` to cover `**/__tests__/**`. Verified by replicating the
CI command exactly (`eslint src/**/*.ts`, unquoted, from the package directory):
exit 0.

Carried on `hotfix/ci-baseline-repair-20260808` (PR #111, still draft).

## Known trap: the lint glob is narrower than it looks

Package lint scripts use an **unquoted** `eslint src/**/*.ts`. The shell — not
ESLint — expands that, and without `globstar` it expands to a single level. In
`packages/prompt-templating` it matches only `src/__tests__/index.test.ts`, so
`src/index.ts` is never linted. It currently holds 3 `curly` errors that CI
cannot see.

Quoting the glob repo-wide would surface a backlog of previously-unlinted errors
across 62 packages. That is a deliberate, separately-scoped cleanup — not a
drive-by fix — and it is why it was left alone here.

- Owner: _unassigned_
- Gate: lint scripts quoted, backlog burned down
