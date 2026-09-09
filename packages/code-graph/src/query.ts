/**
 * Graph traversal: query, path, explain.
 *
 * This is what makes the graph worth building — the difference between grepping
 * a repo and traversing it. Every answer carries the confidence of the edges it
 * crossed, so a caller can tell a read-from-source chain from an inferred one.
 */
import type { CodeGraph, Confidence, GraphEdge, GraphNode } from './schema.js';

/** Rough token estimate. Good enough to keep an answer inside a model's budget. */
const estimateTokens = (text: string): number => Math.ceil(text.length / 4);

const STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'how', 'does', 'do', 'did',
  'what', 'which', 'who', 'whom', 'where', 'when', 'why', 'to', 'of', 'in', 'on', 'for',
  'with', 'and', 'or', 'not', 'this', 'that', 'it', 'its', 'from', 'by', 'as', 'at',
  'work', 'works', 'use', 'used', 'uses', 'get', 'gets', 'me', 'my', 'i', 'we', 'you',
]);

/** Split an identifier or sentence into lowercase terms, including camelCase parts. */
export function terms(text: string): string[] {
  return text
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[^A-Za-z0-9]+/)
    .map((t) => t.toLowerCase())
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

export interface FindOptions {
  limit?: number;
}

/**
 * Resolve a human-supplied name to nodes, most specific first:
 * exact id, then exact label, then case-insensitive label match, then substring.
 */
export function findNodes(graph: CodeGraph, name: string, options: FindOptions = {}): GraphNode[] {
  const limit = options.limit ?? 10;
  const exact = graph.nodes.get(name);
  if (exact) return [exact];

  const lower = name.toLowerCase();
  const byLabel: GraphNode[] = [];
  const byLabelLower: GraphNode[] = [];
  const bySubstring: GraphNode[] = [];

  for (const node of graph.nodes.values()) {
    if (node.label === name) byLabel.push(node);
    else if (node.label.toLowerCase() === lower) byLabelLower.push(node);
    else if (node.label.toLowerCase().includes(lower) || node.id.toLowerCase().includes(lower)) {
      bySubstring.push(node);
    }
  }
  return [...byLabel, ...byLabelLower, ...bySubstring].slice(0, limit);
}

export interface QueryOptions {
  /** `bfs` gathers broad context; `dfs` follows one chain deep. */
  mode?: 'bfs' | 'dfs';
  /** Approximate token cap on the returned subgraph. */
  budget?: number;
  /** Maximum hops from a seed. */
  maxDepth?: number;
  /** Ignore edges weaker than this. `INFERRED` keeps EXTRACTED + INFERRED. */
  minConfidence?: Confidence;
}

export interface QueryResult {
  seeds: GraphNode[];
  nodes: Array<GraphNode & { depth: number }>;
  edges: GraphEdge[];
  tokensUsed: number;
  truncated: boolean;
}

/** Test files answer "how is this exercised", rarely "how does this work". */
const TEST_FILE = /(^|\/)__tests__\/|\.(test|spec)\.[cm]?[jt]sx?$|_test\.(go|py)$|\.test\.rs$/;

const fileWeight = (node: GraphNode): number => (TEST_FILE.test(node.sourceFile) ? 0.35 : 1);

/**
 * A question about behaviour is answered by the thing that has behaviour.
 * A local `const dir` in a matching file is a poor entry point into the graph.
 */
function kindWeight(node: GraphNode): number {
  switch (node.kind) {
    case 'class':
    case 'interface':
      return 1.3;
    case 'function':
    case 'method':
      return 1.2;
    case 'type':
      return 1;
    case 'file':
      return 0.8;
    case 'constant':
      return 0.4;
    default:
      return 0.6;
  }
}

const CONFIDENCE_RANK: Record<Confidence, number> = {
  EXTRACTED: 0,
  INFERRED: 1,
  AMBIGUOUS: 2,
};

/**
 * Traverse outward from the nodes that best match `question`.
 *
 * Seeds are scored by term overlap between the question and each node's label and
 * path — deliberately lexical. Semantic seeding is what TNF's pgvector layer is
 * for, and duplicating it here would be a second implementation of the same job.
 */
export function query(graph: CodeGraph, question: string, options: QueryOptions = {}): QueryResult {
  const mode = options.mode ?? 'bfs';
  const budget = options.budget ?? 4000;
  const maxDepth = options.maxDepth ?? 3;
  const maxRank = CONFIDENCE_RANK[options.minConfidence ?? 'AMBIGUOUS'];

  const questionTerms = new Set(terms(question));
  const scored: Array<{ node: GraphNode; score: number }> = [];
  for (const node of graph.nodes.values()) {
    if (node.kind === 'external') continue;
    const labelTerms = terms(node.label);
    const haystack = new Set([...labelTerms, ...terms(node.sourceFile)]);
    let score = 0;
    for (const term of questionTerms) if (haystack.has(term)) score += 1;
    if (score === 0) continue;

    // A match on the symbol's own name is worth more than a match on the path
    // it happens to live in; otherwise every symbol in a well-named file ties.
    for (const term of questionTerms) if (labelTerms.includes(term)) score += 0.5;

    scored.push({ node, score: score * kindWeight(node) * fileWeight(node) });
  }
  scored.sort((a, b) => b.score - a.score || a.node.id.localeCompare(b.node.id));
  const seeds = scored.slice(0, 5).map((s) => s.node);

  if (seeds.length === 0) {
    return { seeds: [], nodes: [], edges: [], tokensUsed: 0, truncated: false };
  }

  const edgesBySource = new Map<string, GraphEdge[]>();
  for (const edge of graph.edges) {
    if (CONFIDENCE_RANK[edge.confidence] > maxRank) continue;
    for (const end of [edge.source, edge.target]) {
      const list = edgesBySource.get(end);
      if (list) list.push(edge);
      else edgesBySource.set(end, [edge]);
    }
  }

  const visited = new Map<string, number>();
  const collected: Array<GraphNode & { depth: number }> = [];
  const usedEdges = new Map<string, GraphEdge>();
  let tokensUsed = 0;
  let truncated = false;

  const frontier: Array<{ id: string; depth: number }> = seeds.map((s) => ({ id: s.id, depth: 0 }));
  while (frontier.length > 0) {
    const next = mode === 'bfs' ? frontier.shift() : frontier.pop();
    if (!next) break;
    if (visited.has(next.id)) continue;
    visited.set(next.id, next.depth);

    const node = graph.nodes.get(next.id);
    if (!node) continue;

    const cost = estimateTokens(`${node.id} ${node.label} ${node.sourceLocation ?? ''}`);
    if (tokensUsed + cost > budget) {
      truncated = true;
      break;
    }
    tokensUsed += cost;
    collected.push({ ...node, depth: next.depth });

    if (next.depth >= maxDepth) continue;
    for (const edge of edgesBySource.get(next.id) ?? []) {
      usedEdges.set(`${edge.source} ${edge.relation} ${edge.target}`, edge);
      const other = edge.source === next.id ? edge.target : edge.source;
      if (!visited.has(other)) frontier.push({ id: other, depth: next.depth + 1 });
    }
  }

  // Only report edges whose endpoints both made it into the answer.
  const present = new Set(collected.map((n) => n.id));
  const edges = [...usedEdges.values()].filter(
    (e) => present.has(e.source) && present.has(e.target)
  );

  return { seeds, nodes: collected, edges, tokensUsed, truncated };
}

export interface PathStep {
  node: GraphNode;
  /** Edge traversed to reach this node. Absent on the first step. */
  via?: GraphEdge;
}

export interface PathResult {
  found: boolean;
  from?: GraphNode;
  to?: GraphNode;
  steps: PathStep[];
  /** Weakest confidence anywhere on the path — the honest strength of the whole chain. */
  weakestLink?: Confidence;
  reason?: string;
}

/** Shortest path between two named concepts, reported with the weakest edge it crosses. */
export function path(graph: CodeGraph, fromName: string, toName: string): PathResult {
  const from = findNodes(graph, fromName, { limit: 1 })[0];
  const to = findNodes(graph, toName, { limit: 1 })[0];
  if (!from) return { found: false, steps: [], reason: `no node matches '${fromName}'` };
  if (!to) return { found: false, steps: [], reason: `no node matches '${toName}'` };
  if (from.id === to.id) return { found: true, from, to, steps: [{ node: from }] };

  const edgesByEnd = new Map<string, GraphEdge[]>();
  for (const edge of graph.edges) {
    for (const end of [edge.source, edge.target]) {
      const list = edgesByEnd.get(end);
      if (list) list.push(edge);
      else edgesByEnd.set(end, [edge]);
    }
  }

  const cameFrom = new Map<string, { prev: string; edge: GraphEdge }>();
  const seen = new Set<string>([from.id]);
  const queue: string[] = [from.id];

  while (queue.length > 0) {
    const current = queue.shift() as string;
    if (current === to.id) break;
    for (const edge of edgesByEnd.get(current) ?? []) {
      const other = edge.source === current ? edge.target : edge.source;
      if (seen.has(other)) continue;
      seen.add(other);
      cameFrom.set(other, { prev: current, edge });
      queue.push(other);
    }
  }

  if (!cameFrom.has(to.id)) {
    return { found: false, from, to, steps: [], reason: 'no path between these nodes' };
  }

  const steps: PathStep[] = [];
  let cursor = to.id;
  while (cursor !== from.id) {
    const link = cameFrom.get(cursor);
    if (!link) break;
    const node = graph.nodes.get(cursor);
    if (node) steps.unshift({ node, via: link.edge });
    cursor = link.prev;
  }
  steps.unshift({ node: from });

  const weakestLink = steps
    .map((s) => s.via?.confidence)
    .filter((c): c is Confidence => Boolean(c))
    .sort((a, b) => CONFIDENCE_RANK[b] - CONFIDENCE_RANK[a])[0];

  return { found: true, from, to, steps, ...(weakestLink ? { weakestLink } : {}) };
}

export interface ExplainResult {
  node?: GraphNode;
  /** Other nodes that matched the same name; a caller can disambiguate. */
  alternatives: GraphNode[];
  incoming: Array<{ edge: GraphEdge; node: GraphNode }>;
  outgoing: Array<{ edge: GraphEdge; node: GraphNode }>;
  reason?: string;
}

/** Everything the graph knows about one node, grouped by direction. */
export function explain(graph: CodeGraph, name: string): ExplainResult {
  const matches = findNodes(graph, name);
  const node = matches[0];
  if (!node) return { alternatives: [], incoming: [], outgoing: [], reason: `no node matches '${name}'` };

  const incoming: ExplainResult['incoming'] = [];
  const outgoing: ExplainResult['outgoing'] = [];
  for (const edge of graph.edges) {
    if (edge.target === node.id) {
      const other = graph.nodes.get(edge.source);
      if (other) incoming.push({ edge, node: other });
    } else if (edge.source === node.id) {
      const other = graph.nodes.get(edge.target);
      if (other) outgoing.push({ edge, node: other });
    }
  }

  return { node, alternatives: matches.slice(1), incoming, outgoing };
}
