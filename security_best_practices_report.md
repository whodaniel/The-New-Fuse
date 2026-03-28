# Security and Quality Audit Report

## Executive Summary

This audit focused on CI/test harnesses, lint/typecheck/build scripts, and
obvious security anti-patterns. The main risks are CI non-determinism due to
`--no-frozen-lockfile`, overly permissive default GitHub Actions token
permissions, unpinned action versions, and supply-chain exposure from
`curl | bash` installs in Dockerfiles. Coverage thresholds are defined but not
enforced, which weakens quality gates.

## Medium Severity Findings

### M-1: CI allows lockfile drift via `--no-frozen-lockfile`

**Impact:** Builds/tests can run with dependency versions different from the
reviewed lockfile, increasing supply-chain risk and making CI results
non-deterministic.

- `.github/workflows/test.yml:69-71, 99-101, 134-135`
- `.github/workflows/build.yml:70-71, 99-100`
- `.github/workflows/quality.yml:49-50, 95-96, 177-200`

**Recommendation:** Use `pnpm install --frozen-lockfile` for CI jobs. If
lockfile updates are required, make them explicit in PRs or run a dedicated
“lockfile refresh” job.

### M-2: GitHub Actions not pinned to immutable SHAs

**Impact:** Using mutable tags (e.g., `@v4`, `@v5`) exposes CI to supply-chain
compromise if tags are retargeted.

- `.github/workflows/test.yml:31-43, 55-57`
- `.github/workflows/quality.yml:28-38, 39-41, 60-61`
- `.github/workflows/build.yml:33-45, 57-58`

**Recommendation:** Pin actions to commit SHAs and rely on Dependabot or
Renovate to keep them updated.

### M-3: Workflows rely on default GitHub token permissions

**Impact:** Default token permissions can be broader than needed. If a workflow
executes untrusted code (PRs), it can enable unwanted write actions.

- `.github/workflows/test.yml:1-23` (no explicit `permissions` block)
- `.github/workflows/build.yml:1-24` (no explicit `permissions` block)
- `.github/workflows/quality.yml:1-22` (no explicit `permissions` block)

**Recommendation:** Add explicit `permissions` blocks (e.g., `contents: read`)
at workflow or job level. Grant write permissions only where strictly required
(e.g., PR commenting jobs).

### M-4: Docker builds run remote install scripts via `curl | bash`

**Impact:** Remote script execution during image build expands supply-chain
attack surface and makes builds harder to reproduce or audit.

- `apps/cloud-sandbox/Dockerfile.secure:13-16`
- `apps/cloud-sandbox/Dockerfile.secure:49-56`

**Recommendation:** Use distro packages or official Node binaries with checksum
verification. If using NodeSource, add the signed APT key explicitly and avoid
piping to shell.

## Low Severity Findings

### L-1: Coverage thresholds are documented but not enforced

**Impact:** The quality gate doesn’t fail on coverage regression, weakening CI’s
ability to prevent test coverage decay.

- `.github/workflows/quality.yml:103-119`

**Recommendation:** Parse `coverage-summary.json` (Jest) or the relevant
coverage output and `exit 1` if thresholds are not met.

## Notes

This report focused on the requested CI and dependency/security risk surface.
Additional language-specific code vulnerabilities were not exhaustively
reviewed.
