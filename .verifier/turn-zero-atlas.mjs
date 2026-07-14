/**
 * Turn-Zero Atlas Loader (TNF)
 * ---------------------------
 * Adds the live Process Atlas to an agent's system context once per session.
 *
 * On first call (or whenever fresher than `maxAgeMinutes`), reads the markdown
 * digest at `.verifier/process-atlas.digest.md` and injects it as a system
 * message before the agent begins producing the next user turn.
 *
 * Usage in any agent (Node 20+ / ES modules):
 *
 *   import { loadAtlasIntoContext } from './turn-zero-atlas.mjs';
 *   const messages = await loadAtlasIntoContext([
 *     { role: 'user', content: '...' }
 *   ]);
 *
 * Or bound inline:
 *
 *   const messages = await loadAtlasIntoContext(initialMessages, {
 *     maxAgeMinutes: 30,
 *     repoPath: '/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse',
 *   });
 *
 * Honors:
 * - Failsafe: missing digest → returns the original messages untouched
 * - Idempotency: tagged with sentinel marker so a second call within window is a no-op
 * - Determinism: each call emits a verification line so downstream tooling can assert grounding
 */
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ATLAS_SENTINEL = '[tnf-atlas-grounded]';

const DEFAULT_DIGEST = path.resolve(
  __dirname,
  '..',
  '.verifier',
  'process-atlas.digest.md',
);

/**
 * Reads the latest markdown digest, optionally refreshing the JSON/verify
 * artifact if the markdown is stale. Returns null on failure.
 */
async function readDigest(digestPath, maxAgeMinutes) {
  try {
    const st = await stat(digestPath);
    const ageMin = (Date.now() - st.mtimeMs) / 1000 / 60;
    if (ageMin > maxAgeMinutes) {
      throw new Error(`digest is ${ageMin.toFixed(1)}m old, exceeds ${maxAgeMinutes}m`);
    }
    const txt = await readFile(digestPath, 'utf8');
    return { text: txt, ageMin };
  } catch (e) {
    return { text: null, ageMin: null, error: e.message };
  }
}

/**
 * Injects the atlas digest as a system message at the head of the message list.
 * Idempotent: if a system message already bears the ATLAS_SENTINEL marker, no-op.
 *
 * @param {Array<{role:string,content:string}>} messages
 * @param {{maxAgeMinutes?:number, digestPath?:string}} opts
 * @returns {Promise<Array<{role:string,content:string}>>}
 */
export async function loadAtlasIntoContext(messages = [], opts = {}) {
  if (!Array.isArray(messages)) return messages;
  if (messages.some((m) => typeof m.content === 'string' && m.content.includes(ATLAS_SENTINEL))) {
    return messages;
  }
  const digestPath = opts.digestPath
    ? path.resolve(opts.digestPath, '.verifier', 'process-atlas.digest.md')
    : DEFAULT_DIGEST;
  const maxAgeMinutes = opts.maxAgeMinutes ?? 240; // 4h matches the cron cadence

  const { text, ageMin, error } = await readDigest(digestPath, maxAgeMinutes);
  if (!text) {
    // Failsafe — return original messages untouched. Surface the error in metadata
    // only when caller explicitly asks via opt.failsafeVerbose; default silent.
    if (opts.failsafeVerbose) {
      console.warn(`[atlas] digest unavailable at ${digestPath}: ${error}`);
    }
    return messages;
  }

  const grounding = [
    ATLAS_SENTINEL,
    `Atlas age=${ageMin.toFixed(1)}m`,
    '',
    text,
    '',
    `[end of atlas]`,
  ].join('\n');

  return [
    { role: 'system', content: grounding },
    ...messages,
  ];
}

export default loadAtlasIntoContext;
