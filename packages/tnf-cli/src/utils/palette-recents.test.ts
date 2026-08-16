/**
 * Behaviour guard for the palette's frecency store.
 *
 * The store runs inside a keypress handler and reads/writes the operator's home
 * directory, so the properties worth pinning are as much about failure as about
 * ranking:
 *
 *   1. recency beats raw count (a command you stopped using fades)
 *   2. scores are normalised, so the ranker's weight has a stable meaning
 *   3. a missing, corrupt or unwritable store degrades to "no history"
 *
 * Run: pnpm --filter @the-new-fuse/tnf-cli test
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { PaletteRecents, frecency } from './palette-recents.js';

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

const DAY = 24 * 60 * 60 * 1000;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-palette-recents-'));
const NOW = 1_700_000_000_000;

console.log('\npalette-recents — decay');

check(
  'a fresh single use beats a stale one',
  frecency({ id: 'a', count: 1, last: NOW }, NOW) >
    frecency({ id: 'b', count: 1, last: NOW - 28 * DAY }, NOW)
);
check(
  'more uses beat fewer at the same age',
  frecency({ id: 'a', count: 10, last: NOW }, NOW) > frecency({ id: 'b', count: 2, last: NOW }, NOW)
);
// Two half-lives of decay is worth more than a 5x count advantage: the point
// of frecency is that what you ran this morning outranks what you drilled last
// quarter.
check(
  'recency outweighs a stale count advantage',
  frecency({ id: 'a', count: 2, last: NOW }, NOW) >
    frecency({ id: 'b', count: 10, last: NOW - 28 * DAY }, NOW)
);
check(
  'a use in the future is not penalised',
  frecency({ id: 'a', count: 1, last: NOW + DAY }, NOW) > 0
);

console.log('\npalette-recents — store');

{
  const file = path.join(tmp, 'store.json');
  const store = new PaletteRecents(file, () => NOW).load();
  check('an absent store loads empty', store.isEmpty);
  check('an unknown id scores zero', store.scoreFor('cli:agents list') === 0);

  store.record('cli:agents list');
  store.record('cli:harness cycle');
  store.record('cli:harness cycle');

  check('the most-used entry normalises to 1', store.scoreFor('cli:harness cycle') === 1);
  check(
    'a less-used entry scores between 0 and 1',
    store.scoreFor('cli:agents list') > 0 && store.scoreFor('cli:agents list') < 1,
    String(store.scoreFor('cli:agents list'))
  );
  check('ranked() puts the most-used first', store.ranked()[0] === 'cli:harness cycle');
  check('recording persists to disk', fs.existsSync(file));

  const reloaded = new PaletteRecents(file, () => NOW).load();
  check('a reloaded store keeps the ordering', reloaded.ranked()[0] === 'cli:harness cycle');
  check('a reloaded store keeps the normalisation', reloaded.scoreFor('cli:harness cycle') === 1);

  // A day later the same records still rank the same way relative to each
  // other — normalisation is against the current maximum, not a fixed scale.
  const later = new PaletteRecents(file, () => NOW + DAY).load();
  check(
    'scores stay normalised as the whole store ages',
    later.scoreFor('cli:harness cycle') === 1
  );
}

console.log('\npalette-recents — degradation');

{
  const file = path.join(tmp, 'corrupt.json');
  fs.writeFileSync(file, '{ this is not json', 'utf8');
  const store = new PaletteRecents(file, () => NOW).load();
  check('a corrupt store loads empty rather than throwing', store.isEmpty);
  check('a corrupt store still scores safely', store.scoreFor('anything') === 0);
  store.record('cli:agents list');
  check(
    'a corrupt store is overwritten by the next record',
    store.scoreFor('cli:agents list') === 1
  );
}

{
  const file = path.join(tmp, 'wrong-shape.json');
  fs.writeFileSync(file, JSON.stringify({ entries: [{ nope: true }, 'garbage', null] }), 'utf8');
  const store = new PaletteRecents(file, () => NOW).load();
  check('records without an id are skipped', store.isEmpty);
}

{
  // Unwritable path: the palette must not crash inside a keypress handler.
  const file = path.join(tmp, 'store.json', 'nested', 'x.json');
  const store = new PaletteRecents(file, () => NOW).load();
  let threw = false;
  try {
    store.record('cli:agents list');
  } catch {
    threw = true;
  }
  check('an unwritable store does not throw', !threw);
  check('an unwritable store still scores in memory', store.scoreFor('cli:agents list') === 1);
}

fs.rmSync(tmp, { recursive: true, force: true });

console.log(`\npalette-recents: ${pass} passed, ${fail} failed\n`);
if (fail > 0) process.exit(1);
