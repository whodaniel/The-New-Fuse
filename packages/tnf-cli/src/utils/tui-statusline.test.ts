/**
 * Behaviour guard for the TUI status line.
 *
 * The properties that matter are the ones an operator would notice being
 * wrong mid-session:
 *
 *   1. the model never disappears, however narrow the terminal
 *   2. the line never exceeds the terminal width (a wrap pushes the prompt
 *      down a row and the palette draws over the wrong region)
 *   3. a held session is not displayed as an idle one
 *   4. segments drop whole, never half-rendered
 *
 * Run: pnpm --filter @the-new-fuse/tnf-cli test
 */
import {
  PLAIN_STATUS_THEME,
  formatCount,
  formatDuration,
  renderStatusLine,
  shortModelName,
  statusSegments,
  type StatusSnapshot,
} from './tui-statusline.js';

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

const full: StatusSnapshot = {
  provider: 'anthropic',
  model: 'anthropic/claude-opus-5:beta',
  mode: 'agent',
  tuiMode: 'LONG_RUN',
  autonomous: true,
  turnsUsed: 4,
  turnsMax: 40,
  tokens: 12480,
  messages: 38,
  operatorWindowMs: 30000,
  branch: 'main',
  cwd: '~/…/The-New-Fuse',
  mcpServers: 3,
  indexedCommands: 1312,
};

console.log('\nstatusline — formatting');

check('short counts stay exact', formatCount(940) === '940');
check('thousands get one decimal', formatCount(1240) === '1.2k');
check('tens of thousands drop the decimal', formatCount(12480) === '12k');
check('millions are compacted', formatCount(1_240_000) === '1.2M');
check('negative counts degrade to zero', formatCount(-5) === '0');

check('provider prefix is stripped', shortModelName('anthropic/claude-opus-5') === 'claude-opus-5');
check('variant suffix is stripped', shortModelName('gpt-5:beta') === 'gpt-5');
check('a bare model name is untouched', shortModelName('gemini-3-flash') === 'gemini-3-flash');

check('sub-minute windows read in seconds', formatDuration(30000) === '30s');
check('minute windows read in minutes', formatDuration(120000) === '2m');
check('mixed windows keep the remainder', formatDuration(90000) === '1m30s');
check('a zero window is not negative', formatDuration(0) === '0s');

console.log('\nstatusline — content');

const wide = renderStatusLine(full, 200, PLAIN_STATUS_THEME);
check('the model is present', wide.includes('anthropic/claude-opus-5'), wide);
check('autonomy is shown', wide.includes('auto ON'), wide);
check('the turn budget is shown', wide.includes('turn 4/40'), wide);
check('context size is shown', wide.includes('ctx 12k'), wide);
check('message count rides along with context', wide.includes('38msg'), wide);
check('the operator window is shown', wide.includes('win 30s'), wide);
check('the branch is shown', wide.includes('⎇ main'), wide);
check('the palette size is advertised', wide.includes('1.3k cmds'), wide);

// A held session looks idle but is not off. Conflating the two is how an
// operator ends up waiting for a turn that will never fire.
const held = renderStatusLine({ ...full, hold: true }, 200, PLAIN_STATUS_THEME);
check(
  'a held session reads HOLD, not ON',
  held.includes('HOLD') && !held.includes('auto ON'),
  held
);

const idle = renderStatusLine({ ...full, autonomous: false }, 200, PLAIN_STATUS_THEME);
check('a non-autonomous session reads off', idle.includes('auto off'), idle);

const planning = renderStatusLine({ ...full, mode: 'plan' }, 200, PLAIN_STATUS_THEME);
check('a non-agent mode is surfaced', planning.includes('plan'), planning);
check('the default agent mode is not noise', !wide.includes('agent'), wide);

const nearCap = renderStatusLine({ ...full, turnsUsed: 38 }, 200, PLAIN_STATUS_THEME);
check('the turn budget still renders near the cap', nearCap.includes('turn 38/40'), nearCap);

const restricted = renderStatusLine({ ...full, permissions: 'read-only' }, 200, PLAIN_STATUS_THEME);
check('a restrictive permission set is surfaced', restricted.includes('read-only'), restricted);

const empty = renderStatusLine({}, 200, PLAIN_STATUS_THEME);
check('an empty snapshot still names a model slot', empty.includes('model/unknown'), empty);

console.log('\nstatusline — fitting');

for (const columns of [200, 120, 100, 80, 60, 40, 24, 10]) {
  const line = renderStatusLine(full, columns, PLAIN_STATUS_THEME);
  check(`fits ${columns} columns`, line.length <= Math.max(20, columns), `${line.length}: ${line}`);
}

// Observed live: `nvidia-nemotron-3-ultra/nemotron-3-ultra-550b-a55b` is 49
// columns of mostly-repeated text, and on an 80-column terminal it pushed out
// autonomy, context and the branch — every field that actually changes.
const verbose: StatusSnapshot = {
  ...full,
  provider: 'nvidia-nemotron-3-ultra',
  model: 'nvidia/nemotron-3-ultra-550b-a55b',
};
const verboseLine = renderStatusLine(verbose, 80, PLAIN_STATUS_THEME);
check(
  'an oversized model segment drops its provider prefix',
  verboseLine.includes('nemotron-3-ultra-550b-a55b') &&
    !verboseLine.includes('nvidia-nemotron-3-ultra/'),
  verboseLine
);
check(
  'compacting the model leaves room for the fields that change',
  verboseLine.includes('auto ON') && verboseLine.includes('ctx'),
  verboseLine
);
check(
  'a normally-sized model keeps its provider prefix',
  renderStatusLine(full, 80, PLAIN_STATUS_THEME).includes('anthropic/claude-opus-5')
);

const narrow = renderStatusLine(full, 40, PLAIN_STATUS_THEME);
check('the model survives a narrow terminal', narrow.includes('claude-opus-5'), narrow);
check('autonomy survives a narrow terminal', narrow.includes('ON'), narrow);
check('low-priority chrome is dropped first', !narrow.includes('cmds'), narrow);

const tiny = renderStatusLine(full, 10, PLAIN_STATUS_THEME);
check('the tiniest terminal still names the model', tiny.includes('claude-opus-5'), tiny);

// Segments drop whole. A half-rendered `anthropic/claude-op…` is worse than
// no branch name at all, so nothing is ever truncated mid-segment.
check(
  'nothing is ellipsised mid-segment',
  !narrow.includes('…claude') && !tiny.includes('…claude')
);
check('the line never wraps', !wide.includes('\n') && !tiny.includes('\n'));

console.log('\nstatusline — segments');

const segments = statusSegments(full, PLAIN_STATUS_THEME);
check('the model segment outranks everything else', segments[0].priority === 100);
check(
  'every segment reports a width matching its plain text',
  segments.every((s) => s.width === s.text.length),
  JSON.stringify(segments.map((s) => [s.text, s.width]))
);
check(
  'segment order is stable regardless of width',
  renderStatusLine(full, 200, PLAIN_STATUS_THEME).indexOf('turn') <
    renderStatusLine(full, 200, PLAIN_STATUS_THEME).indexOf('win')
);

console.log(`\nstatusline: ${pass} passed, ${fail} failed\n`);
if (fail > 0) process.exit(1);
