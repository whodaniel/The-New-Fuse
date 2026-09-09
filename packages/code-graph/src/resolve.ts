/**
 * Repo-wide call resolution — the second pass.
 *
 * A call whose callee is not defined in the same file cannot be labelled from
 * that file alone. This pass is the only place with enough information to decide,
 * and it is deliberately conservative:
 *
 *   exactly one definition repo-wide  -> INFERRED  (a resolution, not a reading)
 *   several definitions               -> AMBIGUOUS (surfaced, never guessed)
 *   too many definitions              -> dropped   (the name carries no evidence)
 *   no definition                     -> dropped   (a builtin or a third-party symbol)
 *
 * Dropping is reported in the result, not silent. A call graph that quietly
 * invents a target is worse than one that admits it does not know.
 */
import * as posix from 'node:path/posix';
import type { GraphEdge, GraphNode } from './schema.js';
import type { UnresolvedCall } from './extract/base.js';

/**
 * Above this many same-named definitions, the name is something like `run` or
 * `get` and matching on it would be noise dressed as evidence.
 */
export const DEFAULT_AMBIGUITY_LIMIT = 4;

export interface ResolveOptions {
  ambiguityLimit?: number;
  /**
   * `file id -> file ids it imports`, from already-resolved import edges.
   *
   * When the calling file imports one of the candidate definitions' files, that
   * candidate is the one the call site actually refers to; the others are
   * same-named symbols elsewhere in the repo. Narrowing on this removes the
   * dominant source of false call edges (a local `test` or `run` capturing every
   * call to an identically named import) without inventing any new edge.
   */
  importMap?: ReadonlyMap<string, ReadonlySet<string>>;
}

export interface ResolveResult {
  edges: GraphEdge[];
  stats: {
    resolvedInferred: number;
    resolvedAmbiguous: number;
    /** Callee matched nothing in the corpus: builtin, third-party, or dynamic. */
    droppedNoMatch: number;
    /** Callee matched more definitions than `ambiguityLimit`. */
    droppedTooCommon: number;
  };
}

/** `app/x.ts#Foo.bar` -> `app/x.ts`. File ids have no `#`. */
const fileOfId = (id: string): string => {
  const hash = id.indexOf('#');
  return hash === -1 ? id : id.slice(0, hash);
};

const bareName = (label: string): string => {
  const dot = label.lastIndexOf('.');
  return dot === -1 ? label : label.slice(dot + 1);
};

/** Definition kinds a call can legitimately target. */
const CALLABLE_KINDS = new Set<GraphNode['kind']>(['function', 'method', 'class']);

/**
 * Build `name -> node ids` over every callable definition in the corpus.
 *
 * Methods are indexed under both their qualified label (`Service.run`) and their
 * bare name (`run`), because a call site writes only the bare name.
 */
export function buildSymbolIndex(nodes: Iterable<GraphNode>): Map<string, string[]> {
  const index = new Map<string, string[]>();
  const push = (key: string, id: string): void => {
    const existing = index.get(key);
    if (existing) {
      if (!existing.includes(id)) existing.push(id);
    } else {
      index.set(key, [id]);
    }
  };
  for (const node of nodes) {
    if (!CALLABLE_KINDS.has(node.kind)) continue;
    push(node.label, node.id);
    const bare = bareName(node.label);
    if (bare !== node.label) push(bare, node.id);
  }
  return index;
}

export function resolveCalls(
  nodes: Iterable<GraphNode>,
  unresolved: readonly UnresolvedCall[],
  options: ResolveOptions = {}
): ResolveResult {
  const ambiguityLimit = options.ambiguityLimit ?? DEFAULT_AMBIGUITY_LIMIT;
  const nodeList = [...nodes];
  const index = buildSymbolIndex(nodeList);
  const kindOf = new Map(nodeList.map((n) => [n.id, n.kind]));
  const edges = new Map<string, GraphEdge>();
  const stats: ResolveResult['stats'] = {
    resolvedInferred: 0,
    resolvedAmbiguous: 0,
    droppedNoMatch: 0,
    droppedTooCommon: 0,
  };

  for (const call of unresolved) {
    let candidates = (index.get(call.callee) ?? []).filter((id) => id !== call.from);
    // `receiver.name()` can only be a method. Without this, `pattern.test(x)`
    // resolves to any top-level function named `test` — a confident-looking edge
    // that is simply false.
    if (call.viaMember) candidates = candidates.filter((id) => kindOf.get(id) === 'method');
    const imported = options.importMap?.get(call.sourceFile);
    if (imported && imported.size > 0) {
      const narrowed = candidates.filter((id) => imported.has(fileOfId(id)));
      if (narrowed.length > 0) candidates = narrowed;
    }
    if (candidates.length === 0) {
      stats.droppedNoMatch += 1;
      continue;
    }
    if (candidates.length > ambiguityLimit) {
      stats.droppedTooCommon += 1;
      continue;
    }

    const site = `${call.sourceFile}:${call.sourceLocation}`;
    if (candidates.length === 1) {
      const target = candidates[0] as string;
      add(edges, {
        source: call.from,
        target,
        relation: 'calls',
        confidence: 'INFERRED',
        evidence:
          `call to '${call.callee}' at ${site} matched exactly one definition` +
          `${imported && imported.size > 0 ? ' among the files this file imports' : ' in the corpus'}`,
      });
      stats.resolvedInferred += 1;
      continue;
    }

    for (const target of candidates) {
      add(edges, {
        source: call.from,
        target,
        relation: 'calls',
        confidence: 'AMBIGUOUS',
        evidence:
          `call to '${call.callee}' at ${site} matched ${candidates.length} definitions; ` +
          `every candidate is recorded so the ambiguity is visible rather than guessed`,
        meta: { candidateCount: candidates.length, callee: call.callee },
      });
    }
    stats.resolvedAmbiguous += 1;
  }

  return { edges: [...edges.values()], stats };
}

function add(map: Map<string, GraphEdge>, edge: GraphEdge): void {
  const key = `${edge.source} ${edge.relation} ${edge.target}`;
  const existing = map.get(key);
  // An INFERRED reading beats an AMBIGUOUS one for the same pair.
  if (existing && existing.confidence === 'INFERRED') return;
  map.set(key, edge);
}

/* -------------------------------------------------------------------------- */
/* External reference resolution                                              */
/* -------------------------------------------------------------------------- */


/** Suffixes tried when resolving a relative import that omits its extension. */
const MODULE_SUFFIXES = [
  '',
  '.ts',
  '.tsx',
  '.mts',
  '.cts',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.py',
  '.go',
  '.rs',
];

const EXTERNAL_PREFIX = 'external:';

/** Edge relations whose `external:` target may name a type defined elsewhere in the corpus. */
const TYPE_RELATIONS = new Set(['extends', 'implements', 'uses']);

const TYPE_KINDS = new Set<GraphNode['kind']>(['class', 'interface', 'type']);

export interface ExternalResolutionResult {
  edges: GraphEdge[];
  /** `external:` node ids that nothing points at any more. */
  orphanedExternals: string[];
  stats: {
    modulesResolved: number;
    modulesLeftExternal: number;
    typesResolved: number;
    typesLeftExternal: number;
  };
}

/**
 * Link `external:` placeholders to real corpus nodes where the link is unambiguous.
 *
 * Without this pass the graph is a pile of per-file islands: `import './base'`
 * and `extends Base` both dangle, so no path can cross a file boundary. Both
 * rewrites are labelled INFERRED — the import statement is read from source, but
 * turning `./base` into `app/base.ts` applies a resolution rule rather than
 * reading a fact, and only an unambiguous single match is accepted.
 */
export function resolveExternalReferences(
  nodes: Iterable<GraphNode>,
  edges: readonly GraphEdge[]
): ExternalResolutionResult {
  const nodeList = [...nodes];
  const fileIds = new Set(nodeList.filter((n) => n.kind === 'file').map((n) => n.id));

  const typeIndex = new Map<string, string[]>();
  for (const node of nodeList) {
    if (!TYPE_KINDS.has(node.kind)) continue;
    const bucket = typeIndex.get(node.label);
    if (bucket) bucket.push(node.id);
    else typeIndex.set(node.label, [node.id]);
  }

  const stats: ExternalResolutionResult['stats'] = {
    modulesResolved: 0,
    modulesLeftExternal: 0,
    typesResolved: 0,
    typesLeftExternal: 0,
  };

  const rewritten: GraphEdge[] = [];
  for (const edge of edges) {
    if (!edge.target.startsWith(EXTERNAL_PREFIX)) {
      rewritten.push(edge);
      continue;
    }
    const specifier = edge.target.slice(EXTERNAL_PREFIX.length);

    if (edge.relation === 'imports') {
      const resolved = resolveRelativeModule(edge.source, specifier, fileIds);
      if (resolved) {
        stats.modulesResolved += 1;
        rewritten.push({
          ...edge,
          target: resolved,
          confidence: 'INFERRED',
          evidence: `relative import '${specifier}' in ${edge.source} resolved to ${resolved}`,
        });
      } else {
        stats.modulesLeftExternal += 1;
        rewritten.push(edge);
      }
      continue;
    }

    if (TYPE_RELATIONS.has(edge.relation)) {
      const candidates = (typeIndex.get(specifier) ?? []).filter((id) => id !== edge.source);
      if (candidates.length === 1) {
        const target = candidates[0] as string;
        stats.typesResolved += 1;
        rewritten.push({
          ...edge,
          target,
          confidence: 'INFERRED',
          evidence: `'${specifier}' matched exactly one type definition in the corpus (${target})`,
        });
      } else {
        stats.typesLeftExternal += 1;
        rewritten.push(edge);
      }
      continue;
    }

    rewritten.push(edge);
  }

  const referenced = new Set<string>();
  for (const edge of rewritten) {
    referenced.add(edge.source);
    referenced.add(edge.target);
  }
  const orphanedExternals = nodeList
    .filter((n) => n.kind === 'external' && !referenced.has(n.id))
    .map((n) => n.id);

  return { edges: rewritten, orphanedExternals, stats };
}

/**
 * Compiled-output extensions that a TypeScript ESM specifier writes even though
 * the file on disk is the TypeScript source. `import './foo.js'` next to
 * `foo.ts` is the dominant style in this monorepo, so a resolver that does not
 * strip these resolves nothing at all.
 */
const REWRITABLE_OUTPUT_EXTENSIONS = ['.js', '.mjs', '.cjs', '.jsx'];

/**
 * Resolve a relative specifier against the importing file, trying the usual
 * suffix and `index` conventions. Returns a file id only on an unambiguous match.
 */
function resolveRelativeModule(
  fromFile: string,
  specifier: string,
  fileIds: ReadonlySet<string>
): string | null {
  if (!specifier.startsWith('.')) return null;
  const base = posix.normalize(posix.join(posix.dirname(fromFile), specifier));
  if (base.startsWith('..')) return null; // outside the corpus root

  // `./foo.js` should also be tried as `./foo`, so it can find `foo.ts`.
  const bases = [base];
  for (const ext of REWRITABLE_OUTPUT_EXTENSIONS) {
    if (base.endsWith(ext)) {
      bases.push(base.slice(0, -ext.length));
      break;
    }
  }

  const matches = new Set<string>();
  for (const candidateBase of bases) {
    for (const suffix of MODULE_SUFFIXES) {
      const candidate = `${candidateBase}${suffix}`;
      if (candidate !== fromFile && fileIds.has(candidate)) matches.add(candidate);
      const indexCandidate = `${candidateBase}/index${suffix}`;
      if (suffix !== '' && indexCandidate !== fromFile && fileIds.has(indexCandidate)) {
        matches.add(indexCandidate);
      }
    }
    // An exact hit on this base is authoritative; do not let the stripped
    // variant introduce a spurious second candidate.
    if (matches.size > 0) break;
  }
  return matches.size === 1 ? ([...matches][0] as string) : null;
}
