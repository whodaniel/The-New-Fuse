/**
 * Code-graph schema.
 *
 * The single rule this package exists to enforce: **no edge without provenance.**
 * TNF has repeatedly shipped surfaces that report a verdict they never earned
 * (see docs/protocols/TNF_CODE_GRAPH_PROTOCOL.md). A graph edge is a claim about
 * the codebase, so every edge states how strongly it is evidenced and `build()`
 * refuses any extraction that omits it.
 */

/** How strongly an edge is evidenced by the source text. */
export type Confidence =
  /** Explicit in the source: an import statement, an `extends` clause, a call whose callee is defined in the same file. */
  | 'EXTRACTED'
  /** Resolved by this package rather than read directly: a cross-file call matched to exactly one definition. */
  | 'INFERRED'
  /** Genuinely uncertain: a name that resolves to more than one definition. Surfaced for human review, never silently dropped. */
  | 'AMBIGUOUS';

export const CONFIDENCES: readonly Confidence[] = ['EXTRACTED', 'INFERRED', 'AMBIGUOUS'];

export type NodeKind =
  | 'file'
  | 'module'
  | 'function'
  | 'class'
  | 'method'
  | 'interface'
  | 'type'
  | 'constant'
  | 'external';

export const NODE_KINDS: readonly NodeKind[] = [
  'file',
  'module',
  'function',
  'class',
  'method',
  'interface',
  'type',
  'constant',
  'external',
];

/**
 * Edge relations.
 *
 * `implements` and `uses` intentionally match the aliases already present in
 * scripts/semantic-graph/common.py EDGE_TYPE_ALIASES, so the unified graph can
 * merge this output without inventing a second vocabulary.
 */
export type EdgeRelation =
  | 'imports'
  | 'calls'
  | 'extends'
  | 'implements'
  | 'uses'
  | 'defines'
  | 'contains';

export const EDGE_RELATIONS: readonly EdgeRelation[] = [
  'imports',
  'calls',
  'extends',
  'implements',
  'uses',
  'defines',
  'contains',
];

export type Language = 'typescript' | 'tsx' | 'javascript' | 'python' | 'go' | 'rust';

export interface GraphNode {
  /** Stable id. `<relPath>` for files, `<relPath>#<symbol>` for symbols, `external:<specifier>` for unresolved imports. */
  id: string;
  /** Human-readable name. Never used as an identity key. */
  label: string;
  kind: NodeKind;
  /** Repo-relative POSIX path. Empty string for `external` nodes, which have no file. */
  sourceFile: string;
  /** 1-based line, formatted `L42`. Absent for nodes with no single location. */
  sourceLocation?: string;
  language?: Language;
  meta?: Record<string, unknown>;
}

export interface GraphEdge {
  source: string;
  target: string;
  relation: EdgeRelation;
  confidence: Confidence;
  /** Why this edge exists — the source construct, or the resolution rule that produced it. */
  evidence?: string;
  meta?: Record<string, unknown>;
}

export interface Extraction {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/** A built graph: deduplicated nodes keyed by id, plus the edge list. */
export interface CodeGraph {
  nodes: Map<string, GraphNode>;
  edges: GraphEdge[];
  /** Undirected adjacency used by traversal. Populated by build(). */
  adjacency: Map<string, Set<string>>;
}

export interface GraphStats {
  nodeCount: number;
  edgeCount: number;
  nodesByKind: Record<string, number>;
  edgesByRelation: Record<string, number>;
  edgesByConfidence: Record<Confidence, number>;
  languages: string[];
}

export const emptyExtraction = (): Extraction => ({ nodes: [], edges: [] });
