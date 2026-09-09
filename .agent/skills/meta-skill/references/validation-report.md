# Validation receipt and continuation

Repository: whodaniel/tnf-monorepo. Branch: feature/durable-task-runtime.
Audited HEAD: 98bb6080c8339253e9e5e7d861ce15655da680c8. Changes are uncommitted
in the shared checkout; unrelated durable-task and specialist-agency work is
preserved.

Classification: core / oss_runtime / product_state / public.

## Delivered

- Architectural gap matrix across synthesis, UI/API, registry, MCP, context,
  governance and recovery.
- Canonical meta-skill/SKILL.md with standard frontmatter, progressive
  references and bounded actuator contract; existing skill-builder routes to it.
- Dispatch/evals/assertions schemas, concrete Python PEP 723 candidate,
  deterministic validation harness, quarantine receipts and tests.
- SkillsService compiler now disables model tools and routes generated JSON
  through admission; no direct model-selected filesystem write. Its successful
  return explicitly says active: false and references the verified receipt.

## Executed checks

| Check                                                                                     | Result                                                                                 |
| ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| TNF task-scoped onboarding and write readiness                                            | PASS                                                                                   |
| gate.cjs --check on concrete normalization candidate                                      | PASS: Ajv, YAML, Python AST, PEP 723; no candidate execution                           |
| node --test scripts/gate.test.cjs scripts/sandbox.test.cjs (paths relative to this skill) | 10 local checks passed; 3 real sandbox suites subsequently passed with a pinned image  |
| pnpm exec tsx --test .agent/skills/meta-skill/scripts/service.test.ts                     | 1 passed; real FIFO, symlink, directory, byte-budget and read-only-bank checks         |
| pnpm --filter @the-new-fuse/tnf-cli type-check                                            | PASS, exit 0                                                                           |
| skill-creator quick_validate.py for meta-skill and skill-builder                          | Both valid                                                                             |
| git diff --check for changed tracked sources                                              | PASS                                                                                   |
| Docker engine startup/probe                                                               | Initially failed during slow startup; refreshed engine verified healthy at 28.1.1      |
| Sandbox cleanup                                                                           | No tnf-meta test containers remain; Docker left running after the successful follow-up |

The ten gate tests cover malformed contracts, path-like names, unsupported
languages/tools, line limits, explicit lineage violations, negative-trigger
precedence, blank triggers, strict argument validation, syntax/PEP errors,
non-executing lint, DAG terminal behavior, immutable receipts, tamper detection,
and digest cordons surviving changed request IDs.

## Not claimed

Live sandbox admission and negative isolation tests passed. Model-to-gate
end-to-end inference, a registered production worker, provider cache-performance
measurements, crash-proof orphan cleanup, and stack-wide receipt adoption remain
unverified. Candidate-owned evals establish repeatability against declared
outputs; independent task acceptance is a separate requirement. Lineage metadata
is validated but not authenticated across calls. The legacy
`tnf metaskills govern` command still references a missing script. Package
distribution also needs to carry this repository-local gate before a standalone
CLI install can compile skills.

## Changed paths and processes

Task-owned changes: `.agent/skills/meta-skill/**`,
`.agent/skills/skill-builder/SKILL.md`, and
`packages/tnf-cli/src/services/SkillsService.ts`. Runtime receipts are bounded
under the skill's ignored `.state/` subdirectories. No core execution-loop,
consensus, MCP configuration, global host skill or personal-memory files were
changed. TNF Turn End additionally updates its standard session protocol
artifacts.

The independent audit/implementation agent finished. No task test or sandbox
process remains. Docker Desktop was initially stopped after an unhealthy startup
probe; the user restarted it and the successful follow-up leaves it running. No
commit, push or production activation occurred.

## Exact continuation

From the canonical repository root:

```bash
pnpm run tnf:onboard -- --task "Verify meta-skill sandbox and receipt consumer integration"
node .agent/skills/meta-skill/scripts/gate.cjs --help
node --test .agent/skills/meta-skill/scripts/gate.test.cjs
pnpm exec tsx --test .agent/skills/meta-skill/scripts/service.test.ts
```

The following official Python digest was pulled, verified and used successfully
(the image must include /usr/bin/timeout):

```bash
TNF_META_SKILL_IMAGE=python@sha256:9d2e5553305c7c7b0097999bb17187c69b921ccd6bc9d40e4bb5ebe652c00285 node --test .agent/skills/meta-skill/scripts/sandbox.test.cjs
```

Do not invent an image digest or bypass the sandbox. Next verify one deliberate
receipt consumer before extending to other registries, then add kill/recovery
and independently owned task-acceptance evidence. Review the gap matrix before
claiming complete production enforcement.

## Successful live sandbox follow-up

See [sandbox-validation.json](sandbox-validation.json) for source hashes and all
five admission receipts. Three real suites passed with zero skips: valid
admission plus wrong-output quarantine; infinite-loop/output-flood quarantine;
and non-root execution with rejected root writes, hidden host paths and blocked
outbound networking.

A concurrent AGY test initially held the canonical ledger. Tests therefore used
an identical source snapshot with a separate ledger; canonical/snapshot file
hashes and receipt hashes were verified before exporting evidence. No AGY parent
process was terminated. After that parent exited, its orphaned infinite-loop
container was removed; its lock was already absent.

Real execution exposed and repaired Docker-client SIGTERM hangs, startup
consuming the execution budget, and automatic-removal races. The harness now
uses an in-container coreutils deadline, a bounded host startup allowance,
SIGKILL for an unresponsive Docker client and one explicit container-removal
path. This verifies normal timeout cleanup, not automatic recovery from
arbitrary host process death.
