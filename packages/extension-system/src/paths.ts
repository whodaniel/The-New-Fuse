/**
 * Resolve the on-disk root for TNF satellite / product apps that extend core.
 *
 * Layout (2026-08-09):
 *   <parent>/TNF-Extensions          ← canonical satellite tree (outside monorepo)
 *   <repo>/apps/extensions           ← symlink redirect into that tree
 *
 * Protocol/workflow packages still load via ExtensionManager from an
 * `extensionDirectory` (often a nested folder with `extension.json` manifests).
 * This helper finds the *satellite apps* root, not every protocol package.
 */

import * as fs from 'fs';
import * as path from 'path';

export const TNF_EXTENSIONS_DIR_NAME = 'TNF-Extensions';
export const APPS_EXTENSIONS_REDIRECT = path.join('apps', 'extensions');

export interface ResolveTnfExtensionsRootOptions {
  /** Monorepo root (The-New-Fuse). Defaults to cwd when omitted. */
  repoRoot?: string;
  /** Override env var name (default TNF_EXTENSIONS_ROOT). */
  envKey?: string;
}

/**
 * Resolve the absolute path to the TNF-Extensions satellite tree.
 * Returns null when nothing is available (no env, no redirect, no sibling).
 */
export function resolveTnfExtensionsRoot(
  options: ResolveTnfExtensionsRootOptions = {}
): string | null {
  const envKey = options.envKey ?? 'TNF_EXTENSIONS_ROOT';
  const fromEnv = process.env[envKey]?.trim();
  if (fromEnv) {
    const resolved = path.resolve(fromEnv);
    if (fs.existsSync(resolved)) {
      return resolved;
    }
  }

  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const redirect = path.join(repoRoot, APPS_EXTENSIONS_REDIRECT);
  if (fs.existsSync(redirect)) {
    try {
      return fs.realpathSync(redirect);
    } catch {
      return path.resolve(redirect);
    }
  }

  const sibling = path.join(path.dirname(repoRoot), TNF_EXTENSIONS_DIR_NAME);
  if (fs.existsSync(sibling)) {
    return path.resolve(sibling);
  }

  return null;
}

/**
 * Prefer satellite root when present; otherwise `<base>/extensions`.
 * Used by ExtensionSystemFactory.createDefault so loads look at TNF-Extensions
 * via apps/extensions when that layout exists.
 */
export function resolveDefaultExtensionDirectory(baseDirectory: string): string {
  const base = path.resolve(baseDirectory);
  const satellite = resolveTnfExtensionsRoot({ repoRoot: base });
  if (satellite) {
    return satellite;
  }

  const nested = path.join(base, 'extensions');
  if (fs.existsSync(nested)) {
    return nested;
  }

  // Parent-of-repo sibling when baseDirectory is the monorepo root
  const sibling = path.join(path.dirname(base), TNF_EXTENSIONS_DIR_NAME);
  if (fs.existsSync(sibling)) {
    return sibling;
  }

  return nested;
}

/** List immediate child app directories under the satellite root (skips `external`). */
export function listSatelliteAppDirs(extensionsRoot?: string | null): string[] {
  const root = extensionsRoot ?? resolveTnfExtensionsRoot();
  if (!root || !fs.existsSync(root)) {
    return [];
  }

  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter(
      (entry) => entry.isDirectory() && entry.name !== 'external' && !entry.name.startsWith('.')
    )
    .map((entry) => path.join(root, entry.name))
    .sort();
}
