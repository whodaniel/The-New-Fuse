/**
 * On-disk graph artifact.
 *
 * One format in Phase 1: JSON, shaped so scripts/semantic-graph/build_unified_graph.py
 * can merge it through the existing add_node/add_edge seam without a translation
 * layer. GraphML / Obsidian / Cypher exports are deliberately deferred rather
 * than half-built.
 */
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { CodeGraph, GraphEdge, GraphNode, GraphStats } from './schema.js';
import type { ExternalResolutionResult, ResolveResult } from './resolve.js';

export const GRAPH_SCHEMA_VERSION = 1;
export const GENERATOR = '@the-new-fuse/code-graph';

export interface GraphDocument {
  schemaVersion: number;
  generator: string;
  generatedAt: string;
  /** Root the node ids are relative to, as given at build time. */
  root: string;
  stats: GraphStats;
  resolution: ResolveResult['stats'] | null;
  /** Import/type linking stats. Null when external resolution was skipped. */
  externals: ExternalResolutionResult['stats'] | null;
  /** community id -> member node ids. Absent when clustering was skipped. */
  communities?: Record<string, string[]>;
  modularity?: number;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface ToJsonOptions {
  root: string;
  stats: GraphStats;
  resolution?: ResolveResult['stats'] | null;
  externals?: ExternalResolutionResult['stats'] | null;
  communities?: Map<number, string[]>;
  modularity?: number;
}

export function toJson(graph: CodeGraph, options: ToJsonOptions): GraphDocument {
  const doc: GraphDocument = {
    schemaVersion: GRAPH_SCHEMA_VERSION,
    generator: GENERATOR,
    generatedAt: new Date().toISOString(),
    root: options.root,
    stats: options.stats,
    resolution: options.resolution ?? null,
    externals: options.externals ?? null,
    nodes: [...graph.nodes.values()],
    edges: graph.edges,
  };
  if (options.communities) {
    doc.communities = Object.fromEntries(
      [...options.communities.entries()].map(([id, members]) => [String(id), members])
    );
  }
  if (options.modularity !== undefined) doc.modularity = options.modularity;
  return doc;
}

/** Write the document, creating the parent directory. Returns the path written. */
export async function writeGraph(document: GraphDocument, outPath: string): Promise<string> {
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
  return outPath;
}

/** Read a graph document back into a traversable CodeGraph. */
export async function readGraph(
  inPath: string
): Promise<{ document: GraphDocument; graph: CodeGraph }> {
  const raw = await fs.readFile(inPath, 'utf8');
  const document = JSON.parse(raw) as GraphDocument;
  if (document.schemaVersion !== GRAPH_SCHEMA_VERSION) {
    throw new Error(
      `Graph at ${inPath} is schema version ${document.schemaVersion}; ` +
        `this build reads version ${GRAPH_SCHEMA_VERSION}. Rebuild it with 'tnf graph build'.`
    );
  }
  return { document, graph: hydrate(document) };
}

/** Rebuild the in-memory adjacency from a document. */
export function hydrate(document: GraphDocument): CodeGraph {
  const nodes = new Map(document.nodes.map((n) => [n.id, n]));
  const adjacency = new Map<string, Set<string>>();
  for (const id of nodes.keys()) adjacency.set(id, new Set());
  for (const edge of document.edges) {
    adjacency.get(edge.source)?.add(edge.target);
    adjacency.get(edge.target)?.add(edge.source);
  }
  return { nodes, edges: document.edges, adjacency };
}
