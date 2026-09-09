---
name: meta-skill
description:
  Compile, validate, evaluate, and admit new TNF executable skills from
  structured capability requests. Use when synthesizing a skill, generating
  another meta-skill, or validating a generated capability for activation. Do
  not use for ordinary feature implementation, runtime-loop changes, general
  conversation, or executing an already admitted skill.
metadata:
  type: meta
  execution: deterministic
  version: '1'
---

# META-SKILL: Meta-Skill Compiler

Requirements: Node.js 22+, repository Ajv and yaml dependencies, Python 3.11+,
and a running Docker daemon with an operator-pinned local Python image for
admission.

This skill is an actuator/compiler. It produces bounded Python capability
artifacts and admission receipts. It cannot edit main(), engine state loops,
consensus code, system prompts, MCP configuration, host skills, or credentials.
Its only persistent write authority is its own `.state/` directory inside
`.agent/skills/meta-skill/`; activation lives in a transient registry.
Application code that calls this compiler does not become writable by generated
code.

## Inputs and activation

Read [dispatch.schema.json](references/dispatch.schema.json) when constructing a
candidate. Return exactly that JSON envelope; omit reasoning traces and freeform
plans. Positive semantic matches may nominate a candidate, but only explicit
positive/negative rules and test vectors authorize deterministic routing.
Negative rules take precedence. This limited matcher does not claim to
understand arbitrary semantic negation.

Read [pipeline.md](references/pipeline.md) for runtime boundaries, prefix
placement, DAG transitions and recovery. Use
[gap-analysis.md](references/gap-analysis.md) for the audited integration points
and remaining stack gaps.

## Execution lifecycle

1. Freeze the request and parent lineage. Refuse repeated ancestors, the current
   compiler's identity, or depth beyond three parents. Each invocation executes
   a finite forward-only graph; generated code receives no synthesis or
   registration tools.
2. Produce a candidate with standard YAML frontmatter, a `scripts/` Python PEP
   723 artifact, a closed scalar argument schema, explicit positive/non-trigger
   rules, and deterministic evaluation vectors. Revision 1 accepts Python with
   no third-party dependencies; TypeScript requires a separately verified
   adapter and is rejected today.
3. Validate without executing synthesized code:

   ```bash
   node .agent/skills/meta-skill/scripts/gate.cjs --check < candidate.json
   ```

4. Admit using an operator-configured `TNF_META_SKILL_IMAGE` reference pinned by
   SHA-256 digest, already present locally:

   ```bash
   node .agent/skills/meta-skill/scripts/gate.cjs --admit < candidate.json
   ```

   The gate validates with Ajv, parses YAML, lints Python AST/PEP 723 without
   importing it, then runs `--help` and repeated evaluations in isolated
   containers. No prompts, dependency installation, network, host mounts, shell
   interpolation, or privilege fallback occur.

5. On failure, write an exclusive quarantine receipt and cordon the exact
   candidate digest. It never enters the transient registry or a discoverable
   Markdown directory. Prior active versions are preserved. Fix the candidate as
   a new immutable revision; do not clear a ledger entry to force admission.
6. On success, persist a receipt containing the candidate and proof before
   adding its digest to the process-local registry. CLI process exit ends that
   registration. A receipt file is not proof that a running host loaded the
   skill. Consumers must revalidate content and admission under their current
   policy before activation.

## Output and verification

The CLI returns one structured status object and an exit code; successful
admission returns a receipt path, not a published skill directory. JSON
candidates remain encoded in receipt files so legacy Markdown scanners cannot
expose quarantined code.

Read [verification.md](references/verification.md),
[evals.schema.json](references/evals.schema.json) and
[assertions.schema.json](references/assertions.schema.json) when authoring or
reviewing evals. [evals.json](references/evals.json) and
[assertions.json](references/assertions.json) contain runnable vectors and
bounds for the included concrete text-normalization candidate.

Current evidence and exact continuation commands are in
[validation-report.md](references/validation-report.md).

Run the compiler's regression suite:

```bash
node --test .agent/skills/meta-skill/scripts/gate.test.cjs
```

Use [scripts/gate.cjs](scripts/gate.cjs) `--help` for discovery. Keep this
entrypoint under 500 lines and description under 1024 characters. Load
references only as needed; keep invariant policy at the context root and
candidate data at a leaf or behind a digest-checked reference.
