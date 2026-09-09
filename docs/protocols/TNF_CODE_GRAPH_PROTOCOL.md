# TNF Code Graph Protocol

**Status:** active (2026-09-07) · **Scope:** any TNF surface that emits, stores,
merges, or reports graph edges about the codebase.

This protocol governs one rule: **an edge is a claim, and a claim states its
evidence.**

## Why this exists

TNF's recurring defect is not missing capability — it is capability that reports
a verdict it never earned. A parity audit that scored tool *names* while four
tools had no executor. A federation gate that swallowed a live 401 and returned
a fabricated `allow`. Substrate checks that verified a proxy instead of the
thing. Each looked green and meant nothing.

A code graph is unusually good at this failure. "`AuthService` calls
`TokenStore`" reads identically whether it was parsed from an import statement,
guessed from a matching name, or invented by a heuristic. Once an unlabelled
edge is in the graph, nothing downstream can recover how much to trust it.

So provenance is not metadata here. It is the primary field.

## The contract

Every edge carries `confidence`, exactly one of:

| Label | Meaning | Example |
|---|---|---|
| `EXTRACTED` | Explicitly stated in the source text | `import`, an `extends` clause, a call to a same-file definition |
| `INFERRED` | Produced by a documented resolution rule, not read directly | a cross-file call matched to exactly one definition; `./base` resolved to `app/base.ts` |
| `AMBIGUOUS` | Genuinely uncertain; every candidate recorded | a callee name matching several definitions |

Three obligations follow.

### 1. No edge without a label

`packages/code-graph/src/validate.ts` returns an error for any edge missing or
misspelling `confidence`, and `build()` calls `assertValid()` before consuming an
extraction. The gate sits at the choke point every edge must pass, not in a
linter that can be skipped.

Any other producer of code-graph edges must enforce the same rule at its own
choke point. `scripts/semantic-graph/build_unified_graph.py` step 12b rejects and
counts unlabelled edges rather than importing them.

### 2. Silence is a result, and is counted

Two situations produce no edge:

- the referenced symbol matches nothing in the corpus (builtin / third-party)
- it matches more definitions than `ambiguityLimit` (default 4) — a name like
  `run` carries no evidence

Both are reported in `document.resolution` as `droppedNoMatch` and
`droppedTooCommon`. **Dropping must never be silent.** A consumer that sees
16,000 drops knows the call graph is partial; one that sees only the edges does
not.

Likewise `filesExtracted` and `failures` are part of every build result. A graph
over 900 of 1000 files is a different claim from one over all of them, and the
difference must be visible without asking.

### 3. Reporting carries the label

Any surface that reports a graph result — CLI, MCP tool, autonomous-loop tool,
visualization, a person writing a summary — carries the confidence with it.

- `tnf graph path` prints the **weakest link** on the chain, because a path is
  only as trustworthy as its weakest edge.
- The MCP tools return `confidence` on every edge and state the vocabulary in
  their own descriptions, so a model consuming them is told what the labels mean.
- `unified_graph_stats.json` carries `code_graph_confidence`.

A path whose weakest link is `AMBIGUOUS` is a hypothesis. Presenting it as a
finding violates this protocol regardless of whether it happens to be correct.

## Resolution rules must be documented and conservative

An `INFERRED` edge is only as good as the rule that produced it. Every rule in
use is documented in the source that applies it, and each is conservative — it
narrows candidates, and never invents one:

1. **Imports resolve before calls.** When the calling file imports a candidate's
   file, that candidate is what the call site means.
2. **A member call can only be a method.** `pattern.test(x)` is not a call to a
   free function named `test`.
3. **Same-file wins.** A same-file call is `EXTRACTED` and skips resolution.

Adding a resolution rule means adding a test that shows what it *stops* matching,
not only what it starts matching.

## Vocabulary

Node kinds: `file`, `module`, `function`, `class`, `method`, `interface`,
`type`, `constant`, `external`.

Edge relations: `imports`, `calls`, `extends`, `implements`, `uses`, `defines`,
`contains`.

Node ids are relative to the build root: `<relPath>` for files,
`<relPath>#<symbol>` for symbols, `external:<specifier>` for unresolved
references. Ids must not carry machine-specific path segments, which is why
`extract()` requires an explicit `root` rather than inferring one.

## Boundaries

- **This protocol does not govern semantic similarity.** Embedding edges
  (`embedding_similar`, pgvector) are a different kind of claim with a different
  evidence model. Do not label them with this vocabulary, and do not add an
  embedding pass to the code graph.
- **A built graph is derived state.** It lives under `~/.tnf/code-graph/` and is
  never committed. Nothing may depend on a graph file being present in the repo.
- **The graph is not an authority on intent.** It records what the code
  references, not what it should reference.

## Conformance

A surface conforms when all of the following hold:

- [ ] every edge it emits or forwards carries a valid `confidence`
- [ ] unlabelled edges are rejected at its choke point, and the rejection is counted
- [ ] dropped/unresolved references are reported, not swallowed
- [ ] extraction failures and coverage are visible in its output
- [ ] anything it shows a human or a model states the confidence
- [ ] any resolution rule it adds has a test showing what the rule excludes

## References

- `packages/code-graph/` — engine, schema, validator, resolvers
- `packages/mcp-code-graph-server/` — MCP surface
- `packages/tnf-cli/src/commands/code-graph.ts` — `tnf graph`
- `scripts/semantic-graph/build_unified_graph.py` step 12b — merge
- `.agent/skills/tnf-code-graph/SKILL.md` — operating procedure
- `.agent/skills/tnf-honest-guard-review/` — the review method this protocol serves
