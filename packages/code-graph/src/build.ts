/**
 * Graph assembly.
 *
 * `build()` is the choke point where the provenance rule is enforced: it calls
 * `assertValid()` before it will touch an extraction, so an edge without a
 * confidence label cannot reach the graph even if an extractor forgot one.
 */
import type { ExtractResult } from './extract/index.js';
import {
  resolveCalls,
  resolveExternalReferences,
  type ExternalResolutionResult,
  type ResolveOptions,
  type ResolveResult,
} from './resolve.js';
import { assertValid } from './validate.js';
import type { CodeGraph, Confidence, GraphEdge, GraphNode, GraphStats } from './schema.js';

export interface BuildOptions extends ResolveOptions {
  /** Skip the repo-wide call resolution pass. Leaves only same-file EXTRACTED call edges. */
  skipResolution?: boolean;
  /**
   * Skip linking `external:` imports and type references to corpus nodes.
   * Leaves the graph as per-file islands; useful for testing extraction alone.
   */
  skipExternalResolution?: boolean;
}

export interface BuildResult {
  graph: CodeGraph;
  stats: GraphStats;
  resolution: ResolveResult['stats'] | null;
  externals: ExternalResolutionResult['stats'] | null;
}

/** Assemble a validated extraction into a graph, running call resolution by default. */
export function build(extraction: ExtractResult, options: BuildOptions = {}): BuildResult {
  assertValid(extraction, 'merged extraction');

  const nodes = new Map<string, GraphNode>();
  for (const node of extraction.nodes) {
    const existing = nodes.get(node.id);
    // Later extractions must not overwrite a node that already has a location.
    if (!existing || (!existing.sourceLocation && node.sourceLocation)) nodes.set(node.id, node);
  }

  const edges = new Map<string, GraphEdge>();
  const addEdge = (edge: GraphEdge): void => {
    if (!nodes.has(edge.source) || !nodes.has(edge.target)) return;
    const key = `${edge.source} ${edge.relation} ${edge.target}`;
    const existing = edges.get(key);
    if (existing && rank(existing.confidence) <= rank(edge.confidence)) return;
    edges.set(key, edge);
  };

  for (const edge of extraction.edges) addEdge(edge);

  // Pass order matters. Imports are linked FIRST so call resolution can use the
  // import graph to narrow candidates: without it, a local function named `test`
  // or `run` captures every call to an identically named import elsewhere.
  let edgeList = [...edges.values()];
  let externals: ExternalResolutionResult['stats'] | null = null;
  let importMap: Map<string, Set<string>> | undefined;
  if (!options.skipExternalResolution) {
    const linked = resolveExternalReferences(nodes.values(), edgeList);
    edgeList = linked.edges;
    externals = linked.stats;
    importMap = buildImportMap(nodes, edgeList);
  }

  let resolution: ResolveResult['stats'] | null = null;
  if (!options.skipResolution) {
    const resolved = resolveCalls(nodes.values(), extraction.unresolvedCalls, {
      ...options,
      ...(importMap ? { importMap } : {}),
    });
    for (const edge of resolved.edges) {
      if (!nodes.has(edge.source) || !nodes.has(edge.target)) continue;
      edgeList.push(edge);
    }
    resolution = resolved.stats;
  }

  edgeList = dedupe(edgeList);

  // Only now is it knowable which `external:` placeholders nothing points at.
  if (!options.skipExternalResolution) {
    const referenced = new Set<string>();
    for (const edge of edgeList) {
      referenced.add(edge.source);
      referenced.add(edge.target);
    }
    for (const [id, node] of nodes) {
      if (node.kind === 'external' && !referenced.has(id)) nodes.delete(id);
    }
  }

  const adjacency = new Map<string, Set<string>>();
  for (const id of nodes.keys()) adjacency.set(id, new Set());
  for (const edge of edgeList) {
    adjacency.get(edge.source)?.add(edge.target);
    adjacency.get(edge.target)?.add(edge.source);
  }

  const graph: CodeGraph = { nodes, edges: edgeList, adjacency };
  return { graph, stats: statistics(graph), resolution, externals };
}

/** Rewriting targets can collapse two edges onto one pair; keep the strongest. */
function dedupe(edges: readonly GraphEdge[]): GraphEdge[] {
  const byKey = new Map<string, GraphEdge>();
  for (const edge of edges) {
    if (edge.source === edge.target) continue;
    const key = `${edge.source} ${edge.relation} ${edge.target}`;
    const existing = byKey.get(key);
    if (existing && rank(existing.confidence) <= rank(edge.confidence)) continue;
    byKey.set(key, edge);
  }
  return [...byKey.values()];
}

export function statistics(graph: CodeGraph): GraphStats {
  const nodesByKind: Record<string, number> = {};
  const edgesByRelation: Record<string, number> = {};
  const edgesByConfidence: Record<Confidence, number> = {
    EXTRACTED: 0,
    INFERRED: 0,
    AMBIGUOUS: 0,
  };
  const languages = new Set<string>();

  for (const node of graph.nodes.values()) {
    nodesByKind[node.kind] = (nodesByKind[node.kind] ?? 0) + 1;
    if (node.language) languages.add(node.language);
  }
  for (const edge of graph.edges) {
    edgesByRelation[edge.relation] = (edgesByRelation[edge.relation] ?? 0) + 1;
    edgesByConfidence[edge.confidence] += 1;
  }

  return {
    nodeCount: graph.nodes.size,
    edgeCount: graph.edges.length,
    nodesByKind,
    edgesByRelation,
    edgesByConfidence,
    languages: [...languages].sort(),
  };
}

const rank = (c: Confidence): number => (c === 'EXTRACTED' ? 0 : c === 'INFERRED' ? 1 : 2);

/**
 * `file id -> file ids it imports`, from import edges that resolved to real files.
 *
 * Unresolved `external:` imports are excluded: they carry no information about
 * which corpus file a call site meant.
 */
function buildImportMap(
  nodes: ReadonlyMap<string, GraphNode>,
  edges: readonly GraphEdge[]
): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const edge of edges) {
    if (edge.relation !== 'imports') continue;
    if (nodes.get(edge.target)?.kind !== 'file') continue;
    const bucket = map.get(edge.source);
    if (bucket) bucket.add(edge.target);
    else map.set(edge.source, new Set([edge.target]));
  }
  return map;
}
