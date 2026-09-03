# TNF Notation Coherence Protocol

`[CLASS:PRIME] [STATUS:ACTIVE] [DOC_TYPE:PROTOCOL_STANDARD] [VISIBILITY:COLLECTIVE] [OWNER:TNF]`

## The gap this closes

TNF had two notation defenses and a hole between them.

`notation-reconciliation-audit.cjs` finds notation pointing at things that no
longer exist — dangling paths, dangling commands. `STATE_FRESHNESS_MANDATE`
governs claims about _live_ state. Neither catches the case in the middle:
**notation that still resolves, but now misdescribes the code it sits above,
because the code changed and its description did not.**

That case is not hypothetical. Four instances in a single session,
2026-09-02/03:

| Where                    | What the notation said                          | What the code did                             |
| ------------------------ | ----------------------------------------------- | --------------------------------------------- |
| `isEntitled()`           | "a server-side deployment switch", env var only | also resolved operator login custody          |
| `resolve-cloud-redis.sh` | "Legacy Railway discovery retired"              | four `CLOUD_RUNTIME_*` branches still present |
| `scripts/deploy.js`      | "CloudRuntime uses cloud_runtime.toml"          | invoked `gcp-deploy.sh`                       |
| ~447 files               | Railway/`cloud_runtime` as live infrastructure  | platform retired                              |

The first was introduced _by the commit that changed the code_, and required a
follow-up PR to correct. It was caught only because someone happened to re-read
it. That is not a control.

## Why this matters more than untidiness

A stale comment is worse than no comment, because it is read as authority.

TNF has already paid for this: an agent running a chain-of-command audit read
`.agent/agents/super-director.md` and `TNF_AUTHORITATIVE_CHAIN_OF_COMMAND.md`,
which advertised the dead host `tramway.proxy.rlwy.net` as the live Cloud Redis
backbone, and reported dead infrastructure as live. A later session then spent
real time hunting a heartbeat on a store that never existed.

Stale notation does not sit inert. Another agent reads it and manufactures a
false claim from it, and that claim enters a report that a human trusts.

## The rule

> **A commit that changes what code does must, in the same commit, update the
> notation that describes it — or leave the description demonstrably still
> true.**

"Notation" is whatever a reader would consult to learn the behaviour: the doc
comment above the declaration, the protocol doc that specifies it, the skill
file that tells an agent how to use it.

Same commit, not "later". A description that is wrong between commits is wrong
in every checkout, every clone, and every agent context that reads it in
between.

## Enforcement

```bash
node scripts/protocols/notation-coherence-gate.cjs            # staged, advisory
node scripts/protocols/notation-coherence-gate.cjs --strict   # exit 1 on findings
node scripts/protocols/notation-coherence-gate.cjs --json
```

For each staged code file it finds the changed line ranges, walks to the
enclosing declaration, and looks for the comment block attached above it. If the
code changed and its attached description did not, it surfaces the pair.

**It is advisory by default, and that is deliberate.** The gate cannot know
whether the description is _actually_ wrong — deciding that requires reading,
which is the entire point. It reports "you changed this; its description did not
change; confirm it is still true." Blocking on a heuristic that cannot verify
its own finding would train people to bypass it, which is how a gate becomes
inert.

Same philosophy as `notation-reconciliation-auditor`: surface for semantic
review, never auto-judge. It also ignores undocumented code (a different
problem) and one-line markers (too short to be a description of behaviour).

## What it does not cover

- Notation in a _different file_ from the code it describes — a protocol doc or
  SKILL.md is not adjacent to the function, so nothing links them mechanically.
  That remains a judgment call, and the rule above still applies.
- Whether a description was accurate to begin with.
- Behaviour changes with no textual change at all — a dependency upgrade that
  alters semantics leaves no diff to catch.

The first is the significant one. If you change behaviour that a protocol doc or
skill specifies, updating the doc comment is not sufficient.

## Related

- `docs/protocols/STATE_FRESHNESS_MANDATE.md` — claims about live state
- `.agent/skills/notation-reconciliation-auditor/SKILL.md` — dangling references
- `.agent/skills/tnf-platform-migration-residue-audit/SKILL.md` — notation left
  behind by a platform migration, including the renamed-not-removed case
