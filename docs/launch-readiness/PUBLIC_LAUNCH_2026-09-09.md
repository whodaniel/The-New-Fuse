# Public launch assessment — 2026-09-09 UTC

**Decision: NO_GO for unrestricted public launch.** This is a dated assessment,
not a permanent claim about runtime state. Developer first-run is the immediate
priority; the hosted app still requires the shared execution, isolation,
recovery and commercial gates below.

## Evidence and changes

The previous production checklist manufactured performance, capacity, security
and readiness figures. `scripts/production-readiness-checklist.js` now performs
bounded public HTTP checks and fails when required journeys are unknown. It does
not certify security or infer execution from telemetry. Run:

```sh
node scripts/production-readiness-checklist.js --output /tmp/tnf-launch-readiness.json
node --test scripts/production-readiness-checklist.test.mjs scripts/install-tnf-cli.test.mjs
```

The observed public login shell, JSON edge health and anonymous orchestration
rejection passed. The master clock failed freshness. Seven end-to-end
obligations remain unexecuted. Re-run before relying on these observations; the
report records the assessor revision, not the deployed revision.

The official installer cloned the public runtime but its generated launcher
trusted only the private development origin. It also ignored a failed executable
version check. The installer now accepts both official runtime origins,
propagates execution failure, resolves branch/tag/commit refs through fetch and
detached checkout, and preserves dirty existing clones. The root launcher
source-freshness check now uses portable `find -newer` instead of BSD-only
`stat`.

Eleven focused tests passed, including actual Git checkout and
generated-launcher execution. Install tests substitute the dependency build
boundary; they are **not** clean-machine dependency-install proof. Publication
and a clean-machine first-result run remain required.

## Subsequent verification on the same day

A fresh remote CLI install passed in a disposable Cloud Build runner at public
revision `8095b29f131c2d36f34ff2ee2b63eb88f8d5c70f`: clone, dependency
installation, CLI dependency builds, exact commit verification and installed
`tnf --version` (`1.0.0`). Onboarding and fleet startup were disabled; this does
not prove a first agent result.
[Build receipt](https://console.cloud.google.com/cloud-build/builds/662860c7-ed99-4987-933c-8aa1368563e2?project=241337102384).

The clean full-build runs exposed and drove fixes for three React JSX
declaration errors, an omitted API source declaration in the public export, and
incompatible Express request interfaces. The shared-namespace request contract
has a focused regression that fails against the original declaration and passes
against the correction. The public merge continues to require the actual
`Build Summary` workflow result; branch protection was not bypassed.
[Latest failed build before the namespace correction](https://github.com/whodaniel/The-New-Fuse/actions/runs/34304784890).

## Ordered release gates

| Priority | Gate                            | Current evidence                                                                            | Acceptance evidence                                                                                                                                                        |
| -------- | ------------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0       | Public first-run                | Fresh remote CLI install and version probe passed; onboarding and first result unverified   | Published public commit; clean supported OS install; documented setup; first real agent result and elapsed time                                                            |
| P0       | Reliable coordination           | Public clock stale; inspected producer logs show Redis not connected                        | Intended hosted producer identified; singleton ownership and pause behavior verified; fresh shared telemetry; correlated task completion independent of an operator laptop |
| P0       | Real execution                  | Reachable shell and anonymous rejection only                                                | Dedicated authenticated tenant runs an agent, real tool and useful result; trace links input, tool output, errors and final result                                         |
| P0       | Durable orchestration           | Not executed in this assessment                                                             | Persisted multi-agent run interrupted and resumed; cancellation, bounded retry and duplicate-side-effect prevention demonstrated                                           |
| P0       | Tenant and credential isolation | Not executed in this assessment                                                             | Two test tenants cannot read, mutate or execute each other’s resources; credential redaction, authorization and deletion verified                                          |
| P0       | Release recovery                | Not executed in this assessment                                                             | Identified release artifacts; measured rollback and data-restore drill; usable incident/support route                                                                      |
| P0       | Capacity and abuse              | No supported capacity claim                                                                 | Measured declared launch workload; rate limits, quotas, cost bounds and overload response verified                                                                         |
| P0       | Public product promises         | Source-based installer exists; no CLI npm package or public release found during inspection | Supported install path, examples, limitations, license, privacy, support and entitlement/billing promises agree with tested behavior                                       |

The operator fleet was paused by its resource watchdog during inspection.
Preserve that pause. Do not connect or restart an unowned scheduler simply to
turn telemetry green. A live PID or Redis connection alone does not satisfy
execution or recovery gates.

Authenticated tests require a dedicated test tenant and an approved credential
reference. No production credential is committed to this report. Do not
substitute a locally forged token or fixture execution for the missing hosted
journey.

## Competitive acceptance baseline

This is a capability baseline from official documentation, not a comparative
performance benchmark or evidence that every advertised capability works under
TNF’s workload.

- [OpenAI Agents guide](https://developers.openai.com/api/docs/guides/agents):
  agent execution, tools, handoffs, sessions, approvals, guardrails and tracing
  establish the minimum useful execution story to test.
- [LangGraph persistence](https://docs.langchain.com/oss/python/langgraph/persistence):
  checkpointed state and recoverable execution make interruption/resumption a
  release gate, rather than an optional demo.
- [CrewAI platform](https://docs-platform.crewai.com/platform/en/introduction):
  deployment, programmatic execution and execution visibility establish
  expectations for a usable hosted control plane.

TNF’s cross-runtime coordination and graph should be evaluated against those
concrete journeys. Node counts, draft architecture, provider counts and a large
command surface do not establish an advantage. First demonstrate one
reproducible useful run, recovery, isolation and cloud operation; then measure
time to first result, completion rate, recovery correctness, latency and cost on
the same declared workload.

## Continuation

1. Publish the installer repairs through the existing guarded public-runtime
   export pipeline; verify public main contains them.
2. Execute a clean install from that exact public revision and record the real
   dependency/build outcome.
3. Resolve the intended hosted clock producer and its readiness/pause contract
   before changing runtime configuration.
4. Use a dedicated authenticated tenant for the execution and recovery journeys.
   Extend the existing readiness gate with real runners as evidence becomes
   available; unknown gates must stay blocking.
5. Reconcile the historical launch backlog against these observed behaviors
   before scheduling additional feature work.

## Consolidation handoff verification

The audit at `a23f50f57` was rechecked using tracked Git trees, not recursive
workspace scans. At this release branch: 623 zero-byte files and 128 files with
`.bak`, `.backup`, `.orig`, or `.backup3` suffixes were found. Empty modules,
configuration files, and tracked placeholders require consumer checks before
removal; these counts do not establish safe deletion scope.

Public `main` at `1e680a2108b66d921a8d827daf3fad36cfc78c86` and pending export
`39952b7c83b3073f1f87af607683458fe3ee2347` both contain 3,930 profile files
beneath `archive/apps/gemini-bridge-extension/test_runs`. GitHub recursive tree
responses were complete. Profile contents were not read, so credential exposure
is not established. The publication script now excludes this run root, and its
existing boundary gate rejects any remaining `pw-profile` path or that archived
run root. Four focused gate checks pass, including opaque binary state and a
relocated profile directory. This is a forward publication correction;
historical objects remain. Remote removal requires the corrected export to land.

Review of PR #352 identified further verification needs before deployment: its
migration 013 membership policy queries `workspace_members` from a policy on
that same table, a recursive RLS shape; its mirror accepts absent/future clock
heartbeats and writes shared cloud state/log keys. No production database
change, credential-backup deletion, or fleet resumption was performed in this
review.
