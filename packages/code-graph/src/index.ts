/**
 * @the-new-fuse/code-graph
 *
 * Deterministic tree-sitter AST code graph. Every edge carries an
 * EXTRACTED / INFERRED / AMBIGUOUS confidence label, enforced by the validator
 * before `build()` will accept an extraction.
 *
 * Pipeline: collectFiles -> extract -> build (+resolve) -> cluster -> toJson
 */
import * as os from 'node:os';
import * as path from 'node:path';
import { build, type BuildOptions } from './build.js';
import { cluster, type ClusterOptions } from './cluster.js';
import { toJson, type GraphDocument } from './export.js';
import { collectFiles, extract, type ExtractResult } from './extract/index.js';
import type { CodeGraph, GraphStats } from './schema.js';

export * from './schema.js';
export { assertValid, validateExtraction } from './validate.js';
export { getParser, disposeParsers, SUPPORTED_LANGUAGES } from './parser.js';
export {
  collectFiles,
  extract,
  extractFile,
  languageForFile,
  IGNORED_DIRECTORIES,
  LANGUAGE_BY_EXTENSION,
  MAX_FILE_BYTES,
} from './extract/index.js';
export type { ExtractOptions, ExtractResult } from './extract/index.js';
export type { ExtractorContext, FileExtraction, UnresolvedCall } from './extract/base.js';
export {
  buildSymbolIndex,
  resolveCalls,
  resolveExternalReferences,
  DEFAULT_AMBIGUITY_LIMIT,
} from './resolve.js';
export type {
  ExternalResolutionResult,
  ResolveOptions,
  ResolveResult,
} from './resolve.js';
export { build, statistics } from './build.js';
export type { BuildOptions, BuildResult } from './build.js';
export { cluster } from './cluster.js';
export type { ClusterOptions, ClusterResult } from './cluster.js';
export { explain, findNodes, path as graphPath, query, terms } from './query.js';
export type {
  ExplainResult,
  PathResult,
  PathStep,
  QueryOptions,
  QueryResult,
} from './query.js';
export {
  GENERATOR,
  GRAPH_SCHEMA_VERSION,
  hydrate,
  readGraph,
  toJson,
  writeGraph,
} from './export.js';
export type { GraphDocument, ToJsonOptions } from './export.js';

/** Default location for a built graph. Machine-local derived state, never committed. */
export const defaultGraphPath = (projectName = 'default'): string =>
  path.join(os.homedir(), '.tnf', 'code-graph', `${sanitize(projectName)}.json`);

const sanitize = (name: string): string => name.replace(/[^A-Za-z0-9._-]+/g, '-').slice(0, 120);

export interface BuildGraphOptions extends BuildOptions, ClusterOptions {
  /** Root for node ids. Defaults to `target` when it is a directory. */
  root?: string;
  /** Skip community detection. */
  skipCluster?: boolean;
  /** Extra directory names to ignore during collection. */
  ignore?: Iterable<string>;
  onProgress?: (event: { phase: 'collect' | 'extract' | 'build' | 'cluster'; detail: string }) => void;
}

export interface BuildGraphResult {
  graph: CodeGraph;
  document: GraphDocument;
  stats: GraphStats;
  extraction: ExtractResult;
}

/**
 * Full pipeline over a path.
 *
 * `failures` on the returned extraction lists any file that could not be parsed.
 * Callers should surface it: a graph built from 900 of 1000 files is a different
 * claim than a graph built from all of them.
 */
export async function buildGraph(
  target: string,
  options: BuildGraphOptions = {}
): Promise<BuildGraphResult> {
  const absoluteTarget = path.resolve(target);
  const root = path.resolve(options.root ?? absoluteTarget);

  options.onProgress?.({ phase: 'collect', detail: absoluteTarget });
  const files = await collectFiles(absoluteTarget, { ...(options.ignore ? { ignore: options.ignore } : {}) });

  options.onProgress?.({ phase: 'extract', detail: `${files.length} file(s)` });
  const extraction = await extract(files, { root });

  options.onProgress?.({ phase: 'build', detail: `${extraction.nodes.length} node(s)` });
  const { graph, stats, resolution, externals } = build(extraction, options);

  let communities: Map<number, string[]> | undefined;
  let modularity: number | undefined;
  if (!options.skipCluster) {
    options.onProgress?.({ phase: 'cluster', detail: `${graph.nodes.size} node(s)` });
    const clustered = cluster(graph, options);
    communities = clustered.communities;
    modularity = clustered.modularity;
  }

  const document = toJson(graph, {
    root,
    stats,
    resolution,
    externals,
    ...(communities ? { communities } : {}),
    ...(modularity !== undefined ? { modularity } : {}),
  });

  return { graph, document, stats, extraction };
}
