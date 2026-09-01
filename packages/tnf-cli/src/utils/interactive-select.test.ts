import assert from 'node:assert/strict';
import { PassThrough } from 'node:stream';
import {
  interactiveSelect,
  matchingSelectIndices,
  reduceSelectState,
  type SelectItem,
  type SelectState,
} from './interactive-select.js';

const items: SelectItem<string>[] = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'offline', label: 'Offline', disabled: true },
  { value: 'openrouter', label: 'OpenRouter', description: '400+ routed models' },
];

let state: SelectState = { selected: 0, query: '' };
state = reduceSelectState(items, state, 'down').state;
assert.equal(state.selected, 1, 'down selects the next item');
state = reduceSelectState(items, state, 'down').state;
assert.equal(state.selected, 3, 'navigation skips disabled items');
state = reduceSelectState(items, state, 'down').state;
assert.equal(state.selected, 0, 'down wraps');
state = reduceSelectState(items, state, 'end').state;
assert.equal(state.selected, 3, 'end selects the final selectable item');
state = reduceSelectState(items, state, 'home').state;
assert.equal(state.selected, 0, 'home selects the first item');

state = reduceSelectState(items, state, { text: 'route' }).state;
assert.deepEqual(
  matchingSelectIndices(items, state.query),
  [3],
  'typing filters labels and descriptions'
);
assert.equal(state.selected, 3, 'filtering moves selection into the result set');
const chosen = reduceSelectState(items, state, 'enter').selected;
assert.equal(chosen?.value, 'openrouter', 'enter returns the highlighted item');
assert.equal(reduceSelectState(items, state, 'escape').cancelled, true, 'escape cancels');

const input = new PassThrough() as PassThrough & {
  isTTY: boolean;
  isRaw: boolean;
  setRawMode: (enabled: boolean) => typeof input;
};
const rawModeTransitions: boolean[] = [];
input.isTTY = true;
input.isRaw = false;
input.setRawMode = (enabled: boolean) => {
  input.isRaw = enabled;
  rawModeTransitions.push(enabled);
  return input;
};
input.pause();

const output = new PassThrough() as PassThrough & { isTTY: boolean; rows: number };
output.isTTY = true;
output.rows = 24;

const cancelledSelection = interactiveSelect([{ value: 'openrouter', label: 'OpenRouter' }], {
  title: 'Choose provider',
  input: input as never,
  output: output as never,
});
input.emit('keypress', '', { name: 'escape' });
assert.equal(await cancelledSelection, null, 'TTY escape resolves as cancellation');
assert.deepEqual(rawModeTransitions, [true, false], 'TTY raw mode is restored');
assert.equal(input.isPaused(), true, 'selector pauses stdin when it resumed a dormant stream');

console.log('interactive-select: 13 passed, 0 failed');
