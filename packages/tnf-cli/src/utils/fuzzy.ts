/**
 * packages/tnf-cli/src/utils/fuzzy.ts
 *
 * Subsequence fuzzy matcher for the TNF command palette.
 *
 * WHY THIS EXISTS
 *   The previous palette matched with `name.startsWith(query)` against a
 *   hand-curated list of ~40 top-level slash commands. That forced a two-step
 *   selection: pick the namespace (`/harness`), watch it dump a help page,
 *   then retype the real command (`tnf harness cycle`). Typing `cycle` found
 *   nothing, because `cycle` is not a prefix of `harness`.
 *
 *   A flat palette over all ~410 command paths only works if the matcher can
 *   score a query against the *whole path* — `hcy` should reach
 *   `harness cycle`, `regi` should reach `agents register`. That is a
 *   subsequence match with positional bonuses, not a prefix test.
 *
 * SCORING MODEL (higher is better; null means no match)
 *   Every query character must appear in the haystack in order. On top of
 *   that base requirement the score rewards matches that a human would call
 *   "the obvious one":
 *
 *     + word-start hits          `ac` → "**a**gents **c**onvo" beats "ex**a**ct**c**opy"
 *     + consecutive runs         `regis` as one block beats five scattered hits
 *     + full-token prefix        query is a prefix of a whole path segment
 *     + earlier first match      matches near the front of the string win
 *     - long haystacks           mild length penalty so short paths surface
 *
 *   Only the LAST path segment and word starts get boosts. Matching inside
 *   the middle of a word is legal but cheap, which is what keeps `tnf agents
 *   register` above `tnf staffing role-generate` for the query `regi`.
 *
 * DELIBERATELY NOT A LIBRARY
 *   fzf/fzy-grade algorithms do full dynamic programming over the match
 *   matrix. This is a single greedy left-to-right pass with backtracking only
 *   at word starts — O(n) per candidate, fast enough to re-rank 400+ entries
 *   on every keystroke inside a readline keypress handler, which is the
 *   actual constraint.
 */

export interface FuzzyMatch {
  /** Higher is better. Only meaningful when comparing against the same query. */
  score: number;
  /** Indices in the haystack that the query characters landed on. */
  positions: number[];
}

const SCORE_WORD_START = 80;
const SCORE_CONSECUTIVE = 60;
const SCORE_SEGMENT_PREFIX = 140;
const SCORE_EXACT_SEGMENT = 220;
const SCORE_FULL_PREFIX = 300;
const PENALTY_LEADING = 3;
const PENALTY_GAP = 6;
const PENALTY_LENGTH = 1;

/** Word boundary = start of string, or preceded by a separator. */
function isWordStart(haystack: string, index: number): boolean {
  if (index === 0) return true;
  const prev = haystack[index - 1];
  return (
    prev === ' ' || prev === '-' || prev === '_' || prev === ':' || prev === '/' || prev === '.'
  );
}

/**
 * Greedy left-to-right subsequence walk that prefers word starts.
 *
 * For each query character we take the first haystack hit at or after the
 * cursor, but if a word-start hit exists within the same "gap region" we take
 * that instead. This is what makes `ac` resolve to `agents convo` rather than
 * to the `a`/`c` pair inside `agents`.
 */
function walk(haystackLower: string, queryLower: string): number[] | null {
  const positions: number[] = [];
  let cursor = 0;

  for (let qi = 0; qi < queryLower.length; qi++) {
    const ch = queryLower[qi];
    let plain = -1;
    let wordStart = -1;

    for (let hi = cursor; hi < haystackLower.length; hi++) {
      if (haystackLower[hi] !== ch) continue;
      if (plain === -1) plain = hi;
      if (isWordStart(haystackLower, hi)) {
        wordStart = hi;
        break;
      }
    }

    if (plain === -1) return null;
    // Prefer a word start, but never jump backwards past an adjacent
    // (consecutive) hit — consecutive runs are worth more than a distant
    // word start, and jumping would break `regis` matching as one block.
    const consecutive = positions.length > 0 && plain === positions[positions.length - 1] + 1;
    const chosen = consecutive || wordStart === -1 ? plain : wordStart;
    positions.push(chosen);
    cursor = chosen + 1;
  }

  return positions;
}

/**
 * Score `query` against `haystack`. Returns null when the query is not a
 * subsequence of the haystack. An empty query matches everything at score 0.
 */
export function fuzzyMatch(haystack: string, query: string): FuzzyMatch | null {
  if (!query) return { score: 0, positions: [] };
  if (!haystack) return null;

  const haystackLower = haystack.toLowerCase();
  const queryLower = query.toLowerCase();
  if (queryLower.length > haystackLower.length) return null;

  const positions = walk(haystackLower, queryLower);
  if (!positions) return null;

  let score = 0;

  // Positional bonuses.
  for (let i = 0; i < positions.length; i++) {
    const pos = positions[i];
    if (isWordStart(haystack, pos)) score += SCORE_WORD_START;
    if (i > 0) {
      const gap = pos - positions[i - 1] - 1;
      if (gap === 0) score += SCORE_CONSECUTIVE;
      else score -= Math.min(gap, 12) * PENALTY_GAP;
    }
  }

  // Whole-token bonuses: the query lines up with a real path segment.
  const segments = haystackLower.split(/[\s:/]+/).filter(Boolean);
  for (const segment of segments) {
    if (segment === queryLower) {
      score += SCORE_EXACT_SEGMENT;
      break;
    }
    if (segment.startsWith(queryLower)) {
      score += SCORE_SEGMENT_PREFIX;
      break;
    }
  }
  if (haystackLower.startsWith(queryLower)) score += SCORE_FULL_PREFIX;

  // Prefer matches that start early and live in short strings.
  score -= Math.min(positions[0], 20) * PENALTY_LEADING;
  score -= Math.min(haystack.length, 80) * PENALTY_LENGTH;

  return { score, positions };
}

/**
 * Score a query against a primary field (the command path) and a secondary
 * field (its description), so `register an agent` still finds
 * `tnf agents register`. Description hits are heavily discounted so they can
 * never outrank a real path hit.
 */
export function fuzzyMatchEntry(
  primary: string,
  secondary: string | undefined,
  query: string
): FuzzyMatch | null {
  const direct = fuzzyMatch(primary, query);
  if (direct) return direct;
  if (!secondary) return null;
  const fallback = fuzzyMatch(secondary, query);
  if (!fallback) return null;
  // Description-only hits rank below every path hit, and carry no highlight
  // positions (the highlight applies to `primary`, which did not match).
  return { score: fallback.score - 2000, positions: [] };
}

/** Wrap matched characters using the supplied painter. Used by the renderer. */
export function highlight(
  text: string,
  positions: number[],
  paint: (chunk: string) => string
): string {
  if (positions.length === 0) return text;
  const marked = new Set(positions);
  let out = '';
  let run = '';
  let runMatched = false;

  const flush = () => {
    if (!run) return;
    out += runMatched ? paint(run) : run;
    run = '';
  };

  for (let i = 0; i < text.length; i++) {
    const matched = marked.has(i);
    if (matched !== runMatched) {
      flush();
      runMatched = matched;
    }
    run += text[i];
  }
  flush();
  return out;
}
