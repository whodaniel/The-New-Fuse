# Verification and evaluation suite

## Schemas and assertions

- `dispatch.schema.json`: closed synthesis envelope, bounded identity/lineage,
  routing rules, standard Markdown, Python artifact, closed argument schema,
  tool grants (empty in v1), eval vectors and assertions.
- `evals.schema.json`: unique vector IDs, scalar argument objects, expected exit
  code and exact stdout, plus positive and negative routing cases. Runtime
  checks additionally reject duplicate IDs and schema-invalid vector arguments.
- `assertions.schema.json`: mandatory help/repeatability checks, network
  disabled, 1–5 second case timeout, and combined stdout/stderr cap at 8192
  bytes.
- `candidate.json`: a complete text-normalization capability with actual
  argparse CLI code, not a mocked executor. Its embedded vectors match
  `evals.json` and its policy matches `assertions.json`.

The trusted evaluator checks help discovery, malformed JSON rejection and
unknown-argument rejection, then runs every candidate test twice in fresh
containers. It compares exit codes, exact stdout, and repeatability of
stdout/stderr. Assertions are data, never eval strings or executable assertion
plugins. Input and output schemas use Ajv without coercion or field removal.
Python lint uses AST and TOML parsing, never imports candidate code.

Candidate-authored expected outputs demonstrate self-consistency. They do not
independently establish that a capability fulfills the user's intended task.
Production promotion needs task-owner-approved acceptance vectors pinned
independently from the generated candidate. The current admission receipt must
not be sold as that stronger evidence.

## Commands

```bash
node .agent/skills/meta-skill/scripts/gate.cjs --help
node .agent/skills/meta-skill/scripts/gate.cjs --check < .agent/skills/meta-skill/references/candidate.json
node --test .agent/skills/meta-skill/scripts/gate.test.cjs
```

For real sandbox evaluation, configure `TNF_META_SKILL_IMAGE` with a trusted
local Python image digest and run `--admit` on a fresh candidate revision. A
previously cordoned candidate stays cordoned; infrastructure failure does not
authorize deleting history. A revised candidate must be deliberately reviewed
before retry.

## Required production evidence

1. Genuine sandbox success on the normalization candidate and rejection of
   incorrect expected output.
2. Timeout, output flood, attempted network/host-file access and noninteractive
   argument failures.
3. Receipt persistence, content/policy alteration detection, failed replacement
   preservation and cordon behavior.
4. Process-kill recovery without stale active registration or orphaned sandbox
   execution.
5. Every application registration path consuming a verified receipt; Markdown
   presence alone never qualifies.
6. Task-owner-controlled acceptance vectors, authenticated parent lineage if
   recursive host dispatch is later introduced, and provider prefix-cache
   measurements if cache performance is claimed.

Local regression results and live sandbox evidence are recorded in
`validation-report.md` and `sandbox-validation.json`. Passing static checks is
not a substitute for any unexecuted runtime case.

## Standards provenance

Checked against the current
[Agent Skills specification](https://agentskills.io/specification) and
[PEP 723](https://peps.python.org/pep-0723/). Standard constraints cover skill
metadata and packaging; zero-interactive execution, isolation and admission
policies are TNF's stricter profile. The legacy local quick-validator rejects
the standard optional compatibility field, so this entrypoint states
requirements in its body instead.
