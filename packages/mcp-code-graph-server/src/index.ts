#!/usr/bin/env node
/**
 * TNF code-graph MCP server.
 *
 * Exposes the deterministic AST code graph over stdio so any MCP host can
 * traverse a codebase instead of grepping it. Mirrors the structure of
 * @the-new-fuse/mcp-concordance-server, which serves lexical concordance data:
 * this one serves structural edges, and every edge it returns carries its
 * EXTRACTED / INFERRED / AMBIGUOUS provenance so the caller can tell a
 * read-from-source fact from a resolution.
 *
 * The graph is built by `tnf graph build` and read from ~/.tnf/code-graph/.
 * This server never parses or writes; it is a read-only view.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import {
  explain,
  graphPath,
  query,
  readGraph,
  type CodeGraph,
  type Confidence,
  type GraphDocument,
} from '@the-new-fuse/code-graph';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

const GRAPH_DIR = process.env.TNF_CODE_GRAPH_DIR || path.join(os.homedir(), '.tnf', 'code-graph');

interface LoadedGraph {
  graph: CodeGraph;
  document: GraphDocument;
  file: string;
}

let cache: (LoadedGraph & { mtimeMs: number }) | null = null;

/** Newest graph file, or null when none has been built. */
async function newestGraphFile(): Promise<{ file: string; mtimeMs: number } | null> {
  let entries: string[];
  try {
    entries = (await fs.readdir(GRAPH_DIR)).filter((f) => f.endsWith('.json'));
  } catch {
    return null;
  }
  if (entries.length === 0) return null;
  const stats = await Promise.all(
    entries.map(async (name) => {
      const file = path.join(GRAPH_DIR, name);
      return { file, mtimeMs: (await fs.stat(file)).mtimeMs };
    })
  );
  return stats.sort((a, b) => b.mtimeMs - a.mtimeMs)[0] ?? null;
}

/**
 * Load the newest graph, reusing the cached one while its mtime is unchanged.
 *
 * Rebuilds land as a new mtime, so a long-lived server picks them up without
 * needing a restart — and without re-reading a multi-megabyte file per call.
 */
async function loadGraph(): Promise<LoadedGraph> {
  const newest = await newestGraphFile();
  if (!newest) {
    throw new Error(
      `No code graph found in ${GRAPH_DIR}. Build one with 'tnf graph build <path>' first.`
    );
  }
  if (cache && cache.file === newest.file && cache.mtimeMs === newest.mtimeMs) return cache;
  const { document, graph } = await readGraph(newest.file);
  cache = { graph, document, file: newest.file, mtimeMs: newest.mtimeMs };
  return cache;
}

const server = new Server(
  { name: 'tnf-code-graph-server', version: '1.0.0' },
  { capabilities: { tools: {}, resources: {} } }
);

const PROVENANCE_NOTE =
  'Every edge carries `confidence`: EXTRACTED (explicit in the source), ' +
  'INFERRED (resolved by the tool, e.g. a cross-file call matched to exactly one ' +
  'definition), or AMBIGUOUS (several candidates, all recorded). Do not treat an ' +
  'AMBIGUOUS edge as a fact.';

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'graph_query',
      description:
        'Traverse the code graph outward from the symbols that best match a question. ' +
        'Returns a bounded subgraph of real imports/calls/extends/implements edges. ' +
        `Use instead of grepping when the question is about how code connects. ${PROVENANCE_NOTE}`,
      inputSchema: {
        type: 'object' as const,
        properties: {
          question: { type: 'string', description: 'What you want to understand.' },
          budget: {
            type: 'number',
            description: 'Approximate token cap on the returned subgraph (default 2000).',
            default: 2000,
          },
          mode: {
            type: 'string',
            enum: ['bfs', 'dfs'],
            description: 'bfs gathers breadth; dfs follows one chain deep.',
            default: 'bfs',
          },
          min_confidence: {
            type: 'string',
            enum: ['EXTRACTED', 'INFERRED', 'AMBIGUOUS'],
            description: 'Ignore weaker edges. EXTRACTED returns source-stated edges only.',
          },
        },
        required: ['question'],
      },
    },
    {
      name: 'graph_path',
      description:
        'Shortest route between two symbols, classes or files, reported with the weakest ' +
        `confidence anywhere on the chain. Answers "how does X reach Y". ${PROVENANCE_NOTE}`,
      inputSchema: {
        type: 'object' as const,
        properties: {
          from: { type: 'string', description: 'Symbol, class or file path to start from.' },
          to: { type: 'string', description: 'Symbol, class or file path to reach.' },
        },
        required: ['from', 'to'],
      },
    },
    {
      name: 'graph_explain',
      description:
        'Everything the graph knows about one node: where it is defined, what references it, ' +
        `and what it references. ${PROVENANCE_NOTE}`,
      inputSchema: {
        type: 'object' as const,
        properties: {
          name: { type: 'string', description: 'Symbol, class, method or file path.' },
          limit: {
            type: 'number',
            description: 'Maximum edges to return per direction (default 40).',
            default: 40,
          },
        },
        required: ['name'],
      },
    },
    {
      name: 'graph_stats',
      description:
        'Summary of the loaded graph: node and edge counts by kind, relation and confidence, ' +
        'languages covered, how many calls and imports resolved, and when it was built. ' +
        'Call this first to know what the graph does and does not cover.',
      inputSchema: { type: 'object' as const, properties: {} },
    },
  ],
}));

const asText = (payload: unknown) => ({
  content: [{ type: 'text' as const, text: JSON.stringify(payload, null, 2) }],
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name } = request.params;
  const args = (request.params.arguments ?? {}) as Record<string, unknown>;

  try {
    const { graph, document, file } = await loadGraph();

    switch (name) {
      case 'graph_stats':
        return asText({
          graph: file,
          root: document.root,
          generatedAt: document.generatedAt,
          stats: document.stats,
          resolution: document.resolution,
          externals: document.externals,
          communities: document.communities ? Object.keys(document.communities).length : 0,
          modularity: document.modularity,
        });

      case 'graph_query': {
        const question = String(args.question ?? '');
        if (!question) throw new Error('graph_query: `question` is required');
        const budget = Number(args.budget);
        const result = query(graph, question, {
          mode: args.mode === 'dfs' ? 'dfs' : 'bfs',
          budget: Number.isFinite(budget) && budget > 0 ? budget : 2000,
          ...(typeof args.min_confidence === 'string'
            ? { minConfidence: args.min_confidence as Confidence }
            : {}),
        });
        if (result.seeds.length === 0) {
          return asText({
            found: false,
            reason: 'nothing in the graph matches that question',
            hint: 'try a symbol or file name that appears in the codebase',
          });
        }
        return asText({
          found: true,
          seeds: result.seeds.map((n) => n.id),
          truncated: result.truncated,
          tokensUsed: result.tokensUsed,
          nodes: result.nodes.map((n) => ({
            id: n.id,
            kind: n.kind,
            at: n.sourceLocation ? `${n.sourceFile}:${n.sourceLocation}` : n.sourceFile,
            depth: n.depth,
          })),
          edges: result.edges.map((e) => ({
            from: e.source,
            relation: e.relation,
            to: e.target,
            confidence: e.confidence,
            evidence: e.evidence,
          })),
        });
      }

      case 'graph_path': {
        const from = String(args.from ?? '');
        const to = String(args.to ?? '');
        if (!from || !to) throw new Error('graph_path: both `from` and `to` are required');
        const result = graphPath(graph, from, to);
        if (!result.found) return asText({ found: false, reason: result.reason });
        return asText({
          found: true,
          weakestLink: result.weakestLink,
          steps: result.steps.map((s) => ({
            node: s.node.id,
            at: s.node.sourceLocation
              ? `${s.node.sourceFile}:${s.node.sourceLocation}`
              : s.node.sourceFile,
            ...(s.via
              ? {
                  via: {
                    relation: s.via.relation,
                    confidence: s.via.confidence,
                    evidence: s.via.evidence,
                  },
                }
              : {}),
          })),
        });
      }

      case 'graph_explain': {
        const target = String(args.name ?? '');
        if (!target) throw new Error('graph_explain: `name` is required');
        const limitArg = Number(args.limit);
        const limit = Number.isFinite(limitArg) && limitArg > 0 ? limitArg : 40;
        const result = explain(graph, target);
        if (!result.node) return asText({ found: false, reason: result.reason });
        return asText({
          found: true,
          node: {
            id: result.node.id,
            kind: result.node.kind,
            language: result.node.language,
            at: result.node.sourceLocation
              ? `${result.node.sourceFile}:${result.node.sourceLocation}`
              : result.node.sourceFile,
          },
          alternatives: result.alternatives.map((n) => n.id),
          incomingTotal: result.incoming.length,
          outgoingTotal: result.outgoing.length,
          incoming: result.incoming.slice(0, limit).map((i) => ({
            from: i.node.id,
            relation: i.edge.relation,
            confidence: i.edge.confidence,
          })),
          outgoing: result.outgoing.slice(0, limit).map((o) => ({
            to: o.node.id,
            relation: o.edge.relation,
            confidence: o.edge.confidence,
          })),
        });
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    // Return the failure as content rather than throwing: an MCP host shows the
    // model a tool result it can act on, and "build the graph first" is
    // actionable in a way that a transport-level error is not.
    return {
      isError: true,
      content: [
        {
          type: 'text' as const,
          text: error instanceof Error ? error.message : String(error),
        },
      ],
    };
  }
});

server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: 'code-graph://stats',
      name: 'Code graph statistics',
      description: 'Counts by kind, relation and confidence for the currently loaded graph.',
      mimeType: 'application/json',
    },
    {
      uri: 'code-graph://communities',
      name: 'Detected communities',
      description: 'Louvain communities over the code graph, largest first.',
      mimeType: 'application/json',
    },
  ],
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  const { document } = await loadGraph();

  if (uri === 'code-graph://stats') {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(
            {
              root: document.root,
              generatedAt: document.generatedAt,
              stats: document.stats,
              resolution: document.resolution,
              externals: document.externals,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  if (uri === 'code-graph://communities') {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(
            { modularity: document.modularity, communities: document.communities ?? {} },
            null,
            2
          ),
        },
      ],
    };
  }

  throw new Error(`Unknown resource: ${uri}`);
});

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`TNF Code Graph MCP Server running on stdio (graphs: ${GRAPH_DIR})`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
