/**
 * `tnf graph` — build and traverse the deterministic AST code graph.
 *
 * Every subcommand loads @the-new-fuse/code-graph with a dynamic import. The
 * package pulls a tree-sitter WASM runtime, and cli.ts is explicit that a static
 * import of that weight would be paid on every single `tnf` invocation including
 * the unattended ones (see the ./orchestration.js note in cli.ts).
 *
 * The graph itself is machine-local derived state under ~/.tnf/code-graph/ — it
 * is rebuilt from source on demand and never committed.
 */
import type { Command } from 'commander';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { getOrCreateCommand } from './_registry.js';

type CodeGraphModule = typeof import('@the-new-fuse/code-graph');

const loadEngine = async (): Promise<CodeGraphModule> => {
  try {
    return (await import('@the-new-fuse/code-graph')) as CodeGraphModule;
  } catch (error) {
    throw new Error(
      "The code-graph engine is not built. Run 'pnpm --filter @the-new-fuse/code-graph run build' first.",
      { cause: error as Error }
    );
  }
};

const graphDir = (): string => path.join(os.homedir(), '.tnf', 'code-graph');

/** One graph per project, keyed by the target path so several can coexist. */
function graphPathFor(target: string): string {
  const resolved = path.resolve(target);
  const slug = resolved.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(-120);
  return path.join(graphDir(), `${slug || 'default'}.json`);
}

/** Most recently built graph, so query/path/explain work with no arguments. */
function latestGraphPath(): string | null {
  if (!fs.existsSync(graphDir())) return null;
  const entries = fs
    .readdirSync(graphDir())
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      const full = path.join(graphDir(), f);
      return { full, mtime: fs.statSync(full).mtimeMs };
    })
    .sort((a, b) => b.mtime - a.mtime);
  return entries[0]?.full ?? null;
}

async function requireGraph(explicit?: string) {
  const engine = await loadEngine();
  const target = explicit ? graphPathFor(explicit) : latestGraphPath();
  if (!target || !fs.existsSync(target)) {
    throw new Error(
      explicit
        ? `No graph built for ${explicit}. Run 'tnf graph build ${explicit}' first.`
        : "No graph has been built yet. Run 'tnf graph build [path]' first."
    );
  }
  const { document, graph } = await engine.readGraph(target);
  return { engine, document, graph, graphFile: target };
}

const fail = (error: unknown): never => {
  console.error(`[graph] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
};

export function registerCodeGraphCommands(program: Command, repoRoot: string): void {
  const graph = getOrCreateCommand(
    program,
    'graph',
    'Deterministic AST code graph: build it, then traverse it instead of grepping.'
  );

  graph
    .command('build [target]')
    .description('Parse a directory into a code graph and save it under ~/.tnf/code-graph/.')
    .option('--json', 'Emit the build summary as JSON')
    .option('--no-cluster', 'Skip community detection')
    .option('--quiet', 'Suppress progress output')
    .action(
      async (
        target: string | undefined,
        options: { json?: boolean; cluster?: boolean; quiet?: boolean }
      ) => {
        try {
          const engine = await loadEngine();
          const root = path.resolve(target ?? repoRoot);
          const started = Date.now();
          const result = await engine.buildGraph(root, {
            root,
            skipCluster: options.cluster === false,
            ...(options.quiet || options.json
              ? {}
              : {
                  onProgress: (event) =>
                    process.stderr.write(`[graph] ${event.phase}: ${event.detail}\n`),
                }),
          });
          const outPath = graphPathFor(root);
          await engine.writeGraph(result.document, outPath);

          const summary = {
            target: root,
            graph: outPath,
            elapsedMs: Date.now() - started,
            filesExtracted: result.extraction.filesExtracted,
            failures: result.extraction.failures.length,
            stats: result.stats,
            resolution: result.document.resolution,
            externals: result.document.externals,
            communities: result.document.communities
              ? Object.keys(result.document.communities).length
              : 0,
            modularity: result.document.modularity,
          };

          if (options.json) {
            console.log(JSON.stringify(summary, null, 2));
            return;
          }

          const c = result.stats.edgesByConfidence;
          console.log(`[graph] ${outPath}`);
          console.log(
            `[graph] ${summary.filesExtracted} file(s) in ${(summary.elapsedMs / 1000).toFixed(1)}s ` +
              `-> ${result.stats.nodeCount} nodes, ${result.stats.edgeCount} edges`
          );
          console.log(
            `[graph] confidence: ${c.EXTRACTED} extracted, ${c.INFERRED} inferred, ${c.AMBIGUOUS} ambiguous`
          );
          if (summary.communities) {
            console.log(
              `[graph] ${summary.communities} communities (modularity ${summary.modularity?.toFixed(3)})`
            );
          }
          // Honest reporting: a graph built from a subset is a different claim.
          if (result.extraction.failures.length > 0) {
            console.log(`[graph] ${result.extraction.failures.length} file(s) failed to parse:`);
            for (const failure of result.extraction.failures.slice(0, 5)) {
              console.log(`[graph]   ${failure.file}: ${failure.reason}`);
            }
          }
        } catch (error) {
          fail(error);
        }
      }
    );

  graph
    .command('query <question...>')
    .description('Traverse the graph from the nodes that best match a question.')
    .option('--target <path>', 'Which built graph to use (defaults to the most recent)')
    .option('--budget <tokens>', 'Approximate token cap on the answer', '2000')
    .option('--dfs', 'Follow one chain deep instead of gathering breadth-first')
    .option('--min-confidence <level>', 'EXTRACTED | INFERRED | AMBIGUOUS')
    .option('--json', 'Emit the result subgraph as JSON')
    .action(async (question: string[], options) => {
      try {
        const { engine, graph: g } = await requireGraph(options.target);
        const result = engine.query(g, question.join(' '), {
          mode: options.dfs ? 'dfs' : 'bfs',
          budget: Number(options.budget),
          ...(options.minConfidence
            ? { minConfidence: String(options.minConfidence).toUpperCase() as 'EXTRACTED' }
            : {}),
        });
        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
          return;
        }
        if (result.seeds.length === 0) {
          console.log('[graph] Nothing in the graph matches that question.');
          return;
        }
        console.log(`[graph] seeds: ${result.seeds.map((s) => s.id).join(', ')}`);
        console.log(
          `[graph] ${result.nodes.length} node(s), ${result.edges.length} edge(s), ~${result.tokensUsed} tokens` +
            `${result.truncated ? ' (truncated at budget)' : ''}\n`
        );
        for (const edge of result.edges) {
          console.log(`  ${edge.source}\n    --${edge.relation}(${edge.confidence})--> ${edge.target}`);
        }
      } catch (error) {
        fail(error);
      }
    });

  graph
    .command('path <from> <to>')
    .description('Shortest route between two concepts, with the weakest link on it.')
    .option('--target <path>', 'Which built graph to use (defaults to the most recent)')
    .option('--json', 'Emit the path as JSON')
    .action(async (from: string, to: string, options) => {
      try {
        const { engine, graph: g } = await requireGraph(options.target);
        const result = engine.graphPath(g, from, to);
        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
          return;
        }
        if (!result.found) {
          console.log(`[graph] No path: ${result.reason}`);
          return;
        }
        console.log(`[graph] weakest link on this path: ${result.weakestLink ?? 'n/a'}\n`);
        for (const step of result.steps) {
          const via = step.via ? `--${step.via.relation}(${step.via.confidence})--> ` : '';
          console.log(`  ${via}${step.node.id}`);
        }
      } catch (error) {
        fail(error);
      }
    });

  graph
    .command('explain <name>')
    .description('Everything the graph knows about one node.')
    .option('--target <path>', 'Which built graph to use (defaults to the most recent)')
    .option('--json', 'Emit the explanation as JSON')
    .action(async (name: string, options) => {
      try {
        const { engine, graph: g } = await requireGraph(options.target);
        const result = engine.explain(g, name);
        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
          return;
        }
        if (!result.node) {
          console.log(`[graph] ${result.reason}`);
          return;
        }
        const n = result.node;
        console.log(`[graph] ${n.id}`);
        console.log(`[graph] ${n.kind}${n.language ? ` (${n.language})` : ''} at ${n.sourceFile}${n.sourceLocation ? `:${n.sourceLocation}` : ''}`);
        if (result.alternatives.length > 0) {
          console.log(`[graph] also matched: ${result.alternatives.map((a) => a.id).join(', ')}`);
        }
        console.log(`\n  incoming (${result.incoming.length}):`);
        for (const item of result.incoming.slice(0, 20)) {
          console.log(`    ${item.node.id} --${item.edge.relation}(${item.edge.confidence})-->`);
        }
        console.log(`\n  outgoing (${result.outgoing.length}):`);
        for (const item of result.outgoing.slice(0, 20)) {
          console.log(`    --${item.edge.relation}(${item.edge.confidence})--> ${item.node.id}`);
        }
      } catch (error) {
        fail(error);
      }
    });

  graph
    .command('status')
    .description('List built graphs and what each one contains.')
    .option('--json', 'Emit the listing as JSON')
    .action(async (options: { json?: boolean }) => {
      try {
        if (!fs.existsSync(graphDir())) {
          console.log("[graph] No graphs built yet. Run 'tnf graph build [path]'.");
          return;
        }
        const engine = await loadEngine();
        const files = fs.readdirSync(graphDir()).filter((f) => f.endsWith('.json'));
        const rows = [];
        for (const file of files) {
          const full = path.join(graphDir(), file);
          try {
            const { document } = await engine.readGraph(full);
            rows.push({
              graph: full,
              root: document.root,
              generatedAt: document.generatedAt,
              nodes: document.stats.nodeCount,
              edges: document.stats.edgeCount,
              confidence: document.stats.edgesByConfidence,
            });
          } catch (error) {
            // A graph written by an older schema is reported, not hidden.
            rows.push({
              graph: full,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }
        if (options.json) {
          console.log(JSON.stringify(rows, null, 2));
          return;
        }
        for (const row of rows) {
          if ('error' in row) {
            console.log(`[graph] ${row.graph}\n[graph]   unreadable: ${row.error}`);
            continue;
          }
          console.log(`[graph] ${row.root}`);
          console.log(
            `[graph]   ${row.nodes} nodes, ${row.edges} edges ` +
              `(${row.confidence.EXTRACTED}/${row.confidence.INFERRED}/${row.confidence.AMBIGUOUS} E/I/A) ` +
              `built ${row.generatedAt}`
          );
        }
      } catch (error) {
        fail(error);
      }
    });
}
