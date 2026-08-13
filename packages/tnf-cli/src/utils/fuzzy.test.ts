/**
 * Ranking guard for the command-palette fuzzy matcher.
 *
 * The palette's whole reason for existing is that a query should reach a LEAF
 * command without the operator first selecting its namespace. That property is
 * a ranking property, not a "does it match" property — `regi` matches a dozen
 * paths, and the palette is only useful if `agents register` is the one at the
 * top. These assertions pin the orderings that make the flat palette usable;
 * if a scoring-weight tweak inverts one, this fails loudly rather than
 * silently degrading back into "type the namespace first".
 *
 * Run: pnpm --filter @the-new-fuse/tnf-cli test
 */
import { fuzzyMatch, fuzzyMatchEntry, highlight } from './fuzzy.js';

let pass = 0;
let fail = 0;

function check(name: string, cond: boolean, detail = ''): void {
  if (cond) {
    console.log(`  PASS  ${name}`);
    pass += 1;
  } else {
    console.log(`  FAIL  ${name} ${detail}`);
    fail += 1;
  }
}

function score(haystack: string, query: string): number {
  const m = fuzzyMatch(haystack, query);
  return m ? m.score : Number.NEGATIVE_INFINITY;
}

/** Assert `winner` outranks every entry in `losers` for the given query. */
function ranksAbove(query: string, winner: string, losers: string[]): void {
  const winnerScore = score(winner, query);
  for (const loser of losers) {
    const loserScore = score(loser, query);
    check(
      `"${query}": "${winner}" > "${loser}"`,
      winnerScore > loserScore,
      `(${winnerScore} vs ${loserScore})`
    );
  }
}

console.log('\nfuzzy matcher — match semantics');

check('empty query matches everything', fuzzyMatch('anything', '')?.score === 0);
check('non-subsequence does not match', fuzzyMatch('agents list', 'zzz') === null);
check('query longer than haystack does not match', fuzzyMatch('ab', 'abc') === null);
check('case-insensitive', fuzzyMatch('Agents Register', 'AGENTS') !== null);

// The core regression: the old palette used name.startsWith(query), so a query
// naming the SUBCOMMAND could never reach it. These must all match now.
check('subcommand-only query reaches the leaf', fuzzyMatch('harness cycle', 'cycle') !== null);
check('cross-segment initials reach the leaf', fuzzyMatch('harness cycle', 'hcy') !== null);
check('interior substring matches', fuzzyMatch('agents register', 'regi') !== null);

console.log('\nfuzzy matcher — ranking');

// Typing the subcommand should land on the command that owns it.
ranksAbove('regi', 'agents register', [
  'staffing role-generate',
  'refresh-context git',
  'channels reingest',
]);

// Word starts beat scattered interior hits.
ranksAbove('ac', 'agents convo', ['exact-copy', 'parity match']);

// A whole segment beats a partial one.
ranksAbove('cycle', 'harness cycle', ['harness cycle-report', 'full-auto cycle-status']);

// Consecutive runs beat scattered hits of the same characters.
ranksAbove('menu', 'menu', ['model export numbers up']);

// Shorter paths win ties — the palette should not bury `register` under
// deeper paths that merely also contain it.
ranksAbove('register', 'register', ['fleet worker register-remote-worker']);

console.log('\nfuzzy matcher — description fallback');

const pathHit = fuzzyMatchEntry('agents register', 'Register an agent', 'regi');
const descHit = fuzzyMatchEntry('agents bank reconcile', 'Register the agent bank', 'regi');
check('description-only hit still matches', descHit !== null);
check(
  'path hit always outranks description hit',
  (pathHit?.score ?? -Infinity) > (descHit?.score ?? -Infinity),
  `(${pathHit?.score} vs ${descHit?.score})`
);
check('description hit carries no highlight positions', descHit?.positions.length === 0);

console.log('\nfuzzy matcher — highlight');

const m = fuzzyMatch('agents register', 'regi');
const painted = highlight('agents register', m?.positions ?? [], (s) => `[${s}]`);
check(
  'highlight brackets the matched run',
  painted === 'agents [regi]ster',
  `got ${JSON.stringify(painted)}`
);
check(
  'highlight with no positions is identity',
  highlight('agents register', [], (s) => `[${s}]`) === 'agents register'
);

console.log(`\nfuzzy: ${pass} passed, ${fail} failed\n`);
if (fail > 0) process.exit(1);
