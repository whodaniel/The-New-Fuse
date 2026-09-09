import assert from 'node:assert/strict';
import {
  formatPromptSlashCommandChain,
  parseSlashCommand,
  parseSlashCommandChain,
  parseSlashCommands,
  reverseSlashCommandChain,
  serializeSlashCommandChain,
  type SlashCommandDefinition,
} from './slashCommands.js';

const numbered = parseSlashCommands('/skill#1 /skill#2 /skill#3');
assert.deepEqual(
  numbered.map((step) => step.name),
  ['skill#1', 'skill#2', 'skill#3'],
  'numbered skill tokens must retain their order'
);

const withArguments = parseSlashCommands(
  '/research topic one /summarize "two paragraphs" /save "/tmp"'
);
assert.deepEqual(withArguments, [
  { rawName: 'research', name: 'research', args: ['topic', 'one'] },
  { rawName: 'summarize', name: 'summarize', args: ['two paragraphs'] },
  { rawName: 'save', name: 'save', args: ['/tmp'] },
]);
assert.deepEqual(parseSlashCommand('/save "/tmp"'), {
  rawName: 'save',
  name: 'save',
  args: ['/tmp'],
});

const forward = parseSlashCommandChain(
  '/research "AI agents" /summarize "two paragraphs" /publish draft'
);
const serialized = serializeSlashCommandChain(forward);
assert.deepEqual(parseSlashCommandChain(serialized), forward, 'slash chains must round-trip');

const reverse = reverseSlashCommandChain(forward);
assert.deepEqual(
  reverse.steps.map((step) => step.name),
  ['publish', 'summarize', 'research'],
  'reverse chains must invert execution order'
);
assert.deepEqual(
  parseSlashCommandChain(serializeSlashCommandChain(reverse)).steps,
  reverse.steps,
  'reverse chains must serialize back to executable slash syntax'
);
assert.deepEqual(
  parseSlashCommandChain(serialized, 'reverse').steps.map((step) => step.name),
  ['publish', 'summarize', 'research'],
  'chains can be parsed directly in reverse execution direction'
);

const promptCommand = (name: string): SlashCommandDefinition => ({
  name,
  summary: `${name} summary`,
  usage: `/${name}`,
  source: 'discovered',
  mode: 'prompt',
  content: `${name} body`,
});
const prompt = formatPromptSlashCommandChain([
  { command: promptCommand('research'), args: ['TNF'] },
  { command: promptCommand('summarize'), args: [] },
  { command: promptCommand('publish'), args: ['markdown'] },
]);
assert.match(prompt, /tnf\.slash-chain\/v1/);
assert.match(prompt, /step 1 output as `upstream`/);
assert.match(prompt, /Stop on the first failed validation/);
assert.match(prompt, /Invocation: \/research TNF \/summarize \/publish markdown/);

console.log('slashCommands tests passed');
