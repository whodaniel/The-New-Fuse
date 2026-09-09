---
name: tnf-honest-guard-review
description:
  How to audit an existing check, gate, health probe, or advertised capability
  that claims something it never established. Covers the six shapes of a
  dishonest guard — including a surface that advertises a tool or command with no
  working implementation behind it — the three-state result that fixes them, the
  parity oracle that catches advertised-but-absent, and mutation-testing the fix
  so the new guard is real. Use when a gate says pass/fail and you need to know
  whether it earned that answer, or when adding anything to a catalogue that
  tells a model or an operator what exists.
primary_type: diagnostic
category: engineering/patterns
department: tech
risk_tier: low
harmful_pattern_detection: false
---

# Reviewing a guard for verdicts it did not earn

## When to use this

A check, gate, attestation, or health probe already exists and returns a verdict
that something else depends on. You are asking whether the verdict is backed by
evidence.

This is the **audit** counterpart to [[authoring-enforcement-gates]] (writing a
new gate) and to [[verifying-command-success]] (not fooling yourself with your
own shell commands). Use it when the suspect code is a persistent guard that
other systems trust.

## The core rule

**A guard may only report what it established.** Pass and fail are not the only
outcomes — "I could not determine this" is a third, and collapsing it into
either of the other two is the entire bug class below.

Every one of these shipped in TNF and every one produced a confident, specific,
wrong answer.

## The six shapes

**1. It checks a proxy, not the thing.**
`cli-critical-dist` recorded a `sha256` for each CLI-critical artifact in the
substrate seal, then only called `existsSync`. `@the-new-fuse/shared` drifted
`e8fb7245…` → `b5c55e66…` while the check stayed green for weeks. The evidence
needed was already recorded and simply never compared.
*Ask: does the check consume the evidence it collects?*

**2. It reads one of several sources.**
`gate-policy-token` read `process.env` only, but the token also lives in
`~/.tnf/credentials.env`. A correctly provisioned box was reported "unset" —
a false negative that sent operators hunting a non-existent problem. A sibling
script held the only complete resolver.
*Ask: is this the only place the value can live? Who else resolves it?*

**3. It trusts a self-reported claim.**
`tnf-full-auto-state.json` said `mode: "running"` for a loop last alive 133
hours earlier. Seven consumers read that file and believed it. A frozen state
file cannot report its own death: the failure-streak counter stops advancing
precisely because nothing is running.
*Ask: is this field an observation or an assertion? Judge liveness on a clock,
against an independent signal (pid, pgrep, socket).*

**4. It fails open when a dependency is unreachable.**
The broker's federation gate returned `ok: true` with "local fallback used" on
5xx, invalid JSON, or a transport error. The caller reads `ok` as permission, so
dispatch proceeded to `allow` on a verdict the gate never issued — including
under `enforce`, where the gate is supposed to be authoritative.
*Ask: if the dependency vanished, would this return "allowed"?*

**5. Skipping a probe manufactures a verdict.**
`tnf doctor --skip-live-checks` skipped the cloud-API probe that decides whether
a missing `DATABASE_URL` is a hard failure at all. Skipping did not skip a
check; it produced a `FAIL`. Preflight passed that flag, so full-auto could
never start on a cloud-rooted box — the daemon exited on that line and the loop
stayed dead for days.
*Ask: does any skip/short-circuit path change the verdict rather than omit it?*

**6. It advertises a capability that has no implementation.**

The catalogue is the claim. `llm-tools.ts` advertised `todo_add`, `todo_list`,
`todo_update` and `todo_done` to the model; `agents-run.ts` had no `case` for any
of them, so every call fell through to `unknown tool`. Nothing compared the two
files, so the surface stayed wrong for months. A tool a model is *told* it has
and does not is worse than no tool: it burns turns and produces confident
nonsense built on an imagined result.

This shape is not limited to LLM tools — it is any catalogue read as truth: a
command surface, a capability manifest, an MCP tool list, a skill index, a
parity audit that scores *names*.

The fix is a **parity oracle**: a test that reads both sides and fails when the
advertised set is not a subset of the implemented set.

```js
const advertised = BUILTIN_TOOLS.filter((t) => t.defaultEnabled).map((t) => t.name);
const implemented = new Set(
  [...fs.readFileSync(EXECUTOR, 'utf8').matchAll(/case\s+'([a-z0-9_]+)'\s*:/gi)].map((m) => m[1])
);
```

Where the defect already exists and is out of scope to fix, record it as an
explicit allow-list — never widen the oracle to accommodate it:

```js
/** Pre-existing debt. Shrink this; never grow it. */
const KNOWN_MISSING = new Set(['todo_add', 'todo_list', 'todo_update', 'todo_done']);
```

That keeps the oracle green on a repo that already has the defect while still
blocking *new* instances, and it makes the debt countable instead of invisible.
Adding a line to that set is not a fix.

## A latch will name the wrong culprit

When a guard latches (escalation halt, quarantine, circuit breaker), the message
you see describes the *latch*, not the cause. A TNF escalation halt reported
`2 identical failures for node (e6971280…)`; the actual cause was a lockfile
digest that no longer matched the substrate seal, several layers away.

Read the underlying report before believing the headline:

```bash
node scripts/protocols/validate-substrate-attestation.cjs --json | \
  python3 -c "import json,sys; d=json.load(sys.stdin); \
    [print(c['severity'], c['id'], c['detail']) for c in d['checks'] if not c['ok']]"
```

Remediate the cause, *then* clear the latch. Clearing first only re-trips it.
Never reach for the documented override (`TNF_SKIP_*`) as a fix — that is an
operator escape hatch, not a repair.

## The fix: three states, and a severity that matches

Return the distinction rather than flattening it:

| Situation | `ok` | severity | why |
|---|---|---|---|
| Verified good | `true` | — | evidence obtained |
| Verified bad | `false` | `hard` | evidence obtained |
| Could not establish | `false` | `soft` | absence of evidence is not evidence |

"Could not establish" must not read as OK, and must not brick the system either.
Concretely: a token whose endpoint is unreachable is `unverified`, not
`rejected`; an artifact the seal never recorded is `unsealed`, not `matching`; a
gate that 5xx'd is `unavailable`, not `allow`.

Where a caller must act on it, let the *mode* decide: enforce treats
`unavailable` like a denial, warn proceeds while recording that it was
unverified. Both stop an enforced action; the operator can still tell "denied"
from "could not ask".

## Prove the new guard is real

A test that passes against the broken code guards nothing. After fixing, run the
new tests against the **pre-fix** implementation and confirm they fail:

```bash
cp guard.cjs /tmp/guard-fixed.cjs
git show origin/main:path/to/guard.cjs > path/to/guard.cjs   # pre-fix
node --test path/to/guard.test.cjs        # expect the NEW tests to fail
cp /tmp/guard-fixed.cjs path/to/guard.cjs # restore
node --test path/to/guard.test.cjs        # expect all green
```

Doing this on the substrate attestation showed exactly 7 of 15 failing against
the old script and 15/15 against the new one — which is what made the guards
credible rather than decorative.

Also test the guard's own negative direction: a schema gate was fixed to accept
a widened `enum`, then deliberately fed a schema missing a version and one with
a bogus version, to prove it still rejected both.

## Checklist

- [ ] Does the check consume the evidence it already collects?
- [ ] Is this the only source the value can come from?
- [ ] Is the field an observation, or the subject's own claim about itself?
- [ ] If the dependency vanished, does this return "allowed" or "healthy"?
- [ ] Does any skip path change the verdict instead of omitting it?
- [ ] Can "unknown" be told apart from "fine" in the output?
- [ ] Do the new tests fail against the old code?

See also [[authoring-enforcement-gates]], [[verifying-command-success]],
[[tnf-harness-integrity-auditor]].
