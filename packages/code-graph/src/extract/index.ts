/**
 * Extraction dispatch.
 *
 * `extract()` takes a list of files and a root. The root is required rather than
 * inferred: node ids are derived relative to it, and inferring it from the file
 * list would anchor a single-file extraction to that file's own directory,
 * producing ids that carry machine-specific path segments.
 */
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { getParser } from '../parser.js';
import type { Extraction, Language } from '../schema.js';
import { assertValid } from '../validate.js';
import { ExtractionBuilder, type FileExtraction, type UnresolvedCall } from './base.js';
import { extractGo } from './go.js';
import { extractPython } from './python.js';
import { extractRust } from './rust.js';
import { extractTypeScript } from './typescript.js';

/** File suffix to language. Adding a language means adding an entry here and an extractor module. */
export const LANGUAGE_BY_EXTENSION: Record<string, Language> = {
  '.ts': 'typescript',
  '.mts': 'typescript',
  '.cts': 'typescript',
  '.tsx': 'tsx',
  '.js': 'javascript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  '.jsx': 'javascript',
  '.py': 'python',
  '.go': 'go',
  '.rs': 'rust',
};

const EXTRACTORS = {
  typescript: extractTypeScript,
  tsx: extractTypeScript,
  javascript: extractTypeScript,
  python: extractPython,
  go: extractGo,
  rust: extractRust,
} as const;

/** Directories never worth parsing. Skipping these is the difference between seconds and hours. */
export const IGNORED_DIRECTORIES = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  'out',
  'coverage',
  '.next',
  '.turbo',
  '.cache',
  'vendor',
  'target',
  '__pycache__',
  '.venv',
  'venv',
  '.tnf',
  '.claude',
]);

/** Files above this size are skipped: they are almost always generated or minified. */
export const MAX_FILE_BYTES = 1_500_000;

export const languageForFile = (filePath: string): Language | undefined =>
  LANGUAGE_BY_EXTENSION[path.extname(filePath).toLowerCase()];

export interface CollectOptions {
  /** Extra directory names to skip, on top of IGNORED_DIRECTORIES. */
  ignore?: Iterable<string>;
}

/** Recursively collect every parseable file under `target` (or return it, if it is a file). */
export async function collectFiles(target: string, options: CollectOptions = {}): Promise<string[]> {
  const ignored = new Set([...IGNORED_DIRECTORIES, ...(options.ignore ?? [])]);
  const stat = await fs.stat(target);
  if (stat.isFile()) return languageForFile(target) ? [target] : [];

  const found: string[] = [];
  const queue: string[] = [target];
  while (queue.length > 0) {
    const dir = queue.pop() as string;
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      continue; // unreadable directory is a skip, not a failure of the whole run
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!ignored.has(entry.name)) queue.push(full);
      } else if (entry.isFile() && languageForFile(entry.name)) {
        found.push(full);
      }
    }
  }
  return found.sort();
}

export interface ExtractOptions {
  /** Absolute path all node ids are made relative to. Required. */
  root: string;
  /** Called once per file that could not be parsed. Default: collect silently. */
  onError?: (file: string, error: Error) => void;
}

export interface ExtractResult extends Extraction {
  unresolvedCalls: UnresolvedCall[];
  /** Files that threw during parse or extraction. Reported, never silently dropped. */
  failures: Array<{ file: string; reason: string }>;
  filesExtracted: number;
}

/** Extract one file. Returns null when the suffix has no registered extractor. */
export async function extractFile(
  absolutePath: string,
  root: string
): Promise<FileExtraction | null> {
  const language = languageForFile(absolutePath);
  if (!language) return null;

  const stat = await fs.stat(absolutePath);
  if (stat.size > MAX_FILE_BYTES) return null;

  const source = await fs.readFile(absolutePath, 'utf8');
  const relPath = path.relative(root, absolutePath).split(path.sep).join('/');
  const parser = await getParser(language);
  const tree = parser.parse(source);
  if (!tree) throw new Error(`tree-sitter returned no tree for ${relPath}`);

  const out = new ExtractionBuilder(relPath, language);
  out.addNode({
    id: relPath,
    label: path.basename(relPath),
    kind: 'file',
    sourceFile: relPath,
    language,
  });
  EXTRACTORS[language]({ relPath, language, source, root: tree.rootNode, out });
  tree.delete();

  const result = out.result();
  assertValid(result, `extraction of ${relPath}`);
  return result;
}

/**
 * Extract a list of files into one merged extraction plus the unresolved-call backlog.
 *
 * Nodes are deduplicated by id while merging. Node ids are unique *within* a file,
 * but `external:` nodes are shared by construction — a hundred files importing
 * `node:path` all produce `external:node:path`, and concatenating their node lists
 * would violate the schema's uniqueness rule for no reason.
 */
export async function extract(files: string[], options: ExtractOptions): Promise<ExtractResult> {
  const root = path.resolve(options.root);
  const nodes = new Map<string, ExtractResult['nodes'][number]>();
  const merged: ExtractResult = {
    nodes: [],
    edges: [],
    unresolvedCalls: [],
    failures: [],
    filesExtracted: 0,
  };

  for (const file of files) {
    try {
      const result = await extractFile(path.resolve(file), root);
      if (!result) continue;
      for (const node of result.nodes) {
        const existing = nodes.get(node.id);
        // Keep whichever copy carries a location; otherwise first wins.
        if (!existing || (!existing.sourceLocation && node.sourceLocation)) nodes.set(node.id, node);
      }
      merged.edges.push(...result.edges);
      merged.unresolvedCalls.push(...result.unresolvedCalls);
      merged.filesExtracted += 1;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      merged.failures.push({ file, reason: err.message });
      options.onError?.(file, err);
    }
  }
  merged.nodes = [...nodes.values()];
  return merged;
}

export { ExtractionBuilder } from './base.js';
export type { ExtractorContext, FileExtraction, UnresolvedCall } from './base.js';
