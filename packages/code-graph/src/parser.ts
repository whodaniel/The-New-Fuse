/**
 * tree-sitter parser pool.
 *
 * Grammars come from @vscode/tree-sitter-wasm (MIT, Microsoft) as prebuilt WASM.
 * Deliberately NOT the native `tree-sitter` bindings: those need node-gyp, which
 * is a build-time failure surface on older macOS hosts, and WASM keeps the package
 * installable anywhere Node runs. No .wasm blob is committed to this repo.
 */
import { createRequire } from 'node:module';
import { Language, Parser } from 'web-tree-sitter';
import type { Language as Lang } from './schema.js';

const require = createRequire(import.meta.url);

/** Grammar file name in @vscode/tree-sitter-wasm for each supported language. */
const GRAMMAR_FILES: Record<Lang, string> = {
  typescript: 'tree-sitter-typescript.wasm',
  tsx: 'tree-sitter-tsx.wasm',
  javascript: 'tree-sitter-javascript.wasm',
  python: 'tree-sitter-python.wasm',
  go: 'tree-sitter-go.wasm',
  rust: 'tree-sitter-rust.wasm',
};

export const SUPPORTED_LANGUAGES = Object.keys(GRAMMAR_FILES) as Lang[];

let initialized: Promise<void> | null = null;
const languageCache = new Map<Lang, Language>();
const parserCache = new Map<Lang, Parser>();

function initOnce(): Promise<void> {
  initialized ??= Parser.init();
  return initialized;
}

function grammarPath(language: Lang): string {
  try {
    return require.resolve(`@vscode/tree-sitter-wasm/wasm/${GRAMMAR_FILES[language]}`);
  } catch (cause) {
    throw new Error(
      `Grammar for '${language}' is not installed. ` +
        `Run 'pnpm --filter @the-new-fuse/code-graph install' to restore @vscode/tree-sitter-wasm.`,
      { cause }
    );
  }
}

/**
 * Get a parser configured for `language`.
 *
 * Parsers are cached per language and reused across files — creating one per file
 * dominates runtime on a monorepo-sized corpus.
 */
export async function getParser(language: Lang): Promise<Parser> {
  await initOnce();
  const cached = parserCache.get(language);
  if (cached) return cached;

  let lang = languageCache.get(language);
  if (!lang) {
    lang = await Language.load(grammarPath(language));
    languageCache.set(language, lang);
  }
  const parser = new Parser();
  parser.setLanguage(lang);
  parserCache.set(language, parser);
  return parser;
}

/** Release every cached parser. Call when a long-lived process is done extracting. */
export function disposeParsers(): void {
  for (const parser of parserCache.values()) parser.delete();
  parserCache.clear();
  languageCache.clear();
}
