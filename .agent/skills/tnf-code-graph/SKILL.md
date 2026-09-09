---
name: tnf-code-graph
description: >-
  Build and traverse the TNF deterministic AST code graph instead of grepping.
  Use when asked how code connects, what calls or imports something, how one
  symbol reaches another, or to trace a change's blast radius. Also use when
  adding a language extractor, or when a graph edge's trustworthiness matters.
  Covers `tnf graph` commands, the EXTRACTED/INFERRED/AMBIGUOUS contract, the
  MCP surface, and the unified-graph merge.
primary_type: protocol
category: engineering/code-intelligence
department: tech
risk_tier: low
harmful_pattern_detection: false
---

# TNF Code Graph

Deterministic tree-sitter AST graph of a codebase. No LLM, no embeddings, no
network — the same source always produces the same graph.

It exists because until 2026-09-07 every TNF graph edge was lexical
(concordance, `same_file`), embedding-derived (`embedding_similar`), or authored
by hand (`tools/agent-relationship-graph`). Nothing read code *structurally*.
`packages/core-vector-db/src/codebase-vectorizer.ts` declared the right shape and
admitted in a comment that it was regex, and nothing imported it.

## When to reach for it

- "What calls X?" / "What would break if I change Y?"
- "How does A reach B?" — `tnf graph path` answers in one command
- "What is in this package?" — traverse rather than open twenty files
- Before a refactor, to see the real dependency surface

Do **not** use it for "what is this about" questions. That is semantic, and
TNF already answers it with pgvector (`@the-new-fuse/core-vector-db`). The two
are complementary; do not reimplement either inside the other.

## Commands

```bash
tnf graph build [path]              # parse -> ~/.tnf/code-graph/<slug>.json
tnf graph build . --json            # machine-readable build summary
tnf graph status                    # what graphs exist and what they cover
tnf graph query "how does the durable task service dispatch work"
tnf graph query "..." --min-confidence EXTRACTED   # source-stated edges only
tnf graph path AssimilationService DurableTaskService
tnf graph explain WorkflowGraphBridge
```

Query/path/explain use the most recently built graph unless `--target <path>` is
given. All four accept `--json`.

The graph is machine-local derived state under `~/.tnf/code-graph/`. It is never
committed — rebuild it, do not ship it.

## The confidence contract

This is the part that matters most, and the part to copy elsewhere.

| Label | Meaning |
|---|---|
| `EXTRACTED` | Explicit in the source: an import statement, an `extends` clause, a call to a function defined in the same file |
| `INFERRED` | Resolved by the tool: a cross-file call matched to exactly one definition; `./base` resolved to `app/base.ts` |
| `AMBIGUOUS` | Several candidates, all recorded so the ambiguity is visible |

Two things produce **no edge at all**, and both are counted in
`document.resolution` rather than dropped silently:

- a callee matching nothing in the corpus (a builtin or third-party symbol)
- a callee matching more definitions than `ambiguityLimit` (default 4) — a name
  like `run` or `get` is not evidence

`build()` calls `assertValid()` before it will touch an extraction, so an edge
without a confidence label cannot enter the graph even if an extractor forgot
one. The gate is at the choke point, not in a linter.

**When reporting a result from this graph, carry the label.** `tnf graph path`
prints the weakest link on the chain for exactly this reason. A path whose
weakest link is `AMBIGUOUS` is a hypothesis, not a finding. Reporting it as a
finding is the [guards report verdicts they never earned] failure in a new place.

## Precision rules (why the edges are trustworthy)

Three rules, applied in this order, do most of the work:

1. **Imports resolve before calls.** When the calling file imports one of the
   candidate definitions' files, that candidate is what the call site means.
   ESM `import`, CommonJS `require('x')` and dynamic `import('x')` all count —
   a CJS tree with no import edges silently disables this rule.
2. **A member call can only be a method.** `pattern.test(x)` is not a call to a
   top-level function named `test`. Before this rule, that single false edge put
   two unrelated services two hops apart on a real query.
3. **Same-file wins.** A call to a same-file definition is `EXTRACTED` and never
   enters the repo-wide resolution pass.

If a result looks wrong, check which of these three did not apply before
concluding the graph is broken.

## Languages

TypeScript/TSX/JavaScript, Python, Go, Rust — the four in this monorepo, each
with passing extractor tests. The grammar bundle (`@vscode/tree-sitter-wasm`)
carries more (bash, C#, C++, Java, PHP, Ruby, …). **Do not claim a language
before an extractor and its tests exist for it.**

### Adding a language

1. Grammar file name → `GRAMMAR_FILES` in `packages/code-graph/src/parser.ts`.
2. Extension → `LANGUAGE_BY_EXTENSION` in `src/extract/index.ts`.
3. Write `src/extract/<lang>.ts`. Two passes: definitions, then references. A
   single pass downgrades every call to a function declared later in the file.
4. Register in the `EXTRACTORS` map.
5. Fixture in `src/__tests__/corpus.ts`, assertions in `extract.test.ts`.

**Read the grammar's node types off the real WASM before writing the extractor.**
Field names differ between grammars in ways that are not guessable — `go` uses
`selector_expression[field]`, `python` uses `attribute[attribute]`, `rust` uses
`field_expression[field]`. A short probe script that dumps the parse tree of a
fixture costs two minutes and saves a wrong extractor.

## Other surfaces

- **Autonomous loop:** `graph_query`, `graph_path`, `graph_explain` are builtin
  LLM tools with real executors in `packages/tnf-cli/src/commands/agents-run.ts`.
  `src/utils/llm-tools.executors.test.ts` fails if a tool is ever advertised
  without one.
- **MCP:** `packages/mcp-code-graph-server` serves the same four operations over
  stdio to any MCP host, plus `code-graph://stats` and `code-graph://communities`.
- **Unified semantic graph:** `scripts/semantic-graph/build_unified_graph.py`
  step 12b merges the artifact as origin `code-graph`, carrying each edge's
  confidence into `unified_graph_stats.json` under `code_graph_confidence`.
  Set `TNF_CODE_GRAPH_JSON` to point at a specific graph. The step is optional —
  the semantic pipeline still builds on a machine that never ran `tnf graph build`.

## Verification

```bash
pnpm --filter @the-new-fuse/code-graph run build
pnpm --filter @the-new-fuse/code-graph run test
pnpm --filter @the-new-fuse/mcp-code-graph-server run build
tsx packages/tnf-cli/src/utils/llm-tools.executors.test.ts
node scripts/protocols/command-surface-gate.cjs --mode=ci
```

Only report checks that actually ran. A newly authored test is not a passing
test until it has run.

## Guardrails

- **Never present an INFERRED or AMBIGUOUS edge as a fact.** Say which it is.
- **Never claim coverage the tests do not show.** `filesExtracted` and
  `failures` are on every build result; a graph over 900 of 1000 files is a
  different claim from one over all of them.
- **Do not add a semantic/embedding pass here.** That is the vector layer's job.
- **Do not commit a built graph.** It is derived state; rebuild it.
- **A new origin needs a palette entry.** `build_graph_explorer.py` drops any
  origin missing from `PALETTE` out of the legend *and* out of `activeOrigins`,
  so its nodes silently become unfilterable.
