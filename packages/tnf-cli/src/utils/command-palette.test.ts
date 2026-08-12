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
  composeFrame,
  parseQuery,
  rankPalette,
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
  frame.filter((l) => l.startsWith('›')).length === 1
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
check('empty result set renders a no-match line', emptyFrame.length === 1);

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
check(
  'tab completes the buffer without running',
  tabOutcome.type === 'complete' && tabOutcome.line === '/agents register',
  JSON.stringify(tabOutcome)
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

console.log(`\npalette: ${pass} passed, ${fail} failed\n`);
if (fail > 0) process.exit(1);
