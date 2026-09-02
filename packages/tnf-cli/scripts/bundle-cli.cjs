#!/usr/bin/env node
/**
 * Bundle packages/tnf-cli/src/cli.ts into a single-file dist/cli.js.
 *
 * Why: the tsc-only dist layout forces Node to resolve+read hundreds of
 * per-file modules (dist + node_modules graph: supabase, ws, zod, MCP SDK...)
 * on every invocation — measured ~3s of pure module loading before --version
 * can answer. A single precompiled bundle shifts that cost to one mmap+parse.
 *
 * Safety: this runs AFTER `tsc --build`. If bundling fails for any reason the
 * already-emitted per-file dist/cli.js remains in place — the CLI keeps
 * working, just slower. Never let this script fail the build; warn instead.
 *
 * esbuild is resolved from the workspace root's node_modules via createRequire
 * so this stays zero-dependency for the package even under pnpm's isolated
 * node_modules layout.
 */
const path = require('node:path');
const fs = require('node:fs');
const { createRequire } = require('node:module');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const PKG_ROOT = path.resolve(__dirname, '..');
const OUTFILE = path.join(PKG_ROOT, 'dist', 'cli.js');
const ENTRY = path.join(PKG_ROOT, 'src', 'cli.ts');

// Runtime require() of a native binding / optional peer that must never be
// inlined into the bundle (paths resolve relative to their own package dirs).
const EXTERNALS = [
  'bufferutil',
  'utf-8-validate',
  'fsevents',
  // Builtin *subpath* specifiers that esbuild's node platform does not mark
  // as builtin automatically.
  'readline/promises',
];

function main() {
  const rootRequire = createRequire(path.join(REPO_ROOT, 'package.json'));
  let esbuild;
  try {
    esbuild = rootRequire('esbuild');
  } catch {
    console.warn('[bundle-cli] esbuild not resolvable from workspace root; keeping tsc output');
    return;
  }

  const result = esbuild.buildSync({
    entryPoints: [ENTRY],
    outdir: path.join(PKG_ROOT, 'dist'),
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: ['node22'],
    sourcemap: false,
    // Minified entry is ~6MB; V8 parse/compile is the dominant startup cost
    // once the module graph is one file, so smaller source wins.
    minify: true,
    // Split so `await import('./heavy-module.js')` sites stay in lazily
    // loaded chunk files instead of being inlined into the eager entry —
    // this is what makes the lazy-loader pattern in cli.ts actually defer
    // parse+eval of orchestration/supabase/MCP/telegraf code.
    splitting: true,
    chunkNames: 'chunks/[name]-[hash]',
    entryNames: '[name]',
    legalComments: 'none',
    logLevel: 'warning',
    external: EXTERNALS,
    banner: {
      // Built by packages/tnf-cli/scripts/bundle-cli.cjs (esbuild) — do not edit.
      // CJS deps bundled into ESM fall into esbuild's `__require` shim for
      // builtin/dynamic requires; the shim delegates to a scope-visible
      // `require` when one exists, so define one via createRequire.
      js: [
        '// Built by packages/tnf-cli/scripts/bundle-cli.cjs (esbuild) — do not edit.',
        "import { createRequire as __tnfCreateRequire } from 'node:module';",
        'const require = __tnfCreateRequire(import.meta.url);',
      ].join('\n'),
    },
  });

  if (result.errors && result.errors.length > 0) {
    throw new Error(`esbuild reported ${result.errors.length} error(s)`);
  }
  const sizeKb = Math.round(fs.statSync(OUTFILE).size / 1024);
  console.log(`[bundle-cli] dist/cli.js bundled (${sizeKb} KiB entry + lazy chunks)`);
}

try {
  main();
} catch (err) {
  console.warn(
    `[bundle-cli] bundling failed (${err && err.message}); keeping tsc-per-file dist output`
  );
}
