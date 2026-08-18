/**
 * Behaviour guard for the flat command palette.
 *
 * The regression this exists to prevent is the original UX: a palette that
 * only indexes depth-1 names, so selecting one lands you on a help page and
 * you type the real command by hand. The assertions below encode the
 * properties that make the palette flat rather than hierarchical:
 *
 *   1. leaves are indexed at every depth, not just namespaces
 *   2. a leaf is reachable by typing ONLY its own name
 *   3. the palette survives a space, so `/agents reg` keeps filtering
 *   4. the frame is erased in place instead of appended per keystroke
 *
 * Run: pnpm --filter @the-new-fuse/tnf-cli test
 */
import { Command } from 'commander';
import type { DiscoveredEntry } from '../services/CommandSourceService.js';
import {
  PLAIN_THEME,
  PaletteController,
  PaletteRenderer,
  buildPaletteIndex,
  collectCliEntries,
  completionFor,
  composeFrame,
  describeSelection,
  parseQuery,
  rankPalette,
  resolveWindow,
  scrollbarColumn,
} from './command-palette.js';

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

/** A miniature stand-in for the real 410-command tree. */
function buildProgram(): Command {
  const program = new Command();
  const agents = program.command('agents').description('Agent operations');
  agents
    .command('register')
    .description('Register an agent')
    .argument('<name>', 'agent name')
    .argument('[role]', 'agent role');
  agents.command('list').description('List registered agents');
  const harness = program.command('harness').description('Harness master loop');
  harness.command('cycle').description('Run one inspect/act/verify cycle');
  harness.command('inspect').description('Inspect harness health');
  program.command('doctor').description('Run diagnostics');
  return program;
}

const MARKDOWN: DiscoveredEntry[] = [
  {
    name: 'self-improve',
    kind: 'command',
    runtime: 'claude',
    scope: 'project',
    description: 'Run the TNF self-improvement loop',
    filePath: '/repo/.claude/commands/self-improve.md',
  },
  {
    name: 'agent-registry-manager',
    kind: 'agent',
    runtime: 'claude',
    scope: 'project',
    description: 'Manages agent metadata in the registry',
    filePath: '/repo/.claude/agents/agent-registry-manager.md',
  },
  {
    name: 'agent-browser',
    kind: 'skill',
    runtime: 'agent',
    scope: 'project',
    description: 'Headless browser automation for agents',
    filePath: '/repo/.agent/skills/agent-browser/SKILL.md',
  },
];

const SLASH = [
  { name: 'doctor', summary: 'Run TNF diagnostics', usage: '/doctor', mode: 'cli' },
  { name: 'cycle', summary: 'Run one harness loop', usage: '/cycle', mode: 'cli' },
];

const program = buildProgram();
const index = buildPaletteIndex({ program, slash: SLASH, markdown: MARKDOWN });

console.log('\npalette — index construction');

const cliEntries = collectCliEntries(program);
const labels = cliEntries.map((e) => e.searchText);
check('indexes depth-1 namespaces', labels.includes('agents'));
check('indexes depth-2 leaves', labels.includes('agents register'));
check('indexes every leaf of every branch', labels.includes('harness cycle'));
check(
  'every node is indexed (2 branches + 5 leaves)',
  cliEntries.length === 7,
  `got ${cliEntries.length}: ${labels.join(', ')}`
);

const registerEntry = cliEntries.find((e) => e.searchText === 'agents register');
check('argument signature is rendered', registerEntry?.label === 'agents register <name> [role]');
check('required args are flagged', registerEntry?.needsArgs === true);
check(
  'branch nodes are badged so a help-page dead end is visible',
  cliEntries.find((e) => e.searchText === 'agents')?.badge === 'cli▸'
);
check(
  'markdown sources are indexed',
  index.some((e) => e.id === 'skill:agent:agent-browser')
);

console.log('\npalette — flat reachability (the actual bug)');

/** Top-ranked search text for a query. */
function top(query: string): string {
  return rankPalette(index, query)[0]?.entry.searchText ?? '<none>';
}

check(
  'typing a leaf name reaches the leaf',
  top('/register') === 'agents register',
  top('/register')
);
check(
  'typing a leaf name reaches the leaf (2)',
  top('/inspect') === 'harness inspect',
  top('/inspect')
);
check('partial leaf name works', top('/regi') === 'agents register', top('/regi'));
check(
  'a space does not end the query — it refines it',
  top('/agents reg') === 'agents register',
  top('/agents reg')
);
check(
  'cross-segment initials reach the leaf',
  rankPalette(index, '/hcyc').some((r) => r.entry.searchText === 'harness cycle')
);

console.log('\npalette — tiering and sigils');

check(
  'CLI verbs outrank the 795 markdown definitions for a shared prefix',
  top('/agent') !== 'agent-browser',
  top('/agent')
);
check(
  '@ narrows to agents',
  rankPalette(index, '/@agent').every((r) => r.entry.badge.startsWith('agent·'))
);
check(
  '# narrows to skills',
  rankPalette(index, '/#agent').every((r) => r.entry.badge.startsWith('skill·'))
);
check(
  '! narrows to CLI commands',
  rankPalette(index, '/!agent').every((r) => r.entry.badge.startsWith('cli'))
);
check('parseQuery strips trigger and sigils', parseQuery('/@foo').query === 'foo');
check('parseQuery reports the kind filter', parseQuery('/#foo').kinds?.has('skill') === true);
check('parseQuery with no sigil has no filter', parseQuery('/foo').kinds === null);

console.log('\npalette — frame composition');

const frame = composeFrame({
  ranked: rankPalette(index, '/reg'),
  selectedIndex: 0,
  visibleRows: 5,
  columns: 100,
  theme: PLAIN_THEME,
  totalCount: index.length,
});
check('frame has header, rows and footer', frame.length >= 3);
check(
  'selection marker is present exactly once',
  frame.filter((l) => l.startsWith('▸')).length === 1,
  JSON.stringify(frame.filter((l) => l.startsWith('▸')))
);
check(
  'every row fits the terminal width (no wrap, so height stays exact)',
  frame.every((line) => line.length <= 100),
  `longest ${Math.max(...frame.map((l) => l.length))}`
);
const emptyFrame = composeFrame({
  ranked: [],
  selectedIndex: 0,
  visibleRows: 5,
  columns: 100,
  theme: PLAIN_THEME,
  totalCount: index.length,
});
check('empty result set renders a no-match line', emptyFrame[0].includes('no match'));
check('empty result set still shows the key hints', emptyFrame.length === 2);

const detailFrame = composeFrame({
  ranked: rankPalette(index, '/reg'),
  selectedIndex: 0,
  visibleRows: 5,
  columns: 100,
  theme: PLAIN_THEME,
  totalCount: index.length,
});
check(
  'detail row names the runnable command for the selection',
  detailFrame[detailFrame.length - 2].includes('tnf agents register'),
  JSON.stringify(detailFrame[detailFrame.length - 2])
);
check(
  'detail row flags a command that still needs arguments',
  describeSelection(rankPalette(index, '/reg')[0]).includes('needs arguments')
);
check('detail row tolerates an empty selection', describeSelection(undefined) === '  —');

const filteredFrame = composeFrame({
  ranked: rankPalette(index, '/!reg'),
  selectedIndex: 0,
  visibleRows: 5,
  columns: 100,
  theme: PLAIN_THEME,
  totalCount: index.length,
  kinds: parseQuery('/!reg').kinds,
});
check('header surfaces the active kind filter', filteredFrame[0].includes('filter cli'));

// The frame height must not depend on scroll position: the renderer erases a
// fixed region, so a frame that grows and shrinks under the prompt flickers
// and leaves orphaned rows in the scrollback.
const wide = Array.from({ length: 60 }, (_, i) => ({
  entry: { ...index[0], id: `x${i}`, label: `entry-${i}`, searchText: `entry-${i}` },
  score: 100 - i,
  positions: [] as number[],
}));
const heightAt = (selectedIndex: number, scrollOffset: number) =>
  composeFrame({
    ranked: wide,
    selectedIndex,
    scrollOffset,
    visibleRows: 8,
    columns: 100,
    theme: PLAIN_THEME,
    totalCount: index.length,
  }).length;
check(
  'frame height is constant regardless of scroll position',
  heightAt(0, 0) === heightAt(30, 26) && heightAt(30, 26) === heightAt(59, 52),
  `${heightAt(0, 0)} / ${heightAt(30, 26)} / ${heightAt(59, 52)}`
);
check('frame height is rows + header + detail + footer', heightAt(0, 0) === 8 + 3);

// Column widths are measured across the whole result set, not the visible
// window: measuring the window made descriptions slide left and right under a
// stationary cursor as the operator scrolled.
const columnStart = (selectedIndex: number, scrollOffset: number): number => {
  const rows = composeFrame({
    ranked: rankPalette(index, '/'),
    selectedIndex,
    scrollOffset,
    visibleRows: 4,
    columns: 100,
    theme: PLAIN_THEME,
    totalCount: index.length,
  }).slice(1, 5);
  // Every row is padded to the same shape, so any row's length is the width.
  return rows[0].length;
};
check(
  'column layout does not shift while scrolling',
  columnStart(0, 0) === columnStart(6, 3),
  `${columnStart(0, 0)} vs ${columnStart(6, 3)}`
);

console.log('\npalette — scroll window');

// The bug: the controller snapped scrollOffset to selectedIndex on downward
// overflow, putting the newly-selected row at the TOP of the window, so one
// Down keypress at the bottom edge scrolled a whole page.
check(
  'scrolling down by one advances the window by exactly one',
  resolveWindow(60, 8, 8, 0).start === 1
);
check('the selection stays inside the window', resolveWindow(60, 8, 8, 0).end === 9);
check('scrolling up by one retreats by exactly one', resolveWindow(60, 4, 8, 5).start === 4);
check(
  'a window already containing the selection does not move',
  resolveWindow(60, 3, 8, 0).start === 0
);
check('the window never runs off the end', resolveWindow(60, 59, 8, 99).end === 60);
check('the window never runs off the front', resolveWindow(60, 0, 8, -5).start === 0);
check('a short list is shown whole', resolveWindow(3, 2, 8, 0).end === 3);
check('a short list needs no offset', resolveWindow(3, 2, 8, 0).start === 0);

const barTop = scrollbarColumn(60, 0, 8);
const barBottom = scrollbarColumn(60, 52, 8);
check('scrollbar thumb sits at the top when scrolled to the top', barTop[0] === 'thumb');
check('scrollbar thumb sits at the bottom when scrolled to the end', barBottom[7] === 'thumb');
check(
  'scrollbar is absent when everything fits',
  scrollbarColumn(4, 0, 8).every((c) => c === 'none')
);

console.log('\npalette — in-place rendering');

let buffer = '';
const renderer = new PaletteRenderer({
  write: (chunk) => {
    buffer += chunk;
  },
  columns: () => 100,
  rows: () => 24,
});

renderer.draw(['a', 'b', 'c']);
const firstDraw = buffer;
check(
  'draw saves and restores the cursor',
  firstDraw.includes('\x1b7') && firstDraw.includes('\x1b8')
);
check(
  'draw reserves scroll space before saving',
  firstDraw.indexOf('\x1b[3A') < firstDraw.indexOf('\x1b7')
);
check('draw clears each line it writes', (firstDraw.match(/\x1b\[2K/g) || []).length === 3);
check('draw erases below to drop a taller previous frame', firstDraw.includes('\x1b[0J'));

buffer = '';
renderer.draw(['a']);
check(
  'shrinking frame does not reserve more space',
  !buffer.includes('\x1b[') || !/\x1b\[\d+A/.test(buffer.replace('\x1b[0J', '')),
  JSON.stringify(buffer)
);

buffer = '';
renderer.clear();
check('clear erases the region', buffer.includes('\x1b[0J'));
check(
  'clear is idempotent',
  (() => {
    buffer = '';
    renderer.clear();
    return buffer === '';
  })()
);

console.log('\npalette — controller');

const controller = new PaletteController(
  new PaletteRenderer({ write: () => {}, columns: () => 100, rows: () => 24 }),
  PLAIN_THEME
);
controller.setIndex(index);

check(
  'non-slash input does not open the palette',
  controller.handle('hello', 'other').type === 'none'
);
check(
  'slash input opens the palette',
  (() => {
    controller.handle('/reg', 'other');
    return controller.isOpen;
  })()
);
check('selection defaults to the top match', controller.selected?.searchText === 'agents register');

controller.handle('/reg', 'down');
const afterDown = controller.selected?.searchText;
check('down moves the selection', afterDown !== 'agents register', `still ${afterDown}`);
controller.handle('/reg', 'up');
check('up returns the selection', controller.selected?.searchText === 'agents register');

const tabOutcome = controller.handle('/reg', 'tab');
// Trailing space: `agents register` takes a required <name>, and without it
// the next character the operator types lands inside the command token.
check(
  'tab completes the buffer without running',
  tabOutcome.type === 'complete' && tabOutcome.line === '/agents register ',
  JSON.stringify(tabOutcome)
);
check('tab leaves the palette open so the next token keeps filtering', controller.isOpen);
check(
  'completion of an argument-free leaf gets no trailing space',
  completionFor({
    id: 'cli:harness cycle',
    label: 'harness cycle',
    searchText: 'harness cycle',
    tokens: ['harness', 'cycle'],
    description: '',
    badge: 'cli',
    tier: 3,
    needsArgs: false,
    action: { type: 'cli', argv: ['harness', 'cycle'] },
  }) === '/harness cycle'
);
check(
  'completion of a branch gets a trailing space to keep drilling',
  completionFor({
    id: 'cli:agents',
    label: 'agents',
    searchText: 'agents',
    tokens: ['agents'],
    description: '',
    badge: 'cli▸',
    tier: 3,
    needsArgs: false,
    action: { type: 'cli', argv: ['agents'] },
  }) === '/agents '
);

controller.handle('/harness cycle', 'other');
const runOutcome = controller.handle('/harness cycle', 'enter');
check(
  'enter runs the selected leaf directly',
  runOutcome.type === 'run' && runOutcome.entry.searchText === 'harness cycle',
  JSON.stringify(runOutcome.type === 'run' ? runOutcome.entry.searchText : runOutcome)
);
check('enter closes the palette', !controller.isOpen);

controller.handle('/reg', 'other');
check('escape dismisses', controller.handle('/reg', 'escape').type === 'dismissed');
check('escape closes the palette', !controller.isOpen);
// Regression: the last ranked selection used to survive dismissal and claim
// the next Enter, so escaping the palette still ran a command.
check(
  'enter after escape does NOT run the stale selection',
  controller.handle('/reg', 'enter').type === 'none'
);

// Found by driving a real TTY: Escape only hid the palette until the next
// keystroke, because `handle()` reopens on any printable key. Dismissing it
// and continuing to type brought it straight back.
controller.handle('/reg', 'other');
controller.handle('/reg', 'escape');
controller.handle('/regi', 'other');
check('escape stays dismissed while the same line is edited', !controller.isOpen);
controller.handle('/regis', 'other');
check('still dismissed several keystrokes later', !controller.isOpen);

// Abandoning the line re-arms it.
controller.handle('', 'other');
controller.handle('/reg', 'other');
check('clearing the line re-arms the palette', controller.isOpen);

console.log('\npalette — navigation');

const navController = new PaletteController(
  new PaletteRenderer({ write: () => {}, columns: () => 100, rows: () => 24 }),
  PLAIN_THEME
);
navController.setIndex(index);

// Bare `/` lists everything, which is the case that actually needs scrolling.
navController.handle('/', 'other');
const total = rankPalette(index, '/').length;
check('bare slash lists the whole index', total === index.length, `${total} vs ${index.length}`);

const labelAt = () => navController.selected?.searchText;
const firstLabel = labelAt();
navController.handle('/', 'up');
check(
  'up on the first row wraps to the last',
  labelAt() === rankPalette(index, '/')[total - 1].entry.searchText,
  `${labelAt()}`
);
navController.handle('/', 'down');
check('down from the last row wraps back to the first', labelAt() === firstLabel);

navController.handle('/', 'end');
check(
  'end jumps to the last row',
  labelAt() === rankPalette(index, '/')[total - 1].entry.searchText
);
navController.handle('/', 'home');
check('home jumps back to the first row', labelAt() === firstLabel);

navController.handle('/', 'pagedown');
const afterPage = labelAt();
check('page down moves further than one row', afterPage !== firstLabel);
navController.handle('/', 'pageup');
check('page up clamps at the first row rather than wrapping', labelAt() === firstLabel);

navController.handle('/', 'halfdown');
check('half-page down moves the selection', labelAt() !== firstLabel);
navController.handle('/', 'halfup');
check('half-page up returns', labelAt() === firstLabel);

// The scroll offset must track the selection, or the highlighted row is drawn
// outside the window the renderer is showing.
navController.handle('/', 'end');
check(
  'scrolling to the end leaves the selection inside the visible window',
  navController.scrollPosition <= total - 1 && navController.scrollPosition + 24 > total - 1
);

console.log('\npalette — frecency');

// A stub store: `agents register` is the operator's most-used command.
const recents = { scoreFor: (id: string) => (id === 'cli:harness cycle' ? 1 : 0) };
const withRecents = rankPalette(index, '/', 200, { recents });
check(
  'an empty query surfaces the most-used command first',
  withRecents[0].entry.id === 'cli:harness cycle',
  withRecents[0].entry.id
);
check('the frecency contribution is reported for the ★ mark', withRecents[0].recency === 1);
// History nudges ties; it must never overrule what was actually typed.
const typed = rankPalette(index, '/agents register', 200, { recents });
check(
  'history does not overrule an explicit query',
  typed[0].entry.searchText === 'agents register',
  typed[0].entry.searchText
);
check(
  'ranking without a store is unchanged',
  rankPalette(index, '/reg')[0].entry.searchText ===
    rankPalette(index, '/reg', 200, {})[0].entry.searchText
);

console.log(`\npalette: ${pass} passed, ${fail} failed\n`);
if (fail > 0) process.exit(1);
