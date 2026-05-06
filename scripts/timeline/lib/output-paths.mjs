import path from 'node:path';

const PRIVATE_SCOPE = 'private';
const PUBLIC_SCOPE = 'public';

function normalizeScope(rawScope) {
  const scope = String(rawScope || '').trim().toLowerCase();
  return scope === PUBLIC_SCOPE ? PUBLIC_SCOPE : PRIVATE_SCOPE;
}

export function getTimelineOutputScope() {
  return normalizeScope(process.env.TNF_TIMELINE_OUTPUT_SCOPE || PRIVATE_SCOPE);
}

export function resolveTimelineOutputPath(filename, scopeOverride = '') {
  const scope = normalizeScope(scopeOverride || getTimelineOutputScope());
  const baseDir =
    scope === PUBLIC_SCOPE
      ? process.env.TNF_TIMELINE_PUBLIC_DIR || path.join(process.cwd(), 'data', 'protocols')
      : process.env.TNF_TIMELINE_PRIVATE_DIR || path.join(process.cwd(), 'data', 'private', 'protocols');

  return path.join(baseDir, filename);
}
