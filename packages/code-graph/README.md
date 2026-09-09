# @the-new-fuse/code-graph

Deterministic code knowledge graph built from tree-sitter ASTs. Every edge carries
an `EXTRACTED` / `INFERRED` / `AMBIGUOUS` confidence label, and the validator
refuses to let an unlabelled edge into the graph.

No LLM. No embeddings. No network. Parsing is local and reproducible: the same
input always produces the same graph.

## Why this exists

TNF could already search code semantically (`@the-new-fuse/core-vector-db`,
pgvector) and had several curated graphs, but nothing that read code
*structurally*. Every graph edge was lexical, embedding-derived, or hand-written.
This package supplies the missing layer: real `imports` / `calls` / `extends` /
`implements` edges, with an audit trail attached to each one.

It is complementary to the vector layer, not a replacement. Embeddings answer
"what is this about"; this answers "what actually references what".

## Install

```bash
pnpm add @the-new-fuse/code-graph
```

Grammars come from `@vscode/tree-sitter-wasm` as prebuilt WASM — no `node-gyp`,
no native compilation, works anywhere Node 20+ runs.

## Use

```ts
import { buildGraph, query, graphPath, explain, writeGraph } from '@the-new-fuse/code-graph';

const { graph, document, stats } = await buildGraph('./src');

console.log(stats.edgesByConfidence);
// { EXTRACTED: 10482, INFERRED: 1262, AMBIGUOUS: 275 }

// Traverse instead of grepping
const answer = query(graph, 'how does the durable task service dispatch work', { budget: 2000 });

// Shortest route between two concepts, reported with its weakest link
const route = graphPath(graph, 'AssimilationService', 'DurableTaskService');
console.log(route.weakestLink); // 'AMBIGUOUS' — the chain is only as good as this

// Everything the graph knows about one node
const detail = explain(graph, 'WorkflowGraphBridge');

await writeGraph(document, './graph.json');
```

Anything that failed to parse is reported, never hidden:

```ts
const { extraction } = await buildGraph('./src');
if (extraction.failures.length) console.warn(extraction.failures);
```

A graph built from 900 of 1000 files is a different claim than one built from all
of them, so `filesExtracted` and `failures` are part of the result.

## The confidence labels

This is the part worth copying even if you never use the rest.

| Label | Meaning | Example |
|---|---|---|
| `EXTRACTED` | Stated explicitly in the source | an `import` statement; an `extends` clause; a call to a function defined in the same file |
| `INFERRED` | Resolved by this package, not read directly | a cross-file call matched to exactly one definition; `./base` resolved to `app/base.ts` |
| `AMBIGUOUS` | Genuinely uncertain — every candidate is recorded | a call whose name matches several definitions |

Two things deliberately produce **no edge at all**:

- a callee that matches nothing in the corpus (a builtin, or a third-party symbol)
- a callee matching more definitions than `ambiguityLimit` (default 4) — a name
  like `run` or `get` carries no evidence

Both are counted in `document.resolution` rather than silently dropped. A call
graph that invents a target is worse than one that admits it does not know.

### How precision is kept

Three rules do most of the work, in this order:

1. **Imports are resolved before calls.** When the calling file imports one of the
   candidate definitions' files, that candidate is the one the call site means.
2. **A member call can only be a method.** `pattern.test(x)` is not a call to a
   top-level function named `test`. Without this rule that single false edge put
   two unrelated services two hops apart.
3. **Same-file wins.** A call to a definition in the same file is `EXTRACTED` and
   never enters the repo-wide guessing pass at all.

Rule 1 depends on the import graph being populated, which is why
`require('./x')` is treated as an import rather than a call to `require`. On a
992-file CommonJS-heavy tree, adding that took imports from 1,630 to 3,458,
resolved modules from 31 to 227, and *reduced* AMBIGUOUS call edges by 77 —
better import coverage buys precision, not just more edges.

## Supported languages

| Language | Extensions | Nodes | Edges |
|---|---|---|---|
| TypeScript / TSX / JavaScript | `.ts .tsx .mts .cts .js .jsx .mjs .cjs` | class, interface, type, function, method, constant | imports (ESM `import`, CommonJS `require()`, dynamic `import()`), calls, extends, implements, defines, contains |
| Python | `.py` | class, method, function | imports, calls, extends (base classes), defines, contains |
| Go | `.go` | type, interface, constant, function, method | imports, calls, defines, contains |
| Rust | `.rs` | struct/enum, trait, constant, function, method | use, calls, implements (`impl T for S`), defines, contains |

This is the set that has passing tests. The grammar bundle carries more languages
(bash, C#, C++, Java, PHP, Ruby, …); they are not claimed until an extractor and
its tests exist.

### Adding a language

1. Add the grammar file name to `GRAMMAR_FILES` in `src/parser.ts`.
2. Add the extension to `LANGUAGE_BY_EXTENSION` in `src/extract/index.ts`.
3. Write `src/extract/<lang>.ts` exporting `extract<Lang>(ctx: ExtractorContext)`.
   Two passes: definitions first, then references — a single pass downgrades
   every call to a function declared later in the file.
4. Register it in the `EXTRACTORS` map.
5. Add fixtures to `src/__tests__/corpus.ts` and assertions to `extract.test.ts`.

Read the grammar's node types off the real WASM rather than assuming them; field
names differ between grammars in ways that are not guessable.

## Artifact format

`writeGraph` emits a `GraphDocument`: `schemaVersion`, `generator`, `generatedAt`,
`root`, `stats`, `resolution`, `externals`, `communities`, `modularity`, `nodes`,
`edges`. Node ids are relative to `root`, so a graph is portable across machines.

`readGraph` refuses a document whose `schemaVersion` it does not know, rather than
misreading it.

## Communities

`cluster()` runs Louvain over the graph and returns communities largest-first with
the modularity score. It is computed from the graph's own structure, not from
authored categories. Modularity is always reported against the original graph, so
it stays inside `[-1, 1]`.

## Performance

209 TypeScript files (~7,300 nodes, ~12,000 edges) in under 10 seconds on a 2015
MacBook Pro, single-threaded. Parsers are cached per language; call
`disposeParsers()` when a long-lived process is finished.

## Testing

```bash
pnpm --filter @the-new-fuse/code-graph run build
pnpm --filter @the-new-fuse/code-graph run test
```

Fixtures are written to a temp directory at runtime rather than checked in, so
`tsc -b` never tries to compile a deliberately odd fixture.
