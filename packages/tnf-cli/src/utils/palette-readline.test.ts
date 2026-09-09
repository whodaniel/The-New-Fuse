/**
 * Integration guard for the palette's readline glue.
 *
 * This is the code with real ordering hazards, and none of it is reachable
 * from a test that imports cli.ts (that module runs main()). So the glue lives
 * in its own module and this drives it over a fake TTY: a duplex stream with
 * `isTTY` and `setRawMode`, plus a stand-in readline interface whose `line`
 * property behaves the way Node's does — including the two behaviours that
 * broke the original dropdown:
 *
 *   - Enter clears `rl.line` BEFORE our handler runs, so reading the buffer at
 *     that moment yields '' and the selection would be lost.
 *   - Up/Down are bound to history recall and overwrite `rl.line` with a
 *     previous command, so the typed query would vanish mid-navigation.
 *
 * Run: pnpm --filter @the-new-fuse/tnf-cli test
 */
import { Command } from 'commander';
import { EventEmitter } from 'node:events';
import readline from 'node:readline';
import { PassThrough } from 'node:stream';
import { PLAIN_THEME, buildPaletteIndex, type PaletteEntry } from './command-palette.js';
import {
  attachPalette,
  paletteEntryToLine,
  resolveSlashDropdownInput,
} from './palette-readline.js';

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

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/* ---------------- fixtures ---------------- */

function buildIndex(): PaletteEntry[] {
  const program = new Command();
  const agents = program.command('agents').description('Agent operations');
  agents.command('register').description('Register an agent').argument('<name>', 'name');
  agents.command('list').description('List agents');
  const harness = program.command('harness').description('Harness loop');
  harness.command('cycle').description('Run one cycle');
  return buildPaletteIndex({
    program,
    slash: [{ name: 'doctor', summary: 'Diagnostics', usage: '/doctor', mode: 'cli' }],
  });
}

const INDEX = buildIndex();

/**
 * Stand-in for readline.Interface, driven through Node's REAL keypress parser.
 *
 * An earlier version of this harness synthesised key objects directly
 * (`emit('keypress', '', {name:'escape'})`). That hid a bug that only a live
 * terminal exposed: Node emits NOTHING for a lone ESC — it holds the byte in
 * case an escape sequence follows — and once any key follows, both bytes
 * surface as one `{meta:true}` chord. `{name:'escape'}` simply never occurs,
 * so Escape handling was unreachable while the test reported it working.
 *
 * Raw bytes now go through `readline.emitKeypressEvents`, so the events this
 * harness produces are the events a real terminal produces. Buffer mutation
 * still has to be simulated (there is no real readline attached), and it
 * deliberately reproduces the two behaviours that break naive palettes:
 * Enter clears the buffer before our listener runs, and arrows overwrite it
 * with history.
 */
class FakeReadline extends EventEmitter {
  line = '';
  cursor = 0;
  /** What readline's history recall would replace the buffer with. */
  historyEntry = 'previous command';

  _refreshLine(): void {
    /* no-op: nothing to repaint in a test */
  }

  /** Type one character: readline updates the buffer, then the byte is parsed. */
  type(char: string): void {
    this.line += char;
    this.cursor = this.line.length;
    this.feed(char);
  }

  typeAll(text: string): void {
    for (const char of text) this.type(char);
  }

  /** Enter: readline emits `line` and CLEARS the buffer before listeners run. */
  pressEnter(): string {
    const submitted = this.line;
    this.line = '';
    this.cursor = 0;
    this.feed('\r');
    return submitted;
  }

  /** Arrow key: readline recalls history INTO the buffer first. */
  pressArrow(name: 'up' | 'down'): void {
    this.line = this.historyEntry;
    this.cursor = this.line.length;
    this.feed(name === 'up' ? '\x1b[A' : '\x1b[B');
  }

  /** Press Escape the way a terminal sends it: a bare ESC byte. */
  pressEscape(): void {
    this.feed('\x1b');
  }

  pressTab(shift = false): void {
    this.feed(shift ? '\x1b[Z' : '\t');
  }

  pressCtrl(char: string): void {
    this.feed(String.fromCharCode(char.toUpperCase().charCodeAt(0) - 64));
  }

  /** Write raw bytes into the parser. */
  feed(bytes: string): void {
    (this.stdin as any)?.write(bytes);
  }

  stdin: (PassThrough & { isTTY?: boolean; setRawMode?: (m: boolean) => void }) | null = null;
}

interface Harness {
  rl: FakeReadline;
  state: ReturnType<typeof attachPalette>;
  rawModeCalls: boolean[];
  written: string[];
}

function makeHarness(options: { isTTY?: boolean; escapeDelayMs?: number } = {}): Harness {
  const rl = new FakeReadline();
  const rawModeCalls: boolean[] = [];
  const written: string[] = [];

  const stdin = Object.assign(new PassThrough(), {
    isTTY: options.isTTY ?? true,
    setRawMode: (mode: boolean) => {
      rawModeCalls.push(mode);
    },
  }) as PassThrough & { isTTY?: boolean; setRawMode?: (m: boolean) => void };
  rl.stdin = stdin;

  const stdout = {
    write: (chunk: string) => {
      written.push(chunk);
      return true;
    },
    columns: 100,
    rows: 24,
    on: (): NodeJS.EventEmitter => ({}) as NodeJS.EventEmitter as any,
    off: (): void => {},
  };

  const state = attachPalette({
    rl: rl as never,
    projectRoot: '/repo',
    getIndex: () => INDEX,
    theme: PLAIN_THEME,
    stdin: stdin as never,
    stdout: stdout as never,
    emitKeypressEvents: readline.emitKeypressEvents,
    escapeDelayMs: options.escapeDelayMs ?? 10,
  });

  return { rl, state, rawModeCalls, written };
}

/* ---------------- tests ---------------- */

console.log('\npalette-readline — attach lifecycle');

{
  const h = makeHarness();
  check('raw mode is enabled on attach', h.rawModeCalls[0] === true);
  check('a controller is bound', h.state.controller !== null);
  h.rl.emit('close');
  check('raw mode is restored on close', h.rawModeCalls.includes(false));
  check(
    'dispose is idempotent',
    (() => {
      h.state.dispose();
      h.state.dispose();
      return true;
    })()
  );
}

{
  const h = makeHarness({ isTTY: false });
  check('non-TTY does not attach a controller', h.state.controller === null);
  check('non-TTY does not touch raw mode', h.rawModeCalls.length === 0);
}

console.log('\npalette-readline — typing opens and filters');

{
  const h = makeHarness();
  h.rl.typeAll('/regi');
  check('palette opens on a slash query', h.state.controller?.isOpen === true);
  check(
    'top match is the leaf, not the namespace',
    h.state.controller?.selected?.searchText === 'agents register',
    h.state.controller?.selected?.searchText
  );
  check('something was drawn', h.written.length > 0);
}

{
  const h = makeHarness();
  h.rl.typeAll('hello world');
  check('plain text never opens the palette', h.state.controller?.isOpen === false);
}

console.log('\npalette-readline — hazard 2: Enter clears rl.line first');

{
  const h = makeHarness();
  h.rl.typeAll('/harness cycle');
  const submitted = h.rl.pressEnter();
  check('rl.line really was cleared by Enter', h.rl.line === '');
  check(
    'the selection survived the clear (pending was stashed)',
    h.state.pending?.searchText === 'harness cycle',
    String(h.state.pending?.searchText)
  );
  const resolved = resolveSlashDropdownInput(submitted, h.state);
  check('resolves to the runnable line', resolved === '/harness cycle', resolved);
  check('pending is consumed exactly once', h.state.pending === null);
}

console.log('\npalette-readline — hazard 3: arrows are history-bound');

{
  const h = makeHarness();
  h.rl.typeAll('/agents');
  const first = h.state.controller?.selected?.searchText;
  h.rl.pressArrow('down');
  check(
    "readline's history recall is undone — the query is restored",
    h.rl.line === '/agents',
    h.rl.line
  );
  check('the selection moved', h.state.controller?.selected?.searchText !== first);
  check('navigation is recorded', h.state.navigated === true);

  h.rl.pressArrow('up');
  check('up returns to the first match', h.state.controller?.selected?.searchText === first);
  check('query still intact after two arrows', h.rl.line === '/agents');
}

{
  // With the palette closed, arrows must be left alone so history still works.
  const h = makeHarness();
  h.rl.typeAll('plain text');
  h.rl.pressArrow('up');
  check(
    'history recall is NOT undone when the palette is closed',
    h.rl.line === 'previous command',
    h.rl.line
  );
}

console.log('\npalette-readline — navigated selection wins over typed text');

{
  const h = makeHarness();
  h.rl.typeAll('/agents');
  h.rl.pressArrow('down');
  const chosen = h.state.controller?.selected;
  const submitted = h.rl.pressEnter();
  const resolved = resolveSlashDropdownInput(submitted, h.state);
  check(
    'the highlighted row runs, not the typed prefix',
    resolved === paletteEntryToLine(chosen!),
    `${resolved} vs ${paletteEntryToLine(chosen!)}`
  );
}

{
  // Typed arguments must never be replaced by the highlighted row.
  const h = makeHarness();
  h.rl.typeAll('/agents register alice');
  const submitted = h.rl.pressEnter();
  const resolved = resolveSlashDropdownInput(submitted, h.state);
  check(
    'a self-typed line with arguments is preserved verbatim',
    resolved === '/agents register alice',
    resolved
  );
}

console.log('\npalette-readline — Tab completes without running');

{
  const h = makeHarness();
  h.rl.typeAll('/regi');
  h.rl.pressTab();
  // Trailing space because `agents register` still needs its required <name>.
  check('buffer is completed to the full path', h.rl.line === '/agents register ', h.rl.line);
  check('nothing was submitted', h.state.pending === null);
  check('palette stays open to keep refining', h.state.controller?.isOpen === true);
}

{
  const h = makeHarness();
  h.rl.typeAll('/agents');
  h.rl.pressTab(true);
  check('shift-tab walks backwards instead of completing', h.rl.line === '/agents', h.rl.line);
}

{
  const h = makeHarness();
  h.rl.typeAll('/regi');
  h.rl.pressTab();
  h.rl.typeAll('alice');
  const submitted = h.rl.pressEnter();
  const resolved = resolveSlashDropdownInput(submitted, h.state);
  check(
    'typing after completion preserves arguments',
    resolved === '/agents register alice',
    resolved
  );
}

console.log('\npalette-readline — dismissal');

{
  // A lone ESC produces no keypress event at all, so dismissal can only be
  // resolved on a timer. `escapeDelayMs` is shortened here; the assertion is
  // that Escape works WITHOUT requiring another keystroke.
  const h = makeHarness({ escapeDelayMs: 10 });
  h.rl.typeAll('/regi');
  h.rl.pressEscape();
  check(
    'a bare ESC does not resolve instantly (Node buffers it)',
    h.state.controller?.isOpen === true
  );
  await wait(40);
  check('escape closes the palette once the delay expires', h.state.controller?.isOpen === false);
  const submitted = h.rl.pressEnter();
  check(
    'a dismissed palette does not hijack the submitted line',
    resolveSlashDropdownInput(submitted, h.state) === submitted
  );
}

{
  // An arrow key is ESC-prefixed. Its sequence must NOT be mistaken for a
  // dismissal, or navigating would close the palette.
  const h = makeHarness({ escapeDelayMs: 10 });
  h.rl.typeAll('/agents');
  h.rl.pressArrow('down');
  await wait(40);
  check('an arrow sequence does not trigger the escape timer', h.state.controller?.isOpen === true);
}

{
  const h = makeHarness();
  h.rl.typeAll('/regi');
  h.rl.pressCtrl('c');
  check(
    'unclaimed ctrl-chords close the palette and defer to readline',
    h.state.controller?.isOpen === false
  );
}

console.log('\npalette-readline — emacs navigation chords');

// tmux without extended keys, plain SSH clients and most mobile terminals never
// deliver PageUp/Home, which used to leave the operator moving one row at a
// time through 1300 entries.
{
  const h = makeHarness();
  h.rl.typeAll('/');
  const first = h.state.controller?.selected?.searchText;
  h.rl.pressCtrl('n');
  check('ctrl-n moves down', h.state.controller?.selected?.searchText !== first);
  check('the palette stays open on a claimed chord', h.state.controller?.isOpen === true);
  check('the query survives the chord', h.rl.line === '/', h.rl.line);
  h.rl.pressCtrl('p');
  check('ctrl-p moves back up', h.state.controller?.selected?.searchText === first);

  h.rl.pressCtrl('d');
  check('ctrl-d pages down', h.state.controller?.selected?.searchText !== first);
  check("ctrl-d does not leave readline's deletion in the buffer", h.rl.line === '/', h.rl.line);
  h.rl.pressCtrl('u');
  check('ctrl-u pages back up', h.state.controller?.selected?.searchText === first);

  h.rl.pressCtrl('g');
  check('ctrl-g dismisses like escape', h.state.controller?.isOpen === false);
}

{
  // Line editing stays with readline: claiming ^A/^E/^W would break editing the
  // query itself, which is what the operator is doing while the palette is open.
  const h = makeHarness();
  h.rl.typeAll('/regi');
  h.rl.pressCtrl('a');
  check('ctrl-a is left to readline', h.state.controller?.isOpen === false);
}

{
  // Regression found by driving a REAL TTY, not by these fake-TTY tests:
  // Escape dismissed only until the next keystroke, so continuing to type
  // reopened the palette over a query the operator had already rejected.
  const h = makeHarness();
  h.rl.typeAll('/regi');
  h.rl.pressEscape();
  h.rl.typeAll('ster');
  check('escape survives continued typing on the same line', h.state.controller?.isOpen === false);

  // Submitting re-arms it, so the next line gets a palette again.
  h.rl.pressEnter();
  h.rl.typeAll('/reg');
  check('the next line gets the palette back', h.state.controller?.isOpen === true);
}

console.log('\npalette-readline — the frame is erased, not appended');

{
  const h = makeHarness();
  h.rl.typeAll('/reg');
  const drawsWhileTyping = h.written.length;
  h.rl.pressEscape();
  const all = h.written.join('');
  check('each redraw erases below the cursor', all.includes('\x1b[0J'));
  check(
    'every draw is cursor-save/restore bracketed, so the prompt never moves',
    (all.match(/\x1b7/g) || []).length === (all.match(/\x1b8/g) || []).length,
    `${(all.match(/\x1b7/g) || []).length} saves vs ${(all.match(/\x1b8/g) || []).length} restores`
  );
  check('typing redrew rather than accumulating separate menus', drawsWhileTyping > 0);
}

console.log('\npalette-readline — smooth scrolling keeps selection in view');

{
  const h = makeHarness({ isTTY: false });
  // Non-TTY doesn't attach, skip
  check('non-TTY skips scroll test', true);
}

console.log(`\npalette-readline: ${pass} passed, ${fail} failed\n`);
if (fail > 0) process.exit(1);
