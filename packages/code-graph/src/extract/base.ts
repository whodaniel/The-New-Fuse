/**
 * Shared extractor scaffolding.
 *
 * Every language extractor walks its own tree-sitter grammar, but they all agree
 * on how a node id is formed and on when a call edge is EXTRACTED rather than
 * INFERRED. That agreement lives here so a new language cannot quietly invent a
 * looser standard of evidence.
 */
import type { Node as TSNode } from 'web-tree-sitter';
import type {
  EdgeRelation,
  Extraction,
  GraphEdge,
  GraphNode,
  Language,
  NodeKind,
} from '../schema.js';

/** A call whose callee was not defined in the same file. Resolved repo-wide in resolve.ts. */
export interface UnresolvedCall {
  /** Node id of the calling function/method/file. */
  from: string;
  /** Bare callee name as written at the call site. */
  callee: string;
  /**
   * True when the call was written as `receiver.callee()` rather than `callee()`.
   *
   * A member call can only mean a method. Treating `pattern.test(x)` as a call to
   * a top-level function named `test` is how a call graph invents edges that look
   * plausible and are simply wrong.
   */
  viaMember: boolean;
  sourceFile: string;
  sourceLocation: string;
}

export interface FileExtraction extends Extraction {
  unresolvedCalls: UnresolvedCall[];
}

export interface ExtractorContext {
  /** Repo-relative POSIX path. */
  relPath: string;
  language: Language;
  source: string;
  root: TSNode;
  out: ExtractionBuilder;
}

export type Extractor = (ctx: ExtractorContext) => void;

/** 1-based line label, e.g. `L42`. tree-sitter rows are 0-based. */
export const loc = (node: TSNode): string => `L${node.startPosition.row + 1}`;

/** Symbol id: `<relPath>#<name>`. Files are their own path. */
export const symbolId = (relPath: string, name: string): string => `${relPath}#${name}`;

/** Id for an import specifier that does not resolve to a file in the corpus. */
export const externalId = (specifier: string): string => `external:${specifier}`;

/** First named child with the given field name, or null. */
export function field(node: TSNode, name: string): TSNode | null {
  return node.childForFieldName(name);
}

/** Text of a field, or undefined when the field is absent. */
export function fieldText(node: TSNode, name: string): string | undefined {
  return node.childForFieldName(name)?.text;
}

/**
 * Walk every named descendant, depth-first.
 *
 * `descendantsOfType` exists but allocates the full match array; extraction runs
 * over every file in a monorepo, so this stays a generator.
 */
export function* walk(node: TSNode): Generator<TSNode> {
  yield node;
  for (const child of node.namedChildren) {
    if (child) yield* walk(child);
  }
}

/** Nearest enclosing node of one of `types`, or null. */
export function enclosing(node: TSNode, types: readonly string[]): TSNode | null {
  let current: TSNode | null = node.parent;
  while (current) {
    if (types.includes(current.type)) return current;
    current = current.parent;
  }
  return null;
}

const rank = (c: GraphEdge['confidence']): number =>
  c === 'EXTRACTED' ? 0 : c === 'INFERRED' ? 1 : 2;

/**
 * Accumulates one file's nodes and edges.
 *
 * The builder deduplicates by id and by edge triple, so an extractor can call
 * `addNode` defensively without producing a graph full of repeats.
 */
export class ExtractionBuilder {
  private readonly nodes = new Map<string, GraphNode>();
  private readonly edges = new Map<string, GraphEdge>();
  private readonly unresolved: UnresolvedCall[] = [];
  /** Names defined in this file, mapped to node id. Drives the EXTRACTED-vs-INFERRED call decision. */
  readonly localDefs = new Map<string, string>();

  constructor(
    readonly relPath: string,
    readonly language: Language
  ) {}

  addNode(node: GraphNode): string {
    if (!this.nodes.has(node.id)) this.nodes.set(node.id, node);
    return node.id;
  }

  /** Declare a symbol defined in this file, and link the file to it with a `defines` edge. */
  defineSymbol(name: string, kind: NodeKind, at: TSNode, meta?: Record<string, unknown>): string {
    const id = symbolId(this.relPath, name);
    this.addNode({
      id,
      label: name,
      kind,
      sourceFile: this.relPath,
      sourceLocation: loc(at),
      language: this.language,
      ...(meta ? { meta } : {}),
    });
    this.localDefs.set(name, id);
    this.addEdge({
      source: this.relPath,
      target: id,
      relation: 'defines',
      confidence: 'EXTRACTED',
      evidence: `${kind} declared at ${this.relPath}:${loc(at)}`,
    });
    return id;
  }

  addEdge(edge: GraphEdge): void {
    if (edge.source === edge.target) return;
    const key = `${edge.source} ${edge.relation} ${edge.target}`;
    const existing = this.edges.get(key);
    // Keep the strongest evidence if the same edge is found twice.
    if (existing && rank(existing.confidence) <= rank(edge.confidence)) return;
    this.edges.set(key, edge);
  }

  /**
   * Record a call. Resolves to an EXTRACTED edge when the callee is defined in
   * this file; otherwise it is deferred to the repo-wide pass, which is the only
   * place with enough information to choose between INFERRED and AMBIGUOUS.
   */
  addCall(from: string, callee: string, at: TSNode, viaMember = false): void {
    const local = this.localDefs.get(callee);
    if (local) {
      this.addEdge({
        source: from,
        target: local,
        relation: 'calls',
        confidence: 'EXTRACTED',
        evidence: `call to same-file definition at ${this.relPath}:${loc(at)}`,
      });
      return;
    }
    this.unresolved.push({
      from,
      callee,
      viaMember,
      sourceFile: this.relPath,
      sourceLocation: loc(at),
    });
  }

  addImport(specifier: string, at: TSNode, relation: EdgeRelation = 'imports'): void {
    const target = externalId(specifier);
    this.addNode({
      id: target,
      label: specifier,
      kind: 'external',
      sourceFile: '',
      meta: { specifier },
    });
    this.addEdge({
      source: this.relPath,
      target,
      relation,
      confidence: 'EXTRACTED',
      evidence: `import statement at ${this.relPath}:${loc(at)}`,
    });
  }

  result(): FileExtraction {
    return {
      nodes: [...this.nodes.values()],
      edges: [...this.edges.values()],
      unresolvedCalls: this.unresolved,
    };
  }
}
