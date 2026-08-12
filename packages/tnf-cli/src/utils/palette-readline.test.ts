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

/** Minimal stand-in for readline.Interface with Node's buffer semantics. */
class FakeReadline extends EventEmitter {
  line = '';
  cursor = 0;
  /** What readline's history recall would replace the buffer with. */
  historyEntry = 'previous command';

  _refreshLine(): void {
    /* no-op: nothing to repaint in a test */
  }

  /** Simulate typing one character: readline updates the buffer, then emits. */
  type(char: string): void {
    this.line += char;
    this.cursor = this.line.length;
    this.emitKey({ name: char.length === 1 ? char : undefined });
  }

  typeAll(text: string): void {
    for (const char of text) this.type(char);
  }

  /** Simulate Enter: readline emits `line` and CLEARS the buffer first. */
  pressEnter(): string {
    const submitted = this.line;
    this.line = '';
    this.cursor = 0;
    this.emitKey({ name: 'return' });
    return submitted;
  }

  /** Simulate an arrow key: readline recalls history INTO the buffer first. */
  pressArrow(name: 'up' | 'down'): void {
    this.line = this.historyEntry;
    this.cursor = this.line.length;
    this.emitKey({ name });
  }

  pressKey(name: string, extra: Record<string, unknown> = {}): void {
    this.emitKey({ name, ...extra });
  }

  private emitKey(key: Record<string, unknown>): void {
    this.stdin?.emit('keypress', '', key);
  }

  stdin: (EventEmitter & { isTTY?: boolean; setRawMode?: (m: boolean) => void }) | null = null;
}

interface Harness {
  rl: FakeReadline;
  state: ReturnType<typeof attachPalette>;
  rawModeCalls: boolean[];
  written: string[];
}

function makeHarness(options: { isTTY?: boolean } = {}): Harness {
  const rl = new FakeReadline();
  const rawModeCalls: boolean[] = [];
  const written: string[] = [];

  const stdin = Object.assign(new EventEmitter(), {
    isTTY: options.isTTY ?? true,
    setRawMode: (mode: boolean) => {
      rawModeCalls.push(mode);
    },
  }) as EventEmitter & { isTTY?: boolean; setRawMode?: (m: boolean) => void };
  rl.stdin = stdin;

  const stdout = {
    write: (chunk: string) => {
      written.push(chunk);
      return true;
    },
    columns: 100,
    rows: 24,
  };

  const state = attachPalette({
    rl: rl as never,
    projectRoot: '/repo',
    getIndex: () => INDEX,
    theme: PLAIN_THEME,
    stdin: stdin as never,
    stdout: stdout as never,
    emitKeypressEvents: () => {
      /* the fake stdin already emits keypress events directly */
    },
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
  h.rl.pressKey('tab');
  check('buffer is completed to the full path', h.rl.line === '/agents register', h.rl.line);
  check('nothing was submitted', h.state.pending === null);
  check('palette stays open to keep refining', h.state.controller?.isOpen === true);
}

{
  const h = makeHarness();
  h.rl.typeAll('/agents');
  h.rl.pressKey('tab', { shift: true });
  check('shift-tab walks backwards instead of completing', h.rl.line === '/agents', h.rl.line);
}

console.log('\npalette-readline — dismissal');

{
  const h = makeHarness();
  h.rl.typeAll('/regi');
  h.rl.pressKey('escape');
  check('escape closes the palette', h.state.controller?.isOpen === false);
  const submitted = h.rl.pressEnter();
  check(
    'a dismissed palette does not hijack the submitted line',
    resolveSlashDropdownInput(submitted, h.state) === submitted
  );
}

{
  const h = makeHarness();
  h.rl.typeAll('/regi');
  h.rl.pressKey('c', { ctrl: true });
  check(
    'ctrl-chords close the palette and defer to readline',
    h.state.controller?.isOpen === false
  );
}

console.log('\npalette-readline — the frame is erased, not appended');

{
  const h = makeHarness();
  h.rl.typeAll('/reg');
  const drawsWhileTyping = h.written.length;
  h.rl.pressKey('escape');
  const all = h.written.join('');
  check('each redraw erases below the cursor', all.includes('\x1b[0J'));
  check(
    'every draw is cursor-save/restore bracketed, so the prompt never moves',
    (all.match(/\x1b7/g) || []).length === (all.match(/\x1b8/g) || []).length,
    `${(all.match(/\x1b7/g) || []).length} saves vs ${(all.match(/\x1b8/g) || []).length} restores`
  );
  check('typing redrew rather than accumulating separate menus', drawsWhileTyping > 0);
}

console.log(`\npalette-readline: ${pass} passed, ${fail} failed\n`);
if (fail > 0) process.exit(1);
